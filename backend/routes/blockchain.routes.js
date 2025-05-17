/**
 * Blockchain routes for DBIS
 */
const express = require('express');
const router = express.Router();
const { authenticateUser, authenticateAdmin } = require('../middleware/auth.middleware');
const blockchainController = require('../controllers/blockchain.controller');

// Health check endpoint for blockchain service
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'DBIS Blockchain Service',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route POST /api/blockchain/push/:recordId
 * @desc Push record to blockchain
 * @access Admin
 */
router.head('/push/:recordId', (req, res) => {
  // Handle HEAD request (usually for preflight checks)
  res.status(200).json({
    success: true,
    message: 'Blockchain push endpoint is available'
  });
});

router.post('/push/:recordId', authenticateAdmin, blockchainController.recordIdentityOnBlockchain);

/**
 * @route GET /api/blockchain/fetch/:userId
 * @desc Fetch user identity from blockchain
 * @access Admin
 */
router.get('/fetch/:userId', authenticateAdmin, blockchainController.fetchIdentityFromBlockchain);

/**
 * @route GET /api/blockchain/status
 * @desc Get user's blockchain identity status
 * @access User
 */
router.get('/status', authenticateUser, blockchainController.getUserBlockchainStatus);

/**
 * @route POST /api/blockchain/professional-record
 * @desc Record professional record on blockchain
 * @access Admin
 */
router.post('/professional-record', authenticateAdmin, blockchainController.recordProfessionalRecord);

/**
 * @route GET /api/blockchain/verify/:hash
 * @desc Verify a document hash on the blockchain
 * @access Public
 */
router.get('/verify/:hash', blockchainController.verifyDocumentHash);

/**
 * @route GET /api/blockchain/transactions
 * @desc Get all blockchain transactions
 * @access Admin
 */
router.get('/transactions', authenticateAdmin, blockchainController.getAllTransactions);

/**
 * @route GET /api/blockchain/transaction/:txHash
 * @desc Get details of a specific blockchain transaction
 * @access Admin
 */
router.get('/transaction/:txHash', authenticateAdmin, blockchainController.getTransactionDetails);

/**
 * @route GET /api/blockchain/user-transactions/:userId
 * @desc Get blockchain transactions for a specific user
 * @access Admin or User (if own transactions)
 */
router.get('/user-transactions/:userId', authenticateUser, blockchainController.getUserTransactions);

module.exports = router;
