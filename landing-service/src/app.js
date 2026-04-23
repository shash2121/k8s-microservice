require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { testConnection } = require('./config/database');
const { createProxyMiddleware } = require('http-proxy-middleware');

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const CATALOG_URL = process.env.CATALOG_URL || 'http://catalog-service:3001';

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.ALLOWED_ORIGIN
  ].filter(Boolean),
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Session ──────────────────────────────────────────────────────────────────

app.use(session({
  secret: process.env.SESSION_SECRET || 'shophub-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// ─── Debug ────────────────────────────────────────────────────────────────────

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} from ${req.ip}`);
  next();
});

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'landing-service',
    timestamp: new Date().toISOString()
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);

// ─── Catalog Proxy ────────────────────────────────────────────────────────────
// Must be defined BEFORE express.static so /catalog/* is proxied,
// not intercepted by static file serving.

app.use('/catalog', createProxyMiddleware({
  target: CATALOG_URL,
  changeOrigin: true,
  pathRewrite: { '^/catalog': '' },
  logLevel: 'warn',
  on: {
    error: (err, req, res) => {
      console.error('[Proxy Error]', err.message);
      res.status(502).json({ error: 'Catalog service unavailable' });
    }
  }
}));

// ─── Pages ────────────────────────────────────────────────────────────────────
// Explicit routes defined before express.static so they take precedence.

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

app.get('/login', (req, res) => {
  res.sendFile('login.html', { root: 'public' });
});

app.get('/signup', (req, res) => {
  res.sendFile('signup.html', { root: 'public' });
});

// ─── Static Files ─────────────────────────────────────────────────────────────
// Placed after explicit routes so it only handles assets (CSS, JS, images etc.)

app.use(express.static('public'));

// ─── 404 ──────────────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// ─── Error Handler ────────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

async function startServer() {
  await testConnection();

  app.listen(PORT, () => {
    console.log(`Landing Service running on port ${PORT}`);
    console.log(`Health check:  http://localhost:${PORT}/health`);
    console.log(`Landing page:  http://localhost:${PORT}`);
    console.log(`Catalog proxy: http://localhost:${PORT}/catalog → ${CATALOG_URL}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;