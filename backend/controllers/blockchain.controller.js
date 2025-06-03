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
    // Check if user exists
    const userResult = await db.query(
      'SELECT id, name, government_id, avax_address, is_verified FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    const isVerified = user.is_verified === true;
    
    // Check if contract is accessible
    const contractStatus = await blockchainService.isContractAccessible(isVerified);
    if (!contractStatus.accessible) {
      return res.status(503).json({ 
        message: 'Blockchain service unavailable', 
        details: contractStatus.error,
        network: contractStatus.network
      });
    }
    
    // Check if user has a wallet address
    if (!user.avax_address) {
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
    
    // Log network being used
    logger.info(`Recording identity on ${isVerified ? 'Avalanche' : 'local'} blockchain for user ${userId}`);
    
    // Record identity on blockchain
    const result = await blockchainService.registerIdentity(
      user.avax_address,
      biometricData.facemesh_hash,
      professionalDataHash,
      isVerified
    );
    
    // Update biometric data with blockchain transaction hash
    await db.query(
      'UPDATE biometric_data SET blockchain_tx_hash = $1, blockchain_network = $2 WHERE id = $3',
      [result.transactionHash, result.network, biometricData.id]
    );
    
    // Record transaction in database
    await db.query(
      `INSERT INTO blockchain_transactions 
         (user_id, transaction_type, transaction_hash, block_number, status, network, data)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        'IDENTITY_REGISTRATION',
        result.transactionHash,
        result.blockNumber,
        result.status,
        result.network,
        JSON.stringify({
          walletAddress: user.avax_address,
          biometricId: biometricData.id,
          isVerified: isVerified
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
          status: result.status,
          network: result.network
        }),
        req.ip
      ]
    );
    
    res.status(200).json({
      message: `Identity recorded on ${isVerified ? 'Avalanche' : 'local'} blockchain successfully`,
      transaction: {
        hash: result.transactionHash,
        blockNumber: result.blockNumber,
        status: result.status,
        network: result.network
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
      'SELECT id, name, government_id, avax_address, is_verified FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    const isVerified = user.is_verified === true;
    
    // Check if user has a wallet address
    if (!user.avax_address) {
      return res.status(400).json({ message: 'User does not have a wallet address' });
    }
    
    // Fetch identity from blockchain
    const isRegistered = await blockchainService.isIdentityRegistered(user.avax_address, isVerified);
    
    if (!isRegistered) {
      return res.status(404).json({
        message: `Identity not found on ${isVerified ? 'Avalanche' : 'local'} blockchain`
      });
    }
    
    const biometricHash = await blockchainService.getBiometricHash(user.avax_address, isVerified);
    const identityVerified = await blockchainService.isIdentityVerified(user.avax_address, isVerified);
    const recordCount = await blockchainService.getProfessionalRecordCount(user.avax_address, isVerified);
    
    // Get records if any
    const records = [];
    for (let i = 0; i < recordCount; i++) {
      try {
        const record = await blockchainService.getProfessionalRecord(user.avax_address, i, isVerified);
        records.push({
          index: i,
          ...record
        });
      } catch (error) {
        logger.error(`Error fetching record at index ${i}:`, error);
      }
    }
    
    // Get blockchain network info
    const networkInfo = blockchainService.getNetworkInfo();
    const networkName = isVerified ? 
      networkInfo.verifiedNetwork.networkName : 
      networkInfo.pendingNetwork.networkName;
    
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
          walletAddress: user.avax_address,
          isRegistered,
          isVerified: identityVerified,
          recordCount,
          network: networkName
        }),
        req.ip
      ]
    );
    
    res.status(200).json({
      message: `Identity fetched from ${isVerified ? 'Avalanche' : 'local'} blockchain successfully`,
      identity: {
        walletAddress: user.avax_address,
        biometricHash,
        isVerified: identityVerified,
        professionalRecordCount: recordCount,
        professionalRecords: records,
        network: networkName
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
    // Get user wallet address and verification status
    const userResult = await db.query(
      'SELECT avax_address, avax_address, is_verified FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Use avax_address if available, otherwise fall back to avax_address
    const walletAddress = userResult.rows[0].avax_address || userResult.rows[0].avax_address;
    const isVerified = userResult.rows[0].is_verified === true;
    
    if (!walletAddress) {
      logger.warn(`User ${userId} does not have a wallet address`);
      // Return an empty status instead of an error
      return res.status(200).json({
        status: {
          walletAddress: null,
          isRegistered: false,
          isVerified: false,
          network: 'Avalanche Fuji Testnet',
          identityStatus: 'NOT_REGISTERED'
        },
        recentTransactions: []
      });
    }
    
    // Get network info
    let network = 'Avalanche Fuji Testnet';
    try {
      const networkInfo = blockchainService.getNetworkInfo();
      if (networkInfo && 
          ((isVerified && networkInfo.verifiedNetwork) || 
           (!isVerified && networkInfo.pendingNetwork))) {
        network = isVerified ? 
          networkInfo.verifiedNetwork.networkName : 
          networkInfo.pendingNetwork.networkName;
      }
    } catch (networkError) {
      logger.warn('Error getting network info:', networkError);
      // Continue with default network name
    }
    
    // Get blockchain status
    let isRegistered = false;
    let isIdentityVerified = false;
    
    try {
      isRegistered = await blockchainService.isIdentityRegistered(walletAddress, isVerified);
      if (isRegistered) {
        try {
          isIdentityVerified = await blockchainService.isIdentityVerified(walletAddress, isVerified);
        } catch (verifyError) {
          logger.warn(`Error checking if identity is verified for ${walletAddress}:`, verifyError);
          // Continue with default value (false)
        }
      }
    } catch (registerError) {
      logger.warn(`Error checking if identity is registered for ${walletAddress}:`, registerError);
      // Continue with default values
    }
    
    // Get recent blockchain transactions
    let recentTransactions = [];
    try {
      // First try with network column
      const transactionsResult = await db.query(
        `SELECT transaction_hash, transaction_type, status, created_at, 
                COALESCE(network, 'Avalanche Fuji Testnet') as network
         FROM blockchain_transactions
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [userId]
      );
      recentTransactions = transactionsResult.rows;
    } catch (txError) {
      // If that fails, try without network column
      try {
        logger.warn('Error getting transactions with network column, trying without:', txError.message);
        const transactionsResult = await db.query(
          `SELECT transaction_hash, transaction_type, status, created_at
           FROM blockchain_transactions
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT 5`,
          [userId]
        );
        // Add default network
        recentTransactions = transactionsResult.rows.map(tx => ({
          ...tx,
          network: 'Avalanche Fuji Testnet'
        }));
      } catch (fallbackError) {
        logger.error('Error getting transactions:', fallbackError);
        // Continue with empty transactions
      }
    }
    
    res.status(200).json({
      status: {
        walletAddress,
        isRegistered,
        isVerified: isIdentityVerified,
        network,
        identityStatus: isIdentityVerified ? 'VERIFIED' : (isRegistered ? 'REGISTERED' : 'NOT_REGISTERED')
      },
      recentTransactions: recentTransactions
    });
  } catch (error) {
    logger.error('Get user blockchain status error:', error);
    res.status(500).json({ message: 'Server error while fetching blockchain status' });
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
      'SELECT id, avax_address FROM users WHERE id = $1',
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
      user.avax_address,
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
