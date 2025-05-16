/**
 * Network routes for DBIS
 * Handles blockchain network selection and status
 */
const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth.middleware');
const networkController = require('../controllers/network.controller');

/**
 * @route GET /api/network/status
 * @desc Get current blockchain network status
 * @access Admin
 */
router.get('/status', authenticateAdmin, networkController.getNetworkStatus);

/**
 * @route POST /api/network/switch
 * @desc Switch blockchain network
 * @access Admin
 */
router.post('/switch', authenticateAdmin, networkController.switchNetwork);

/**
 * @route GET /api/network/contract
 * @desc Get contract deployment status
 * @access Admin
 */
router.get('/contract', authenticateAdmin, networkController.getContractStatus);

/**
 * @route POST /api/network/deploy
 * @desc Deploy smart contract to the current network
 * @access Admin
 */
router.post('/deploy', authenticateAdmin, networkController.deployContract);

module.exports = router;
