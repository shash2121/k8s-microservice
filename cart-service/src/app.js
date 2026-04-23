require('dotenv').config();
const express = require('express');
const cors = require('cors');

const cartRoutes = require('./routes/cart');
const { cache } = require('./config/redis');

const app = express();
const PORT = process.env.PORT || 3002;

async function connectRedis() {
  try {
    await cache.connect();
    console.log('✅ Redis connected');
  } catch (err) {
    console.warn('⚠️ Redis connection failed, continuing without cache:', err.message);
  }
}

connectRedis();

// Middleware
app.use(cors({
  origin: '*',
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

// API Routes – serve under both the raw path and the `/cart` prefix used by the ingress.
// This ensures the UI works when accessed directly (e.g., http://localhost:3002/api/cart)
// and when routed through an ingress that rewrites `/cart/...` to the service.
app.use('/api/cart', cartRoutes);
app.use('/cart/api/cart', cartRoutes);

// Static files – similar dual‑prefix handling for assets referenced in the HTML.
app.use(express.static('public'));
app.use('/cart', express.static('public'));

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
  console.log(`Health check: http://cart-service:${PORT}/health`);
  console.log(`API endpoints: http://cart-service:${PORT}/api/cart`);
});

module.exports = app;
