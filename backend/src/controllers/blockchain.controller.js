/**
 * Blockchain controller for DBIS
 */
const { validationResult } = require('express-validator');
const blockchainService = require('../services/blockchain.service');

/**
 * Register user identity on blockchain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.registerIdentity = async (req, res) => {
  try {
    // Extract userId either from the authenticated user, the request body, or URL parameters
    let userId;
    
    // First check if recordId is provided in URL parameters (for /push/:recordId endpoint)
    if (req.params.recordId) {
      userId = req.params.recordId;
    } 
    // Then check if userId is provided in the request body
    else if (req.body.userId) {
      userId = req.body.userId;
    }
    // Finally default to authenticated user's ID
    else {
      userId = req.user.id;
    }
    
    const db = req.app.locals.db;

    // Check if user has a wallet address
    const userResult = await db.query(
      'SELECT wallet_address FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const walletAddress = userResult.rows[0].wallet_address;
    if (!walletAddress) {
      return res.status(400).json({ message: 'User does not have a connected wallet address' });
    }

    // Check if user has biometric data
    const biometricResult = await db.query(
      'SELECT facemesh_hash FROM biometric_data WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (biometricResult.rows.length === 0) {
      return res.status(400).json({ message: 'User does not have active biometric data' });
    }

    const biometricHash = biometricResult.rows[0].facemesh_hash;

    // Create a professional data hash (placeholder - in a real implementation, this would be based on user's profile data)
    const professionalDataHash = 'professional_data_hash_placeholder';

    // Register identity on blockchain
    const result = await blockchainService.registerIdentity(
      walletAddress,
      biometricHash,
      professionalDataHash
    );

    // Update biometric data with blockchain transaction hash
    await db.query(
      'UPDATE biometric_data SET blockchain_tx_hash = $1 WHERE user_id = $2 AND is_active = true',
      [result.transactionHash, userId]
    );

    // Log the registration
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        userId,
        'REGISTER_ON_BLOCKCHAIN',
        'users',
        userId,
        JSON.stringify({
          walletAddress,
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber
        }),
        req.ip
      ]
    );

    res.status(200).json({
      message: 'Identity registered on blockchain successfully',
      transaction: {
        hash: result.transactionHash,
        blockNumber: result.blockNumber,
        status: result.status
      }
    });
  } catch (error) {
    console.error('Register identity on blockchain error:', error);
    res.status(500).json({ message: 'Server error while registering identity on blockchain' });
  }
};

/**
 * Get user identity status on blockchain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getIdentityStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = req.app.locals.db;

    // Check if user has a wallet address
    const userResult = await db.query(
      'SELECT wallet_address FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const walletAddress = userResult.rows[0].wallet_address;
    if (!walletAddress) {
      return res.status(400).json({ message: 'User does not have a connected wallet address' });
    }

    // Get blockchain status
    const isVerified = await blockchainService.isIdentityVerified(walletAddress);
    const biometricHash = await blockchainService.getBiometricHash(walletAddress);
    const recordCount = await blockchainService.getProfessionalRecordCount(walletAddress);

    // Get biometric data from database
    const biometricResult = await db.query(
      'SELECT id, facemesh_hash, blockchain_tx_hash, created_at, updated_at FROM biometric_data WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    res.status(200).json({
      message: 'Identity status retrieved successfully',
      blockchainStatus: {
        walletAddress,
        isRegistered: biometricHash !== '0x0000000000000000000000000000000000000000000000000000000000000000',
        isVerified,
        professionalRecordCount: recordCount
      },
      databaseStatus: {
        hasBiometricData: biometricResult.rows.length > 0,
        biometricData: biometricResult.rows[0] || null
      }
    });
  } catch (error) {
    console.error('Get identity status error:', error);
    res.status(500).json({ message: 'Server error while retrieving identity status' });
  }
};

/**
 * Add professional record to blockchain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.addProfessionalRecord = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recordId } = req.body;
    
    if (!recordId) {
      return res.status(400).json({ message: 'Record ID is required' });
    }
    
    const db = req.app.locals.db;

    // Check if user has a wallet address
    const userResult = await db.query(
      'SELECT wallet_address FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const walletAddress = userResult.rows[0].wallet_address;
    if (!walletAddress) {
      return res.status(400).json({ message: 'User does not have a connected wallet address' });
    }

    // Get record details
    const recordResult = await db.query(
      'SELECT data_hash, start_date, end_date FROM professional_records WHERE id = $1 AND user_id = $2',
      [recordId, userId]
    );

    if (recordResult.rows.length === 0) {
      return res.status(404).json({ message: 'Professional record not found' });
    }

    const record = recordResult.rows[0];

    // Add record to blockchain
    const result = await blockchainService.addProfessionalRecord(
      walletAddress,
      record.data_hash,
      record.start_date,
      record.end_date
    );

    // Update record with blockchain transaction hash
    await db.query(
      'UPDATE professional_records SET blockchain_tx_hash = $1 WHERE id = $2',
      [result.transactionHash, recordId]
    );

    // Log the addition
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        userId,
        'ADD_PROFESSIONAL_RECORD_TO_BLOCKCHAIN',
        'professional_records',
        recordId,
        JSON.stringify({
          walletAddress,
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber
        }),
        req.ip
      ]
    );

    res.status(200).json({
      message: 'Professional record added to blockchain successfully',
      transaction: {
        hash: result.transactionHash,
        blockNumber: result.blockNumber,
        status: result.status
      }
    });
  } catch (error) {
    console.error('Add professional record to blockchain error:', error);
    res.status(500).json({ message: 'Server error while adding professional record to blockchain' });
  }
};

/**
 * Get professional records from blockchain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getProfessionalRecords = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = req.app.locals.db;

    // Check if user has a wallet address
    const userResult = await db.query(
      'SELECT wallet_address FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const walletAddress = userResult.rows[0].wallet_address;
    if (!walletAddress) {
      return res.status(400).json({ message: 'User does not have a connected wallet address' });
    }

    // Get record count from blockchain
    const recordCount = await blockchainService.getProfessionalRecordCount(walletAddress);

    // Get records from blockchain
    const records = [];
    for (let i = 0; i < recordCount; i++) {
      try {
        const record = await blockchainService.getProfessionalRecord(walletAddress, i);
        records.push({
          index: i,
          ...record
        });
      } catch (error) {
        console.error(`Error retrieving record at index ${i}:`, error);
      }
    }

    res.status(200).json({
      message: 'Professional records retrieved successfully',
      walletAddress,
      recordCount,
      records
    });
  } catch (error) {
    console.error('Get professional records from blockchain error:', error);
    res.status(500).json({ message: 'Server error while retrieving professional records from blockchain' });
  }
};

/**
 * Grant role to a user (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.grantRole = async (req, res) => {
  try {
    const { userAddress, role } = req.body;
    
    if (!userAddress || !role) {
      return res.status(400).json({ message: 'User address and role are required' });
    }
    
    // Validate role
    const validRoles = ['USER_ROLE', 'GOVERNMENT_ROLE', 'ADMIN_ROLE'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be one of: ' + validRoles.join(', ') });
    }
    
    // Grant role on blockchain
    const result = await blockchainService.grantRole(userAddress, role);
    
    // Log the action
    const db = req.app.locals.db;
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        req.user.id,
        'GRANT_ROLE',
        'users',
        null, // No specific user ID in the database
        JSON.stringify({
          userAddress,
          role,
          transactionHash: result.transactionHash
        }),
        req.ip
      ]
    );
    
    res.status(200).json({
      message: 'Role granted successfully',
      transaction: {
        hash: result.transactionHash,
        blockNumber: result.blockNumber,
        status: result.status
      }
    });
  } catch (error) {
    console.error('Grant role error:', error);
    res.status(500).json({ message: 'Server error while granting role' });
  }
};

/**
 * Revoke role from a user (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.revokeRole = async (req, res) => {
  try {
    const { userAddress, role } = req.body;
    
    if (!userAddress || !role) {
      return res.status(400).json({ message: 'User address and role are required' });
    }
    
    // Validate role
    const validRoles = ['USER_ROLE', 'GOVERNMENT_ROLE', 'ADMIN_ROLE'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be one of: ' + validRoles.join(', ') });
    }
    
    // Revoke role on blockchain
    const result = await blockchainService.revokeRole(userAddress, role);
    
    // Log the action
    const db = req.app.locals.db;
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        req.user.id,
        'REVOKE_ROLE',
        'users',
        null, // No specific user ID in the database
        JSON.stringify({
          userAddress,
          role,
          transactionHash: result.transactionHash
        }),
        req.ip
      ]
    );
    
    res.status(200).json({
      message: 'Role revoked successfully',
      transaction: {
        hash: result.transactionHash,
        blockNumber: result.blockNumber,
        status: result.status
      }
    });
  } catch (error) {
    console.error('Revoke role error:', error);
    res.status(500).json({ message: 'Server error while revoking role' });
  }
};
