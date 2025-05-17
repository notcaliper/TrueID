/**
 * Blockchain integration routes for DBIS
 */
const express = require('express');
const router = express.Router();
const blockchainController = require('../controllers/blockchain.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware.verifyToken);

// Blockchain integration routes
router.post('/register-identity', blockchainController.registerIdentity);
router.get('/identity-status', blockchainController.getIdentityStatus);
router.post('/add-professional-record', blockchainController.addProfessionalRecord);
router.get('/professional-records', blockchainController.getProfessionalRecords);

// Push to blockchain endpoint - supports both HEAD and POST
router.head('/push/:recordId', (req, res) => {
  // Handle HEAD request (for preflight checks)
  res.status(200).json({
    success: true,
    message: 'Blockchain push endpoint is available'
  });
});
router.post('/push/:recordId', blockchainController.registerIdentity); // Reuse the registerIdentity function

// Admin routes
router.use('/admin', authMiddleware.hasRole('admin'));
router.post('/admin/grant-role', blockchainController.grantRole);
router.post('/admin/revoke-role', blockchainController.revokeRole);

module.exports = router;
