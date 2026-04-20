require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const productRoutes = require('./routes/products');
const { cache } = require('./config/redis');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('Loading product routes...');

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
app.use(cors());
app.use(express.json());

// Serve static assets from the public folder (one level up from src)
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// Root route – serve index.html explicitly
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: publicDir });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'catalog-service',
    timestamp: new Date().toISOString()
  });
});

// API routes – placed after static so UI is served for root
app.use('/api/products', productRoutes);

// Fallback to index.html for any other route (SPA support)
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: publicDir });
});

// 404 handler for API routes (won't be reached for SPA fallback)
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
  console.log(`API endpoints: http://localhost:${PORT}/api/products`);
});

module.exports = app;
