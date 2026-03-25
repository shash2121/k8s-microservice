const express = require('express');
const router = express.Router();
const { CheckoutSession } = require('../models/Checkout');
const { getOrdersByUserId, getOrderWithItems } = require('../config/database');
const EmailService = require('../services/EmailService');

// In-memory checkout sessions storage (for active checkouts only)
const checkoutSessions = new Map();

const emailService = new EmailService();

// GET checkout session for user
router.get('/session/:userId', (req, res) => {
  const { userId } = req.params;
  let session = checkoutSessions.get(userId);

  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'No checkout session found'
    });
  }

  res.json({
    success: true,
    data: {
      ...session,
      subtotal: session.subtotal,
      taxableAmount: session.taxableAmount,
      tax: session.tax,
      total: session.total
    }
  });
});

// POST create/initiate checkout session from cart
router.post('/session/:userId', async (req, res) => {
  const { userId } = req.params;
  const { items, shippingAddress } = req.body;

  console.log('Creating checkout session for userId:', userId);
  console.log('Items:', items);
  console.log('Shipping Address:', shippingAddress);

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Cart items are required'
    });
  }

  // Create new checkout session
  const session = new CheckoutSession(userId);
  
  // Add items from cart
  items.forEach(item => {
    session.addItem({
      id: item.productId,
      name: item.name,
      price: item.price,
      image: item.image
    }, item.quantity);
  });

  // Set shipping address if provided
  if (shippingAddress) {
    session.calculateShipping(shippingAddress);
  }

  checkoutSessions.set(userId, session);

  console.log('Checkout session created:', session.id);

  res.json({
    success: true,
    message: 'Checkout session created',
    data: {
      id: session.id,
      userId: session.userId,
      items: session.items,
      subtotal: session.subtotal,
      discount: session.discount,
      tax: session.tax,
      shippingCost: session.shippingCost,
      total: session.total,
      status: session.status
    }
  });
});

// PUT update checkout session (add/remove items, apply discount, etc.)
router.put('/session/:userId', (req, res) => {
  const { userId } = req.params;
  const { action, itemId, product, quantity, discountCode, shippingAddress } = req.body;

  let session = checkoutSessions.get(userId);

  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Checkout session not found'
    });
  }

  switch (action) {
    case 'add_item':
      session.addItem(product, quantity);
      break;

    case 'remove_item':
      session.removeItem(itemId);
      break;

    case 'update_quantity':
      session.updateItemQuantity(itemId, quantity);
      break;

    case 'apply_discount':
      const result = session.applyDiscount(discountCode);
      if (!result.success) {
        return res.status(400).json(result);
      }
      break;

    case 'set_shipping':
      session.calculateShipping(shippingAddress);
      break;

    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action'
      });
  }

  res.json({
    success: true,
    message: 'Checkout session updated',
    data: {
      ...session,
      subtotal: session.subtotal,
      taxableAmount: session.taxableAmount,
      tax: session.tax,
      total: session.total
    }
  });
});

// POST process payment and create order
router.post('/session/:userId/checkout', async (req, res) => {
  const { userId } = req.params;
  const { paymentMethod, paymentDetails, customerEmail } = req.body;

  console.log('Processing checkout for userId:', userId);

  let session = checkoutSessions.get(userId);

  if (!session || session.items.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'No checkout session found or cart is empty'
    });
  }

  // Process payment
  const paymentResult = session.processPayment(paymentMethod, paymentDetails);

  if (!paymentResult.success) {
    return res.status(400).json({
      success: false,
      error: paymentResult.error
    });
  }

  try {
    // Save order to database
    const order = await session.saveOrder();

    // Clear the checkout session
    checkoutSessions.delete(userId);

    // Send order confirmation email
    if (customerEmail) {
      await emailService.sendOrderConfirmation(order, customerEmail);
    }

    console.log('Order created:', order.orderId);

    res.json({
      success: true,
      message: 'Order placed successfully',
      data: {
        order: order,
        transactionId: paymentResult.transactionId
      }
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      details: error.message
    });
  }
});

// GET order by ID
router.get('/order/:orderId', async (req, res) => {
  const { orderId } = req.params;
  
  try {
    const order = await getOrderWithItems(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
});

// GET all orders for user
router.get('/orders/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const userOrders = await getOrdersByUserId(userId);

    res.json({
      success: true,
      count: userOrders.length,
      data: userOrders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

// GET available discount codes
router.get('/discount-codes', (req, res) => {
  res.json({
    success: true,
    data: [
      { code: 'WELCOME10', description: '10% off on your order', type: 'percentage', value: 10 },
      { code: 'SAVE20', description: '20% off on orders above ₹5000', type: 'percentage', value: 20, minOrder: 5000 },
      { code: 'FLAT500', description: 'Flat ₹500 off on orders above ₹3000', type: 'flat', value: 500, minOrder: 3000 }
    ]
  });
});

module.exports = router;
