const { v4: uuidv4 } = require('uuid');

class CartItem {
  constructor(productId, name, price, image, quantity = 1) {
    this.id = uuidv4();
    this.productId = productId;
    this.name = name;
    this.price = price;
    this.image = image;
    this.quantity = quantity;
    this.addedAt = new Date().toISOString();
  }

  updateQuantity(qty) {
    if (qty <= 0) return false;
    this.quantity = qty;
    return true;
  }

  get subtotal() {
    return this.price * this.quantity;
  }
}

class Cart {
  constructor(userId = 'guest') {
    this.id = uuidv4();
    this.userId = userId;
    this.items = [];
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  addItem(product, quantity = 1) {
    const existingItem = this.items.find(
      item => item.productId === product.id
    );

    if (existingItem) {
      existingItem.updateQuantity(existingItem.quantity + quantity);
    } else {
      const newItem = new CartItem(
        product.id,
        product.name,
        product.price,
        product.image,
        quantity
      );
      this.items.push(newItem);
    }

    this.updatedAt = new Date().toISOString();
    return this;
  }

  removeItem(itemId) {
    this.items = this.items.filter(item => item.id !== itemId);
    this.updatedAt = new Date().toISOString();
    return this;
  }

  updateItemQuantity(itemId, quantity) {
    const item = this.items.find(item => item.id === itemId);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(itemId);
      } else {
        item.updateQuantity(quantity);
        this.updatedAt = new Date().toISOString();
      }
    }
    return this;
  }

  clear() {
    this.items = [];
    this.updatedAt = new Date().toISOString();
    return this;
  }

  get totalItems() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get totalPrice() {
    return this.items.reduce((sum, item) => sum + item.subtotal, 0);
  }
}

module.exports = { Cart, CartItem };
