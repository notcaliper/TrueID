/**
 * Authentication routes for DBIS
 */
const express = require('express');
const router = express.Router();
const { userRegistrationRules, userLoginRules, adminLoginRules, validate } = require('../middleware/validation.middleware');
const authController = require('../controllers/auth.controller');

/**
 * @route POST /api/user/register
 * @desc Register a new user with username and password (biometric data optional for verification)
 * @access Public
 */
router.post('/register', userRegistrationRules, validate, authController.registerUser);

/**
 * @route POST /api/user/login
 * @desc Login a user with username and password
 * @access Public
 */
router.post('/login', userLoginRules, validate, authController.loginUser);

/**
 * @route POST /api/user/refresh-token
 * @desc Refresh user JWT token
 * @access Public
 */
router.post('/refresh-token', authController.refreshUserToken);

/**
 * @route POST /api/user/verify-biometric
 * @desc Verify user biometric data (for verification purposes only, not login)
 * @access Private
 */
router.post('/verify-biometric', authController.verifyUserBiometric);

module.exports = router;
