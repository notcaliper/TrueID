/**
 * Blockchain controller for DBIS
 * Handles interactions with the blockchain
 */
const blockchainService = require('../services/blockchain.service');

/**
 * Record user identity on blockchain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.recordIdentityOnBlockchain = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  try {
    // Check if contract is accessible
    const contractStatus = await blockchainService.isContractAccessible();
    if (!contractStatus.accessible) {
      return res.status(503).json({ 
        message: 'Blockchain service unavailable', 
        details: contractStatus.error,
        network: contractStatus.network
      });
    }
    
    // Check if user exists
    const userResult = await db.query(
      'SELECT id, name, government_id, wallet_address FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Check if user has a wallet address
    if (!user.wallet_address) {
      return res.status(400).json({ message: 'User does not have a wallet address' });
    }
    
    // Get user's biometric data
    const biometricResult = await db.query(
      'SELECT id, facemesh_hash FROM biometric_data WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    
    if (biometricResult.rows.length === 0) {
      return res.status(400).json({ message: 'User does not have active biometric data' });
    }
    
    const biometricData = biometricResult.rows[0];
    
    // Generate a hash for professional data (placeholder)
    const professionalDataHash = 'professional_data_hash_placeholder';
    
    // Record identity on blockchain
    const result = await blockchainService.registerIdentity(
      user.wallet_address,
      biometricData.facemesh_hash,
      professionalDataHash
    );
    
    // Update biometric data with blockchain transaction hash
    await db.query(
      'UPDATE biometric_data SET blockchain_tx_hash = $1 WHERE id = $2',
      [result.transactionHash, biometricData.id]
    );
    
    // Record transaction in database
    await db.query(
      `INSERT INTO blockchain_transactions 
         (user_id, transaction_type, transaction_hash, block_number, status, data)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        'IDENTITY_REGISTRATION',
        result.transactionHash,
        result.blockNumber,
        result.status,
        JSON.stringify({
          walletAddress: user.wallet_address,
          biometricId: biometricData.id
        })
      ]
    );
    
    // Log the action
    await db.query(
      `INSERT INTO audit_logs (admin_id, user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.admin.id,
        userId,
        'IDENTITY_RECORDED_ON_BLOCKCHAIN',
        'users',
        userId,
        JSON.stringify({
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
          status: result.status
        }),
        req.ip
      ]
    );
    
    res.status(200).json({
      message: 'Identity recorded on blockchain successfully',
      transaction: {
        hash: result.transactionHash,
        blockNumber: result.blockNumber,
        status: result.status
      }
    });
  } catch (error) {
    logger.error('Record identity on blockchain error:', error);
    res.status(500).json({ message: 'Server error while recording identity on blockchain' });
  }
};

/**
 * Fetch user identity from blockchain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.fetchIdentityFromBlockchain = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { userId } = req.params;
  
  try {
    // Check if user exists
    const userResult = await db.query(
      'SELECT id, name, government_id, wallet_address FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Check if user has a wallet address
    if (!user.wallet_address) {
      return res.status(400).json({ message: 'User does not have a wallet address' });
    }
    
    // Fetch identity from blockchain
    const isRegistered = await blockchainService.isIdentityRegistered(user.wallet_address);
    
    if (!isRegistered) {
      return res.status(404).json({ message: 'Identity not found on blockchain' });
    }
    
    const biometricHash = await blockchainService.getBiometricHash(user.wallet_address);
    const isVerified = await blockchainService.isIdentityVerified(user.wallet_address);
    const recordCount = await blockchainService.getProfessionalRecordCount(user.wallet_address);
    
    // Get records if any
    const records = [];
    for (let i = 0; i < recordCount; i++) {
      try {
        const record = await blockchainService.getProfessionalRecord(user.wallet_address, i);
        records.push({
          index: i,
          ...record
        });
      } catch (error) {
        logger.error(`Error fetching record at index ${i}:`, error);
      }
    }
    
    // Log the action
    await db.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.admin.id,
        'IDENTITY_FETCHED_FROM_BLOCKCHAIN',
        'users',
        userId,
        JSON.stringify({
          walletAddress: user.wallet_address,
          isRegistered,
          isVerified,
          recordCount
        }),
        req.ip
      ]
    );
    
    res.status(200).json({
      message: 'Identity fetched from blockchain successfully',
      identity: {
        walletAddress: user.wallet_address,
        biometricHash,
        isVerified,
        professionalRecordCount: recordCount,
        professionalRecords: records
      }
    });
  } catch (error) {
    logger.error('Fetch identity from blockchain error:', error);
    res.status(500).json({ message: 'Server error while fetching identity from blockchain' });
  }
};

/**
 * Get user's blockchain identity status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserBlockchainStatus = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  
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
    
    // Get blockchain status
    const isRegistered = await blockchainService.isIdentityRegistered(walletAddress);
    
    if (!isRegistered) {
      return res.status(200).json({
        message: 'Identity not registered on blockchain',
        identity: {
          walletAddress,
          isRegistered: false,
          isVerified: false,
          professionalRecordCount: 0
        }
      });
    }
    
    const biometricHash = await blockchainService.getBiometricHash(walletAddress);
    const isVerified = await blockchainService.isIdentityVerified(walletAddress);
    const recordCount = await blockchainService.getProfessionalRecordCount(walletAddress);
    
    res.status(200).json({
      message: 'Blockchain identity status retrieved successfully',
      identity: {
        walletAddress,
        biometricHash,
        isRegistered: true,
        isVerified,
        professionalRecordCount: recordCount
      }
    });
  } catch (error) {
    logger.error('Get user blockchain status error:', error);
    res.status(500).json({ message: 'Server error while retrieving blockchain status' });
  }
};

/**
 * Record professional record on blockchain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.recordProfessionalRecord = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { userId, recordId } = req.body;
  
  if (!userId || !recordId) {
    return res.status(400).json({ message: 'User ID and Record ID are required' });
  }
  
  try {
    // Check if user exists
    const userResult = await db.query(
      'SELECT id, wallet_address FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Check if user has a wallet address
    if (!user.wallet_address) {
      return res.status(400).json({ message: 'User does not have a wallet address' });
    }
    
    // Check if record exists
    const recordResult = await db.query(
      `SELECT id, record_type, institution, title, data_hash, start_date, end_date
       FROM professional_records
       WHERE id = $1 AND user_id = $2`,
      [recordId, userId]
    );
    
    if (recordResult.rows.length === 0) {
      return res.status(404).json({ message: 'Professional record not found' });
    }
    
    const record = recordResult.rows[0];
    
    // Record on blockchain
    const startTimestamp = Math.floor(new Date(record.start_date).getTime() / 1000);
    const endTimestamp = record.end_date ? Math.floor(new Date(record.end_date).getTime() / 1000) : 0;
    
    const result = await blockchainService.addProfessionalRecord(
      user.wallet_address,
      record.data_hash,
      startTimestamp,
      endTimestamp
    );
    
    // Update record with blockchain transaction hash
    await db.query(
      'UPDATE professional_records SET blockchain_tx_hash = $1 WHERE id = $2',
      [result.transactionHash, recordId]
    );
    
    // Record transaction in database
    await db.query(
      `INSERT INTO blockchain_transactions 
         (user_id, transaction_type, transaction_hash, block_number, status, data)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        'PROFESSIONAL_RECORD_ADDED',
        result.transactionHash,
        result.blockNumber,
        result.status,
        JSON.stringify({
          recordId,
          recordType: record.record_type,
          institution: record.institution,
          title: record.title
        })
      ]
    );
    
    // Log the action
    await db.query(
      `INSERT INTO audit_logs (admin_id, user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.admin.id,
        userId,
        'PROFESSIONAL_RECORD_RECORDED_ON_BLOCKCHAIN',
        'professional_records',
        recordId,
        JSON.stringify({
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
          status: result.status
        }),
        req.ip
      ]
    );
    
    res.status(200).json({
      message: 'Professional record recorded on blockchain successfully',
      transaction: {
        hash: result.transactionHash,
        blockNumber: result.blockNumber,
        status: result.status
      }
    });
  } catch (error) {
    logger.error('Record professional record on blockchain error:', error);
    res.status(500).json({ message: 'Server error while recording professional record on blockchain' });
  }
};

/**
 * Verify a document hash on the blockchain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.verifyDocumentHash = async (req, res) => {
  const logger = req.app.locals.logger;
  const { hash } = req.params;
  
  if (!hash) {
    return res.status(400).json({ message: 'Document hash is required' });
  }
  
  try {
    // Verify hash on blockchain
    const result = await blockchainService.verifyDocumentHash(hash);
    
    res.status(200).json({
      message: 'Document hash verification completed',
      verification: result
    });
  } catch (error) {
    logger.error('Verify document hash error:', error);
    res.status(500).json({ message: 'Server error while verifying document hash' });
  }
};

/**
 * Get blockchain transactions for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserTransactions = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;
  
  try {
    // Count total transactions
    const countResult = await db.query(
      'SELECT COUNT(*) FROM blockchain_transactions WHERE user_id = $1',
      [userId]
    );
    
    const totalTransactions = parseInt(countResult.rows[0].count);
    
    // Get transactions with pagination
    const offset = (page - 1) * limit;
    
    const result = await db.query(
      `SELECT id, transaction_type, transaction_hash, block_number, status, data, created_at, updated_at
       FROM blockchain_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    res.status(200).json({
      transactions: result.rows,
      pagination: {
        total: totalTransactions,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalTransactions / limit)
      }
    });
  } catch (error) {
    logger.error('Get user transactions error:', error);
    res.status(500).json({ message: 'Server error while retrieving blockchain transactions' });
  }
};
