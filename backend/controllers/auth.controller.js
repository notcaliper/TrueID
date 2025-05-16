/**
 * Authentication controller for DBIS
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

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
  const { name, governmentId, email, phone, facemeshData, walletAddress } = req.body;

  try {
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE government_id = $1',
      [governmentId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'User with this government ID already exists' });
    }

    // Generate facemesh hash
    const facemeshHash = generateFacemeshHash(facemeshData);

    // Check if facemesh hash already exists
    const existingBiometric = await db.query(
      'SELECT id FROM biometric_data WHERE facemesh_hash = $1',
      [facemeshHash]
    );

    if (existingBiometric.rows.length > 0) {
      return res.status(409).json({ message: 'Biometric data already registered to another user' });
    }

    // Start a transaction
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');

      // Insert user
      const userResult = await client.query(
        `INSERT INTO users (name, government_id, email, phone, wallet_address, verification_status)
         VALUES ($1, $2, $3, $4, $5, 'PENDING')
         RETURNING id, government_id, name, email, phone, wallet_address, verification_status, created_at`,
        [name, governmentId, email, phone, walletAddress]
      );

      const user = userResult.rows[0];

      // Insert biometric data
      await client.query(
        `INSERT INTO biometric_data (user_id, facemesh_hash, facemesh_data, is_active)
         VALUES ($1, $2, $3, true)`,
        [user.id, facemeshHash, JSON.stringify(facemeshData)]
      );

      // Log the registration
      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          user.id,
          'USER_REGISTRATION',
          'users',
          user.id,
          JSON.stringify({
            governmentId: user.government_id,
            hasBiometricData: true
          }),
          req.ip
        ]
      );

      await client.query('COMMIT');

      // Generate token
      const tokens = generateUserToken(user);

      // Store session
      await db.query(
        `INSERT INTO user_sessions (user_id, token, refresh_token, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '24 hours')`,
        [user.id, tokens.accessToken, tokens.refreshToken, req.ip, req.headers['user-agent']]
      );

      // Return user data and token
      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          name: user.name,
          governmentId: user.government_id,
          email: user.email,
          phone: user.phone,
          verificationStatus: user.verification_status,
          createdAt: user.created_at
        },
        tokens
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('User registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * Login a user with biometric data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.loginUser = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { governmentId, facemeshHash } = req.body;

  try {
    // Get user by government ID
    const userResult = await db.query(
      `SELECT u.id, u.government_id, u.name, u.email, u.phone, u.wallet_address, 
              u.is_verified, u.verification_status
       FROM users u
       WHERE u.government_id = $1`,
      [governmentId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Check biometric data
    const biometricResult = await db.query(
      `SELECT id, facemesh_hash
       FROM biometric_data
       WHERE user_id = $1 AND is_active = true`,
      [user.id]
    );

    if (biometricResult.rows.length === 0) {
      return res.status(401).json({ message: 'No active biometric data found' });
    }

    // Verify facemesh hash
    const storedHash = biometricResult.rows[0].facemesh_hash;
    
    if (storedHash !== facemeshHash) {
      // Log failed login attempt
      await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          user.id,
          'LOGIN_FAILED',
          'users',
          user.id,
          JSON.stringify({ reason: 'Biometric mismatch' }),
          req.ip
        ]
      );
      
      return res.status(401).json({ message: 'Biometric verification failed' });
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
        JSON.stringify({ method: 'biometric' }),
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
