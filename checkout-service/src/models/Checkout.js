const { v4: uuidv4 } = require('uuid');
const { saveOrderToDB } = require('../config/database');
const logger = require('../logger');

class CheckoutItem {
  constructor(productId, name, price, image, quantity = 1) {
    this.id = uuidv4();
    this.productId = productId;
    this.name = name;
    this.price = price;
    this.image = image;
    this.quantity = quantity;
  }

  get subtotal() {
    return this.price * this.quantity;
  }
}

class CheckoutSession {
  constructor(userId, items = []) {
    this.id = uuidv4();
    this.userId = userId;
    this.items = items;
    this.status = 'pending'; // pending, processing, completed, cancelled
    this.discount = 0;
    this.discountCode = null;
    this.taxRate = 0.18; // 18% GST
    this.shippingCost = 0;
    this.shippingAddress = null;
    this.paymentMethod = null;
    this.paymentStatus = 'pending';
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    this.completedAt = null;
  }

  addItem(product, quantity = 1) {
    const existingItem = this.items.find(
      item => item.productId === product.id
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      const newItem = new CheckoutItem(
        product.id,
        product.name,
        product.price,
        product.image,
        quantity
      );
      this.items.push(newItem);
    }

    this.updatedAt = new Date().toISOString();
    logger.debug('Item added to checkout session', {
      sessionId: this.id,
      userId: this.userId,
      productId: product.id,
      quantity
    });
    return this;
  }

  removeItem(itemId) {
    this.items = this.items.filter(item => item.id !== itemId);
    this.updatedAt = new Date().toISOString();
    logger.debug('Item removed from checkout session', {
      sessionId: this.id,
      userId: this.userId,
      itemId
    });
    return this;
  }

  updateItemQuantity(itemId, quantity) {
    const item = this.items.find(item => item.id === itemId);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(itemId);
      } else {
        item.quantity = quantity;
        this.updatedAt = new Date().toISOString();
        logger.debug('Item quantity updated in checkout session', {
          sessionId: this.id,
          userId: this.userId,
          itemId,
          quantity
        });
      }
    }
    return this;
  }

  applyDiscount(code, amount) {
    const validCodes = {
      'WELCOME10': 0.10, // 10% off
      'SAVE20': 0.20,    // 20% off
      'FLAT500': 500     // Flat ₹500 off
    };

    if (validCodes[code]) {
      this.discountCode = code;
      const discountValue = validCodes[code];

      if (typeof discountValue === 'number' && discountValue < 1) {
        // Percentage discount
        this.discount = this.subtotal * discountValue;
      } else {
        // Flat discount
        this.discount = Math.min(discountValue, this.subtotal);
      }

      this.updatedAt = new Date().toISOString();
      logger.debug('Discount applied to checkout session', {
        sessionId: this.id,
        userId: this.userId,
        code,
        discountAmount: this.discount
      });
      return { success: true, discount: this.discount };
    }

    logger.warn('Invalid discount code attempted', {
      sessionId: this.id,
      userId: this.userId,
      code
    });
    return { success: false, error: 'Invalid discount code' };
  }

  calculateShipping(address) {
    // Free shipping for orders above ₹8300
    if (this.subtotal - this.discount > 8300) {
      this.shippingCost = 0;
    } else {
      // Based on distance/pincode (simplified)
      this.shippingCost = 150; // Standard shipping
    }

    this.shippingAddress = address;
    this.updatedAt = new Date().toISOString();
    logger.debug('Shipping cost calculated', {
      sessionId: this.id,
      userId: this.userId,
      shippingCost: this.shippingCost,
      subtotal: this.subtotal,
      discount: this.discount
    });
    return this.shippingCost;
  }

  get subtotal() {
    return this.items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  get taxableAmount() {
    return Math.max(0, this.subtotal - this.discount);
  }

  get tax() {
    return this.taxableAmount * this.taxRate;
  }

  get total() {
    return this.taxableAmount + this.tax + this.shippingCost;
  }

  processPayment(paymentMethod, paymentDetails) {
    this.paymentMethod = paymentMethod;

    // Simulate payment processing
    const paymentSuccess = Math.random() > 0.1; // 90% success rate

    if (paymentSuccess) {
      this.paymentStatus = 'completed';
      this.status = 'completed';
      this.completedAt = new Date().toISOString();
      logger.info('Payment processed successfully', {
        sessionId: this.id,
        userId: this.userId,
        paymentMethod,
        transactionId: uuidv4()
      });
      return { success: true, transactionId: uuidv4() };
    } else {
      this.paymentStatus = 'failed';
      logger.warn('Payment failed', {
        sessionId: this.id,
        userId: this.userId,
        paymentMethod
      });
      return { success: false, error: 'Payment failed' };
    }
  }

  toOrder() {
    if (this.status !== 'completed') {
      throw new Error('Cannot create order from incomplete checkout');
    }

    return {
      orderId: uuidv4(),
      checkoutId: this.id,
      userId: this.userId,
      items: this.items.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal,
        image: item.image
      })),
      pricing: {
        subtotal: this.subtotal,
        discount: this.discount,
        discountCode: this.discountCode,
        taxableAmount: this.taxableAmount,
        tax: this.tax,
        shippingCost: this.shippingCost,
        total: this.total
      },
      shippingAddress: this.shippingAddress,
      paymentMethod: this.paymentMethod,
      paymentStatus: this.paymentStatus,
      status: 'confirmed',
      createdAt: this.completedAt
    };
  }

  // Save order to database
  async saveOrder() {
    if (this.status !== 'completed') {
      throw new Error('Cannot save incomplete order');
    }

    const order = this.toOrder();
    logger.info('Saving order to database', {
      sessionId: this.id,
      userId: this.userId,
      orderId: order.orderId,
      itemCount: order.items.length
    });
    return await saveOrderToDB(order);
  }

  clear() {
    this.items = [];
    this.discount = 0;
    this.discountCode = null;
    this.shippingCost = 0;
    this.shippingAddress = null;
    this.paymentMethod = null;
    this.paymentStatus = 'pending';
    this.status = 'pending';
    this.updatedAt = new Date().toISOString();
    logger.debug('Checkout session cleared', {
      sessionId: this.id,
      userId: this.userId
    });
    return this;
  }
}

module.exports = { CheckoutSession, CheckoutItem };