/**
 * GDPR Routes - Data Export and Account Deletion
 */
const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth.middleware');
const { exportLimiter, sensitiveLimiter } = require('../middleware/rateLimit.middleware');
const gdprController = require('../controllers/gdpr.controller');

/**
 * @route POST /api/gdpr/export
 * @desc Request data export (GDPR Right to Access)
 * @access Private (User)
 * @rateLimit EXPORT - 3 per day
 */
router.post('/export', authenticateUser, exportLimiter, gdprController.requestDataExport);

/**
 * @route GET /api/gdpr/export/history
 * @desc Get export request history
 * @access Private (User)
 */
router.get('/export/history', authenticateUser, gdprController.getExportHistory);

/**
 * @route GET /api/gdpr/export/:requestId/download
 * @desc Download exported data
 * @access Private (User)
 */
router.get('/export/:requestId/download', authenticateUser, gdprController.downloadExport);

/**
 * @route POST /api/gdpr/deletion
 * @desc Request account deletion (GDPR Right to be Forgotten)
 * @access Private (User)
 * @rateLimit SENSITIVE - 10 per hour
 */
router.post('/deletion', authenticateUser, sensitiveLimiter, gdprController.requestAccountDeletion);

/**
 * @route GET /api/gdpr/deletion/status
 * @desc Get account deletion request status
 * @access Private (User)
 */
router.get('/deletion/status', authenticateUser, gdprController.getDeletionStatus);

/**
 * @route DELETE /api/gdpr/deletion/:requestId
 * @desc Cancel account deletion request (within grace period)
 * @access Private (User)
 */
router.delete('/deletion/:requestId', authenticateUser, gdprController.cancelAccountDeletion);

module.exports = router;
