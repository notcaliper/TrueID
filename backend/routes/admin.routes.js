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
 * @route POST /api/admin/identify-biometric
 * @desc Match incoming biometric facemesh against registered citizen templates
 * @access Admin
 */
router.post('/identify-biometric', authenticateAdmin, adminController.identifyUserBiometric);

/**
 * @route POST /api/admin/users/batch-action
 * @desc Batch verify, reject, deactivate, or reactivate multiple users
 * @access Admin
 */
router.post('/users/batch-action', authenticateAdmin, adminController.batchUserAction);

/**
 * @route POST /api/admin/users/onboard
 * @desc Direct citizen onboarding by authority admin
 * @access Admin
 */
router.post('/users/onboard', authenticateAdmin, adminController.onboardUser);

/**
 * @route PUT /api/admin/users/:id/reset-mfa
 * @desc Reset MFA for user locked out of authenticator
 * @access Admin
 */
router.put('/users/:id/reset-mfa', authenticateAdmin, adminController.resetUserMfa);

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
 * @route GET /api/admin/logs/user/:id
 * @desc Get activity logs for a specific user
 * @access Admin
 */
router.get('/logs/user/:id', authenticateAdmin, adminController.getUserActivityLogs);

/**
 * @route POST /api/admin/create
 * @desc Create a new admin (Super Admin only)
 * @access Super Admin
 */
router.post('/create', authenticateAdmin, requireSuperAdmin, adminController.createAdmin);

/**
 * @route GET /api/admin/dashboard
 * @desc Get dashboard statistics
 * @access Admin
 */
router.get('/dashboard', authenticateAdmin, adminController.getDashboardStats);

/**
 * @route GET /api/admin/dashboard/stats
 * @desc Get detailed dashboard statistics
 * @access Admin
 */
router.get('/dashboard/stats', authenticateAdmin, adminController.getDetailedDashboardStats);

/**
 * @route GET /api/admin/profile
 * @desc Get admin profile
 * @access Admin
 */
router.get('/profile', authenticateAdmin, adminController.getAdminProfile);

/**
 * @route PUT /api/admin/profile
 * @desc Update admin profile
 * @access Admin
 */
router.put('/profile', authenticateAdmin, adminController.updateAdminProfile);

/**
 * @route PUT /api/admin/change-password
 * @desc Change admin password
 * @access Admin
 */
router.put('/change-password', authenticateAdmin, adminController.changeAdminPassword);

/**
 * @route PUT /api/admin/users/:id/deactivate
 * @desc Deactivate a user
 * @access Admin
 */
router.put('/users/:id/deactivate', authenticateAdmin, adminController.deactivateUser);

/**
 * @route PUT /api/admin/users/:id/reactivate
 * @desc Reactivate a user
 * @access Admin
 */
router.put('/users/:id/reactivate', authenticateAdmin, adminController.reactivateUser);

/**
 * @route POST /api/admin/blockchain/check-expiry
 * @desc Check blockchain expiry status for all pending users
 * @access Admin
 */
router.post('/blockchain/check-expiry', authenticateAdmin, adminController.checkBlockchainExpiry);

/**
 * @route GET /api/admin/professional-records
 * @desc Get all professional records
 * @access Admin
 */
router.get('/professional-records', authenticateAdmin, adminController.getAllProfessionalRecords);

/**
 * @route GET /api/admin/professional-records/:id
 * @desc Get professional record by ID
 * @access Admin
 */
router.get('/professional-records/:id', authenticateAdmin, adminController.getProfessionalRecordById);

/**
 * @route PUT /api/admin/professional-records/:id/status
 * @desc Update professional record status
 * @access Admin
 */
router.put('/professional-records/:id/status', authenticateAdmin, adminController.updateProfessionalRecordStatus);

/**
 * @route GET /api/admin/users/:id/professional-records
 * @desc Get professional records for a specific user
 * @access Admin
 */
router.get('/users/:id/professional-records', authenticateAdmin, adminController.getUserProfessionalRecords);

module.exports = router;
