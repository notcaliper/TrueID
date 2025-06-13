const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { body } = require('express-validator');
const documentController = require('../controllers/document.controller');
const { authenticateUser, authenticateAdmin } = require('../middleware/auth.middleware');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPEG and PNG files are allowed.'));
    }
  }
});

// Upload document (user only)
router.post('/upload',
  authenticateUser,
  upload.single('document'),
  [
    body('professionalRecordId').optional().isInt()
  ],
  documentController.uploadDocument
);

// Get document by ID (for authenticated users)
router.get('/:documentId',
  authenticateUser,
  documentController.getDocument
);

// List documents for a professional record (admin access) - specific route first to avoid conflict
router.get('/admin/professional-record/:professionalRecordId',
  authenticateAdmin,
  documentController.listProfessionalRecordDocuments
);

// Get document by ID (for admin)
router.get('/admin/:documentId',
  authenticateAdmin,
  documentController.getDocument
);

// List documents for a professional record (user access)
router.get('/professional-record/:professionalRecordId',
  authenticateUser,
  documentController.listProfessionalRecordDocuments
);

// Verify document (admin only)
router.put('/verify/:documentId',
  authenticateAdmin,
  [
    body('status').isIn(['VERIFIED', 'REJECTED']),
    body('notes').optional().isString()
  ],
  documentController.verifyDocument
);

module.exports = router; 