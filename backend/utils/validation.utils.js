/**
 * Validation utilities for DBIS
 * Provides common validation functions
 */

/**
 * Validate government ID format
 * @param {String} governmentId - Government ID to validate
 * @returns {Boolean} True if valid
 */
const isValidGovernmentId = (governmentId) => {
  // This is a simplified implementation
  // In a real system, you would implement country-specific validation rules
  
  if (!governmentId || typeof governmentId !== 'string') {
    return false;
  }
  
  // Basic format validation: alphanumeric with optional hyphens, 5-20 chars
  return /^[A-Za-z0-9-]{5,20}$/.test(governmentId);
};

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @returns {Boolean} True if valid
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Basic email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validate phone number format
 * @param {String} phone - Phone number to validate
 * @returns {Boolean} True if valid
 */
const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Basic phone validation: digits, optional +, -, and spaces
  return /^[+]?[\s0-9-]{7,15}$/.test(phone);
};

/**
 * Validate Ethereum wallet address
 * @param {String} address - Wallet address to validate
 * @returns {Boolean} True if valid
 */
const isValidEthereumAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  // Ethereum address validation: 0x followed by 40 hex characters
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Validate password strength
 * @param {String} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for at least one digit
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one digit' };
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }
  
  return { isValid: true, message: 'Password is strong' };
};

/**
 * Validate facemesh data structure
 * @param {Object} facemeshData - Facemesh data to validate
 * @returns {Boolean} True if valid
 */
const isValidFacemeshData = (facemeshData) => {
  if (!facemeshData || typeof facemeshData !== 'object') {
    return false;
  }
  
  // Check for required properties (this would depend on your facemesh format)
  if (!facemeshData.landmarks || !Array.isArray(facemeshData.landmarks)) {
    return false;
  }
  
  // Check if landmarks array has data
  if (facemeshData.landmarks.length === 0) {
    return false;
  }
  
  // Check if landmarks have the expected structure
  for (const landmark of facemeshData.landmarks) {
    if (typeof landmark !== 'object' || 
        landmark.x === undefined || 
        landmark.y === undefined || 
        landmark.z === undefined) {
      return false;
    }
  }
  
  return true;
};

/**
 * Sanitize user input to prevent XSS
 * @param {String} input - Input to sanitize
 * @returns {String} Sanitized input
 */
const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Replace HTML special chars with entities
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

module.exports = {
  isValidGovernmentId,
  isValidEmail,
  isValidPhone,
  isValidEthereumAddress,
  validatePasswordStrength,
  isValidFacemeshData,
  sanitizeInput
};
