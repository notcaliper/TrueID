const { validationResult } = require('express-validator');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;

/**
 * Upload a new document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.uploadDocument = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user.id;
    const file = req.file;
    const { professionalRecordId } = req.body;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Calculate file hash
    const fileBuffer = await fs.readFile(file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Start a transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Store document record
      const docResult = await client.query(
        `INSERT INTO document_records (
          user_id, 
          file_path, 
          file_url, 
          file_hash, 
          original_name, 
          mime_type, 
          file_size, 
          verification_status,
          created_at, 
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING id`,
        [
          userId,
          file.path,
          `/uploads/${file.filename}`,
          fileHash,
          file.originalname,
          file.mimetype,
          file.size,
          'PENDING'
        ]
      );

      const documentId = docResult.rows[0].id;

      // If professional record ID is provided, update the record with document URL
      if (professionalRecordId) {
        // First verify the professional record exists and belongs to the user
        const recordCheck = await client.query(
          `SELECT id FROM professional_records WHERE id = $1 AND user_id = $2`,
          [professionalRecordId, userId]
        );

        if (recordCheck.rows.length === 0) {
          throw new Error('Professional record not found or access denied');
        }

        // Update the professional record with document URL
        await client.query(
          `UPDATE professional_records 
           SET document_url = $1,
               updated_at = NOW()
           WHERE id = $2`,
          [`/uploads/${file.filename}`, professionalRecordId]
        );
      }

      // Create verification request
      await client.query(
        `INSERT INTO verification_requests (
          user_id,
          record_id,
          record_type,
          status,
          entity_type,
          created_at,
          updated_at,
          verification_method,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), $6, $7)`,
        [
          userId,
          documentId,
          'DOCUMENT',
          'PENDING',
          'document_records',
          'MANUAL',
          JSON.stringify({
            professionalRecordId
          })
        ]
      );

      // Log the upload
      await client.query(
        `INSERT INTO audit_logs (
          user_id,
          action,
          entity_type,
          entity_id,
          details,
          ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          'DOCUMENT_UPLOADED',
          'document_records',
          documentId,
          JSON.stringify({
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            professionalRecordId
          }),
          req.ip
        ]
      );

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Document uploaded successfully',
        documentId,
        fileUrl: `/uploads/${file.filename}`,
        verificationStatus: 'PENDING',
        professionalRecordId
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ 
      message: 'Server error while uploading document',
      error: error.message 
    });
  }
};

/**
 * Verify a document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.verifyDocument = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const adminId = req.admin.id;
    const { documentId } = req.params;
    const { status, notes } = req.body;

    // Validate status
    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Update document record
      const result = await client.query(
        `UPDATE document_records
         SET verification_status = $1,
             verified_by = $2,
             verification_date = NOW(),
             updated_at = NOW()
         WHERE id = $3
         RETURNING user_id, file_hash`,
        [status, adminId, documentId]
      );

      if (result.rows.length === 0) {
        throw new Error('Document not found');
      }

      const { user_id, file_hash } = result.rows[0];

      // Find associated professional record
      const recordResult = await client.query(
        `SELECT id FROM professional_records 
         WHERE document_url = (
           SELECT file_url FROM document_records WHERE id = $1
         )`,
        [documentId]
      );

      // If there's an associated professional record, update its status
      if (recordResult.rows.length > 0) {
        const professionalRecordId = recordResult.rows[0].id;
        
        await client.query(
          `UPDATE professional_records
           SET verification_status = $1,
               verified_by = $2,
               verified_at = NOW(),
               updated_at = NOW()
           WHERE id = $3`,
          [status, adminId, professionalRecordId]
        );
      }

      // Update verification request
      await client.query(
        `UPDATE verification_requests
         SET status = $1,
             notes = $2,
             reviewed_by = $3,
             reviewed_at = NOW(),
             updated_at = NOW()
         WHERE record_id = $4 AND record_type = 'DOCUMENT'`,
        [status, notes, adminId, documentId]
      );

      // Log the verification
      await client.query(
        `INSERT INTO audit_logs (
          user_id,
          admin_id,
          action,
          entity_type,
          entity_id,
          details,
          ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          user_id,
          adminId,
          'DOCUMENT_VERIFIED',
          'document_records',
          documentId,
          JSON.stringify({
            status,
            notes,
            fileHash: file_hash,
            professionalRecordId: recordResult.rows[0]?.id
          }),
          req.ip
        ]
      );

      await client.query('COMMIT');

      res.status(200).json({
        message: 'Document verification updated successfully',
        status,
        professionalRecordId: recordResult.rows[0]?.id
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Document verification error:', error);
    res.status(500).json({ 
      message: 'Server error while verifying document',
      error: error.message 
    });
  }
};

/**
 * Get document details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getDocument = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { documentId } = req.params;
    const userId = req.user?.id;
    const adminId = req.admin?.id;

    // Get document details with professional record info
    const result = await db.query(
      `SELECT d.*,
              a.username as verified_by_username,
              vr.notes as verification_notes,
              vr.status as verification_request_status,
              pr.id as professional_record_id,
              pr.title as professional_record_title,
              pr.institution as professional_record_institution
       FROM document_records d
       LEFT JOIN admins a ON d.verified_by = a.id
       LEFT JOIN verification_requests vr ON d.id = vr.record_id AND vr.record_type = 'DOCUMENT'
       LEFT JOIN professional_records pr ON pr.document_url = d.file_url
       WHERE d.id = $1
       ${!adminId ? 'AND d.user_id = $2' : ''}`,
      adminId ? [documentId] : [documentId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const document = result.rows[0];

    res.status(200).json({
      message: 'Document retrieved successfully',
      document: {
        id: document.id,
        fileName: document.original_name,
        fileUrl: document.file_url,
        fileSize: document.file_size,
        mimeType: document.mime_type,
        verificationStatus: document.verification_status,
        verificationDate: document.verification_date,
        verifiedBy: document.verified_by_username,
        verificationNotes: document.verification_notes,
        createdAt: document.created_at,
        updatedAt: document.updated_at,
        professionalRecord: document.professional_record_id ? {
          id: document.professional_record_id,
          title: document.professional_record_title,
          institution: document.professional_record_institution
        } : null
      }
    });

  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'Server error while retrieving document' });
  }
};

/**
 * List documents for a professional record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.listProfessionalRecordDocuments = async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { professionalRecordId } = req.params;
    const userId = req.user?.id;
    const adminId = req.admin?.id;

    // Verify access to the professional record
    if (!adminId) {
      const accessCheck = await db.query(
        'SELECT id FROM professional_records WHERE id = $1 AND user_id = $2',
        [professionalRecordId, userId]
      );
      if (accessCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Access denied to this professional record' });
      }
    }

    // Get the document for the professional record
    const result = await db.query(
      `SELECT d.*,
              a.username as verified_by_username,
              vr.notes as verification_notes
       FROM professional_records pr
       JOIN document_records d ON d.file_url = pr.document_url
       LEFT JOIN admins a ON d.verified_by = a.id
       LEFT JOIN verification_requests vr ON d.id = vr.record_id AND vr.record_type = 'DOCUMENT'
       WHERE pr.id = $1`,
      [professionalRecordId]
    );

    res.status(200).json({
      message: 'Documents retrieved successfully',
      documents: result.rows.map(doc => ({
        id: doc.id,
        fileName: doc.original_name,
        fileUrl: doc.file_url,
        fileSize: doc.file_size,
        mimeType: doc.mime_type,
        verificationStatus: doc.verification_status,
        verificationDate: doc.verification_date,
        verifiedBy: doc.verified_by_username,
        verificationNotes: doc.verification_notes,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at
      }))
    });

  } catch (error) {
    console.error('List professional record documents error:', error);
    res.status(500).json({ message: 'Server error while retrieving documents' });
  }
}; 