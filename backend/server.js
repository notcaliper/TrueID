/**
 * Decentralized Biometric Identity System (DBIS)
 * Main server file for the backend API
 */

const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const dbService = require('./services/db.service');
const config = require('./config/config');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// Create Express app
const app = express();
// Explicitly set port to 5000
const PORT = 5000; // Using port 5000 as specified

// Middleware
app.use(helmet()); // Security headers

// Custom CORS headers
app.use((req, res, next) => {
  // Set CORS headers for frontend requests
  const allowedOrigins = ['http://localhost:3000', 'http://localhost:8000'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Custom logging middleware to reduce verbosity
app.use(morgan('combined', {
  skip: function (req, res) {
    // Skip logging for frequent GET requests to users endpoint
    return req.method === 'GET' && req.path.includes('/api/admin/users');
  }
}));

app.use(morgan('dev')); // Request logging
app.use(express.json()); // Parse JSON request body

// Database service is already initialized and will handle connections automatically

// Listen for database connection events
dbService.on('connected', () => {
  console.log('Database service connected successfully');
});

dbService.on('error', (err) => {
  console.error('Database service error:', err);
});

// Log database connection status
console.log('Database service initialized with connection pooling and circuit breaker');
console.log(`Using database host: ${config.DB_HOST}`);

// Set up automatic reconnection attempts in case of failure
setInterval(() => {
  if (!dbService.isConnected) {
    console.log('Attempting to reconnect to database...');
    dbService.testConnection();
  }
}, 60000); // Check every minute

// Create a simple logger
const logger = {
  info: (message, ...args) => console.log(`[INFO] ${message}`, ...args),
  error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
  debug: (message, ...args) => console.debug(`[DEBUG] ${message}`, ...args)
};

// Make db service and logger available to routes
app.locals.db = dbService;
app.locals.logger = logger;

// Add database connection check middleware
app.use(async (req, res, next) => {
  if (!dbService.getConnectionStatus()) {
    return res.status(503).json({ 
      message: 'Database connection not ready. Please try again in a moment.',
      retryAfter: 5
    });
  }
  next();
});

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const blockchainRoutes = require('./routes/blockchain.routes');
const networkRoutes = require('./routes/network.routes');
const testRoutes = require('./routes/test.routes');
const professionRoutes = require('./routes/profession.routes');
const documentRoutes = require('./routes/document.routes');

// Use routes
app.use('/api/user', authRoutes); // Changed from '/api/auth' to '/api/user' to match frontend expectations
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/test', testRoutes);
app.use('/api/profession', professionRoutes);
app.use('/api/documents', documentRoutes);

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads/documents');
fs.mkdirSync(uploadDir, { recursive: true });

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = dbService.getConnectionStatus() ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
    database: dbStatus,
    uptime: process.uptime()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the Decentralized Biometric Identity System API',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server only after database is connected
const startServer = async () => {
  // Wait for database connection
  if (!dbService.getConnectionStatus()) {
    console.log('Waiting for database connection...');
    await new Promise((resolve) => {
      dbService.once('connected', resolve);
    });
  }
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Database connected successfully to ${config.DB_HOST}`);
  });
};

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app; // For testing purposes
