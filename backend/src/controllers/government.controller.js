/**
 * Government controller for DBIS
 */
const { validationResult } = require('express-validator');
const blockchainService = require('../services/blockchain.service');

/**
 * List all users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.listUsers = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { page = 1, limit = 10, search } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT u.id, u.username, u.email, u.full_name, u.date_of_birth, 
             u.wallet_address, u.created_at, array_agg(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
    `;
    
    let params = [];
    
    if (search) {
      query += ` WHERE u.username ILIKE $1 OR u.email ILIKE $1 OR u.full_name ILIKE $1`;
      params.push(`%${search}%`);
    }
    
    query += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) FROM users`;
    if (search) {
      countQuery += ` WHERE username ILIKE $1 OR email ILIKE $1 OR full_name ILIKE $1`;
    }
    
    const countResult = await db.query(countQuery, search ? [`%${search}%`] : []);
    const totalUsers = parseInt(countResult.rows[0].count);
    
    res.status(200).json({
      message: 'Users retrieved successfully',
      users: result.rows,
      pagination: {
        total: totalUsers,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ message: 'Server error while retrieving users' });
  }
};

/**
 * Get user details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const db = req.app.locals.db;
    
    // Get user details
    const userResult = await db.query(
      `SELECT u.id, u.username, u.email, u.full_name, u.date_of_birth, 
              u.phone_number, u.wallet_address, u.created_at, u.updated_at,
              array_agg(DISTINCT r.name) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Get biometric data status
    const biometricResult = await db.query(
      `SELECT id, created_at, updated_at, is_active, blockchain_tx_hash
       FROM biometric_data
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );
    
    // Get professional records
    const recordsResult = await db.query(
      `SELECT id, record_type, organization_name, title, start_date, end_date,
              is_verified, verified_by, verified_at, created_at
       FROM professional_records
       WHERE user_id = $1
       ORDER BY start_date DESC`,
      [userId]
    );
    
    // Get verification requests
    const requestsResult = await db.query(
      `SELECT id, record_id, record_type, status, requested_at, processed_at, notes
       FROM verification_requests
       WHERE user_id = $1
       ORDER BY requested_at DESC`,
      [userId]
    );
    
    // Log the access
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        req.user.id,
        'VIEW_USER_DETAILS',
        'users',
        userId,
        JSON.stringify({}),
        req.ip
      ]
    );
    
    res.status(200).json({
      message: 'User details retrieved successfully',
      user,
      biometricData: biometricResult.rows[0] || null,
      professionalRecords: recordsResult.rows,
      verificationRequests: requestsResult.rows
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Server error while retrieving user details' });
  }
};

/**
 * List verification requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.listVerificationRequests = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;
    
    const result = await db.query(
      `SELECT vr.id, vr.user_id, vr.record_id, vr.record_type, vr.status, 
              vr.requested_at, vr.processed_at, vr.notes,
              u.username, u.full_name, u.email
       FROM verification_requests vr
       JOIN users u ON vr.user_id = u.id
       WHERE vr.status = $1
       ORDER BY vr.requested_at ASC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );
    
    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) FROM verification_requests WHERE status = $1',
      [status]
    );
    
    const totalRequests = parseInt(countResult.rows[0].count);
    
    res.status(200).json({
      message: 'Verification requests retrieved successfully',
      requests: result.rows,
      pagination: {
        total: totalRequests,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalRequests / limit)
      }
    });
  } catch (error) {
    console.error('List verification requests error:', error);
    res.status(500).json({ message: 'Server error while retrieving verification requests' });
  }
};

/**
 * Approve verification request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.approveVerification = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { notes } = req.body;
    const governmentUserId = req.user.id;
    const db = req.app.locals.db;
    
    // Start a transaction
    await db.query('BEGIN');
    
    try {
      // Get verification request
      const requestResult = await db.query(
        'SELECT * FROM verification_requests WHERE id = $1 AND status = $2',
        [requestId, 'pending']
      );
      
      if (requestResult.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({ message: 'Pending verification request not found' });
      }
      
      const request = requestResult.rows[0];
      
      // Update verification request status
      await db.query(
        'UPDATE verification_requests SET status = $1, processed_by = $2, processed_at = NOW(), notes = $3 WHERE id = $4',
        ['approved', governmentUserId, notes, requestId]
      );
      
      // Update the record based on record type
      if (request.record_type === 'professional_record') {
        // Update professional record
        await db.query(
          'UPDATE professional_records SET is_verified = true, verified_by = $1, verified_at = NOW() WHERE id = $2',
          [governmentUserId, request.record_id]
        );
        
        // Get record details for blockchain
        const recordResult = await db.query(
          'SELECT user_id, data_hash, start_date, end_date FROM professional_records WHERE id = $1',
          [request.record_id]
        );
        
        if (recordResult.rows.length > 0) {
          const record = recordResult.rows[0];
          
          // Get user wallet address
          const userResult = await db.query(
            'SELECT wallet_address FROM users WHERE id = $1',
            [record.user_id]
          );
          
          if (userResult.rows.length > 0 && userResult.rows[0].wallet_address) {
            // Register verification on blockchain
            const walletAddress = userResult.rows[0].wallet_address;
            
            // Get record index on blockchain
            const recordCount = await blockchainService.getProfessionalRecordCount(walletAddress);
            
            // Verify the record on blockchain
            // This is a placeholder - in a real implementation, you would need to find the correct record index
            const blockchainResult = await blockchainService.verifyProfessionalRecord(
              walletAddress,
              recordCount - 1 // Assuming the latest record is the one we want to verify
            );
            
            // Update record with blockchain transaction hash
            await db.query(
              'UPDATE professional_records SET blockchain_tx_hash = $1 WHERE id = $2',
              [blockchainResult.transactionHash, request.record_id]
            );
          }
        }
      } else if (request.record_type === 'identity') {
        // Update user identity verification status
        // This would be implemented based on your identity verification flow
      }
      
      // Log the verification
      await db.query(
        'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          governmentUserId,
          'APPROVE_VERIFICATION',
          'verification_requests',
          requestId,
          JSON.stringify({ 
            recordType: request.record_type,
            recordId: request.record_id
          }),
          req.ip
        ]
      );
      
      // Commit transaction
      await db.query('COMMIT');
      
      res.status(200).json({
        message: 'Verification request approved successfully',
        requestId
      });
    } catch (error) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(500).json({ message: 'Server error while approving verification request' });
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
          recordType: result.rows[0].record_type,
          recordId: result.rows[0].record_id,
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
 * Get audit logs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { page = 1, limit = 20, userId, action, startDate, endDate } = req.query;
    
    const offset = (page - 1) * limit;
    let params = [];
    let whereConditions = [];
    
    // Build query conditions
    if (userId) {
      whereConditions.push(`al.user_id = $${params.length + 1}`);
      params.push(userId);
    }
    
    if (action) {
      whereConditions.push(`al.action = $${params.length + 1}`);
      params.push(action);
    }
    
    if (startDate) {
      whereConditions.push(`al.created_at >= $${params.length + 1}`);
      params.push(startDate);
    }
    
    if (endDate) {
      whereConditions.push(`al.created_at <= $${params.length + 1}`);
      params.push(endDate);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get audit logs
    const query = `
      SELECT al.id, al.user_id, al.action, al.entity_type, al.entity_id, 
             al.details, al.ip_address, al.user_agent, al.created_at,
             u.username, u.full_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) FROM audit_logs al
      ${whereClause}
    `;
    
    const countResult = await db.query(countQuery, params.slice(0, params.length - 2));
    const totalLogs = parseInt(countResult.rows[0].count);
    
    res.status(200).json({
      message: 'Audit logs retrieved successfully',
      logs: result.rows,
      pagination: {
        total: totalLogs,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalLogs / limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Server error while retrieving audit logs' });
  }
};
