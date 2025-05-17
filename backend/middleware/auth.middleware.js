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
  // Allow health checks to bypass authentication
  if (req.path === '/health' || req.path === '/api/health' || req.query.healthCheck === 'true' || req.headers['x-health-check'] === 'true') {
    return res.status(200).json({
      status: 'ok',
      message: 'Health check successful',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No token provided for path:', req.path);
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required. No token provided.' 
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token received:', token.substring(0, 15) + '...');
    
    // Verify token
    const JWT_SECRET = process.env.JWT_SECRET;
    console.log('Using JWT secret:', JWT_SECRET ? JWT_SECRET.substring(0, 3) + '...' : 'undefined');
    
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decoded successfully:', decoded.username);
    
    // Check if token is for an admin
    if (decoded.type !== 'admin') {
      console.log('Invalid token type:', decoded.type);
      return res.status(403).json({ 
        success: false,
        message: 'Invalid token type for this resource.' 
      });
    }
    
    // Add admin info to request
    req.admin = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };
    
    // Check if token is about to expire and add refresh flag
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp - currentTime < 3600) { // Less than 1 hour remaining
      req.tokenNearExpiry = true;
    }
    
    console.log('Authentication successful for admin:', decoded.username);
    next();
  } catch (error) {
    console.error('Authentication error details:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired. Please login again.',
        error: 'token_expired'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token. Please login again.',
        error: 'invalid_token'
      });
    }
    
    if (req.app.locals.logger) {
      req.app.locals.logger.error('Authentication error:', error);
    } else {
      console.error('Logger not available, authentication error:', error);
    }
    
    return res.status(500).json({ 
      success: false,
      message: 'Authentication error.',
      error: error.message
    });
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
