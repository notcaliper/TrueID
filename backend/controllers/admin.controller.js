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

    // Return admin data and token in the format expected by the government portal
    res.status(200).json({
      message: 'Login successful',
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      },
      tokens,
      // Include token directly for backward compatibility with government portal
      token: tokens.accessToken,
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
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

    // Get admin profile to include in response
    const profileResult = await db.query(
      'SELECT id, username, email, role FROM admins WHERE id = $1',
      [admin.id]
    );
    
    const adminProfile = profileResult.rows[0];
    
    res.status(200).json({
      message: 'Token refreshed successfully',
      tokens,
      // Include token directly for backward compatibility with government portal
      token: tokens.accessToken,
      admin: adminProfile,
      user: adminProfile
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
      SELECT u.id, u.name, u.government_id, u.email, u.phone, u.avax_address, 
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
      `SELECT u.id, u.name, u.government_id, u.email, u.phone, u.avax_address, 
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
      `SELECT id, facemesh_hash, blockchain_tx_hash, verification_status, created_at, updated_at
       FROM biometric_data
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [id]
    );
    
    // Get professional records
    const recordsResult = await db.query(
      `SELECT id, record_type, institution, title, description, 
              start_date, end_date, is_current, is_verified, 
              created_at, updated_at
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
    
    // Add facemesh_hash and blockchain_tx_hash to user object if available
    if (biometricResult.rows && biometricResult.rows.length > 0) {
      // Use the latest biometric record (assuming sorted by created_at DESC)
      const latestBiometric = biometricResult.rows[0];
      if (latestBiometric.facemesh_hash) {
        user.facemesh_hash = latestBiometric.facemesh_hash;
      }
      if (latestBiometric.blockchain_tx_hash) {
        user.blockchain_tx_hash = latestBiometric.blockchain_tx_hash;
      }
      user.biometric_verification_status = latestBiometric.verification_status;
    } else {
      user.facemesh_hash = null;
      user.blockchain_tx_hash = null;
      user.biometric_verification_status = null;
    }
    res.status(200).json({
      user,
      biometricData: biometricResult.rows.map(b => ({
        id: b.id,
        facemesh_hash: b.facemesh_hash,
        blockchain_tx_hash: b.blockchain_tx_hash,
        verification_status: b.verification_status,
        created_at: b.created_at,
        updated_at: b.updated_at
      })),
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
  const { verificationStatus, verificationNotes, transferAmount } = req.body;
  
  try {
    // Check if user exists and get all necessary user data including private key
    const userResult = await db.query(
      'SELECT id, name, government_id, verification_status, avax_address, avax_address, avax_private_key FROM users WHERE id = $1',
      [id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Start a transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update user verification status
      const updateResult = await client.query(
        `UPDATE users 
         SET verification_status = $1, 
             verification_notes = $2,
             verified_by = $3,
             verified_at = NOW(),
             is_verified = $4,
             updated_at = NOW()
         WHERE id = $5
         RETURNING id, name, government_id, verification_status, verified_at, avax_address, avax_address`,
        [
          verificationStatus,
          verificationNotes,
          req.admin.id,
          verificationStatus === 'VERIFIED', // Set is_verified to true only if status is VERIFIED
          id
        ]
      );
      
      // Also update biometric data verification status to maintain consistency
      await client.query(
        `UPDATE biometric_data 
         SET verification_status = $1,
             updated_at = NOW()
         WHERE user_id = $2 AND is_active = true`,
        [verificationStatus, id]
      );
      
      const updatedUser = updateResult.rows[0];
      
      // Log the verification action
      await client.query(
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
      
      // Initialize variables for transaction results
      let fundingResult = null;
      let blockchainRegistrationResult = null;
      
      // STEP 1: If verification status is VERIFIED, first transfer funds to the user's wallet
      if (verificationStatus === 'VERIFIED') {
        // Import the wallet service
        const walletService = require('../services/wallet.service');
        
        // Get transfer amount from request or use default (0.03 AVAX)
        const amount = transferAmount || 0.03;
        
        // Check if user has avax_address, use that if available
        const targetAddress = user.avax_address || user.avax_address;
        
        if (targetAddress) {
          logger.info(`Transferring ${amount} AVAX to user ${user.id} at address ${targetAddress}`);
          
          // Transfer AVAX to user's wallet
          fundingResult = await walletService.transferTokens(targetAddress, amount);
          
          if (fundingResult.success) {
            // Update user's blockchain transaction record
            await client.query(
              `INSERT INTO blockchain_transactions 
               (user_id, transaction_type, transaction_hash, block_number, status, data)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                id,
                'VERIFICATION_FUNDING',
                fundingResult.transactionHash,
                fundingResult.blockNumber,
                'SUCCESS',
                JSON.stringify({
                  amount: amount,
                  from: fundingResult.from,
                  to: targetAddress,
                  gasUsed: fundingResult.gasUsed,
                  network: 'avalanche_fuji'
                })
              ]
            );
            
            // Log the transaction
            await client.query(
              `INSERT INTO audit_logs (admin_id, user_id, action, entity_type, entity_id, details, ip_address)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                req.admin.id,
                id,
                'USER_BLOCKCHAIN_FUNDING',
                'users',
                id,
                JSON.stringify({
                  transactionHash: fundingResult.transactionHash,
                  amount: amount,
                  status: 'SUCCESS'
                }),
                req.ip
              ]
            );
            
            // STEP 2: After successful funding, forcefully register user's identity on blockchain
            if (user.avax_private_key) {
              try {
                // Get user's biometric data hash
                const biometricResult = await client.query(
                  'SELECT facemesh_hash FROM biometric_data WHERE user_id = $1 AND is_active = true',
                  [id]
                );
                
                if (biometricResult.rows.length > 0) {
                  const biometricHash = biometricResult.rows[0].facemesh_hash;
                  
                  // Import blockchain service
                  const blockchainService = require('../services/blockchain.service');
                  
                  // Check if identity already exists on blockchain
                  const targetAddress = user.avax_address || user.avax_address;
                  let identityExists = false;
                  
                  try {
                    identityExists = await blockchainService.isIdentityRegistered(targetAddress);
                    logger.info(`Identity check for user ${user.id} completed. Result: ${identityExists ? 'EXISTS' : 'NOT EXISTS'}`);
                  } catch (identityCheckError) {
                    logger.error(`Error checking if identity exists for user ${user.id}:`, identityCheckError);
                    // Continue with registration attempt even if check fails
                  }
                  
                  if (identityExists) {
                    logger.info(`Identity for user ${user.id} already exists on blockchain, skipping registration`);
                    
                    // Record the existing identity in audit logs
                    await client.query(
                      `INSERT INTO audit_logs (admin_id, user_id, action, entity_type, entity_id, details, ip_address)
                       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                      [
                        req.admin.id,
                        id,
                        'USER_BLOCKCHAIN_IDENTITY_EXISTS',
                        'users',
                        id,
                        JSON.stringify({
                          message: 'Identity already exists on blockchain',
                          walletAddress: targetAddress
                        }),
                        req.ip
                      ]
                    );
                    
                    // Set blockchainRegistrationResult to indicate existing identity
                    blockchainRegistrationResult = {
                      status: 'ALREADY_EXISTS',
                      message: 'Identity already exists on blockchain'
                    };
                  } else {
                    // Use empty professional data hash for now
                    const professionalDataHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
                    
                    logger.info(`Registering user ${user.id} identity on blockchain using their private key`);
                    
                    // Register identity on blockchain using user's private key
                    blockchainRegistrationResult = await blockchainService.registerIdentity(
                      user.avax_private_key,
                      biometricHash,
                      professionalDataHash
                    );
                  
                    // Record blockchain registration only if we actually registered (not for existing identities)
                    await client.query(
                      `INSERT INTO blockchain_transactions 
                       (user_id, transaction_type, transaction_hash, block_number, status, data)
                       VALUES ($1, $2, $3, $4, $5, $6)`,
                      [
                        id,
                        'IDENTITY_REGISTRATION',
                        blockchainRegistrationResult.transactionHash,
                        blockchainRegistrationResult.blockNumber,
                        blockchainRegistrationResult.status,
                        JSON.stringify({
                          biometricHash: biometricHash,
                          registeredBy: 'SYSTEM_AUTOMATIC',
                          network: blockchainRegistrationResult.network
                        })
                      ]
                    );
                    
                    // Update the biometric data with the blockchain transaction hash
                    await client.query(
                      `UPDATE biometric_data 
                       SET blockchain_tx_hash = $1,
                           updated_at = NOW()
                       WHERE user_id = $2 AND is_active = true`,
                      [blockchainRegistrationResult.transactionHash, id]
                    );
                  }
                  
                  // Log blockchain registration in audit logs only since blockchain_status column doesn't exist
                  logger.info(`Successfully registered user ${id} identity on blockchain with tx hash: ${blockchainRegistrationResult.transactionHash}`);
                  
                  // Log the blockchain registration
                  await client.query(
                    `INSERT INTO audit_logs (admin_id, user_id, action, entity_type, entity_id, details, ip_address)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                      req.admin.id,
                      id,
                      'USER_BLOCKCHAIN_REGISTRATION',
                      'users',
                      id,
                      JSON.stringify({
                        transactionHash: blockchainRegistrationResult.transactionHash,
                        status: blockchainRegistrationResult.status,
                        automatic: true
                      }),
                      req.ip
                    ]
                  );
                } else {
                  logger.error(`No active biometric data found for user ${id}`);
                }
              } catch (blockchainError) {
                logger.error(`Error registering user ${id} on blockchain:`, blockchainError);
                
                // Log the failed blockchain registration
                await client.query(
                  `INSERT INTO audit_logs (admin_id, user_id, action, entity_type, entity_id, details, ip_address)
                   VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                  [
                    req.admin.id,
                    id,
                    'USER_BLOCKCHAIN_REGISTRATION_FAILED',
                    'users',
                    id,
                    JSON.stringify({
                      error: blockchainError.message
                    }),
                    req.ip
                  ]
                );
              }
            } else {
              logger.error(`No private key available for user ${id}`);
            }
          } else {
            // Log the failed funding transaction
            await client.query(
              `INSERT INTO audit_logs (admin_id, user_id, action, entity_type, entity_id, details, ip_address)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                req.admin.id,
                id,
                'USER_BLOCKCHAIN_FUNDING_FAILED',
                'users',
                id,
                JSON.stringify({
                  error: fundingResult.error,
                  amount: amount
                }),
                req.ip
              ]
            );
          }
        } else {
          logger.error(`No wallet address available for user ${id}`);
        }
      }
      
      await client.query('COMMIT');
      
      // Prepare response
      const response = {
        message: `User ${verificationStatus.toLowerCase()} successfully`,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          governmentId: updatedUser.government_id,
          verificationStatus: updatedUser.verification_status,
          verifiedAt: updatedUser.verified_at
        }
      };
      
      // Add transaction details to response if available
      if (fundingResult && fundingResult.success) {
        response.fundingTransaction = {
          hash: fundingResult.transactionHash,
          blockNumber: fundingResult.blockNumber,
          explorerUrl: fundingResult.explorerUrl
        };
      }
      
      // Add blockchain registration details if available
      if (blockchainRegistrationResult) {
        response.blockchainRegistration = {};
        
        // Handle the case where identity already exists
        if (blockchainRegistrationResult.status === 'ALREADY_EXISTS') {
          response.blockchainRegistration.status = 'ALREADY_EXISTS';
          response.blockchainRegistration.message = blockchainRegistrationResult.message;
        } else {
          // For newly registered identities
          response.blockchainRegistration.hash = blockchainRegistrationResult.transactionHash;
          response.blockchainRegistration.blockNumber = blockchainRegistrationResult.blockNumber;
          response.blockchainRegistration.status = blockchainRegistrationResult.status;
          
          // Include network info if available
          if (blockchainRegistrationResult.network) {
            response.blockchainRegistration.network = blockchainRegistrationResult.network;
          }
        }
      }
      
      res.status(200).json(response);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Verify user error:', error);
    res.status(500).json({ message: 'Server error during user verification' });
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
      'SELECT id, name, email, phone, avax_address FROM users WHERE id = $1',
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
           avax_address = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, name, government_id, email, phone, avax_address, updated_at`,
      [
        name || user.name,
        email || user.email,
        phone || user.phone,
        walletAddress || user.avax_address,
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
            walletAddress: walletAddress !== user.avax_address ? { from: user.avax_address, to: walletAddress } : undefined
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
    
    // Format the response to match what the government portal expects
    const adminData = adminResult.rows[0];
    
    res.status(200).json({
      admin: adminData,
      // Also include as user for compatibility with government portal
      user: adminData,
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
 * Deactivate a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deactivateUser = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.params.id;
  const { action, notes } = req.body;
  
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

/**
 * Check blockchain expiry status for all pending users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.checkBlockchainExpiry = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  
  try {
    // Import blockchain service
    const blockchainService = require('../services/blockchain.service');
    
    // Process expired blockchain statuses
    const results = await blockchainService.processExpiredBlockchainStatuses(db);
    
    // Log the action
    await db.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, details, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.admin.id,
        'BLOCKCHAIN_EXPIRY_CHECK',
        'users',
        JSON.stringify({
          total: results.total,
          confirmed: results.confirmed,
          expired: results.expired
        }),
        req.ip
      ]
    );
    
    res.status(200).json({
      message: 'Blockchain expiry check completed successfully',
      results
    });
  } catch (error) {
    logger.error('Blockchain expiry check error:', error);
    res.status(500).json({ message: 'Server error while checking blockchain expiry status' });
  }
};

/**
 * Get activity logs for a specific user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserActivityLogs = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { id } = req.params;
  
  try {
    // Check if user exists
    const userResult = await db.query(
      'SELECT id, name FROM users WHERE id = $1',
      [id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user activity logs
    const logsResult = await db.query(
      `SELECT id, admin_id, user_id, action, entity_type, entity_id, details, ip_address, created_at
       FROM audit_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [id]
    );
    
    // Get admin names for the logs
    const adminIds = [...new Set(logsResult.rows.filter(log => log.admin_id).map(log => log.admin_id))];
    
    let adminNames = {};
    if (adminIds.length > 0) {
      const adminResult = await db.query(
        `SELECT id, name FROM admins WHERE id IN (${adminIds.map((_, i) => `$${i + 1}`).join(', ')})`,
        adminIds
      );
      
      adminNames = adminResult.rows.reduce((acc, admin) => {
        acc[admin.id] = admin.name;
        return acc;
      }, {});
    }
    
    // Add admin names to logs
    const logsWithAdminNames = logsResult.rows.map(log => ({
      ...log,
      adminName: log.admin_id ? (adminNames[log.admin_id] || 'Unknown Admin') : 'System'
    }));
    
    res.status(200).json({
      user: userResult.rows[0],
      logs: logsWithAdminNames
    });
  } catch (error) {
    logger.error('Get user activity logs error:', error);
    res.status(500).json({ message: 'Server error while retrieving user activity logs' });
  }
};

/**
 * Get detailed dashboard statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getDetailedDashboardStats = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  
  try {
    // Get user statistics by verification status
    const userStatsByStatus = await db.query(`
      SELECT verification_status, COUNT(*) as count 
      FROM users 
      GROUP BY verification_status
    `);
    
    // Get user statistics by registration date (last 30 days)
    const userStatsByDate = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '30 days' 
      GROUP BY DATE(created_at) 
      ORDER BY date
    `);
    
    // Get biometric data statistics
    const biometricStats = await db.query(`
      SELECT verification_status, COUNT(*) as count 
      FROM biometric_data 
      GROUP BY verification_status
    `);
    
    // Get blockchain transaction statistics
    const blockchainStats = await db.query(`
      SELECT transaction_type, COUNT(*) as count 
      FROM blockchain_transactions 
      GROUP BY transaction_type
    `);
    
    // Get activity logs statistics
    const activityStats = await db.query(`
      SELECT action, COUNT(*) as count 
      FROM audit_logs 
      WHERE created_at >= NOW() - INTERVAL '30 days' 
      GROUP BY action
    `);
    
    res.status(200).json({
      userStatsByStatus: userStatsByStatus.rows,
      userStatsByDate: userStatsByDate.rows,
      biometricStats: biometricStats.rows,
      blockchainStats: blockchainStats.rows,
      activityStats: activityStats.rows
    });
  } catch (error) {
    logger.error('Get detailed dashboard stats error:', error);
    res.status(500).json({ message: 'Server error while retrieving detailed dashboard statistics' });
  }
};

/**
 * Get all professional records
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllProfessionalRecords = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { page = 1, limit = 10, sort = 'created_at', order = 'DESC' } = req.query;
  
  try {
    const offset = (page - 1) * limit;
    
    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) FROM professional_records'
    );
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Get professional records with user details
    const recordsResult = await db.query(
      `SELECT pr.*, u.name as user_name, u.email as user_email
       FROM professional_records pr
       JOIN users u ON pr.user_id = u.id
       ORDER BY pr.${sort} ${order}
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    res.status(200).json({
      records: recordsResult.rows,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    logger.error('Get all professional records error:', error);
    res.status(500).json({ message: 'Server error while retrieving professional records' });
  }
};

/**
 * Get professional record by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getProfessionalRecordById = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { id } = req.params;
  const recordId = parseInt(id, 10);

  if (Number.isNaN(recordId)) {
    return res.status(400).json({ message: 'Invalid professional record ID' });
  }

  try {
    // Fetch the professional record details along with user and verifier info
    const result = await db.query(
      `SELECT pr.*, 
              u.name AS user_name, u.email AS user_email, u.government_id, 
              a.username AS verified_by_username
       FROM professional_records pr
       LEFT JOIN users u ON pr.user_id = u.id
       LEFT JOIN admins a ON pr.verified_by = a.id
       WHERE pr.id = $1`,
      [recordId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Professional record not found' });
    }

    res.status(200).json({ record: result.rows[0] });
  } catch (error) {
    logger.error('Get professional record by ID error:', error);
    res.status(500).json({ message: 'Server error while retrieving professional record' });
  }
};

/**
 * Get professional records for a specific user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserProfessionalRecords = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { id } = req.params;
  
  try {
    // Check if user exists
    const userResult = await db.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get professional records for the user
    const recordsResult = await db.query(
      `SELECT * FROM professional_records 
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [id]
    );
    
    res.status(200).json({
      user: userResult.rows[0],
      records: recordsResult.rows
    });
  } catch (error) {
    logger.error('Get user professional records error:', error);
    res.status(500).json({ message: 'Server error while retrieving user professional records' });
  }
};

/**
 * Update professional record status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateProfessionalRecordStatus = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { id } = req.params;
  const recordId = parseInt(id, 10);

  if (Number.isNaN(recordId)) {
    return res.status(400).json({ message: 'Invalid professional record ID' });
  }

  const { status, notes } = req.body;
  const adminId = req.admin.id;

  // Validate status
  if (!['VERIFIED', 'REJECTED', 'DEACTIVATED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be VERIFIED, REJECTED, or DEACTIVATED' });
  }

  try {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Update professional record
      const result = await client.query(
        `UPDATE professional_records
         SET verification_status = $1,
             verified_by = $2,
             verified_at = NOW(),
             verification_remarks = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING id, user_id, title, institution, verification_status`,
        [status, adminId, notes, recordId]
      );

      if (result.rows.length === 0) {
        throw new Error('Professional record not found');
      }

      const record = result.rows[0];

      // Log the action
      await client.query(
        `INSERT INTO audit_logs (
          admin_id,
          user_id,
          action,
          entity_type,
          entity_id,
          details,
          ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          adminId,
          record.user_id,
          'PROFESSIONAL_RECORD_STATUS_UPDATED',
          'professional_records',
          id,
          JSON.stringify({
            status,
            notes,
            title: record.title,
            institution: record.institution
          }),
          req.ip
        ]
      );

      await client.query('COMMIT');

      res.status(200).json({
        message: 'Professional record status updated successfully',
        record: {
          id: record.id,
          status: record.verification_status,
          verifiedAt: new Date(),
          verifiedBy: adminId
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Update professional record status error:', error);
    res.status(500).json({ message: 'Server error while updating professional record status' });
  }
};
