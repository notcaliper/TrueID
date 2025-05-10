/**
 * Government official routes for DBIS
 */
const express = require('express');
const router = express.Router();
const governmentController = require('../controllers/government.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All routes require authentication and government role
router.use(authMiddleware.verifyToken);
router.use(authMiddleware.hasRole('government'));

// User management routes
router.get('/users', governmentController.listUsers);
router.get('/users/:userId', governmentController.getUserDetails);

// Verification routes
router.get('/verification-requests', governmentController.listVerificationRequests);
router.post('/verify/:requestId', governmentController.approveVerification);
router.post('/reject/:requestId', governmentController.rejectVerification);

// Audit routes
router.get('/audit-logs', governmentController.getAuditLogs);

module.exports = router;
