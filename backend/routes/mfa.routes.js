/**
 * Multi-Factor Authentication routes for TrueID
 */
const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth.middleware');
const mfaController = require('../controllers/mfa.controller');

/**
 * @route POST /api/mfa/setup
 * @desc Initialize MFA setup (generate secret and QR code)
 * @access Private (User)
 */
router.post('/setup', authenticateUser, mfaController.setupMFA);

/**
 * @route POST /api/mfa/verify-setup
 * @desc Verify MFA setup with initial token
 * @access Private (User)
 */
router.post('/verify-setup', authenticateUser, mfaController.verifyMFASetup);

/**
 * @route POST /api/mfa/verify-login
 * @desc Verify MFA token during login (public - uses temp token)
 * @access Public
 */
router.post('/verify-login', mfaController.verifyMFALogin);

/**
 * @route POST /api/mfa/disable
 * @desc Disable MFA for user
 * @access Private (User)
 */
router.post('/disable', authenticateUser, mfaController.disableMFA);

/**
 * @route GET /api/mfa/status
 * @desc Get MFA status for current user
 * @access Private (User)
 */
router.get('/status', authenticateUser, mfaController.getMFAStatus);

/**
 * @route POST /api/mfa/regenerate-codes
 * @desc Regenerate recovery codes
 * @access Private (User)
 */
router.post('/regenerate-codes', authenticateUser, mfaController.regenerateRecoveryCodes);

module.exports = router;
