/**
 * User routes for DBIS
 */
const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth.middleware');
const { professionalRecordRules, validate } = require('../middleware/validation.middleware');
const userController = require('../controllers/user.controller');

/**
 * @route GET /api/users/profile
 * @desc Get user profile
 * @access User
 */
router.get('/profile', authenticateUser, userController.getUserProfile);

/**
 * @route PUT /api/users/profile
 * @desc Update user profile
 * @access User
 */
router.put('/profile', authenticateUser, userController.updateUserProfile);

/**
 * @route GET /api/users/verification-status
 * @desc Get user verification status
 * @access User
 */
router.get('/verification-status', authenticateUser, userController.getVerificationStatus);

/**
 * @route POST /api/users/professional-record
 * @desc Add a professional record
 * @access User
 */
router.post('/professional-record', authenticateUser, professionalRecordRules, validate, userController.addProfessionalRecord);

/**
 * @route GET /api/users/professional-records
 * @desc Get user's professional records
 * @access User
 */
router.get('/professional-records', authenticateUser, userController.getProfessionalRecords);

/**
 * @route PUT /api/users/update-facemesh
 * @desc Update user's facemesh data
 * @access User
 */
router.put('/update-facemesh', authenticateUser, userController.updateFacemesh);

/**
 * @route GET /api/users/blockchain-status
 * @desc Get user's blockchain status
 * @access User
 */
router.get('/blockchain-status', authenticateUser, userController.getBlockchainStatus);

module.exports = router;
