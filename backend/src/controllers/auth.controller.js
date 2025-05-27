/**
 * Authentication controller for DBIS
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, fullName, dateOfBirth, phoneNumber } = req.body;
    const db = req.app.locals.db;

    // Check if email already exists
    const emailCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Check if username already exists
    const usernameCheck = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const result = await db.query(
      'INSERT INTO users (username, email, password_hash, full_name, date_of_birth, phone_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, full_name, created_at',
      [username, email, hashedPassword, fullName, dateOfBirth, phoneNumber]
    );

    // Assign user role
    await db.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, (SELECT id FROM roles WHERE name = $2))',
      [result.rows[0].id, 'user']
    );

    // Create JWT token
    const token = jwt.sign(
      { id: result.rows[0].id, username: result.rows[0].username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create refresh token
    const refreshToken = uuidv4();
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30); // 30 days

    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [result.rows[0].id, refreshToken, refreshTokenExpiry]
    );

    // Log the registration
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        result.rows[0].id,
        'REGISTER',
        'users',
        result.rows[0].id,
        JSON.stringify({ method: 'email' }),
        req.ip
      ]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        fullName: result.rows[0].full_name,
        createdAt: result.rows[0].created_at
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * Login a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const db = req.app.locals.db;

    // Find user by email
    const result = await db.query(
      'SELECT u.id, u.username, u.email, u.password_hash, u.full_name, u.wallet_address, ' +
      'array_agg(r.name) as roles ' +
      'FROM users u ' +
      'LEFT JOIN user_roles ur ON u.id = ur.user_id ' +
      'LEFT JOIN roles r ON ur.role_id = r.id ' +
      'WHERE u.email = $1 ' +
      'GROUP BY u.id',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        roles: user.roles 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create refresh token
    const refreshToken = uuidv4();
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30); // 30 days

    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, refreshTokenExpiry]
    );

    // Log the login
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        user.id,
        'LOGIN',
        'users',
        user.id,
        JSON.stringify({ method: 'email' }),
        req.ip,
        req.headers['user-agent']
      ]
    );

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        walletAddress: user.wallet_address,
        roles: user.roles
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * Refresh JWT token using refresh token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const db = req.app.locals.db;

    // Find refresh token in database
    const tokenResult = await db.query(
      'SELECT rt.*, u.username, array_agg(r.name) as roles ' +
      'FROM refresh_tokens rt ' +
      'JOIN users u ON rt.user_id = u.id ' +
      'LEFT JOIN user_roles ur ON u.id = ur.user_id ' +
      'LEFT JOIN roles r ON ur.role_id = r.id ' +
      'WHERE rt.token = $1 AND rt.revoked = false AND rt.expires_at > NOW() ' +
      'GROUP BY rt.id, u.username',
      [refreshToken]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const tokenData = tokenResult.rows[0];

    // Create new JWT token
    const newToken = jwt.sign(
      { 
        id: tokenData.user_id, 
        username: tokenData.username,
        roles: tokenData.roles 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Token refreshed successfully',
      token: newToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Server error during token refresh' });
  }
};

/**
 * Logout a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const db = req.app.locals.db;

    // Revoke refresh token
    await db.query(
      'UPDATE refresh_tokens SET revoked = true, revoked_at = NOW() WHERE token = $1',
      [refreshToken]
    );

    // Log the logout
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        req.user.id,
        'LOGOUT',
        'users',
        req.user.id,
        JSON.stringify({}),
        req.ip
      ]
    );

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
};

/**
 * Connect wallet address to user account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.connectWallet = async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;
    
    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ message: 'Wallet address, signature, and message are required' });
    }

    // TODO: Verify signature using ethers.js
    // This would verify that the user actually owns the wallet
    // const signerAddress = ethers.utils.verifyMessage(message, signature);
    // if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
    //   return res.status(401).json({ message: 'Invalid signature' });
    // }

    const db = req.app.locals.db;

    // Check if wallet is already connected to another account
    const walletCheck = await db.query('SELECT id FROM users WHERE wallet_address = $1', [walletAddress]);
    if (walletCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Wallet address already connected to another account' });
    }

    // Get user ID from token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Update user with wallet address
    await db.query(
      'UPDATE users SET wallet_address = $1, updated_at = NOW() WHERE id = $2',
      [walletAddress, userId]
    );

    // Log the wallet connection
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        userId,
        'WALLET_CONNECT',
        'users',
        userId,
        JSON.stringify({ walletAddress }),
        req.ip
      ]
    );

    res.status(200).json({ message: 'Wallet connected successfully', walletAddress });
  } catch (error) {
    console.error('Wallet connection error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Server error during wallet connection' });
  }
};

/**
 * Verify email address
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.verifyEmail = async (req, res) => {
  // This would be implemented with email verification logic
  res.status(501).json({ message: 'Email verification not implemented yet' });
};

/**
 * Request password reset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.forgotPassword = async (req, res) => {
  // This would be implemented with password reset request logic
  res.status(501).json({ message: 'Password reset not implemented yet' });
};

/**
 * Reset password with token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.resetPassword = async (req, res) => {
  // This would be implemented with password reset logic
  res.status(501).json({ message: 'Password reset not implemented yet' });
};
