/**
 * Admin controller for DBIS
 */
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate JWT token for admin
 * @param {Object} admin - Admin object
 * @returns {Object} Token object with access and refresh tokens
 */
const generateAdminToken = (admin) => {
  const payload = {
    id: admin.id,
    username: admin.username,
    role: admin.role,
    type: 'admin'
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  const refreshToken = jwt.sign(
    { ...payload, jti: uuidv4() },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN) || 86400 // 24h in seconds
  };
};

/**
 * Login an admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.loginAdmin = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { username, password } = req.body;

  try {
    // Get admin by username
    const adminResult = await db.query(
      'SELECT id, username, password, email, role, is_active FROM admins WHERE username = $1',
      [username]
    );

    if (adminResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const admin = adminResult.rows[0];

    // Check if admin is active
    if (!admin.is_active) {
      return res.status(403).json({ message: 'Account is inactive. Please contact system administrator.' });
    }

    // Verify password
    let passwordValid;
    try {
      // Check if password is hashed with argon2
      if (admin.password.startsWith('$argon2')) {
        passwordValid = await argon2.verify(admin.password, password);
      } else {
        // Fallback to bcrypt if needed
        const bcrypt = require('bcryptjs');
        passwordValid = await bcrypt.compare(password, admin.password);
      }
    } catch (error) {
      logger.error('Password verification error:', error);
      return res.status(500).json({ message: 'Error during authentication' });
    }

    if (!passwordValid) {
      // Log failed login attempt
      await db.query(
        'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          admin.id,
          'ADMIN_LOGIN_FAILED',
          'admins',
          admin.id,
          JSON.stringify({ reason: 'Invalid password' }),
          req.ip
        ]
      );
      
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const tokens = generateAdminToken(admin);

    // Update last login time
    await db.query(
      'UPDATE admins SET last_login = NOW() WHERE id = $1',
      [admin.id]
    );

    // Store session
    await db.query(
      'INSERT INTO admin_sessions (admin_id, token, refresh_token, ip_address, user_agent, expires_at) VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL \'24 hours\')',
      [admin.id, tokens.accessToken, tokens.refreshToken, req.ip, req.headers['user-agent']]
    );

    // Log successful login
    await db.query(
      'INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        admin.id,
        'ADMIN_LOGIN_SUCCESS',
        'admins',
        admin.id,
        JSON.stringify({}),
        req.ip
      ]
    );

    // Return admin data and token
    res.status(200).json({
      message: 'Login successful',
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      },
      tokens
    });
  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * Refresh admin JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.refreshAdminToken = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    if (decoded.type !== 'admin') {
      return res.status(403).json({ message: 'Invalid token type' });
    }

    // Check if refresh token exists in database
    const sessionResult = await db.query(
      'SELECT admin_id FROM admin_sessions WHERE refresh_token = $1',
      [refreshToken]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Get admin
    const adminResult = await db.query(
      'SELECT id, username, role FROM admins WHERE id = $1',
      [decoded.id]
    );

    if (adminResult.rows.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const admin = adminResult.rows[0];

    // Generate new tokens
    const tokens = generateAdminToken(admin);

    // Update session
    await db.query(
      'UPDATE admin_sessions SET token = $1, refresh_token = $2, expires_at = NOW() + INTERVAL \'24 hours\' WHERE refresh_token = $3',
      [tokens.accessToken, tokens.refreshToken, refreshToken]
    );

    res.status(200).json({
      message: 'Token refreshed successfully',
      tokens
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    logger.error('Token refresh error:', error);
    res.status(500).json({ message: 'Server error during token refresh' });
  }
};

/**
 * Get all users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllUsers = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { page = 1, limit = 10, search = '', status = '' } = req.query;
  
  try {
    let query = `
      SELECT u.id, u.name, u.government_id, u.email, u.phone, u.wallet_address, 
             u.is_verified, u.verification_status, u.created_at, u.updated_at,
             EXISTS(SELECT 1 FROM biometric_data b WHERE b.user_id = u.id AND b.is_active = true) as has_biometric
      FROM users u
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    if (search) {
      query += ` AND (u.name ILIKE $${paramIndex} OR u.government_id ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND u.verification_status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }
    
    // Count total users matching the criteria
    const countQuery = `SELECT COUNT(*) FROM (${query}) AS count`;
    const countResult = await db.query(countQuery, queryParams);
    const totalUsers = parseInt(countResult.rows[0].count);
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    
    const result = await db.query(query, queryParams);
    
    res.status(200).json({
      users: result.rows,
      pagination: {
        total: totalUsers,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error while retrieving users' });
  }
};

/**
 * Get user by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserById = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { id } = req.params;
  
  try {
    // Get user details
    const userResult = await db.query(
      `SELECT u.id, u.name, u.government_id, u.email, u.phone, u.wallet_address, 
              u.is_verified, u.verification_status, u.verification_notes, 
              u.created_at, u.updated_at, u.verified_at,
              a.username as verified_by_username
       FROM users u
       LEFT JOIN admins a ON u.verified_by = a.id
       WHERE u.id = $1`,
      [id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Get biometric data (only metadata, not the actual data)
    const biometricResult = await db.query(
      `SELECT id, is_active, blockchain_tx_hash, created_at, updated_at
       FROM biometric_data
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [id]
    );
    
    // Get professional records
    const recordsResult = await db.query(
      `SELECT id, record_type, institution, title, description, 
              start_date, end_date, is_current, is_verified, 
              blockchain_tx_hash, created_at, updated_at
       FROM professional_records
       WHERE user_id = $1
       ORDER BY start_date DESC`,
      [id]
    );
    
    // Get recent audit logs
    const logsResult = await db.query(
      `SELECT id, action, entity_type, details, ip_address, created_at
       FROM audit_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [id]
    );
    
    res.status(200).json({
      user,
      biometricData: biometricResult.rows,
      professionalRecords: recordsResult.rows,
      recentActivity: logsResult.rows
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error while retrieving user details' });
  }
};

/**
 * Verify or reject a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.verifyUser = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { id } = req.params;
  const { verificationStatus, verificationNotes } = req.body;
  
  try {
    // Check if user exists
    const userResult = await db.query(
      'SELECT id, name, government_id, verification_status FROM users WHERE id = $1',
      [id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Update user verification status
    const updateResult = await db.query(
      `UPDATE users 
       SET verification_status = $1, 
           verification_notes = $2,
           verified_by = $3,
           verified_at = NOW(),
           is_verified = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, name, government_id, verification_status, verified_at`,
      [
        verificationStatus,
        verificationNotes,
        req.admin.id,
        verificationStatus === 'VERIFIED', // Set is_verified to true only if status is VERIFIED
        id
      ]
    );
    
    const updatedUser = updateResult.rows[0];
    
    // Log the verification action
    await db.query(
      `INSERT INTO audit_logs (admin_id, user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.admin.id,
        id,
        `USER_${verificationStatus}`,
        'users',
        id,
        JSON.stringify({
          previousStatus: user.verification_status,
          newStatus: verificationStatus,
          notes: verificationNotes
        }),
        req.ip
      ]
    );
    
    res.status(200).json({
      message: `User ${verificationStatus.toLowerCase()} successfully`,
      user: updatedUser
    });
  } catch (error) {
    logger.error('Verify user error:', error);
    res.status(500).json({ message: 'Server error while updating user verification status' });
  }
};

/**
 * Update user information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateUser = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { id } = req.params;
  const { name, email, phone, walletAddress } = req.body;
  
  try {
    // Check if user exists
    const userResult = await db.query(
      'SELECT id, name, email, phone, wallet_address FROM users WHERE id = $1',
      [id]
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
        id
      ]
    );
    
    const updatedUser = updateResult.rows[0];
    
    // Log the update action
    await db.query(
      `INSERT INTO audit_logs (admin_id, user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.admin.id,
        id,
        'USER_UPDATED',
        'users',
        id,
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
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ message: 'Server error while updating user information' });
  }
};

/**
 * Get activity logs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getActivityLogs = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { page = 1, limit = 20, userId, adminId, action, startDate, endDate } = req.query;
  
  try {
    let query = `
      SELECT l.id, l.action, l.entity_type, l.entity_id, l.details, l.ip_address, l.created_at,
             u.name as user_name, u.government_id,
             a.username as admin_username
      FROM audit_logs l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN admins a ON l.admin_id = a.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    if (userId) {
      query += ` AND l.user_id = $${paramIndex}`;
      queryParams.push(userId);
      paramIndex++;
    }
    
    if (adminId) {
      query += ` AND l.admin_id = $${paramIndex}`;
      queryParams.push(adminId);
      paramIndex++;
    }
    
    if (action) {
      query += ` AND l.action = $${paramIndex}`;
      queryParams.push(action);
      paramIndex++;
    }
    
    if (startDate) {
      query += ` AND l.created_at >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      query += ` AND l.created_at <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }
    
    // Count total logs matching the criteria
    const countQuery = `SELECT COUNT(*) FROM (${query}) AS count`;
    const countResult = await db.query(countQuery, queryParams);
    const totalLogs = parseInt(countResult.rows[0].count);
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY l.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    
    const result = await db.query(query, queryParams);
    
    res.status(200).json({
      logs: result.rows,
      pagination: {
        total: totalLogs,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalLogs / limit)
      }
    });
  } catch (error) {
    logger.error('Get activity logs error:', error);
    res.status(500).json({ message: 'Server error while retrieving activity logs' });
  }
};

/**
 * Create a new admin (Super Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createAdmin = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { username, password, email, role = 'ADMIN' } = req.body;
  
  try {
    // Check if username or email already exists
    const existingAdmin = await db.query(
      'SELECT id FROM admins WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingAdmin.rows.length > 0) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }
    
    // Hash password with Argon2
    const hashedPassword = await argon2.hash(password);
    
    // Insert new admin
    const result = await db.query(
      `INSERT INTO admins (username, password, email, role, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, username, email, role, created_at`,
      [username, hashedPassword, email, role]
    );
    
    const newAdmin = result.rows[0];
    
    // Log the admin creation
    await db.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.admin.id,
        'ADMIN_CREATED',
        'admins',
        newAdmin.id,
        JSON.stringify({
          username: newAdmin.username,
          email: newAdmin.email,
          role: newAdmin.role
        }),
        req.ip
      ]
    );
    
    res.status(201).json({
      message: 'Admin created successfully',
      admin: newAdmin
    });
  } catch (error) {
    logger.error('Create admin error:', error);
    res.status(500).json({ message: 'Server error while creating admin' });
  }
};

/**
 * Get dashboard statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getDashboardStats = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  
  try {
    // Get total users count
    const usersCountResult = await db.query('SELECT COUNT(*) FROM users');
    const totalUsers = parseInt(usersCountResult.rows[0].count);
    
    // Get verified users count
    const verifiedUsersResult = await db.query(
      "SELECT COUNT(*) FROM users WHERE verification_status = 'VERIFIED'"
    );
    const verifiedUsers = parseInt(verifiedUsersResult.rows[0].count);
    
    // Get pending users count
    const pendingUsersResult = await db.query(
      "SELECT COUNT(*) FROM users WHERE verification_status = 'PENDING'"
    );
    const pendingUsers = parseInt(pendingUsersResult.rows[0].count);
    
    // Get rejected users count
    const rejectedUsersResult = await db.query(
      "SELECT COUNT(*) FROM users WHERE verification_status = 'REJECTED'"
    );
    const rejectedUsers = parseInt(rejectedUsersResult.rows[0].count);
    
    // Get total biometric records count
    const biometricResult = await db.query('SELECT COUNT(*) FROM biometric_data');
    const totalBiometricRecords = parseInt(biometricResult.rows[0].count);
    
    // Get total professional records count
    const professionalResult = await db.query('SELECT COUNT(*) FROM professional_records');
    const totalProfessionalRecords = parseInt(professionalResult.rows[0].count);
    
    // Get total blockchain transactions count
    const blockchainResult = await db.query('SELECT COUNT(*) FROM blockchain_transactions');
    const totalBlockchainTransactions = parseInt(blockchainResult.rows[0].count);
    
    // Get recent activity (last 5 audit logs)
    const recentActivityResult = await db.query(
      `SELECT l.id, l.action, l.entity_type, l.created_at,
              u.name as user_name, u.government_id,
              a.username as admin_username
       FROM audit_logs l
       LEFT JOIN users u ON l.user_id = u.id
       LEFT JOIN admins a ON l.admin_id = a.id
       ORDER BY l.created_at DESC
       LIMIT 5`
    );
    
    // Get user registration trend (last 7 days)
    const registrationTrendResult = await db.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM users
       WHERE created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );
    
    res.status(200).json({
      userStats: {
        total: totalUsers,
        verified: verifiedUsers,
        pending: pendingUsers,
        rejected: rejectedUsers
      },
      recordStats: {
        biometricRecords: totalBiometricRecords,
        professionalRecords: totalProfessionalRecords,
        blockchainTransactions: totalBlockchainTransactions
      },
      recentActivity: recentActivityResult.rows,
      registrationTrend: registrationTrendResult.rows
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error while retrieving dashboard statistics' });
  }
};

/**
 * Get admin profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAdminProfile = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  
  try {
    const adminId = req.admin.id;
    
    // Get admin details
    const adminResult = await db.query(
      'SELECT id, username, email, role, is_active, last_login, created_at, updated_at FROM admins WHERE id = $1',
      [adminId]
    );
    
    if (adminResult.rows.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Get admin activity count
    const activityCountResult = await db.query(
      'SELECT COUNT(*) FROM audit_logs WHERE admin_id = $1',
      [adminId]
    );
    
    const activityCount = parseInt(activityCountResult.rows[0].count);
    
    res.status(200).json({
      admin: adminResult.rows[0],
      activityCount
    });
  } catch (error) {
    logger.error('Get admin profile error:', error);
    res.status(500).json({ message: 'Server error while retrieving admin profile' });
  }
};

/**
 * Update admin profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateAdminProfile = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { email } = req.body;
  
  try {
    const adminId = req.admin.id;
    
    // Check if admin exists
    const adminResult = await db.query(
      'SELECT email FROM admins WHERE id = $1',
      [adminId]
    );
    
    if (adminResult.rows.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Check if email is already in use by another admin
    if (email && email !== adminResult.rows[0].email) {
      const emailCheckResult = await db.query(
        'SELECT id FROM admins WHERE email = $1 AND id != $2',
        [email, adminId]
      );
      
      if (emailCheckResult.rows.length > 0) {
        return res.status(409).json({ message: 'Email already in use by another admin' });
      }
    }
    
    // Update admin information
    const updateResult = await db.query(
      `UPDATE admins 
       SET email = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, username, email, role, is_active, updated_at`,
      [email || adminResult.rows[0].email, adminId]
    );
    
    // Log the update action
    await db.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        adminId,
        'ADMIN_PROFILE_UPDATED',
        'admins',
        adminId,
        JSON.stringify({
          email: email !== adminResult.rows[0].email ? { from: adminResult.rows[0].email, to: email } : undefined
        }),
        req.ip
      ]
    );
    
    res.status(200).json({
      message: 'Admin profile updated successfully',
      admin: updateResult.rows[0]
    });
  } catch (error) {
    logger.error('Update admin profile error:', error);
    res.status(500).json({ message: 'Server error while updating admin profile' });
  }
};

/**
 * Change admin password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.changeAdminPassword = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }
  
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long' });
  }
  
  try {
    const adminId = req.admin.id;
    
    // Get admin details
    const adminResult = await db.query(
      'SELECT password FROM admins WHERE id = $1',
      [adminId]
    );
    
    if (adminResult.rows.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Verify current password
    const isPasswordValid = await argon2.verify(adminResult.rows[0].password, currentPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await argon2.hash(newPassword);
    
    // Update password
    await db.query(
      'UPDATE admins SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, adminId]
    );
    
    // Log the password change
    await db.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        adminId,
        'ADMIN_PASSWORD_CHANGED',
        'admins',
        adminId,
        JSON.stringify({}),
        req.ip
      ]
    );
    
    // Invalidate all existing sessions except the current one
    await db.query(
      'DELETE FROM admin_sessions WHERE admin_id = $1 AND token != $2',
      [adminId, req.token]
    );
    
    res.status(200).json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Change admin password error:', error);
    res.status(500).json({ message: 'Server error while changing password' });
  }
};

/**
 * Deactivate user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deactivateUser = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.params.id;
  const { reason } = req.body;
  
  try {
    // Check if user exists
    const userResult = await db.query(
      'SELECT id, name, government_id, is_active FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // If user is already inactive
    if (user.is_active === false) {
      return res.status(400).json({ message: 'User is already inactive' });
    }
    
    // Update user status
    await db.query(
      'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1',
      [userId]
    );
    
    // Invalidate all user sessions
    await db.query(
      'DELETE FROM user_sessions WHERE user_id = $1',
      [userId]
    );
    
    // Log the deactivation
    await db.query(
      `INSERT INTO audit_logs (admin_id, user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.admin.id,
        userId,
        'USER_DEACTIVATED',
        'users',
        userId,
        JSON.stringify({
          reason: reason || 'No reason provided',
          governmentId: user.government_id
        }),
        req.ip
      ]
    );
    
    res.status(200).json({
      message: 'User deactivated successfully',
      user: {
        id: user.id,
        name: user.name,
        governmentId: user.government_id,
        isActive: false
      }
    });
  } catch (error) {
    logger.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Server error while deactivating user' });
  }
};

/**
 * Reactivate user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.reactivateUser = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.params.id;
  
  try {
    // Check if user exists
    const userResult = await db.query(
      'SELECT id, name, government_id, is_active FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // If user is already active
    if (user.is_active === true) {
      return res.status(400).json({ message: 'User is already active' });
    }
    
    // Update user status
    await db.query(
      'UPDATE users SET is_active = true, updated_at = NOW() WHERE id = $1',
      [userId]
    );
    
    // Log the reactivation
    await db.query(
      `INSERT INTO audit_logs (admin_id, user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.admin.id,
        userId,
        'USER_REACTIVATED',
        'users',
        userId,
        JSON.stringify({
          governmentId: user.government_id
        }),
        req.ip
      ]
    );
    
    res.status(200).json({
      message: 'User reactivated successfully',
      user: {
        id: user.id,
        name: user.name,
        governmentId: user.government_id,
        isActive: true
      }
    });
  } catch (error) {
    logger.error('Reactivate user error:', error);
    res.status(500).json({ message: 'Server error while reactivating user' });
  }
};
