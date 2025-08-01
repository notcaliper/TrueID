/**
 * Validation middleware for DBIS
 */
const { body, validationResult } = require('express-validator');

/**
 * Middleware to validate request data
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', JSON.stringify(errors.array()));
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }
  next();
};

/**
 * User registration validation rules
 */
exports.userRegistrationRules = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[A-Za-z0-9_]+$/)
    .withMessage('Username can only contain alphanumeric characters and underscores'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),

  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('governmentId')
    .trim()
    .isLength({ min: 5, max: 50 })
    .withMessage('Government ID must be between 5 and 50 characters')
    .matches(/^[A-Za-z0-9-]+$/)
    .withMessage('Government ID can only contain alphanumeric characters and hyphens'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Must provide a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Must provide a valid phone number'),
  
  body('facemeshData')
    .optional()
    .isObject()
    .withMessage('Facemesh data must be a valid JSON object'),
  
  body('walletAddress')
    .optional()
    .isEthereumAddress()
    .withMessage('Must provide a valid Ethereum address')
];

/**
 * User login validation rules
 */
exports.userLoginRules = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required')
];

/**
 * Admin login validation rules
 */
exports.adminLoginRules = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
];

/**
 * User verification validation rules
 */
exports.userVerificationRules = [
  body('verificationStatus')
    .isIn(['VERIFIED', 'REJECTED', 'PENDING'])
    .withMessage('Verification status must be VERIFIED, REJECTED, or PENDING'),
  
  body('verificationNotes')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Verification notes cannot exceed 1000 characters')
];

/**
 * Professional record validation rules
 */
exports.professionalRecordRules = [
  body('recordType')
    .isIn(['EDUCATION', 'EMPLOYMENT', 'CERTIFICATION'])
    .withMessage('Record type must be EDUCATION, EMPLOYMENT, or CERTIFICATION'),
  
  body('institution')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Institution name must be between 2 and 255 characters'),
  
  body('title')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Title must be between 2 and 255 characters'),
  
  body('description')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date in ISO format (YYYY-MM-DD)'),
  
  body('endDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('End date must be a valid date in ISO format (YYYY-MM-DD)'),
  
  body('isCurrent')
    .optional()
    .isBoolean()
    .withMessage('Is current must be a boolean value')
];

/**
 * Biometric verification validation rules
 */
exports.biometricVerificationRules = [
  body('userId')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  
  body('facemeshData')
    .isObject()
    .withMessage('Facemesh data must be a valid JSON object')
];
