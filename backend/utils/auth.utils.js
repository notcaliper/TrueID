/**
 * Authentication utilities for DBIS
 * Handles JWT token generation and verification
 */
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

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
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @param {Boolean} isRefreshToken - Whether this is a refresh token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token, isRefreshToken = false) => {
  try {
    const secret = isRefreshToken 
      ? (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET)
      : process.env.JWT_SECRET;
    
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Extract token from Authorization header
 * @param {String} authHeader - Authorization header value
 * @returns {String|null} Extracted token or null if not found
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.split(' ')[1];
};

module.exports = {
  generateUserToken,
  generateAdminToken,
  verifyToken,
  extractTokenFromHeader
};
