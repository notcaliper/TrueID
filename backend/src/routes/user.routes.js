/**
 * User routes for DBIS
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { body } = require('express-validator');

// All routes require authentication
router.use(authMiddleware.verifyToken);

// Profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', [
  body('fullName').optional().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('phoneNumber').optional().isMobilePhone().withMessage('Invalid phone number'),
  body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format')
], userController.updateProfile);

// Verification status route
router.get('/users/verification-status', userController.getVerificationStatus);

// Password routes
router.put('/password', [
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], userController.changePassword);

module.exports = router;
