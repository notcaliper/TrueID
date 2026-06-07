/**
 * Rate Limiting Middleware
 * Implements per-user and per-IP rate limiting for API endpoints
 */

const dbService = require('../services/db.service');

// Rate limit configurations
const RATE_LIMIT_CONFIGS = {
  // Strict limits for auth endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per window
    message: 'Too many authentication attempts. Please try again later.'
  },
  // Standard API limits
  API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    message: 'Rate limit exceeded. Please slow down your requests.'
  },
  // Strict limits for sensitive operations
  SENSITIVE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 requests per hour
    message: 'Too many sensitive operations. Please try again later.'
  },
  // Export/Deletion limits (GDPR)
  EXPORT: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 3, // 3 exports per day
    message: 'Export limit reached. You can request up to 3 exports per day.'
  }
};

/**
 * Clean up old rate limit records
 */
const cleanupOldRecords = async () => {
  try {
    await dbService.query(
      `DELETE FROM rate_limits 
       WHERE window_start < NOW() - INTERVAL '24 hours'`
    );
  } catch (error) {
    console.error('Rate limit cleanup error:', error);
  }
};

// Run cleanup every hour
setInterval(cleanupOldRecords, 60 * 60 * 1000);

/**
 * Check and update rate limit
 * @param {string} identifier - User ID or IP address
 * @param {string} endpointType - Type of endpoint
 * @param {string} ip - IP address
 * @returns {Object} Rate limit status
 */
const checkRateLimit = async (identifier, endpointType, ip) => {
  const config = RATE_LIMIT_CONFIGS[endpointType] || RATE_LIMIT_CONFIGS.API;
  const windowStart = new Date(Date.now() - config.windowMs);

  try {
    // Get or create rate limit record
    const result = await dbService.query(
      `INSERT INTO rate_limits (user_id, endpoint, request_count, window_start, ip_address)
       VALUES ($1, $2, 1, NOW(), $3)
       ON CONFLICT (user_id, endpoint, window_start) 
       DO UPDATE SET 
         request_count = rate_limits.request_count + 1,
         ip_address = $3
       RETURNING request_count, window_start`,
      [identifier, endpointType, ip]
    );

    const record = result.rows[0];
    const isAllowed = record.request_count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - record.request_count);
    const resetTime = new Date(record.window_start).getTime() + config.windowMs;

    return {
      allowed: isAllowed,
      remaining,
      resetTime,
      total: config.maxRequests,
      message: isAllowed ? null : config.message
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Allow request on error (fail open)
    return { allowed: true, remaining: 1 };
  }
};

/**
 * Rate limiting middleware factory
 * @param {string} type - Rate limit type
 * @returns {Function} Express middleware
 */
const rateLimit = (type = 'API') => {
  return async (req, res, next) => {
    // Skip rate limiting for health checks
    if (req.path === '/api/health') {
      return next();
    }

    // Get identifier (user ID if authenticated, otherwise IP)
    let identifier;
    if (req.user && req.user.id) {
      identifier = `user:${req.user.id}`;
    } else if (req.headers.authorization) {
      // Try to get user from token
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        identifier = `user:${decoded.id}`;
      } catch {
        identifier = `ip:${req.ip}`;
      }
    } else {
      identifier = `ip:${req.ip}`;
    }

    const rateLimitStatus = await checkRateLimit(identifier, type, req.ip);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', rateLimitStatus.total);
    res.setHeader('X-RateLimit-Remaining', rateLimitStatus.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitStatus.resetTime / 1000));

    if (!rateLimitStatus.allowed) {
      // Log rate limit hit
      await dbService.query(
        `INSERT INTO suspicious_activities 
         (user_id, activity_type, ip_address, details, severity)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user?.id || null,
          'RATE_LIMIT_HIT',
          req.ip,
          JSON.stringify({ endpoint: req.path, type }),
          'LOW'
        ]
      ).catch(() => {}); // Silent fail for logging

      return res.status(429).json({
        error: 'Too Many Requests',
        message: rateLimitStatus.message,
        retryAfter: Math.ceil((rateLimitStatus.resetTime - Date.now()) / 1000)
      });
    }

    next();
  };
};

// Pre-configured rate limiters
module.exports = {
  // Auth endpoints (login, register, MFA)
  authLimiter: rateLimit('AUTH'),
  
  // General API endpoints
  apiLimiter: rateLimit('API'),
  
  // Sensitive operations (password change, MFA setup, etc.)
  sensitiveLimiter: rateLimit('SENSITIVE'),
  
  // GDPR export/ deletion
  exportLimiter: rateLimit('EXPORT'),
  
  // Custom rate limiter
  createLimiter: rateLimit
};
