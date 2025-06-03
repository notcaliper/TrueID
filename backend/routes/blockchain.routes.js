/**
 * Blockchain routes for DBIS
 */
const express = require('express');
const router = express.Router();
const { authenticateUser, authenticateAdmin } = require('../middleware/auth.middleware');
const blockchainController = require('../controllers/blockchain.controller');

/**
 * @route POST /api/blockchain/record
 * @desc Admin-initiated recording of user identity on blockchain
 * @access Admin
 */
router.post('/record', authenticateAdmin, blockchainController.recordIdentityOnBlockchain);

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
 * @route POST /api/blockchain/record-professional-record/:id
 * @desc Record a specific professional record on blockchain
 * @access User
 */
router.post('/record-professional-record/:id', authenticateUser, blockchainController.recordUserProfessionalRecord);

/**
 * @route GET /api/blockchain/expiry
 * @desc Get blockchain identity expiry information
 * @access User
 */
router.get('/expiry', authenticateUser, blockchainController.getBlockchainExpiry);

/**
 * @route GET /api/blockchain/verify/:hash
 * @desc Verify a document hash on the blockchain
 * @access Public
 */
router.get('/verify/:hash', blockchainController.verifyDocumentHash);

/**
 * @route GET /api/blockchain/transactions
 * @desc Get blockchain transactions for a user
 * @access User
 */
router.get('/transactions', authenticateUser, blockchainController.getUserTransactions);

module.exports = router;
