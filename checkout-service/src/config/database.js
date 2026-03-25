const mysql = require('mysql2/promise');

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
    console.log('✅ MySQL connected successfully');
    connection.release();
    isConnected = true;
    return true;
  } catch (error) {
    console.warn('⚠️  MySQL not connected. Running in memory mode.');
    console.warn('   Database error:', error.message);
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
    console.log('Using in-memory storage (MySQL not connected)');
    return [[], []];
  }
  
  try {
    return await pool.execute(query, params);
  } catch (error) {
    console.error('Database query error:', error.message);
    return [[], []];
  }
}

// Get orders by user ID
async function getOrdersByUserId(userId) {
  if (!isConnected) {
    return Array.from(orders.values()).filter(order => order.user_id === userId);
  }
  
  const query = `
    SELECT o.*, 
           GROUP_CONCAT(oi.id) as item_ids,
           COUNT(oi.id) as item_count
    FROM orders o
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.user_id = ?
    GROUP BY o.order_id
    ORDER BY o.created_at DESC
  `;
  const [rows] = await execute(query, [userId]);
  return rows;
}

// Get single order with items
async function getOrderWithItems(orderId) {
  if (!isConnected) {
    const order = orders.get(orderId);
    if (!order) return null;
    const items = Array.from(orderItems.values()).filter(item => item.order_id === orderId);
    return { ...order, items };
  }
  
  const orderQuery = 'SELECT * FROM orders WHERE order_id = ?';
  const itemsQuery = 'SELECT * FROM order_items WHERE order_id = ?';
  
  const [orderRows] = await execute(orderQuery, [orderId]);
  if (orderRows.length === 0) return null;
  
  const [itemRows] = await execute(itemsQuery, [orderId]);
  
  return {
    ...orderRows[0],
    items: itemRows
  };
}

// Save order
async function saveOrderToDB(order) {
  if (!isConnected) {
    orders.set(order.orderId, order);
    order.items.forEach(item => {
      const itemId = require('uuid').v4();
      orderItems.set(itemId, { ...item, id: itemId, order_id: order.orderId });
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
    await connection.execute(orderQuery, [
      order.orderId,
      order.userId,
      order.status,
      order.pricing.subtotal,
      order.pricing.discount,
      order.pricing.discountCode,
      order.pricing.tax,
      order.pricing.shippingCost,
      order.shippingAddress,
      order.paymentMethod,
      order.paymentStatus,
      order.pricing.total
    ]);

    const itemQuery = `
      INSERT INTO order_items (id, order_id, product_id, name, price, quantity, subtotal)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    for (const item of order.items) {
      await connection.execute(itemQuery, [
        require('uuid').v4(),
        order.orderId,
        item.productId,
        item.name,
        item.price,
        item.quantity,
        item.subtotal
      ]);
    }

    await connection.commit();
    return order;
  } catch (error) {
    await connection.rollback();
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
  isConnected: () => isConnected
};
