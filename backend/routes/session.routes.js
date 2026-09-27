/**
 * Session Management Routes
 */
const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth.middleware');
const sessionController = require('../controllers/session.controller');

/**
 * @route GET /api/sessions
 * @desc Get all active sessions for current user
 * @access Private (User)
 */
router.get('/', authenticateUser, sessionController.getSessions);

/**
 * @route DELETE /api/sessions/:sessionId
 * @desc Revoke a specific session
 * @access Private (User)
 */
router.delete('/:sessionId', authenticateUser, sessionController.revokeSession);

/**
 * @route DELETE /api/sessions
 * @desc Revoke all other sessions except current
 * @access Private (User)
 */
router.delete('/', authenticateUser, sessionController.revokeOtherSessions);

/**
 * @route GET /api/sessions/settings
 * @desc Get user security settings
 * @access Private (User)
 */
router.get('/settings', authenticateUser, sessionController.getSecuritySettings);

/**
 * @route PUT /api/sessions/settings
 * @desc Update user security settings
 * @access Private (User)
 */
router.put('/settings', authenticateUser, sessionController.updateSecuritySettings);

module.exports = router;
