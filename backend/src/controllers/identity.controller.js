/**
 * Identity management controller for DBIS
 */
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const blockchainService = require('../services/blockchain.service');

/**
 * Register biometric data for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.registerBiometric = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Facemesh data is required' });
    }

    const userId = req.user.id;
    const db = req.app.locals.db;

    // Check if user already has active biometric data
    const existingBiometric = await db.query(
      'SELECT id FROM biometric_data WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (existingBiometric.rows.length > 0) {
      return res.status(400).json({ 
        message: 'User already has active biometric data. Use update endpoint instead.' 
      });
    }

    // Hash the facemesh data using SHA-256
    const facemeshHash = crypto
      .createHash('sha256')
      .update(req.file.buffer)
      .digest('hex');

    // Store the hash in the database
    const result = await db.query(
      'INSERT INTO biometric_data (user_id, facemesh_hash) VALUES ($1, $2) RETURNING id, created_at',
      [userId, facemeshHash]
    );

    // Log the biometric registration
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        userId,
        'REGISTER_BIOMETRIC',
        'biometric_data',
        result.rows[0].id,
        JSON.stringify({ method: 'facemesh' }),
        req.ip
      ]
    );

    res.status(201).json({
      message: 'Biometric data registered successfully',
      biometricId: result.rows[0].id,
      createdAt: result.rows[0].created_at
    });
  } catch (error) {
    console.error('Biometric registration error:', error);
    res.status(500).json({ message: 'Server error during biometric registration' });
  }
};

/**
 * Authenticate user using biometric data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.authenticateBiometric = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Facemesh data is required' });
    }

    const userId = req.user.id;
    const db = req.app.locals.db;

    // Hash the provided facemesh data
    const providedFacemeshHash = crypto
      .createHash('sha256')
      .update(req.file.buffer)
      .digest('hex');

    // Get the stored hash from the database
    const result = await db.query(
      'SELECT facemesh_hash FROM biometric_data WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No active biometric data found for this user' });
    }

    const storedFacemeshHash = result.rows[0].facemesh_hash;

    // Compare the hashes
    const isMatch = providedFacemeshHash === storedFacemeshHash;

    // Log the authentication attempt
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        userId,
        'AUTHENTICATE_BIOMETRIC',
        'users',
        userId,
        JSON.stringify({ success: isMatch }),
        req.ip
      ]
    );

    if (isMatch) {
      res.status(200).json({ message: 'Biometric authentication successful', authenticated: true });
    } else {
      res.status(401).json({ message: 'Biometric authentication failed', authenticated: false });
    }
  } catch (error) {
    console.error('Biometric authentication error:', error);
    res.status(500).json({ message: 'Server error during biometric authentication' });
  }
};

/**
 * Update biometric data for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateBiometric = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Facemesh data is required' });
    }

    const userId = req.user.id;
    const db = req.app.locals.db;

    // Hash the new facemesh data
    const newFacemeshHash = crypto
      .createHash('sha256')
      .update(req.file.buffer)
      .digest('hex');

    // Deactivate old biometric data
    await db.query(
      'UPDATE biometric_data SET is_active = false WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    // Store the new hash
    const result = await db.query(
      'INSERT INTO biometric_data (user_id, facemesh_hash) VALUES ($1, $2) RETURNING id, created_at',
      [userId, newFacemeshHash]
    );

    // Log the biometric update
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        userId,
        'UPDATE_BIOMETRIC',
        'biometric_data',
        result.rows[0].id,
        JSON.stringify({ method: 'facemesh' }),
        req.ip
      ]
    );

    res.status(200).json({
      message: 'Biometric data updated successfully',
      biometricId: result.rows[0].id,
      createdAt: result.rows[0].created_at
    });
  } catch (error) {
    console.error('Biometric update error:', error);
    res.status(500).json({ message: 'Server error during biometric update' });
  }
};

/**
 * Add a professional record for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.addProfessionalRecord = async (req, res) => {
  try {
    const {
      recordType,
      organizationName,
      title,
      description,
      startDate,
      endDate,
      location
    } = req.body;

    if (!recordType || !organizationName || !startDate) {
      return res.status(400).json({ 
        message: 'Record type, organization name, and start date are required' 
      });
    }

    const userId = req.user.id;
    const db = req.app.locals.db;

    // Create a data object to hash
    const recordData = JSON.stringify({
      recordType,
      organizationName,
      title,
      description,
      startDate,
      endDate,
      location,
      userId,
      timestamp: new Date().toISOString()
    });

    // Generate a hash of the record data
    const dataHash = crypto
      .createHash('sha256')
      .update(recordData)
      .digest('hex');

    // Store the record in the database
    const result = await db.query(
      `INSERT INTO professional_records 
       (user_id, record_type, organization_name, title, description, start_date, end_date, location, data_hash) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING id, created_at`,
      [
        userId,
        recordType,
        organizationName,
        title,
        description,
        startDate,
        endDate,
        location,
        dataHash
      ]
    );

    // Log the record creation
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        userId,
        'ADD_PROFESSIONAL_RECORD',
        'professional_records',
        result.rows[0].id,
        JSON.stringify({ recordType }),
        req.ip
      ]
    );

    res.status(201).json({
      message: 'Professional record added successfully',
      recordId: result.rows[0].id,
      dataHash,
      createdAt: result.rows[0].created_at
    });
  } catch (error) {
    console.error('Add professional record error:', error);
    res.status(500).json({ message: 'Server error while adding professional record' });
  }
};

/**
 * Get all professional records for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getProfessionalRecords = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = req.app.locals.db;

    const result = await db.query(
      `SELECT id, record_type, organization_name, title, description, 
       start_date, end_date, location, data_hash, is_verified, verified_by, verified_at, 
       created_at, updated_at, blockchain_tx_hash
       FROM professional_records 
       WHERE user_id = $1 
       ORDER BY start_date DESC`,
      [userId]
    );

    res.status(200).json({
      message: 'Professional records retrieved successfully',
      records: result.rows
    });
  } catch (error) {
    console.error('Get professional records error:', error);
    res.status(500).json({ message: 'Server error while retrieving professional records' });
  }
};

/**
 * Get a specific professional record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getProfessionalRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.user.id;
    const db = req.app.locals.db;

    const result = await db.query(
      `SELECT id, record_type, organization_name, title, description, 
       start_date, end_date, location, data_hash, is_verified, verified_by, verified_at, 
       created_at, updated_at, blockchain_tx_hash
       FROM professional_records 
       WHERE id = $1 AND user_id = $2`,
      [recordId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Professional record not found' });
    }

    res.status(200).json({
      message: 'Professional record retrieved successfully',
      record: result.rows[0]
    });
  } catch (error) {
    console.error('Get professional record error:', error);
    res.status(500).json({ message: 'Server error while retrieving professional record' });
  }
};

/**
 * Update a professional record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateProfessionalRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.user.id;
    const db = req.app.locals.db;

    // Check if record exists and belongs to user
    const recordCheck = await db.query(
      'SELECT id, is_verified FROM professional_records WHERE id = $1 AND user_id = $2',
      [recordId, userId]
    );

    if (recordCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Professional record not found' });
    }

    // Don't allow updates to verified records
    if (recordCheck.rows[0].is_verified) {
      return res.status(403).json({ 
        message: 'Cannot update a verified record. Create a new record instead.' 
      });
    }

    const {
      recordType,
      organizationName,
      title,
      description,
      startDate,
      endDate,
      location
    } = req.body;

    // Create a data object to hash
    const recordData = JSON.stringify({
      recordType,
      organizationName,
      title,
      description,
      startDate,
      endDate,
      location,
      userId,
      timestamp: new Date().toISOString()
    });

    // Generate a new hash of the updated record data
    const dataHash = crypto
      .createHash('sha256')
      .update(recordData)
      .digest('hex');

    // Update the record
    await db.query(
      `UPDATE professional_records 
       SET record_type = $1, organization_name = $2, title = $3, description = $4,
       start_date = $5, end_date = $6, location = $7, data_hash = $8
       WHERE id = $9 AND user_id = $10`,
      [
        recordType,
        organizationName,
        title,
        description,
        startDate,
        endDate,
        location,
        dataHash,
        recordId,
        userId
      ]
    );

    // Log the record update
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        userId,
        'UPDATE_PROFESSIONAL_RECORD',
        'professional_records',
        recordId,
        JSON.stringify({ recordType }),
        req.ip
      ]
    );

    res.status(200).json({
      message: 'Professional record updated successfully',
      recordId,
      dataHash
    });
  } catch (error) {
    console.error('Update professional record error:', error);
    res.status(500).json({ message: 'Server error while updating professional record' });
  }
};

/**
 * Delete a professional record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteProfessionalRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.user.id;
    const db = req.app.locals.db;

    // Check if record exists and belongs to user
    const recordCheck = await db.query(
      'SELECT id, is_verified FROM professional_records WHERE id = $1 AND user_id = $2',
      [recordId, userId]
    );

    if (recordCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Professional record not found' });
    }

    // Don't allow deletion of verified records
    if (recordCheck.rows[0].is_verified) {
      return res.status(403).json({ 
        message: 'Cannot delete a verified record' 
      });
    }

    // Delete the record
    await db.query(
      'DELETE FROM professional_records WHERE id = $1 AND user_id = $2',
      [recordId, userId]
    );

    // Log the record deletion
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        userId,
        'DELETE_PROFESSIONAL_RECORD',
        'professional_records',
        recordId,
        JSON.stringify({}),
        req.ip
      ]
    );

    res.status(200).json({
      message: 'Professional record deleted successfully'
    });
  } catch (error) {
    console.error('Delete professional record error:', error);
    res.status(500).json({ message: 'Server error while deleting professional record' });
  }
};

/**
 * Request verification for a record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.requestVerification = async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.user.id;
    const db = req.app.locals.db;

    // Check if record exists and belongs to user
    const recordCheck = await db.query(
      'SELECT id, record_type FROM professional_records WHERE id = $1 AND user_id = $2',
      [recordId, userId]
    );

    if (recordCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Professional record not found' });
    }

    // Check if there's already a pending verification request
    const requestCheck = await db.query(
      'SELECT id FROM verification_requests WHERE user_id = $1 AND record_id = $2 AND status = $3',
      [userId, recordId, 'pending']
    );

    if (requestCheck.rows.length > 0) {
      return res.status(400).json({ message: 'A verification request is already pending for this record' });
    }

    // Create verification request
    const result = await db.query(
      'INSERT INTO verification_requests (user_id, record_id, record_type) VALUES ($1, $2, $3) RETURNING id, requested_at',
      [userId, recordId, 'professional_record']
    );

    // Log the verification request
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        userId,
        'REQUEST_VERIFICATION',
        'verification_requests',
        result.rows[0].id,
        JSON.stringify({ recordId }),
        req.ip
      ]
    );

    res.status(201).json({
      message: 'Verification request submitted successfully',
      requestId: result.rows[0].id,
      requestedAt: result.rows[0].requested_at
    });
  } catch (error) {
    console.error('Request verification error:', error);
    res.status(500).json({ message: 'Server error while requesting verification' });
  }
};

/**
 * Get verification requests for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getVerificationRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = req.app.locals.db;

    const result = await db.query(
      `SELECT vr.id, vr.record_id, vr.record_type, vr.status, vr.requested_at, vr.processed_at, vr.notes,
       u.username as processed_by_username
       FROM verification_requests vr
       LEFT JOIN users u ON vr.processed_by = u.id
       WHERE vr.user_id = $1
       ORDER BY vr.requested_at DESC`,
      [userId]
    );

    res.status(200).json({
      message: 'Verification requests retrieved successfully',
      requests: result.rows
    });
  } catch (error) {
    console.error('Get verification requests error:', error);
    res.status(500).json({ message: 'Server error while retrieving verification requests' });
  }
};

/**
 * Get verification requests for government officials
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getGovernmentVerificationRequests = async (req, res) => {
  try {
    const db = req.app.locals.db;

    const result = await db.query(
      `SELECT vr.id, vr.user_id, vr.record_id, vr.record_type, vr.status, vr.requested_at,
       u.username, u.full_name
       FROM verification_requests vr
       JOIN users u ON vr.user_id = u.id
       WHERE vr.status = 'pending'
       ORDER BY vr.requested_at ASC`,
      []
    );

    res.status(200).json({
      message: 'Verification requests retrieved successfully',
      requests: result.rows
    });
  } catch (error) {
    console.error('Get government verification requests error:', error);
    res.status(500).json({ message: 'Server error while retrieving verification requests' });
  }
};

/**
 * Verify identity by government official
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.verifyIdentity = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;
    const governmentUserId = req.user.id;
    const db = req.app.locals.db;
    
    // Get verification request
    const requestResult = await db.query(
      'SELECT * FROM verification_requests WHERE id = $1 AND status = $2',
      [requestId, 'pending']
    );
    
    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: 'Pending verification request not found' });
    }
    
    const request = requestResult.rows[0];
    
    // Update verification request status
    await db.query(
      'UPDATE verification_requests SET status = $1, processed_by = $2, processed_at = NOW(), notes = $3 WHERE id = $4',
      ['approved', governmentUserId, notes, requestId]
    );
    
    // Log the verification
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        governmentUserId,
        'VERIFY_IDENTITY',
        'verification_requests',
        requestId,
        JSON.stringify({ userId: request.user_id }),
        req.ip
      ]
    );
    
    res.status(200).json({
      message: 'Identity verification approved successfully',
      requestId
    });
  } catch (error) {
    console.error('Verify identity error:', error);
    res.status(500).json({ message: 'Server error during identity verification' });
  }
};

/**
 * Reject verification request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.rejectVerification = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;
    
    if (!notes) {
      return res.status(400).json({ message: 'Rejection notes are required' });
    }
    
    const governmentUserId = req.user.id;
    const db = req.app.locals.db;
    
    // Update verification request status
    const result = await db.query(
      'UPDATE verification_requests SET status = $1, processed_by = $2, processed_at = NOW(), notes = $3 WHERE id = $4 AND status = $5 RETURNING *',
      ['rejected', governmentUserId, notes, requestId, 'pending']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pending verification request not found' });
    }
    
    // Log the rejection
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        governmentUserId,
        'REJECT_VERIFICATION',
        'verification_requests',
        requestId,
        JSON.stringify({ 
          userId: result.rows[0].user_id,
          notes
        }),
        req.ip
      ]
    );
    
    res.status(200).json({
      message: 'Verification request rejected successfully',
      requestId
    });
  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(500).json({ message: 'Server error while rejecting verification request' });
  }
};

/**
 * Get verification requests for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getGovernmentVerificationRequests = async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const result = await db.query(
      `SELECT vr.id, vr.user_id, vr.record_id, vr.record_type, vr.status, vr.requested_at,
              u.username, u.full_name
       FROM verification_requests vr
       JOIN users u ON vr.user_id = u.id
       WHERE vr.status = 'pending'
       ORDER BY vr.requested_at ASC`,
      []
    );
    
    res.status(200).json({
      message: 'Verification requests retrieved successfully',
      requests: result.rows
    });
  } catch (error) {
    console.error('Get government verification requests error:', error);
    res.status(500).json({ message: 'Server error while retrieving verification requests' });
  }
};

/**
 * Register identity on blockchain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.registerOnBlockchain = async (req, res) => {
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
    
    // Check if user has biometric data
    const biometricResult = await db.query(
      'SELECT facemesh_hash FROM biometric_data WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    
    if (biometricResult.rows.length === 0) {
      return res.status(400).json({ message: 'User does not have active biometric data' });
    }
    
    const biometricHash = biometricResult.rows[0].facemesh_hash;
    
    // Create a professional data hash (placeholder)
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
 * Get blockchain status for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getBlockchainStatus = async (req, res) => {
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
    
    res.status(200).json({
      message: 'Blockchain status retrieved successfully',
      status: {
        walletAddress,
        isRegistered: biometricHash !== '0x0000000000000000000000000000000000000000000000000000000000000000',
        isVerified,
        professionalRecordCount: recordCount
      }
    });
  } catch (error) {
    console.error('Get blockchain status error:', error);
    res.status(500).json({ message: 'Server error while retrieving blockchain status' });
  }
};
