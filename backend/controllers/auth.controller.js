/**
 * Authentication controller for DBIS
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const walletService = require('../services/wallet.service');

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
 * Verify user biometric data (used for verification, not login)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.verifyUserBiometric = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { userId, facemeshData } = req.body;

  if (!userId || !facemeshData) {
    return res.status(400).json({ message: 'User ID and facemesh data are required' });
  }

  try {
    // Generate facemesh hash
    const facemeshHash = generateFacemeshHash(facemeshData);

    // Check biometric data
    const biometricResult = await db.query(
      `SELECT id, facemesh_hash
       FROM biometric_data
       WHERE user_id = $1 AND is_active = true`,
      [userId]
    );

    if (biometricResult.rows.length === 0) {
      return res.status(404).json({ message: 'No active biometric data found for this user' });
    }

    // Verify facemesh hash
    const storedHash = biometricResult.rows[0].facemesh_hash;
    const isMatch = storedHash === facemeshHash;

    // Log verification attempt
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        isMatch ? 'BIOMETRIC_VERIFICATION_SUCCESS' : 'BIOMETRIC_VERIFICATION_FAILED',
        'users',
        userId,
        JSON.stringify({ verified: isMatch }),
        req.ip
      ]
    );

    return res.status(200).json({
      verified: isMatch,
      message: isMatch ? 'Biometric verification successful' : 'Biometric verification failed'
    });
  } catch (error) {
    logger.error('Biometric verification error:', error);
    res.status(500).json({ message: 'Server error during biometric verification' });
  }
};

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {Object} Token object with access and refresh tokens
 */
const generateUserToken = (user) => {
  const payload = {
    id: user.id,
    governmentId: user.government_id,
    type: 'user'
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
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.registerUser = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { username, password, name, governmentId, email, phone, facemeshData, avaxAddress } = req.body;
  
  // If username is not provided, generate one based on name or a random identifier
  const userUsername = username || 
    (name ? `user_${name.toLowerCase().replace(/[^a-z0-9]/g, '')}${Math.floor(Math.random() * 10000)}` : 
    `user${Math.floor(Math.random() * 100000)}`);
  
  // Password is now required
  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }
  
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    // Start transaction
    await db.query('BEGIN');
    
    // Check if username already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [userUsername]
    );
    
    if (existingUser.rows.length > 0) {
      await db.query('ROLLBACK');
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Check if government ID already exists
    if (governmentId) {
      const existingGovId = await db.query(
        'SELECT id FROM users WHERE government_id = $1',
        [governmentId]
      );
      
      if (existingGovId.rows.length > 0) {
        await db.query('ROLLBACK');
        return res.status(400).json({ message: 'Government ID already registered' });
      }
    }
    
    // Generate a new Avalanche wallet if one wasn't provided
    let userWalletAddress = avaxAddress; // Use avaxAddress from request body
    let avaxPrivateKey = null;
    
    if (!userWalletAddress) {
      try {
        logger.info('Generating new Avalanche wallet for user registration');
        const wallet = walletService.generateWallet();
        userWalletAddress = wallet.address;
        avaxPrivateKey = wallet.privateKey;
      } catch (err) {
        logger.error('Error generating wallet:', err);
        await db.query('ROLLBACK');
        return res.status(500).json({ message: 'Error generating wallet' });
      }
    }
    
    // Insert user
    const userResult = await db.query(
      `INSERT INTO users (
        username,
        password,
        name,
        government_id,
        email,
        phone,
        avax_address,
        avax_private_key,
        is_verified,
        verification_status,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING id, username, name, government_id, email, phone, avax_address, is_verified, verification_status`,
      [
        userUsername,
        hashedPassword,
        name,
        governmentId,
        email,
        phone,
        userWalletAddress, // Wallet address
        avaxPrivateKey, // Avalanche private key
        false, // is_verified
        'PENDING' // verification_status
      ]
    );
    
    const user = userResult.rows[0];
    
    // If facemesh data was provided, store it
    if (facemeshData) {
      const facemeshHash = generateFacemeshHash(facemeshData);
      
      await db.query(
        `INSERT INTO biometric_data (
          user_id,
          facemesh_hash,
          is_active,
          created_at
        ) VALUES ($1, $2, $3, NOW())`,
        [user.id, facemeshHash, true]
      );
    }
    
    // Generate tokens
    const tokens = generateUserToken(user);
    
    // Store session
    await db.query(
      `INSERT INTO user_sessions (
        user_id,
        token,
        refresh_token,
        ip_address,
        user_agent,
        expires_at
      ) VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '24 hours')`,
      [user.id, tokens.accessToken, tokens.refreshToken, req.ip, req.headers['user-agent']]
    );
    
    // Log registration
    await db.query(
      `INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        user.id,
        'USER_REGISTERED',
        'users',
        user.id,
        JSON.stringify({
          method: 'password',
          hasBiometric: !!facemeshData,
          hasWallet: true
        }),
        req.ip
      ]
    );
    
    // Commit transaction
    await db.query('COMMIT');
    
    // Return success response
    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        governmentId: user.government_id,
        email: user.email,
        phone: user.phone,
        walletAddress: user.avax_address,
        isVerified: user.is_verified,
        verificationStatus: user.verification_status
      },
      tokens
    });
  } catch (error) {
    // Rollback transaction on error
    await db.query('ROLLBACK');
    
    logger.error('User registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * Login a user with username and password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.loginUser = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Get user by username
    const userResult = await db.query(
      `SELECT u.id, u.username, u.password, u.government_id, u.name, u.email, u.phone, u.avax_address, 
              u.is_verified, u.verification_status
       FROM users u
       WHERE u.username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      // Log failed login attempt
      await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          user.id,
          'LOGIN_FAILED',
          'users',
          user.id,
          JSON.stringify({ reason: 'Invalid password' }),
          req.ip
        ]
      );
      
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const tokens = generateUserToken(user);

    // Store session
    await db.query(
      `INSERT INTO user_sessions (user_id, token, refresh_token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '24 hours')`,
      [user.id, tokens.accessToken, tokens.refreshToken, req.ip, req.headers['user-agent']]
    );

    // Log successful login
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        user.id,
        'LOGIN_SUCCESS',
        'users',
        user.id,
        JSON.stringify({ method: 'password' }),
        req.ip
      ]
    );

    // Return user data and token
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        governmentId: user.government_id,
        email: user.email,
        phone: user.phone,
        isVerified: user.is_verified,
        verificationStatus: user.verification_status
      },
      tokens
    });
  } catch (error) {
    logger.error('User login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * Refresh user JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.refreshUserToken = async (req, res) => {
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

    if (decoded.type !== 'user') {
      return res.status(403).json({ message: 'Invalid token type' });
    }

    // Check if refresh token exists in database
    const sessionResult = await db.query(
      'SELECT user_id FROM user_sessions WHERE refresh_token = $1',
      [refreshToken]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Get user
    const userResult = await db.query(
      'SELECT id, government_id, name FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Generate new tokens
    const tokens = generateUserToken(user);

    // Update session
    await db.query(
      `UPDATE user_sessions 
       SET token = $1, refresh_token = $2, expires_at = NOW() + INTERVAL '24 hours'
       WHERE refresh_token = $3`,
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
