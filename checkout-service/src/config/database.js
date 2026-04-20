const mysql = require('mysql2/promise');
const logger = require('../logger');

let pool = null;
let isConnected = false;

// Initialize database connection
async function initDatabase() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'shophub',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    const connection = await pool.getConnection();
    logger.info('MySQL connected successfully');
    connection.release();
    isConnected = true;
    return true;
  } catch (error) {
    logger.warn('MySQL not connected. Running in memory mode.', {
      error: error.message
    });
    isConnected = false;
    return false;
  }
}

// In-memory storage fallback
const orders = new Map();
const orderItems = new Map();

// Execute query with fallback to in-memory
async function execute(query, params) {
  if (!isConnected || !pool) {
    logger.debug('Using in-memory storage (MySQL not connected)', {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : '')
    });
    return [[], []];
  }
  
  try {
    const result = await pool.execute(query, params);
    logger.debug('Database query executed', {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      affectedRows: result[0].affectedRows || 0
    });
    return result;
  } catch (error) {
    logger.error('Database query error', {
      error: error.message,
      query: query.substring(0, 100) + (query.length > 100 ? '...' : '')
    });
    return [[], []];
  }
}

// Get orders by user ID with items and user info
async function getOrdersByUserId(userId) {
  if (!isConnected) {
    const userOrders = Array.from(orders.values()).filter(order => order.userId === userId);
    logger.debug('Retrieved orders from memory', {
      userId,
      count: userOrders.length
    });
    return userOrders;
  }

  // Get orders with user info
  const ordersQuery = `
    SELECT o.*, u.name as user_name, u.email as user_email 
    FROM orders o 
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `;
  const [orderRows] = await execute(ordersQuery, [userId]);

  if (orderRows.length === 0) {
    logger.debug('No orders found for user', {
      userId
    });
    return [];
  }

  // Get all items for these orders
  const orderIds = orderRows.map(o => o.order_id);
  const placeholders = orderIds.map(() => '?').join(',');
  const itemsQuery = `SELECT * FROM order_items WHERE order_id IN (${placeholders})`;
  const [itemRows] = await execute(itemsQuery, orderIds);

  // Group items by order_id
  const itemsByOrder = {};
  itemRows.forEach(item => {
    if (!itemsByOrder[item.order_id]) {
      itemsByOrder[item.order_id] = [];
    }
    itemsByOrder[item.order_id].push(item);
  });

  // Attach items to each order
  const result = orderRows.map(order => ({
    ...order,
    user_name: order.user_name,
    user_email: order.user_email,
    items: itemsByOrder[order.order_id] || []
  }));
  
  logger.debug('Orders retrieved with items and user info', {
    userId,
    count: result.length
  });
  
  return result;
}

// Get single order with items and user info
async function getOrderWithItems(orderId) {
  if (!isConnected) {
    const order = orders.get(orderId);
    if (!order) {
      logger.debug('Order not found in memory', {
        orderId
      });
      return null;
    }
    const items = Array.from(orderItems.values()).filter(item => item.order_id === orderId);
    const result = { ...order, items };
    logger.debug('Order retrieved from memory', {
      orderId,
      itemCount: items.length
    });
    return result;
  }

  // Join orders with users to get user information
  const orderQuery = `
    SELECT o.*, u.name as user_name, u.email as user_email 
    FROM orders o 
    LEFT JOIN users u ON o.user_id = u.id 
    WHERE o.order_id = ?
  `;
  const itemsQuery = 'SELECT * FROM order_items WHERE order_id = ?';

  const [orderRows] = await execute(orderQuery, [orderId]);
  if (!orderRows || orderRows.length === 0) {
    logger.debug('Order not found in database', {
      orderId
    });
    return null;
  }

  const [itemRows] = await execute(itemsQuery, [orderId]);

  const order = orderRows[0];
  const result = {
    ...order,
    user_name: order.user_name,
    user_email: order.user_email,
    items: itemRows
  };
  
  logger.debug('Order retrieved with items and user info', {
    orderId,
    itemCount: itemRows.length
  });
  
  return result;
}

// Save order
async function saveOrderToDB(order) {
  if (!isConnected) {
    orders.set(order.orderId, order);
    order.items.forEach(item => {
      const itemId = require('uuid').v4();
      orderItems.set(itemId, { ...item, id: itemId, order_id: order.orderId });
    });
    logger.debug('Order saved to memory', {
      orderId: order.orderId,
      itemCount: order.items.length
    });
    return order;
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const orderQuery = `
      INSERT INTO orders (order_id, user_id, status, subtotal, discount, discount_code, 
        tax_amount, shipping_cost, shipping_address, payment_method, payment_status, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const orderResult = await connection.execute(orderQuery, [
      order.orderId || null,
      order.userId || null,
      order.status || null,
      order.pricing?.subtotal ?? null,
      order.pricing?.discount ?? null,
      order.pricing?.discountCode ?? null,
      order.pricing?.tax ?? null,
      order.pricing?.shippingCost ?? null,
      order.shippingAddress || null,
      order.paymentMethod || null,
      order.paymentStatus || null,
      order.pricing?.total ?? null
    ]);

    const itemQuery = `
      INSERT INTO order_items (id, order_id, product_id, name, price, quantity, subtotal, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    for (const item of order.items) {
      await connection.execute(itemQuery, [
        require('uuid').v4() || null,
        order.orderId || null,
        item.productId || null,
        item.name || null,
        item.price || null,
        item.quantity || null,
        item.subtotal || null,
        item.image || ''
      ]);
    }

    await connection.commit();
    logger.info('Order saved to database', {
      orderId: order.orderId,
      userId: order.userId,
      itemCount: order.items.length,
      total: order.pricing?.total
    });
    return order;
  } catch (error) {
    await connection.rollback();
    logger.error('Failed to save order to database', {
      orderId: order.orderId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    connection.release();
  }
}

async function testConnection() {
  return await initDatabase();
}

module.exports = {
  getPool: () => pool,
  testConnection,
  getOrdersByUserId,
  getOrderWithItems,
  saveOrderToDB,
  isConnected: () => isConnected,
  orders,
  orderItems,
  execute
};