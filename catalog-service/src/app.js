require('dotenv').config();
const express = require('express');
const cors = require('cors');

const productRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 3001;

// Kubernetes service URLs
const LANDING_SERVICE_URL = process.env.LANDING_SERVICE_URL || 'http://landing-service:3000';
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://cart-service:3002';
const CHECKOUT_SERVICE_URL = process.env.CHECKOUT_SERVICE_URL || 'http://checkout-service:3003';

console.log('Loading product routes...');
console.log(`Landing Service URL: ${LANDING_SERVICE_URL}`);
console.log(`Cart Service URL: ${CART_SERVICE_URL}`);
console.log(`Checkout Service URL: ${CHECKOUT_SERVICE_URL}`);

// Middleware
app.use(cors({
  origin: [
    process.env.ALLOWED_ORIGINS || '*',
    LANDING_SERVICE_URL,
    CART_SERVICE_URL,
    CHECKOUT_SERVICE_URL
  ].filter(Boolean)
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'catalog-service',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/products', productRoutes);

// Static files
app.use(express.static('public'));

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
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
  console.log(`Catalog Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
