/**
 * Authentication middleware for DBIS
 */
const jwt = require('jsonwebtoken');

/**
 * Verify JWT token middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Authentication token is required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * Check if user has required role
 * @param {String|Array} roles - Required role(s)
 * @returns {Function} Middleware function
 */
exports.hasRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userRoles = req.user.roles || [];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    
    next();
  };
};

/**
 * Check if user is accessing their own resource or has admin role
 * @param {Function} getUserIdFromRequest - Function to extract user ID from request
 * @returns {Function} Middleware function
 */
exports.isResourceOwnerOrAdmin = (getUserIdFromRequest) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const resourceUserId = getUserIdFromRequest(req);
    const isAdmin = (req.user.roles || []).includes('admin');
    const isGovernment = (req.user.roles || []).includes('government');
    
    if (req.user.id === resourceUserId || isAdmin || isGovernment) {
      next();
    } else {
      return res.status(403).json({ message: 'Access denied: you can only access your own resources' });
    }
  };
};
