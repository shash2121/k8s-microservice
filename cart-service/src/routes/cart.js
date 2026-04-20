const express = require('express');
const router = express.Router();
const { Cart } = require('../models/Cart');
const { cache } = require('../config/redis');

const CART_TTL = 1800;

function createCart(userId, data = null) {
  const { CartItem } = require('../models/Cart');
  const cart = new Cart(userId);
  if (data) {
    // Recreate CartItem instances to retain methods
    cart.items = (data.items || []).map(item => {
      const ci = new CartItem();
      // copy properties
      Object.assign(ci, item);
      return ci;
    });
    cart.id = data.id || cart.id;
    cart.createdAt = data.createdAt || cart.createdAt;
    cart.updatedAt = data.updatedAt || cart.updatedAt;
  }
  return cart;
}

async function getCart(userId) {
  const cached = await cache.get(`cart:${userId}`);
  if (cached) {
    return createCart(userId, cached);
  }
  return createCart(userId);
}

async function saveCart(userId, cart) {
  console.log('[cart] Saving cart to Redis key', `cart:${userId}`);
  const result = await cache.set(`cart:${userId}`, {
    id: cart.id,
    userId: cart.userId,
    items: cart.items,
    totalItems: cart.totalItems,
    totalPrice: cart.totalPrice,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt
  }, CART_TTL);
  console.log('[cart] Redis set result:', result);
}

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log('GET cart for userId:', userId);
  
  let cart = await getCart(userId);

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

router.post('/:userId/items', async (req, res) => {
  const { userId } = req.params;
  const { productId, name, price, image, quantity = 1 } = req.body;

  console.log('POST add item to cart:', { userId, productId, name, price, quantity });

  if (!productId || !name || !price) {
    return res.status(400).json({
      success: false,
      error: 'productId, name, and price are required'
    });
  }

  let cart = await getCart(userId);
  cart.addItem({ id: productId, name, price, image }, quantity);
  await saveCart(userId, cart);

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

router.put('/:userId/items/:itemId', async (req, res) => {
  const { userId, itemId } = req.params;
  const { quantity } = req.body;

  let cart = await getCart(userId);
  if (!cart || cart.items.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Cart not found'
    });
  }

  cart.updateItemQuantity(itemId, quantity);
  await saveCart(userId, cart);

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

router.delete('/:userId/items/:itemId', async (req, res) => {
  const { userId, itemId } = req.params;

  let cart = await getCart(userId);
  if (!cart || cart.items.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Cart not found'
    });
  }

  cart.removeItem(itemId);
  await saveCart(userId, cart);

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

router.delete('/:userId', async (req, res) => {
  const { userId } = req.params;

  await cache.del(`cart:${userId}`);

  res.json({
    success: true,
    message: 'Cart cleared',
    data: {
      id: null,
      userId: userId,
      items: [],
      totalItems: 0,
      totalPrice: 0
    }
  });
});

module.exports = router;
