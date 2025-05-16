/**
 * User controller for DBIS
 */
const crypto = require('crypto');

/**
 * Generate SHA-256 hash for facemesh data
 * @param {Object} facemeshData - Facemesh data object
 * @returns {String} SHA-256 hash
 */
const generateFacemeshHash = (facemeshData) => {
  // Convert facemesh data to a consistent string format
  const facemeshString = JSON.stringify(facemeshData);
  
  // Generate SHA-256 hash
  return crypto.createHash('sha256').update(facemeshString).digest('hex');
};

/**
 * Get user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserProfile = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  
  try {
    // Get user details
    const userResult = await db.query(
      `SELECT id, name, government_id, email, phone, wallet_address, 
              is_verified, verification_status, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Get biometric data status (not the actual data)
    const biometricResult = await db.query(
      `SELECT COUNT(*) as count
       FROM biometric_data
       WHERE user_id = $1 AND is_active = true`,
      [userId]
    );
    
    const hasBiometricData = parseInt(biometricResult.rows[0].count) > 0;
    
    // Get professional records count
    const recordsResult = await db.query(
      `SELECT COUNT(*) as count
       FROM professional_records
       WHERE user_id = $1`,
      [userId]
    );
    
    const professionalRecordsCount = parseInt(recordsResult.rows[0].count);
    
    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        governmentId: user.government_id,
        email: user.email,
        phone: user.phone,
        walletAddress: user.wallet_address,
        isVerified: user.is_verified,
        verificationStatus: user.verification_status,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      hasBiometricData,
      professionalRecordsCount
    });
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error while retrieving user profile' });
  }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateUserProfile = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  const { name, email, phone, walletAddress } = req.body;
  
  try {
    // Check if user exists
    const userResult = await db.query(
      'SELECT name, email, phone, wallet_address FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Update user information
    const updateResult = await db.query(
      `UPDATE users 
       SET name = $1, 
           email = $2,
           phone = $3,
           wallet_address = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, name, government_id, email, phone, wallet_address, updated_at`,
      [
        name || user.name,
        email || user.email,
        phone || user.phone,
        walletAddress || user.wallet_address,
        userId
      ]
    );
    
    const updatedUser = updateResult.rows[0];
    
    // Log the update action
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        'PROFILE_UPDATED',
        'users',
        userId,
        JSON.stringify({
          changes: {
            name: name !== user.name ? { from: user.name, to: name } : undefined,
            email: email !== user.email ? { from: user.email, to: email } : undefined,
            phone: phone !== user.phone ? { from: user.phone, to: phone } : undefined,
            walletAddress: walletAddress !== user.wallet_address ? { from: user.wallet_address, to: walletAddress } : undefined
          }
        }),
        req.ip
      ]
    );
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    logger.error('Update user profile error:', error);
    res.status(500).json({ message: 'Server error while updating user profile' });
  }
};

/**
 * Get user verification status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getVerificationStatus = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  
  try {
    const result = await db.query(
      `SELECT is_verified, verification_status, verification_notes, verified_at,
              a.username as verified_by
       FROM users u
       LEFT JOIN admins a ON u.verified_by = a.id
       WHERE u.id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      verificationStatus: result.rows[0]
    });
  } catch (error) {
    logger.error('Get verification status error:', error);
    res.status(500).json({ message: 'Server error while retrieving verification status' });
  }
};

/**
 * Add a professional record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.addProfessionalRecord = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  const { recordType, institution, title, description, startDate, endDate, isCurrent } = req.body;
  
  try {
    // Generate a hash of the record data for blockchain verification
    const recordData = {
      recordType,
      institution,
      title,
      description,
      startDate,
      endDate,
      isCurrent,
      userId,
      timestamp: new Date().toISOString()
    };
    
    const dataHash = crypto.createHash('sha256').update(JSON.stringify(recordData)).digest('hex');
    
    // Insert professional record
    const result = await db.query(
      `INSERT INTO professional_records 
         (user_id, record_type, institution, title, description, 
          start_date, end_date, is_current, data_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, record_type, institution, title, description, 
                 start_date, end_date, is_current, data_hash, created_at`,
      [
        userId,
        recordType,
        institution,
        title,
        description,
        startDate,
        endDate || null,
        isCurrent || false,
        dataHash
      ]
    );
    
    const newRecord = result.rows[0];
    
    // Log the action
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        'PROFESSIONAL_RECORD_ADDED',
        'professional_records',
        newRecord.id,
        JSON.stringify({
          recordType,
          institution,
          title,
          dataHash
        }),
        req.ip
      ]
    );
    
    res.status(201).json({
      message: 'Professional record added successfully',
      record: newRecord
    });
  } catch (error) {
    logger.error('Add professional record error:', error);
    res.status(500).json({ message: 'Server error while adding professional record' });
  }
};

/**
 * Get user's professional records
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getProfessionalRecords = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  
  try {
    const result = await db.query(
      `SELECT id, record_type, institution, title, description, 
              start_date, end_date, is_current, is_verified, 
              verified_by, verified_at, blockchain_tx_hash, 
              created_at, updated_at
       FROM professional_records
       WHERE user_id = $1
       ORDER BY start_date DESC`,
      [userId]
    );
    
    res.status(200).json({
      records: result.rows
    });
  } catch (error) {
    logger.error('Get professional records error:', error);
    res.status(500).json({ message: 'Server error while retrieving professional records' });
  }
};

/**
 * Update user's facemesh data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateFacemesh = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  const { facemeshData } = req.body;
  
  if (!facemeshData) {
    return res.status(400).json({ message: 'Facemesh data is required' });
  }
  
  try {
    // Generate facemesh hash
    const facemeshHash = generateFacemeshHash(facemeshData);
    
    // Check if facemesh hash already exists for another user
    const existingBiometric = await db.query(
      'SELECT user_id FROM biometric_data WHERE facemesh_hash = $1 AND user_id != $2',
      [facemeshHash, userId]
    );
    
    if (existingBiometric.rows.length > 0) {
      return res.status(409).json({ message: 'Biometric data already registered to another user' });
    }
    
    // Start a transaction
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Set all existing biometric data to inactive
      await client.query(
        'UPDATE biometric_data SET is_active = false WHERE user_id = $1',
        [userId]
      );
      
      // Insert new biometric data
      const result = await client.query(
        `INSERT INTO biometric_data (user_id, facemesh_hash, facemesh_data, is_active)
         VALUES ($1, $2, $3, true)
         RETURNING id, facemesh_hash, is_active, created_at`,
        [userId, facemeshHash, JSON.stringify(facemeshData)]
      );
      
      // Log the update
      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          'BIOMETRIC_DATA_UPDATED',
          'biometric_data',
          result.rows[0].id,
          JSON.stringify({
            previousBiometricInactivated: true,
            newBiometricId: result.rows[0].id
          }),
          req.ip
        ]
      );
      
      await client.query('COMMIT');
      
      res.status(200).json({
        message: 'Facemesh data updated successfully',
        biometricData: {
          id: result.rows[0].id,
          facemeshHash: result.rows[0].facemesh_hash,
          isActive: result.rows[0].is_active,
          createdAt: result.rows[0].created_at
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Update facemesh error:', error);
    res.status(500).json({ message: 'Server error while updating facemesh data' });
  }
};

/**
 * Get user's blockchain status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getBlockchainStatus = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  const blockchainService = require('../services/blockchain.service');
  
  try {
    // Get user wallet address
    const userResult = await db.query(
      'SELECT wallet_address FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const walletAddress = userResult.rows[0].wallet_address;
    
    if (!walletAddress) {
      return res.status(400).json({ message: 'User does not have a wallet address' });
    }
    
    // Get blockchain transactions
    const transactionsResult = await db.query(
      `SELECT transaction_hash, transaction_type, status, created_at
       FROM blockchain_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    );
    
    // Get blockchain status from smart contract
    let blockchainIdentityStatus = null;
    let blockchainError = null;
    
    try {
      const isRegistered = await blockchainService.isIdentityRegistered(walletAddress);
      const isVerified = isRegistered ? await blockchainService.isIdentityVerified(walletAddress) : false;
      
      blockchainIdentityStatus = {
        isRegistered,
        isVerified,
        walletAddress
      };
    } catch (error) {
      logger.error('Blockchain status check error:', error);
      blockchainError = 'Could not retrieve blockchain status';
    }
    
    res.status(200).json({
      blockchainIdentityStatus,
      blockchainError,
      recentTransactions: transactionsResult.rows
    });
  } catch (error) {
    logger.error('Get blockchain status error:', error);
    res.status(500).json({ message: 'Server error while retrieving blockchain status' });
  }
};
