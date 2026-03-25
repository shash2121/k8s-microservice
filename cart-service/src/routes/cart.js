const express = require('express');
const router = express.Router();
const { Cart } = require('../models/Cart');

// In-memory cart storage (keyed by userId)
const carts = new Map();

// GET cart for user
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  console.log('GET cart for userId:', userId);
  let cart = carts.get(userId);

  if (!cart) {
    cart = new Cart(userId);
    carts.set(userId, cart);
  }

  console.log('Cart items:', cart.items.length, 'Total:', cart.totalPrice);
  res.json({
    success: true,
    data: {
      id: cart.id,
      userId: cart.userId,
      items: cart.items,
      totalItems: cart.totalItems,
      totalPrice: cart.totalPrice,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt
    }
  });
});

// POST add item to cart
router.post('/:userId/items', (req, res) => {
  const { userId } = req.params;
  const { productId, name, price, image, quantity = 1 } = req.body;

  console.log('POST add item to cart:', { userId, productId, name, price, quantity });

  if (!productId || !name || !price) {
    return res.status(400).json({
      success: false,
      error: 'productId, name, and price are required'
    });
  }

  let cart = carts.get(userId);
  if (!cart) {
    cart = new Cart(userId);
    carts.set(userId, cart);
  }

  cart.addItem({ id: productId, name, price, image }, quantity);

  console.log('Cart after add:', cart.items.length, 'items, Total:', cart.totalPrice);

  res.json({
    success: true,
    message: 'Item added to cart',
    data: {
      id: cart.id,
      userId: cart.userId,
      items: cart.items,
      totalItems: cart.totalItems,
      totalPrice: cart.totalPrice,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt
    }
  });
});

// PUT update item quantity
router.put('/:userId/items/:itemId', (req, res) => {
  const { userId, itemId } = req.params;
  const { quantity } = req.body;

  const cart = carts.get(userId);
  if (!cart) {
    return res.status(404).json({
      success: false,
      error: 'Cart not found'
    });
  }

  cart.updateItemQuantity(itemId, quantity);

  res.json({
    success: true,
    message: 'Cart updated',
    data: {
      ...cart,
      totalItems: cart.totalItems,
      totalPrice: cart.totalPrice
    }
  });
});

// DELETE remove item from cart
router.delete('/:userId/items/:itemId', (req, res) => {
  const { userId, itemId } = req.params;

  const cart = carts.get(userId);
  if (!cart) {
    return res.status(404).json({
      success: false,
      error: 'Cart not found'
    });
  }

  cart.removeItem(itemId);

  res.json({
    success: true,
    message: 'Item removed from cart',
    data: {
      ...cart,
      totalItems: cart.totalItems,
      totalPrice: cart.totalPrice
    }
  });
});

// DELETE clear cart
router.delete('/:userId', (req, res) => {
  const { userId } = req.params;

  const cart = carts.get(userId);
  if (!cart) {
    return res.status(404).json({
      success: false,
      error: 'Cart not found'
    });
  }

  cart.clear();

  res.json({
    success: true,
    message: 'Cart cleared',
    data: {
      ...cart,
      totalItems: cart.totalItems,
      totalPrice: cart.totalPrice
    }
  });
});

module.exports = router;
