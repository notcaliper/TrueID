/**
 * Test routes for TrueID API
 */
const express = require('express');
const router = express.Router();

/**
 * @route GET /api/test/ping
 * @desc Simple ping endpoint to test API connectivity
 * @access Public
 */
router.get('/ping', (req, res) => {
  res.json({ 
    message: 'API is connected successfully!',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route GET /api/test/status
 * @desc Get API status information
 * @access Public
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
