/**
 * Identity management routes for DBIS
 */
const express = require('express');
const router = express.Router();
const identityController = require('../controllers/identity.controller');
const authMiddleware = require('../middleware/auth.middleware');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// All routes require authentication
router.use(authMiddleware.verifyToken);

// Biometric routes
router.post('/register-biometric', upload.single('facemeshData'), identityController.registerBiometric);
router.post('/authenticate-biometric', upload.single('facemeshData'), identityController.authenticateBiometric);
router.put('/update-biometric', upload.single('facemeshData'), identityController.updateBiometric);

// Professional identity routes
router.post('/professional-record', identityController.addProfessionalRecord);
router.get('/professional-records', identityController.getProfessionalRecords);
router.get('/professional-record/:recordId', identityController.getProfessionalRecord);
router.put('/professional-record/:recordId', identityController.updateProfessionalRecord);
router.delete('/professional-record/:recordId', identityController.deleteProfessionalRecord);

// Verification request routes
router.post('/request-verification/:recordId', identityController.requestVerification);
router.get('/verification-requests', identityController.getVerificationRequests);

// Government official routes (requires government role)
router.use('/government', authMiddleware.hasRole('government'));
router.get('/government/verification-requests', identityController.getGovernmentVerificationRequests);
router.post('/government/verify/:requestId', identityController.verifyIdentity);
router.post('/government/reject/:requestId', identityController.rejectVerification);

// Blockchain integration routes
router.post('/register-on-blockchain', identityController.registerOnBlockchain);
router.get('/blockchain-status', identityController.getBlockchainStatus);

module.exports = router;
