require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { testConnection } = require('./config/database');

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Kubernetes service URLs
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3001';
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://cart-service:3002';
const CHECKOUT_SERVICE_URL = process.env.CHECKOUT_SERVICE_URL || 'http://checkout-service:3003';

// Middleware
app.use(cors({
  origin: [
    process.env.ALLOWED_ORIGINS || '*',
    CATALOG_SERVICE_URL,
    CART_SERVICE_URL,
    CHECKOUT_SERVICE_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'shophub-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'landing-service',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// Static files
app.use(express.static('public'));

// Root endpoint - Landing page
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// Login page
app.get('/login', (req, res) => {
  res.sendFile('login.html', { root: 'public' });
});

// Signup page
app.get('/signup', (req, res) => {
  res.sendFile('signup.html', { root: 'public' });
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
    console.log(`Landing Service running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Catalog Service URL: ${CATALOG_SERVICE_URL}`);
    console.log(`Cart Service URL: ${CART_SERVICE_URL}`);
    console.log(`Checkout Service URL: ${CHECKOUT_SERVICE_URL}`);
  });
}

startServer();

module.exports = app;
