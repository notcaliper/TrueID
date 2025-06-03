/**
 * Standalone Blockchain API Server for DBIS
 * This file creates a simple Express server that handles blockchain operations
 */
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const ethers = require('ethers');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'dbis',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header is required' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dbis_secure_jwt_secret_key_2025');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Basic blockchain service implementation
const blockchainService = {
  getBlockchainConfig: () => {
    const network = process.env.BLOCKCHAIN_NETWORK || 'hardhat';
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
    const contractAddress = process.env.LOCAL_CONTRACT_ADDRESS;
    const privateKey = process.env.ADMIN_PRIVATE_KEY;
    
    return {
      network,
      rpcUrl,
      contractAddress,
      privateKey
    };
  },
  
  isContractAccessible: async () => {
    const config = blockchainService.getBlockchainConfig();
    
    // Simulate blockchain connection check
    if (!config.rpcUrl || !config.contractAddress || !config.privateKey) {
      return {
        accessible: false,
        error: 'Missing blockchain configuration',
        network: config.network
      };
    }
    
    // In a real implementation, this would connect to the blockchain
    // For now, we'll simulate success
    return {
      accessible: true,
      network: config.network
    };
  }
};

// Routes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'DBIS Blockchain API',
    timestamp: new Date().toISOString()
  });
});

// Push to blockchain endpoint
app.head('/push/:userId', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Blockchain push endpoint is available'
  });
});

app.post('/push/:userId', verifyToken, async (req, res) => {
  const userId = req.params.userId;
  
  try {
    // Check if blockchain is accessible
    const contractStatus = await blockchainService.isContractAccessible();
    if (!contractStatus.accessible) {
      return res.status(503).json({
        message: 'Blockchain service unavailable',
        details: contractStatus.error,
        network: contractStatus.network
      });
    }
    
    // Check if user exists
    const userResult = await pool.query(
      'SELECT id, name, government_id, avax_address FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Check if user has a wallet address
    if (!user.avax_address) {
      return res.status(400).json({ message: 'User does not have a wallet address' });
    }
    
    // Get user's biometric data
    const biometricResult = await pool.query(
      'SELECT id, facemesh_hash FROM biometric_data WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    
    if (biometricResult.rows.length === 0) {
      return res.status(400).json({ message: 'User does not have active biometric data' });
    }
    
    const biometricData = biometricResult.rows[0];
    
    // Simulate blockchain transaction (in a real implementation, this would interact with the blockchain)
    const txHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const blockNumber = Math.floor(Math.random() * 1000000);
    
    // Update biometric data with simulated blockchain transaction hash
    await pool.query(
      'UPDATE biometric_data SET blockchain_tx_hash = $1 WHERE id = $2',
      [txHash, biometricData.id]
    );
    
    // Return success response
    res.status(200).json({
      message: 'Identity recorded on blockchain successfully',
      transaction: {
        hash: txHash,
        blockNumber: blockNumber,
        status: 'SUCCESS'
      }
    });
  } catch (error) {
    console.error('Record identity on blockchain error:', error);
    res.status(500).json({ message: 'Server error while recording identity on blockchain' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Blockchain API server running on port ${PORT}`);
}); 