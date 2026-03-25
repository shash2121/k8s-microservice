require('dotenv').config();
const express = require('express');
const cors = require('cors');

const cartRoutes = require('./routes/cart');

const app = express();
const PORT = process.env.PORT || 3002;

// Kubernetes service URLs
const LANDING_SERVICE_URL = process.env.LANDING_SERVICE_URL || 'http://landing-service:3000';
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3001';
const CHECKOUT_SERVICE_URL = process.env.CHECKOUT_SERVICE_URL || 'http://checkout-service:3003';

// Middleware
app.use(cors({
  origin: [
    process.env.ALLOWED_ORIGINS || '*',
    LANDING_SERVICE_URL,
    CATALOG_SERVICE_URL,
    CHECKOUT_SERVICE_URL
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
    service: 'cart-service',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/cart', cartRoutes);

// Static files
app.use(express.static('public'));

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile('cart.html', { root: 'public' });
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
app.listen(PORT, () => {
  console.log(`Cart Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Landing Service URL: ${LANDING_SERVICE_URL}`);
  console.log(`Catalog Service URL: ${CATALOG_SERVICE_URL}`);
  console.log(`Checkout Service URL: ${CHECKOUT_SERVICE_URL}`);
});

module.exports = app;
