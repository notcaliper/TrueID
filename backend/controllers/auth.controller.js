/**
 * Authentication controller for DBIS
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const walletService = require('../services/wallet.service');

const { generateFacemeshHash, calculateFacemeshSimilarity, isFacemeshSimilar } = require('../utils/biometric.utils');

/**
 * Verify user biometric data (used for verification, not login)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.verifyUserBiometric = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;

  let tokenUserId = req.user?.id;
  if (!tokenUserId && req.headers.authorization?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
      tokenUserId = decoded.id;
    } catch (_) {}
  }

  const userId = req.body.userId || tokenUserId;
  const facemeshData = req.body.facemeshData || req.body;

  if (!userId || !facemeshData || (!facemeshData.landmarks && !facemeshData.imageData && !facemeshData.biometricHash)) {
    return res.status(400).json({ success: false, verified: false, message: 'User ID and biometric facemesh data are required' });
  }

  try {
    // Check biometric data for user
    const biometricResult = await db.query(
      `SELECT id, facemesh_hash, facemesh_data
       FROM biometric_data
       WHERE user_id = $1 AND is_active = true
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (biometricResult.rows.length === 0) {
      return res.status(404).json({ message: 'No active biometric data found for this user' });
    }

    const storedRow = biometricResult.rows[0];
    const storedHash = storedRow.facemesh_hash;
    const storedData = storedRow.facemesh_data;

    const incomingHash = generateFacemeshHash(facemeshData);
    let isMatch = (storedHash === incomingHash);
    let similarityScore = isMatch ? 1.0 : 0.0;

    if (!isMatch && storedData) {
      similarityScore = calculateFacemeshSimilarity(facemeshData, storedData);
      isMatch = similarityScore >= 0.70;
    }

    // Update biometric verification timestamp and status if matched
    if (isMatch) {
      await db.query(
        `UPDATE biometric_data 
         SET verification_status = 'VERIFIED', 
             verification_score = $1, 
             last_verified_at = NOW(), 
             updated_at = NOW() 
         WHERE id = $2`,
        [similarityScore * 100, storedRow.id]
      );

      // Record in biometric_verifications table
      try {
        await db.query(
          `INSERT INTO biometric_verifications (user_id, biometric_data_id, success, verification_score, liveness_detected, attempt_metadata, created_at)
           VALUES ($1, $2, true, $3, true, $4, NOW())`,
          [userId, storedRow.id, similarityScore * 100, JSON.stringify({ ip_address: req.ip, verification_method: 'FACEMESH_LIVENESS' })]
        );
      } catch (err) {
        logger.warn('Failed to insert into biometric_verifications:', err.message);
      }
    }

    // Log verification attempt
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        isMatch ? 'BIOMETRIC_VERIFICATION_SUCCESS' : 'BIOMETRIC_VERIFICATION_FAILED',
        'users',
        userId,
        JSON.stringify({ verified: isMatch, similarityScore }),
        req.ip
      ]
    );

    return res.status(200).json({
      success: isMatch,
      verified: isMatch,
      similarityScore: Math.round(similarityScore * 100) / 100,
      facemeshHash: storedHash,
      facemesh_hash: storedHash,
      hasBiometrics: true,
      has_biometrics: true,
      message: isMatch ? 'Biometric verification successful' : 'Biometric verification failed: facial feature mismatch'
    });
  } catch (error) {
    logger.error('Biometric verification error:', error);
    res.status(500).json({ success: false, verified: false, message: 'Server error during biometric verification' });
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
  const { username, password, governmentId, email, phone, facemeshData, walletAddress } = req.body;
  const name = (req.body.name || `${req.body.firstName || ''} ${req.body.lastName || ''}`).trim();
  
  // If username is not provided, generate one based on name or a cryptographic identifier
  const userUsername = username || 
    (name ? `user_${name.toLowerCase().replace(/[^a-z0-9]/g, '')}${crypto.randomInt(1000, 9999)}` : 
    `user${crypto.randomInt(10000, 99999)}`);
  
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
    
    // Generate a new Ethereum wallet if one wasn't provided
    let userWalletAddress = walletAddress;
    let avaxPrivateKey = null;
    
    if (!userWalletAddress) {
      try {
        logger.info('Generating new Ethereum wallet for user registration');
        const wallet = walletService.generateWallet();
        userWalletAddress = wallet.address;
        avaxPrivateKey = wallet.privateKey;
      } catch (err) {
        logger.error('Error generating wallet:', err);
        await db.query('ROLLBACK');
        return res.status(500).json({ message: 'Error generating wallet' });
      }
    }
    
    const userDid = userWalletAddress ? `did:trueid:${userWalletAddress}` : null;

    // Insert user
    const userResult = await db.query(
      `INSERT INTO users (
        username,
        password,
        name,
        government_id,
        email,
        phone,
        wallet_address,
        avax_address,
        avax_private_key,
        did,
        blockchain_network,
        is_verified,
        verification_status,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'sepolia', $11, $12, NOW(), NOW())
      RETURNING id, username, name, government_id, email, phone, wallet_address, avax_address, did, is_verified, verification_status`,
      [
        userUsername,
        hashedPassword,
        name,
        governmentId,
        email,
        phone,
        userWalletAddress, // wallet_address
        userWalletAddress, // legacy avax_address
        avaxPrivateKey,
        userDid,
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
          facemesh_data,
          is_active,
          created_at
        ) VALUES ($1, $2, $3, $4, NOW())`,
        [user.id, facemeshHash, JSON.stringify(facemeshData), true]
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
    
    const regWallet = user.wallet_address || '';
    const regDid = user.did || (regWallet ? `did:trueid:${regWallet}` : '');

    // Return success response
    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        government_id: user.government_id,
        governmentId: user.government_id,
        email: user.email,
        phone: user.phone,
        wallet_address: regWallet,
        walletAddress: regWallet,
        did: regDid,
        is_verified: user.is_verified,
        isVerified: user.is_verified,
        verification_status: user.verification_status,
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
    // Get user by username (including MFA fields, blockchain token, and biometric status)
    const userResult = await db.query(
      `SELECT u.id, u.username, u.password, u.government_id, u.name, u.email, u.phone, u.wallet_address, u.did,
              u.is_verified, u.verification_status, u.mfa_enabled, u.mfa_secret, u.soulbound_token_id, u.blockchain_tx_hash,
              b.facemesh_hash, b.last_verified_at as biometric_verified_at
       FROM users u
       LEFT JOIN LATERAL (
         SELECT facemesh_hash, last_verified_at
         FROM biometric_data
         WHERE user_id = u.id AND is_active = true
         ORDER BY created_at DESC
         LIMIT 1
       ) b ON true
       WHERE u.username = $1 OR u.email = $1`,
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

    // Check if MFA is enabled
    if (user.mfa_enabled) {
      // Generate temporary token for MFA verification
      const crypto = require('crypto');
      const tempToken = crypto.randomBytes(32).toString('hex');
      
      // Clean up old MFA sessions for this user
      await db.query(
        'DELETE FROM mfa_sessions WHERE user_id = $1 AND (expires_at < NOW() OR used_at IS NOT NULL)',
        [user.id]
      );
      
      // Create MFA session (expires in 5 minutes)
      await db.query(
        `INSERT INTO mfa_sessions (user_id, temp_token, expires_at, ip_address, user_agent, max_attempts)
         VALUES ($1, $2, NOW() + INTERVAL '5 minutes', $3, $4, 3)`,
        [user.id, tempToken, req.ip, req.headers['user-agent']]
      );

      // Log MFA pending
      await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          user.id,
          'MFA_PENDING',
          'users',
          user.id,
          JSON.stringify({ method: 'password' }),
          req.ip
        ]
      );

      // Return temp token - frontend will redirect to MFA verification
      return res.status(200).json({
        mfaRequired: true,
        tempToken: tempToken,
        message: 'MFA verification required'
      });
    }

    // Generate token (no MFA)
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
    const userWallet = user.wallet_address || '';
    let userDid = user.did;
    if (!userDid && userWallet) {
      userDid = `did:trueid:${userWallet}`;
      await db.query('UPDATE users SET did = $1 WHERE id = $2', [userDid, user.id]).catch(() => {});
    }
    
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        government_id: user.government_id,
        governmentId: user.government_id,
        email: user.email,
        phone: user.phone,
        wallet_address: userWallet,
        walletAddress: userWallet,
        did: userDid,
        is_verified: user.is_verified,
        isVerified: user.is_verified,
        verification_status: user.verification_status,
        verificationStatus: user.verification_status,
        soulbound_token_id: user.soulbound_token_id || '',
        soulboundTokenId: user.soulbound_token_id || '',
        blockchain_tx_hash: user.blockchain_tx_hash || '',
        facemesh_hash: user.facemesh_hash || '',
        facemeshHash: user.facemesh_hash || '',
        has_biometrics: Boolean(user.facemesh_hash),
        hasBiometrics: Boolean(user.facemesh_hash),
        biometric_verified_at: user.biometric_verified_at || null,
        biometricVerifiedAt: user.biometric_verified_at || null
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
      `SELECT id, username, name, government_id, email, phone, wallet_address, did, 
              is_verified, verification_status 
       FROM users WHERE id = $1`,
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];
    const refreshWallet = user.wallet_address || '';
    const refreshDid = user.did || (refreshWallet ? `did:trueid:${refreshWallet}` : '');

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
      tokens,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        government_id: user.government_id,
        governmentId: user.government_id,
        email: user.email,
        phone: user.phone,
        wallet_address: refreshWallet,
        walletAddress: refreshWallet,
        did: refreshDid,
        is_verified: user.is_verified,
        isVerified: user.is_verified,
        verification_status: user.verification_status,
        verificationStatus: user.verification_status
      }
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
