/**
 * Logging utilities for DBIS
 * Handles application logging using Winston
 */
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'dbis-backend' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error' 
    }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log') 
    })
  ]
});

// If we're not in production, also log to the console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

/**
 * Log an API request
 * @param {Object} req - Express request object
 * @param {String} message - Log message
 */
const logRequest = (req, message) => {
  logger.info(message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    adminId: req.admin?.id
  });
};

/**
 * Log an API response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {String} message - Log message
 */
const logResponse = (req, res, message) => {
  logger.info(message, {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: res.responseTime,
    userId: req.user?.id,
    adminId: req.admin?.id
  });
};

/**
 * Log an error
 * @param {Object} req - Express request object
 * @param {Error} error - Error object
 * @param {String} message - Log message
 */
const logError = (req, error, message) => {
  logger.error(message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    adminId: req.admin?.id,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  });
};

/**
 * Log an audit event
 * @param {String} action - Action performed
 * @param {String} entityType - Type of entity affected
 * @param {String|Number} entityId - ID of entity affected
 * @param {Object} details - Additional details
 * @param {Object} user - User who performed the action
 */
const logAudit = (action, entityType, entityId, details, user) => {
  logger.info(`AUDIT: ${action}`, {
    action,
    entityType,
    entityId,
    details,
    user: {
      id: user?.id,
      type: user?.type,
      ip: user?.ip
    }
  });
};

module.exports = {
  logger,
  logRequest,
  logResponse,
  logError,
  logAudit
};
