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
const PORT = process.env.PORT;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Request logging
app.use(express.json()); // Parse JSON request body

// Database connection
const pool = new Pool({
<<<<<<< HEAD
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
=======
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'dbis',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
>>>>>>> parent of 645e0af (Merge pull request #4 from notcaliper/blockchain)
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

// Make db pool available to routes
app.locals.db = pool;

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const identityRoutes = require('./src/routes/identity.routes');
const governmentRoutes = require('./src/routes/government.routes');
const blockchainRoutes = require('./src/routes/blockchain.routes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/identity', identityRoutes);
app.use('/api/government', governmentRoutes);
app.use('/api/blockchain', blockchainRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the Decentralized Biometric Identity System API',
    version: '1.0.0'
  });
});

<<<<<<< HEAD
// Test route for connectivity check
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend API is connected and working',
    timestamp: new Date().toISOString()
  });
});

// Network status endpoint
app.get('/api/network/status', async (req, res) => {
  const blockchainService = require('./services/blockchain.service');
  
  try {
    // Get blockchain network information
    const networkInfo = blockchainService.getNetworkInfo();
    
    // Check if contract is accessible
    const contractStatus = await blockchainService.isContractAccessible();
    
    res.json({
      success: true,
      status: 'online',
      network: {
        name: networkInfo.network.networkName,
        status: contractStatus.accessible ? 'online' : 'offline',
        contractAddress: networkInfo.network.contractAddress,
        error: contractStatus.error
      },
      connections: {
        database: true,
        blockchain: contractStatus.accessible,
        cache: true
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Network status error:', error);
    res.json({
      success: false,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Admin login endpoint for GET requests (for status checking)
app.get('/api/admin/login', (req, res) => {
  res.json({
    success: true,
    message: 'Login endpoint is available. Use POST method to login.',
    timestamp: new Date().toISOString()
  });
});

=======
>>>>>>> parent of 645e0af (Merge pull request #4 from notcaliper/blockchain)
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
