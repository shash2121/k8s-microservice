require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');

const checkoutRoutes = require('./routes/checkout');

const app = express();
const PORT = process.env.PORT || 3003;

// Kubernetes service URLs
const LANDING_SERVICE_URL = process.env.LANDING_SERVICE_URL || 'http://landing-service:3000';
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3001';
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://cart-service:3002';

// Middleware
app.use(cors({
  origin: [
    process.env.ALLOWED_ORIGINS || '*',
    LANDING_SERVICE_URL,
    CATALOG_SERVICE_URL,
    CART_SERVICE_URL
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} from ${req.ip}`);
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

// API Routes
app.use('/api/checkout', checkoutRoutes);

// Static files
app.use(express.static('public'));

// Root endpoint - Checkout page
app.get('/', (req, res) => {
  res.sendFile('checkout.html', { root: 'public' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
async function startServer() {
  // Test database connection
  await testConnection();

  app.listen(PORT, () => {
    console.log(`Checkout Service running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Landing Service URL: ${LANDING_SERVICE_URL}`);
    console.log(`Catalog Service URL: ${CATALOG_SERVICE_URL}`);
    console.log(`Cart Service URL: ${CART_SERVICE_URL}`);
  });
}

startServer();

module.exports = app;
