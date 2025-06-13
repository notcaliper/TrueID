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
      `SELECT id, name, government_id, email, phone, avax_address,
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
        walletAddress: user.avax_address || user.avax_address,
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
  const { name, email, phone, avaxAddress } = req.body;
  
  try {
    // Check if user exists
    const userResult = await db.query(
      'SELECT name, email, phone, avax_address FROM users WHERE id = $1',
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
           avax_address = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, name, government_id, email, phone, avax_address, updated_at`,
      [
        name || user.name,
        email || user.email,
        phone || user.phone,
        avaxAddress || user.avax_address,
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
            walletAddress: walletAddress !== user.avax_address ? { from: user.avax_address, to: walletAddress } : undefined
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
      `SELECT u.is_verified, u.verification_status, u.verification_notes, u.verified_at, u.created_at,
              a.username as verified_by
       FROM users u
       LEFT JOIN admins a ON u.verified_by = a.id
       WHERE u.id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Format the response to match what the frontend expects
    const userData = result.rows[0];
    
    res.status(200).json({
      data: {
        status: userData.verification_status,
        submittedAt: userData.created_at,
        verifiedAt: userData.verified_at,
        rejectionReason: userData.verification_notes,
        verifiedBy: userData.verified_by
      }
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
              start_date, end_date, is_current, verification_status, 
              verified_by, verified_at, blockchain_tx_hash, 
              created_at, updated_at
       FROM professional_records
       WHERE user_id = $1
       ORDER BY start_date DESC`,
      [userId]
    );
    
    // Transform the records to ensure consistent field names and status
    const records = result.rows.map(record => ({
      ...record,
      verification_status: record.verification_status || (record.is_verified ? 'VERIFIED' : 'PENDING')
    }));
    
    res.status(200).json({
      records: records
    });
  } catch (error) {
    logger.error('Get professional records error:', error);
    res.status(500).json({ message: 'Server error while retrieving professional records' });
  }
};

/**
 * Update a professional record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateProfessionalRecord = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  const recordId = req.params.id;
  const { title, institution, year, description, documentUrl } = req.body;
  
  try {
    // Check if record exists and belongs to user
    const recordResult = await db.query(
      'SELECT id, verification_status FROM professional_records WHERE id = $1 AND user_id = $2',
      [recordId, userId]
    );
    
    if (recordResult.rows.length === 0) {
      return res.status(404).json({ message: 'Professional record not found or does not belong to user' });
    }
    
    const record = recordResult.rows[0];
    
    // Check if record is already verified - can't update verified records
    if (record.verification_status === 'VERIFIED') {
      return res.status(400).json({ message: 'Cannot update a verified professional record' });
    }
    
    // Generate a data hash for the record
    const recordData = {
      title: title,
      institution: institution,
      year: year,
      description: description,
      userId: userId,
      timestamp: new Date().toISOString()
    };
    
    const dataHash = crypto.createHash('sha256').update(JSON.stringify(recordData)).digest('hex');
    
    // Update the record
    const updateResult = await db.query(
      `UPDATE professional_records
       SET title = $1,
           institution = $2,
           year = $3,
           description = $4,
           document_url = $5,
           data_hash = $6,
           verification_status = 'PENDING',
           updated_at = NOW()
       WHERE id = $7 AND user_id = $8
       RETURNING id, title, institution, year, description, document_url, verification_status, on_blockchain, created_at, updated_at`,
      [
        title,
        institution,
        year,
        description,
        documentUrl,
        dataHash,
        recordId,
        userId
      ]
    );
    
    const updatedRecord = updateResult.rows[0];
    
    // Log the update action
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        'PROFESSIONAL_RECORD_UPDATED',
        'professional_records',
        recordId,
        JSON.stringify({
          title,
          institution,
          year
        }),
        req.ip
      ]
    );
    
    res.status(200).json({
      message: 'Professional record updated successfully',
      record: {
        id: updatedRecord.id,
        title: updatedRecord.title,
        institution: updatedRecord.institution,
        year: updatedRecord.year,
        description: updatedRecord.description,
        documentUrl: updatedRecord.document_url,
        verificationStatus: updatedRecord.verification_status,
        onBlockchain: updatedRecord.on_blockchain,
        createdAt: updatedRecord.created_at,
        updatedAt: updatedRecord.updated_at
      }
    });
  } catch (error) {
    logger.error('Update professional record error:', error);
    res.status(500).json({ message: 'Server error while updating professional record' });
  }
};

/**
 * Get verification status of a professional record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getProfessionalRecordVerification = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  const recordId = req.params.id;
  
  try {
    // Check if record exists and belongs to user
    const recordResult = await db.query(
      `SELECT pr.id, pr.title, pr.verification_status, pr.on_blockchain, 
              pr.verified_at, pr.verified_by, a.username as admin_username
       FROM professional_records pr
       LEFT JOIN admins a ON pr.verified_by = a.id
       WHERE pr.id = $1 AND pr.user_id = $2`,
      [recordId, userId]
    );
    
    if (recordResult.rows.length === 0) {
      return res.status(404).json({ message: 'Professional record not found or does not belong to user' });
    }
    
    const record = recordResult.rows[0];
    
    // Get blockchain transaction if on blockchain
    let blockchainTransaction = null;
    if (record.on_blockchain) {
      const txResult = await db.query(
        `SELECT transaction_hash, created_at
         FROM blockchain_transactions
         WHERE user_id = $1 AND transaction_type = 'PROFESSIONAL_RECORD' AND entity_id = $2
         ORDER BY created_at DESC LIMIT 1`,
        [userId, recordId]
      );
      
      if (txResult.rows.length > 0) {
        blockchainTransaction = {
          hash: txResult.rows[0].transaction_hash,
          timestamp: txResult.rows[0].created_at
        };
      }
    }
    
    res.status(200).json({
      id: record.id,
      title: record.title,
      verificationStatus: record.verification_status,
      onBlockchain: record.on_blockchain,
      verifiedAt: record.verified_at,
      verifiedBy: record.admin_username,
      blockchainTransaction
    });
  } catch (error) {
    logger.error('Get professional record verification error:', error);
    res.status(500).json({ message: 'Server error while retrieving professional record verification' });
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
    // Generate hash for facemesh data
    const facemeshHash = generateFacemeshHash(facemeshData);
    
    // Use a transaction for atomicity
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Deactivate any existing biometric data
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
 * Get user's biometric verification status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getBiometricStatus = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  
  try {
    // Get the latest active biometric data
    const biometricResult = await db.query(
      `SELECT id, facemesh_hash, is_active, created_at, updated_at, 
              verification_status, verification_score, last_verified_at
       FROM biometric_data
       WHERE user_id = $1 AND is_active = true
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );
    
    // Check if user has biometric data
    const hasBiometricData = biometricResult.rows.length > 0;
    
    // Get verification attempts
    const verificationResult = await db.query(
      `SELECT COUNT(*) as total_verifications, 
              COUNT(*) FILTER (WHERE success = true) as successful_verifications,
              MAX(created_at) FILTER (WHERE success = true) as last_successful_verification
       FROM biometric_verifications
       WHERE user_id = $1`,
      [userId]
    );
    
    const verificationStats = verificationResult.rows[0];
    
    // Determine if user is verified based on active biometric data and successful verification
    const isVerified = hasBiometricData && 
                      biometricResult.rows[0].verification_status === 'VERIFIED' &&
                      verificationStats.successful_verifications > 0;
    
    // Prepare response data
    const responseData = {
      verified: isVerified,
      facemeshExists: hasBiometricData,
      lastVerified: verificationStats.last_successful_verification || null,
      verificationCount: parseInt(verificationStats.total_verifications) || 0,
      successfulVerifications: parseInt(verificationStats.successful_verifications) || 0
    };
    
    // Add biometric details if they exist
    if (hasBiometricData) {
      const biometricData = biometricResult.rows[0];
      responseData.biometricDetails = {
        id: biometricData.id,
        createdAt: biometricData.created_at,
        updatedAt: biometricData.updated_at,
        verificationStatus: biometricData.verification_status,
        verificationScore: biometricData.verification_score
      };
    }
    
    res.status(200).json(responseData);
  } catch (error) {
    logger.error('Get biometric status error:', error);
    res.status(500).json({ message: 'Server error while retrieving biometric status' });
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
    // Get user wallet address and blockchain status
    const userResult = await db.query(
      'SELECT avax_address, blockchain_status, blockchain_expiry FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    const walletAddress = user.avax_address;
    
    if (!walletAddress) {
      return res.status(400).json({ message: 'User does not have a wallet address' });
    }
    
    // Get blockchain transactions
    const transactionsResult = await db.query(
      `SELECT tx_hash as transaction_hash, tx_type as transaction_type, status, created_at
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
        walletAddress,
        databaseStatus: user.blockchain_status,
        expiryTime: user.blockchain_expiry
      };
      
      // If data is on blockchain but status is still PENDING in database, update it
      if (isRegistered && user.blockchain_status === 'PENDING') {
        await db.query(
          `UPDATE users 
           SET blockchain_status = 'CONFIRMED', 
               blockchain_expiry = NULL,
               updated_at = NOW()
           WHERE id = $1`,
          [userId]
        );
        
        blockchainIdentityStatus.databaseStatus = 'CONFIRMED';
        blockchainIdentityStatus.expiryTime = null;
      }
    } catch (error) {
      logger.error('Blockchain status check error:', error);
      blockchainError = 'Could not retrieve blockchain status';
    }
    
    // Calculate time remaining if status is PENDING
    let timeRemaining = null;
    if (user.blockchain_status === 'PENDING' && user.blockchain_expiry) {
      const now = new Date();
      const expiry = new Date(user.blockchain_expiry);
      const diffMs = expiry - now;
      
      if (diffMs > 0) {
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        timeRemaining = {
          hours: diffHrs,
          minutes: diffMins,
          totalMilliseconds: diffMs
        };
      } else {
        timeRemaining = { expired: true };
      }
    }
    
    res.status(200).json({
      blockchainIdentityStatus,
      blockchainError,
      timeRemaining,
      recentTransactions: transactionsResult.rows
    });
  } catch (error) {
    logger.error('Get blockchain status error:', error);
    res.status(500).json({ message: 'Server error while retrieving blockchain status' });
  }
};

/**
 * Transfer user data to blockchain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.transferToBlockchain = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  
  try {
    // Check if user exists and get wallet information
    const userResult = await db.query(
      `SELECT id, name, government_id, avax_address, avax_private_key, 
              blockchain_status, blockchain_expiry, verification_status 
       FROM users WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Check if user is verified
    if (user.verification_status !== 'VERIFIED') {
      return res.status(400).json({ 
        message: 'User must be verified before transferring to blockchain',
        status: user.verification_status
      });
    }
    
    // Check if user has a wallet address and private key
    if (!user.avax_address || !user.avax_private_key) {
      return res.status(400).json({ message: 'User does not have a valid blockchain wallet' });
    }
    
    // Check blockchain status
    if (user.blockchain_status === 'CONFIRMED') {
      return res.status(400).json({ message: 'User data is already on the blockchain' });
    }
    
    // Check if blockchain status is PENDING and within expiry time
    if (user.blockchain_status === 'PENDING') {
      // Check if expiry time has passed
      if (user.blockchain_expiry && new Date(user.blockchain_expiry) < new Date()) {
        return res.status(400).json({ 
          message: 'Blockchain transfer period has expired',
          expiryTime: user.blockchain_expiry
        });
      }
    } else if (user.blockchain_status !== 'PENDING') {
      return res.status(400).json({ 
        message: 'User is not eligible for blockchain transfer',
        status: user.blockchain_status
      });
    }
    
    // Get user biometric data
    const biometricResult = await db.query(
      `SELECT facemesh_hash, facemesh_data FROM biometric_data 
       WHERE user_id = $1 AND is_active = true`,
      [userId]
    );
    
    if (biometricResult.rows.length === 0) {
      return res.status(404).json({ message: 'Biometric data not found' });
    }
    
    // Get user professional data
    const professionalResult = await db.query(
      `SELECT data_hash FROM professional_records 
       WHERE user_id = $1 
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    
    // Generate hashes for blockchain
    const biometricHash = '0x' + biometricResult.rows[0].facemesh_hash;
    
    // Use professional data hash if available, otherwise create a placeholder
    let professionalDataHash;
    if (professionalResult.rows.length > 0 && professionalResult.rows[0].data_hash) {
      professionalDataHash = '0x' + professionalResult.rows[0].data_hash;
    } else {
      // Create a placeholder hash for professional data
      const placeholder = JSON.stringify({
        userId: user.id,
        governmentId: user.government_id,
        timestamp: new Date().toISOString()
      });
      professionalDataHash = '0x' + crypto.createHash('sha256').update(placeholder).digest('hex');
    }
    
    // Import blockchain service
    const blockchainService = require('../services/blockchain.service');
    
    // Check if identity is already registered
    const isRegistered = await blockchainService.isIdentityRegistered(user.avax_address);
    
    if (isRegistered) {
      // Update user blockchain status
      await db.query(
        `UPDATE users 
         SET blockchain_status = 'CONFIRMED', 
             blockchain_expiry = NULL,
             updated_at = NOW() 
         WHERE id = $1`,
        [userId]
      );
      
      return res.status(200).json({
        message: 'Identity is already registered on blockchain',
        blockchainStatus: 'CONFIRMED'
      });
    }
    
    // Start a transaction
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Register identity on blockchain
      const result = await blockchainService.registerIdentity(
        user.avax_private_key,
        biometricHash,
        professionalDataHash
      );
      
      if (result.status === 'success') {
        // Update user blockchain status
        await client.query(
          `UPDATE users 
           SET blockchain_status = 'CONFIRMED', 
               blockchain_expiry = NULL,
               updated_at = NOW() 
           WHERE id = $1`,
          [userId]
        );
        
        // Log the blockchain registration
        await client.query(
          `INSERT INTO blockchain_transactions 
           (user_id, tx_hash, from_address, to_address, tx_type, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            userId,
            result.transactionHash,
            user.avax_address,
            process.env.AVALANCHE_FUJI_CONTRACT_ADDRESS,
            'IDENTITY_REGISTRATION',
            'COMPLETED'
          ]
        );
        
        // Log the action
        await client.query(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            userId,
            'BLOCKCHAIN_IDENTITY_REGISTERED',
            'users',
            userId,
            JSON.stringify({
              transactionHash: result.transactionHash,
              blockNumber: result.blockNumber,
              network: result.network
            }),
            req.ip
          ]
        );
        
        await client.query('COMMIT');
        
        res.status(200).json({
          message: 'Identity successfully registered on blockchain',
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
          blockchainStatus: 'CONFIRMED'
        });
      } else {
        throw new Error('Blockchain registration failed');
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Transfer to blockchain error:', error);
    res.status(500).json({ message: 'Server error during blockchain transfer' });
  }
};
