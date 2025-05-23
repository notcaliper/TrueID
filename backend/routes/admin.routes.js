/**
 * Admin routes for DBIS
 */
const express = require('express');
const router = express.Router();
const { adminLoginRules, userVerificationRules, validate } = require('../middleware/validation.middleware');
const { authenticateAdmin, requireSuperAdmin } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

/**
 * @route POST /api/admin/login
 * @desc Login an admin
 * @access Public
 */
router.post('/login', adminLoginRules, validate, adminController.loginAdmin);

/**
 * @route POST /api/admin/refresh-token
 * @desc Refresh admin JWT token
 * @access Public
 */
router.post('/refresh-token', adminController.refreshAdminToken);

/**
 * @route GET /api/admin/users
 * @desc Get all users
 * @access Admin
 */
router.get('/users', authenticateAdmin, adminController.getAllUsers);

/**
 * @route GET /api/admin/users/:id
 * @desc Get user by ID
 * @access Admin
 */
router.get('/users/:id', authenticateAdmin, adminController.getUserById);

/**
 * @route PUT /api/admin/users/:id/verify
 * @desc Verify or reject a user
 * @access Admin
 */
router.put('/users/:id/verify', authenticateAdmin, userVerificationRules, validate, adminController.verifyUser);

/**
 * @route PUT /api/admin/users/:id/update
 * @desc Update user information
 * @access Admin
 */
router.put('/users/:id/update', authenticateAdmin, adminController.updateUser);

/**
 * @route GET /api/admin/logs
 * @desc Get activity logs
 * @access Admin
 */
router.get('/logs', authenticateAdmin, adminController.getActivityLogs);

/**
 * @route POST /api/admin/create
 * @desc Create a new admin (Super Admin only)
 * @access Super Admin
 */
router.post('/create', authenticateAdmin, requireSuperAdmin, adminController.createAdmin);

module.exports = router;
