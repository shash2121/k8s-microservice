require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');
const { cache } = require('./config/redis');
const logger = require('./logger');

const checkoutRoutes = require('./routes/checkout');

const app = express();
const PORT = process.env.PORT || 3003;

async function connectRedis() {
  try {
    await cache.connect();
    logger.info('Redis connected');
  } catch (err) {
    logger.warn('Redis connection failed, continuing without cache', { error: err.message });
  }
}

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} from ${req.ip}`, {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'checkout-service',
    timestamp: new Date().toISOString()
  });
});

// API Routes – expose under both raw and `/checkout` prefixes for ingress rewrites.
app.use('/api/checkout', checkoutRoutes);
app.use('/checkout/api/checkout', checkoutRoutes);

// Order page – serve under both raw and prefixed paths.
// Serve orders page under both `/orders` and `/checkout/orders` for ingress.
app.use('/orders', (req, res) => {
  res.sendFile('orders.html', { root: 'public' });
});
app.use('/checkout/orders', (req, res) => {
  res.sendFile('orders.html', { root: 'public' });
});

// Static files – serve assets at root and under `/checkout` prefix.
app.use(express.static('public'));
app.use('/checkout', express.static('public'));

// Root endpoint - Checkout page
app.get('/', (req, res) => {
  res.sendFile('checkout.html', { root: 'public' });
});

// Orders page
app.get('/orders', (req, res) => {
  res.sendFile('orders.html', { root: 'public' });
});

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Internal Server Error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path
  });
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
async function startServer() {
  // Test database connection
  logger.info('Testing database connection');
  await testConnection();
  
  // Connect to Redis
  await connectRedis();
  
  app.listen(PORT, () => {
    logger.info(`Checkout Service running on port ${PORT}`, {
      port: PORT,
      healthCheck: `http://localhost:${PORT}/health`,
      apiEndpoints: `http://localhost:${PORT}/api/checkout`
    });
  });
}

startServer();

module.exports = app;
