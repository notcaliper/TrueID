/**
 * Authentication routes for DBIS
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');

// Validation rules
const registerValidation = [
  body('username').isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
  body('email').isEmail().withMessage('Must be a valid email address'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('fullName').isLength({ min: 2 }).withMessage('Full name is required')
];

const loginValidation = [
  body('email').isEmail().withMessage('Must be a valid email address'),
  body('password').exists().withMessage('Password is required')
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authMiddleware.verifyToken, authController.logout);
router.post('/wallet-connect', authController.connectWallet);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;
