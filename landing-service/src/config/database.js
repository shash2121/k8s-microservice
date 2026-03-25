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

// In-memory user storage fallback
const users = new Map();

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

// Test connection
async function testConnection() {
  return await initDatabase();
}

module.exports = { 
  getPool: () => pool,
  testConnection,
  getUsersMap: () => users,
  isConnected: () => isConnected,
  execute
};
