/**
 * Profession Verification Controller
 * Handles upload, retrieval and verification of professional proof images.
 */
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const db = require('../utils/db.utils');

/**
 * Upload profession image (User)
 * Route: POST /api/profession/upload
 */
exports.uploadProfessionProof = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const { professionName } = req.body;
    if (!professionName) {
      // Delete file if professionName missing
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'professionName is required' });
    }

    const recordId = uuidv4();
    const imageUrl = `/uploads/profession/${path.basename(req.file.path)}`;
    const userId = req.user.id;

    await db.query(
      `INSERT INTO profession_verification (id, user_id, profession_name, image_url, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'pending', NOW(), NOW())`,
      [recordId, userId, professionName, imageUrl]
    );

    return res.status(201).json({ message: 'Image uploaded successfully', id: recordId });
  } catch (err) {
    console.error('uploadProfessionProof error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get pending verifications (Admin)
 * Route: GET /api/profession/pending
 */
exports.getPendingVerifications = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT pv.*, u.name as user_name, u.government_id
       FROM profession_verification pv
       JOIN users u ON u.id = pv.user_id
       WHERE pv.status = 'pending'
       ORDER BY pv.created_at ASC`
    );

    return res.json({ records: result.rows });
  } catch (err) {
    console.error('getPendingVerifications error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Verify or reject profession proof (Admin)
 * Route: PATCH /api/profession/verify/:id
 * Body: { status: 'approved' | 'rejected' }
 */
exports.verifyProfession = async (req, res) => {
  try {
    const { id } = req.params; // record id or userId? We'll use record id
    const { status } = req.body;
    if (!['approved', 'rejected'].includes((status || '').toLowerCase())) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Update record status
    const result = await db.query(
      `UPDATE profession_verification 
       SET status = $1, reviewed_by = $2, updated_at = NOW() 
       WHERE id = $3 RETURNING user_id` ,
      [status.toLowerCase(), req.admin.id, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }

    const userId = result.rows[0].user_id;

    // Optionally update user professional status when approved
    if (status.toLowerCase() === 'approved') {
      await db.query(
        `UPDATE users SET professional_verified = true WHERE id = $1`,
        [userId]
      );
    }

    return res.json({ message: `Record ${status}` });
  } catch (err) {
    console.error('verifyProfession error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
