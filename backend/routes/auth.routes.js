/**
 * Authentication routes for DBIS
 */
const express = require('express');
const router = express.Router();
const { userRegistrationRules, userLoginRules, adminLoginRules, validate } = require('../middleware/validation.middleware');
const authController = require('../controllers/auth.controller');

/**
 * @route POST /api/user/register
 * @desc Register a new user with biometric data
 * @access Public
 */
router.post('/register', userRegistrationRules, validate, authController.registerUser);

/**
 * @route POST /api/user/login
 * @desc Login a user with biometric data
 * @access Public
 */
router.post('/login', userLoginRules, validate, authController.loginUser);

/**
 * @route POST /api/user/refresh-token
 * @desc Refresh user JWT token
 * @access Public
 */
router.post('/refresh-token', authController.refreshUserToken);

module.exports = router;
