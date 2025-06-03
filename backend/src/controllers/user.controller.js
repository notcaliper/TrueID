/**
 * User controller for DBIS
 */
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

/**
 * Get user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = req.app.locals.db;

    const result = await db.query(
      'SELECT id, username, email, full_name, date_of_birth, phone_number, avax_address, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile retrieved successfully',
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error while retrieving profile' });
  }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { fullName, phoneNumber, dateOfBirth } = req.body;
    const db = req.app.locals.db;

    // Update user profile
    const result = await db.query(
      'UPDATE users SET full_name = COALESCE($1, full_name), phone_number = COALESCE($2, phone_number), date_of_birth = COALESCE($3, date_of_birth), updated_at = NOW() WHERE id = $4 RETURNING id, username, email, full_name, date_of_birth, phone_number, avax_address, updated_at',
      [fullName, phoneNumber, dateOfBirth, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the profile update
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        userId,
        'UPDATE_PROFILE',
        'users',
        userId,
        JSON.stringify({ fields: Object.keys(req.body) }),
        req.ip
      ]
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
};

/**
 * Get user verification status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getVerificationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = req.app.locals.db;

    const result = await db.query(
      `SELECT verification_status, verified_at, verification_notes, created_at,
              a.username as verified_by
       FROM users u
       LEFT JOIN admins a ON u.verified_by = a.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = result.rows[0];

    res.status(200).json({
      status: userData.verification_status,
      submittedAt: userData.created_at,
      verifiedAt: userData.verified_at,
      rejectionReason: userData.verification_notes,
      verifiedBy: userData.verified_by
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ message: 'Server error while retrieving verification status' });
  }
};

/**
 * Change user password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.changePassword = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    const db = req.app.locals.db;

    // Get current password hash
    const result = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );

    // Log the password change
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        userId,
        'CHANGE_PASSWORD',
        'users',
        userId,
        JSON.stringify({}),
        req.ip
      ]
    );

    // Revoke all refresh tokens
    await db.query(
      'UPDATE refresh_tokens SET revoked = true, revoked_at = NOW() WHERE user_id = $1 AND revoked = false',
      [userId]
    );

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error while changing password' });
  }
};
