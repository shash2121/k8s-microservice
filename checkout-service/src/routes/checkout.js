const express = require('express');
const router = express.Router();
const { CheckoutSession, CheckoutItem } = require('../models/Checkout');
const { getOrdersByUserId, getOrderWithItems, execute } = require('../config/database');
const { cache } = require('../config/redis');
const logger = require('../logger');

const SESSION_TTL = 1800; // 30 minutes

// ---------------------------------------------------------------------
// Helper functions for Redis session persistence
// ---------------------------------------------------------------------
function createSession(userId, data = null) {
  const session = new CheckoutSession(userId);
  if (data) {
    // Avoid using Object.assign because CheckoutSession has read-only getters (subtotal, total, etc.)
    session.id = data.id || session.id;
    session.status = data.status || 'pending';
    session.discount = data.discount || 0;
    session.discountCode = data.discountCode || null;
    session.shippingCost = data.shippingCost || 0;
    session.shippingAddress = data.shippingAddress || null;
    session.paymentMethod = data.paymentMethod || null;
    session.paymentStatus = data.paymentStatus || 'pending';
    session.createdAt = data.createdAt || session.createdAt;
    session.updatedAt = data.updatedAt || session.updatedAt;
    session.completedAt = data.completedAt || null;

    if (data.items && Array.isArray(data.items)) {
      session.items = data.items.map(i => new CheckoutItem(i.productId, i.name, i.price, i.image, i.quantity));
    }
  }
  return session;
}

async function getSession(userId) {
  const cached = await cache.get(`checkout:${userId}`);
  if (cached) return createSession(userId, cached);
  return null;
}

async function saveSession(userId, session) {
  await cache.set(`checkout:${userId}`, {
    id: session.id,
    userId: session.userId,
    items: session.items.map(i => ({
      productId: i.productId,
      name: i.name,
      price: i.price,
      image: i.image,
      quantity: i.quantity
    })),
    subtotal: session.subtotal,
    discount: session.discount,
    discountCode: session.discountCode,
    tax: session.tax,
    shippingCost: session.shippingCost,
    total: session.total,
    status: session.status,
    shippingAddress: session.shippingAddress,
    paymentMethod: session.paymentMethod,
    paymentStatus: session.paymentStatus,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    completedAt: session.completedAt
  }, SESSION_TTL);
}

async function deleteSession(userId) {
  await cache.del(`checkout:${userId}`);
}

// ---------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------
router.get('/session/:userId', async (req, res) => {
  const session = await getSession(req.params.userId);
  if (!session) {
    logger.warn('No checkout session found', {
      userId: req.params.userId
    });
    return res.status(404).json({ success: false, error: 'No checkout session found' });
  }
  logger.info('Checkout session retrieved', {
    userId: req.params.userId,
    sessionId: session.id
  });
  res.json({ success: true, data: session });
});

router.post('/session/:userId', async (req, res) => {
  const { userId } = req.params;
  const { items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    logger.warn('Cart items are required', {
      userId,
      items
    });
    return res.status(400).json({ success: false, error: 'Cart items are required' });
  }
  const session = new CheckoutSession(userId);
  items.forEach(item => {
    session.addItem({
      id: item.productId, // CheckoutSession.addItem expects product.id
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image
    }, item.quantity);
  });
  await saveSession(userId, session);
  logger.info('Checkout session created', {
    userId,
    sessionId: session.id,
    itemCount: items.length
  });
  res.json({ success: true, data: session });
});

router.put('/session/:userId', async (req, res) => {
  const { userId } = req.params;
  const { action, discountCode, shippingAddress } = req.body;
  const session = await getSession(userId);
  if (!session) {
    logger.warn('Checkout session not found', {
      userId
    });
    return res.status(404).json({ success: false, error: 'Checkout session not found' });
  }
  if (action === 'apply_discount') {
    const result = session.applyDiscount(discountCode);
    if (!result.success) {
      logger.warn('Discount application failed', {
        userId,
        discountCode,
        error: result.error
      });
      return res.status(400).json(result);
    }
    logger.info('Discount applied successfully', {
      userId,
      discountCode,
      discountAmount: result.discount
    });
  } else if (action === 'set_shipping') {
    session.calculateShipping(shippingAddress);
    logger.info('Shipping cost calculated', {
      userId,
      shippingCost: session.shippingCost,
      shippingAddress
    });
  }
  await saveSession(userId, session);
  res.json({ success: true, data: session });
});

router.post('/session/:userId/checkout', async (req, res) => {
  const { userId } = req.params;
  const { paymentMethod, paymentDetails, customerEmail } = req.body;
  
  logger.info('Checkout request received', {
    userId,
    paymentMethod,
    hasPaymentDetails: !!paymentDetails,
    customerEmail
  });
  
  const session = await getSession(userId);
  
  if (!session) {
    logger.warn('No session found for checkout', {
      userId
    });
    return res.status(400).json({ success: false, error: 'No checkout session found' });
  }
  
  if (session.items.length === 0) {
    logger.warn('Attempted checkout with empty cart', {
      userId,
      sessionId: session.id
    });
    return res.status(400).json({ success: false, error: 'Cart is empty' });
  }
  
  if (!paymentMethod) {
    logger.warn('No payment method provided', {
      userId,
      sessionId: session.id
    });
    return res.status(400).json({ success: false, error: 'Payment method is required' });
  }
  
  // Validate shipping address is present
  if (!session.shippingAddress || !session.shippingAddress.name || !session.shippingAddress.email || !session.shippingAddress.address) {
    logger.warn('Shipping address not set for checkout', {
      userId,
      sessionId: session.id
    });
    return res.status(400).json({ success: false, error: 'Shipping address is required. Please fill in the shipping form.' });
  }
  
  const paymentResult = session.processPayment(paymentMethod, paymentDetails);
  if (!paymentResult.success) {
    logger.warn('Payment failed', {
      userId,
      sessionId: session.id,
      paymentMethod,
      error: paymentResult.error
    });
    return res.status(400).json({ success: false, error: paymentResult.error });
  }
  
  try {
    const order = await session.saveOrder();
    await deleteSession(userId);
    logger.info('Order created successfully', {
      userId,
      orderId: order.orderId,
      transactionId: paymentResult.transactionId,
      total: order.pricing?.total
    });
    // Publish order.created event
await require('../config/rabbitmq').publishMessage('order.exchange', 'order.created', {
  orderId: order.orderId,
  userId,
  total: order.pricing?.total,
  transactionId: paymentResult.transactionId,
  items: order.items?.map(i => ({ productId: i.product_id, quantity: i.quantity }))
});
res.json({ success: true, data: { order, transactionId: paymentResult.transactionId } });
  } catch (e) {
    logger.error('Order creation error', {
      userId,
      sessionId: session?.id,
      error: e.message,
      stack: e.stack
    });
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

router.get('/orders/:userId', async (req, res) => {
  try {
    // Validate user ID format
    const userId = req.params.userId;
    if (!userId || typeof userId !== 'string' || userId.length < 3) {
      logger.warn('Invalid user ID provided', {
        userId: req.params.userId
      });
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }
    
    const orders = await getOrdersByUserId(userId);
    // Additional security: ensure all returned orders belong to this user
    const validatedOrders = orders.filter(order => order.user_id === userId || order.userId === userId);
    
    logger.info('Orders retrieved for user', {
      userId,
      orderCount: validatedOrders.length
    });
    res.json({ success: true, count: validatedOrders.length, data: validatedOrders });
  } catch (e) {
    logger.error('Failed to fetch orders', {
      userId: req.params.userId,
      error: e.message,
      stack: e.stack
    });
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

router.get('/order/:userId/:orderId', async (req, res) => {
  try {
    const order = await getOrderWithItems(req.params.orderId);
    if (!order) {
      logger.warn('Order not found', {
        orderId: req.params.orderId,
        userId: req.params.userId
      });
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    // Check if the order belongs to the current user
    if (order.user_id != req.params.userId) {
      logger.warn('Access denied to order', {
        orderId: req.params.orderId,
        requestedUserId: req.params.userId,
        orderUserId: order.user_id
      });
      return res.status(403).json({ success: false, error: 'Access denied. This order does not belong to you.' });
    }
    
    logger.info('Order details retrieved', {
      orderId: req.params.orderId,
      userId: req.params.userId
    });
    res.json({ success: true, data: order });
  } catch (e) {
    logger.error('Failed to fetch order', {
      orderId: req.params.orderId,
      userId: req.params.userId,
      error: e.message,
      stack: e.stack
    });
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
});

// User management endpoints
router.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      logger.warn('User creation failed - missing fields', {
        name: !!name,
        email: !!email
      });
      return res.status(400).json({ success: false, error: 'Name and email are required' });
    }
    
    // Check if user already exists
    const checkQuery = 'SELECT id FROM users WHERE email = ?';
    const [existingUsers] = await execute(checkQuery, [email]);
    
    if (existingUsers.length > 0) {
      // User exists, return existing user ID
      logger.info('User already exists', {
        email,
        userId: existingUsers[0].id
      });
      return res.json({ success: true, userId: existingUsers[0].id });
    }
    
    // Create new user
    const userId = require('uuid').v4();
    const insertQuery = `
      INSERT INTO users (id, name, email, password_hash)
      VALUES (?, ?, ?, ?)
    `;
    
    // For demo purposes, use a simple hash of the email as password
    const passwordHash = require('crypto').createHash('sha256').update(email).digest('hex');
    
    await execute(insertQuery, [userId, name, email, passwordHash]);
    
    logger.info('User created successfully', {
      userId,
      name,
      email
    });
    res.json({ success: true, userId });
  } catch (e) {
    logger.error('Error creating user', {
      name: req.body.name,
      email: req.body.email,
      error: e.message,
      stack: e.stack
    });
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

router.get('/users/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const query = 'SELECT id, name, email FROM users WHERE id = ?';
    const [users] = await execute(query, [userId]);
    
    if (users.length === 0) {
      logger.warn('User not found', {
        userId
      });
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    logger.info('User retrieved', {
      userId,
      name: users[0]?.name,
      email: users[0]?.email
    });
    res.json({ success: true, data: users[0] });
  } catch (e) {
    logger.error('Error fetching user', {
      userId: req.params.userId,
      error: e.message,
      stack: e.stack
    });
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

module.exports = router;