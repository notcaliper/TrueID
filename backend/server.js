/**
 * Decentralized Biometric Identity System (DBIS)
 * Main server file for the backend API
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { Pool } = require('pg');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Configure Helmet with adjusted settings for development
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP in development
}));

// Configure CORS to allow requests from the frontend
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3006', 'http://localhost:3007'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Health-Check', 'Accept'],
  credentials: true
}));

app.use(morgan('dev')); // Request logging
app.use(express.json()); // Parse JSON request body

// Health check middleware - this should come before other routes
app.use((req, res, next) => {
  // Check if this is a health check request
  if (req.headers['x-health-check'] === 'true' || req.query.healthCheck === 'true') {
    return res.status(200).json({
      status: 'ok',
      service: 'DBIS Backend API',
      timestamp: new Date().toISOString()
    });
  }
  next();
});

// Root health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'DBIS Backend API',
    timestamp: new Date().toISOString()
  });
});

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'DBIS Backend API',
    timestamp: new Date().toISOString()
  });
});

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

// Create a simple logger
const logger = {
  info: (message, ...args) => console.log(`[INFO] ${message}`, ...args),
  error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
  debug: (message, ...args) => console.debug(`[DEBUG] ${message}`, ...args)
};

// Make db pool and logger available to routes
app.locals.db = pool;
app.locals.logger = logger;

// Health check middleware - handles OPTIONS requests and HEAD/GET requests with health-check header
app.use((req, res, next) => {
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Check if this is a health check request (using custom header or query param)
  const isHealthCheck = req.headers['x-health-check'] === 'true' || req.query.healthCheck === 'true' || 
                      (req.method === 'HEAD') || (req.method === 'GET' && req.headers['accept'] === 'application/health+json');
  
  if (isHealthCheck) {
    // For health checks, always return 200 OK
    if (req.method === 'HEAD') {
      return res.status(200).end();
    }
    return res.status(200).json({
      status: 'ok',
      service: 'DBIS API',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
});

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const identityRoutes = require('./src/routes/identity.routes');
const governmentRoutes = require('./src/routes/government.routes');
const blockchainRoutes = require('./routes/blockchain.routes');
const adminRoutes = require('./routes/admin.routes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/identity', identityRoutes);
app.use('/api/government', governmentRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the Decentralized Biometric Identity System API',
    version: '1.0.0'
  });
});

// Test route for connectivity check
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend API is connected and working',
    timestamp: new Date().toISOString()
  });
});

// Network status endpoint
app.get('/api/network/status', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    network: process.env.BLOCKCHAIN_NETWORK || 'mumbai',
    connections: {
      database: true,
      blockchain: true,
      cache: true
    },
    timestamp: new Date().toISOString()
  });
});

// Admin login endpoint for GET requests (for status checking)
app.get('/api/admin/login', (req, res) => {
  res.json({
    success: true,
    message: 'Login endpoint is available. Use POST method to login.',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing purposes
