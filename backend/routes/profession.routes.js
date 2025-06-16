/**
 * Profession verification routes
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateUser } = require('../middleware/auth.middleware');
const { authenticateAdmin } = require('../middleware/auth.middleware');
const professionController = require('../controllers/profession.controller');

// Ensure uploads dir exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'profession');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

// User upload route
router.post('/upload', authenticateUser, upload.single('image'), professionController.uploadProfessionProof);

// Admin fetch pending
router.get('/pending', authenticateAdmin, professionController.getPendingVerifications);

// Admin verify
router.patch('/verify/:id', authenticateAdmin, professionController.verifyProfession);

module.exports = router;
