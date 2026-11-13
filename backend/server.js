/**
 * TrueID Decentralized Biometric Identity System (DBIS)
 * Main server file for the backend API
 */

const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const dbService = require('./services/db.service');
const config = require('./config/config');

// Create Express app
const app = express();
const PORT = config.PORT || 5000;

// Security & Parsing
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));
app.use(express.json());

// CORS configuration
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:3000', 'http://localhost:8000', 'http://127.0.0.1:3000'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Custom Clean & Informative HTTP Request Logger
morgan.token('colored-method', (req) => {
  const colors = {
    GET: '\x1b[32mGET\x1b[0m',
    POST: '\x1b[34mPOST\x1b[0m',
    PUT: '\x1b[33mPUT\x1b[0m',
    DELETE: '\x1b[31mDELETE\x1b[0m',
    OPTIONS: '\x1b[90mOPTIONS\x1b[0m'
  };
  return colors[req.method] || req.method;
});

morgan.token('colored-status', (req, res) => {
  const status = res.statusCode;
  if (status >= 500) return `\x1b[41;37m ${status} \x1b[0m`;
  if (status >= 400) return `\x1b[31m${status}\x1b[0m`;
  if (status >= 300) return `\x1b[36m${status}\x1b[0m`;
  if (status >= 200) return `\x1b[32m${status}\x1b[0m`;
  return String(status);
});

morgan.token('clean-time', () => {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
});

app.use(morgan('\x1b[90m[:clean-time]\x1b[0m :colored-method :url :colored-status \x1b[90m(:response-time ms)\x1b[0m', {
  skip: (req) => req.path === '/api/health' || req.method === 'OPTIONS'
}));

// Automatic database health check (quiet, checks every 60s)
setInterval(() => {
  if (!dbService.getConnectionStatus()) {
    console.warn('\x1b[33m⚠ [DB]\x1b[0m Connection dropped. Attempting automatic reconnection...');
    dbService.testConnection();
  }
}, 60000);

// Structured logger
const logger = {
  info: (msg, ...args) => console.log(`\x1b[36mℹ [INFO]\x1b[0m ${msg}`, ...args),
  success: (msg, ...args) => console.log(`\x1b[32m✔ [SUCCESS]\x1b[0m ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`\x1b[33m⚠ [WARN]\x1b[0m ${msg}`, ...args),
  error: (msg, ...args) => console.error(`\x1b[31m✖ [ERROR]\x1b[0m ${msg}`, ...args)
};

app.locals.db = dbService;
app.locals.logger = logger;

// Database readiness check middleware
app.use(async (req, res, next) => {
  if (!dbService.getConnectionStatus() && req.path.startsWith('/api') && req.path !== '/api/health') {
    return res.status(503).json({ 
      message: 'Database connection not ready. Please try again in a moment.',
      retryAfter: 3
    });
  }
  next();
});

// Route Mounts
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const blockchainRoutes = require('./routes/blockchain.routes');
const networkRoutes = require('./routes/network.routes');
const testRoutes = require('./routes/test.routes');
const professionRoutes = require('./routes/profession.routes');
const documentRoutes = require('./routes/document.routes');
const mfaRoutes = require('./routes/mfa.routes');
const sessionRoutes = require('./routes/session.routes');
const gdprRoutes = require('./routes/gdpr.routes');

app.use('/api/user', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/test', testRoutes);
app.use('/api/profession', professionRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/mfa', mfaRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/gdpr', gdprRoutes);

// Storage directory
const uploadDir = path.join(__dirname, 'uploads');
fs.mkdirSync(path.join(uploadDir, 'documents'), { recursive: true });

app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(uploadDir));

app.use('/public', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, '..', 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = dbService.getConnectionStatus() ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    uptime: process.uptime()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'TrueID Decentralized Identity System API',
    network: 'Ethereum Sepolia (Chain ID 11155111)',
    version: '1.2.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error at ${req.method} ${req.url}:`, err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
const startServer = async () => {
  if (!dbService.getConnectionStatus()) {
    await new Promise((resolve) => {
      dbService.once('connected', resolve);
    });
  }
  
  app.listen(PORT, () => {
    console.log('\n\x1b[36m╔═══════════════════════════════════════════════════════════╗\x1b[0m');
    console.log('\x1b[36m║\x1b[0m       \x1b[1;37mTrueID Identity System — Backend API Server\x1b[0m         \x1b[36m║\x1b[0m');
    console.log('\x1b[36m║\x1b[0m                                                           \x1b[36m║\x1b[0m');
    console.log(`\x1b[36m║\x1b[0m   Status:    \x1b[32m● ONLINE\x1b[0m (\x1b[1mhttp://localhost:${PORT}\x1b[0m)                  \x1b[36m║\x1b[0m`);
    console.log(`\x1b[36m║\x1b[0m   Database:  \x1b[32m● CONNECTED\x1b[0m (\x1b[90m${config.DB_HOST}:${config.DB_PORT}\x1b[0m)            \x1b[36m║\x1b[0m`);
    console.log('\x1b[36m║\x1b[0m   Network:   \x1b[35mEthereum Sepolia (Chain ID 11155111)\x1b[0m        \x1b[36m║\x1b[0m');
    console.log('\x1b[36m╚═══════════════════════════════════════════════════════════╝\x1b[0m\n');
  });
};

startServer().catch(err => {
  console.error('\x1b[31m✖ Failed to start server:\x1b[0m', err);
  process.exit(1);
});

module.exports = app;
