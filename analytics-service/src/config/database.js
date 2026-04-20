const mysql = require('mysql2/promise');
const logger = require('../logger');

let pool = null;
let isConnected = false;

async function initDatabase() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'analytics',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0
    });
    const conn = await pool.getConnection();
    logger.info('Analytics MySQL connected');
    conn.release();
    isConnected = true;
    return true;
  } catch (err) {
    logger.error('Analytics DB connection failed', { error: err.message });
    isConnected = false;
    return false;
  }
}

async function insertEvent(event) {
  if (!isConnected) {
    logger.warn('Cannot insert event, DB not connected');
    return;
  }
  const sql = `INSERT INTO events 
    (event_name, exchange_name, routing_key, payload, order_id, user_id, total_amount, processed, processed_at) 
    VALUES (?,?,?,?,?,?,?,TRUE,NOW())`;
  const params = [
    event.event_name,
    event.exchange_name,
    event.routing_key,
    JSON.stringify(event.payload),
    event.payload.orderId || null,
    event.payload.userId || null,
    event.payload.total || null
  ];
  try {
    const [result] = await pool.execute(sql, params);
    logger.info('Analytics event stored', { insertId: result.insertId, event_name: event.event_name });
  } catch (e) {
    logger.error('Failed to store analytics event', { error: e.message });
  }
}

module.exports = { initDatabase, insertEvent };
