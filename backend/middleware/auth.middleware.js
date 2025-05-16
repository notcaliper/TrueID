/**
 * Authentication middleware for DBIS
 */
const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate user JWT tokens
 */
exports.authenticateUser = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is for a user (not admin)
    if (decoded.type !== 'user') {
      return res.status(403).json({ message: 'Invalid token type for this resource.' });
    }
    
    // Add user info to request
    req.user = {
      id: decoded.id,
      governmentId: decoded.governmentId
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token. Please login again.' });
    }
    
    req.app.locals.logger.error('Authentication error:', error);
    return res.status(500).json({ message: 'Authentication error.' });
  }
};

/**
 * Middleware to authenticate admin JWT tokens
 */
exports.authenticateAdmin = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is for an admin
    if (decoded.type !== 'admin') {
      return res.status(403).json({ message: 'Invalid token type for this resource.' });
    }
    
    // Add admin info to request
    req.admin = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token. Please login again.' });
    }
    
    req.app.locals.logger.error('Authentication error:', error);
    return res.status(500).json({ message: 'Authentication error.' });
  }
};

/**
 * Middleware to check if admin has super admin role
 */
exports.requireSuperAdmin = (req, res, next) => {
  if (!req.admin || req.admin.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Access denied. Super admin privileges required.' });
  }
  next();
};
