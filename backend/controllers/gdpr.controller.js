/**
 * GDPR Controller
 * Handles data export and account deletion requests (Right to Access, Right to be Forgotten)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createWriteStream } = require('fs');
const archiver = require('archiver');

/**
 * Collect all user data for export
 * @param {Object} db - Database service
 * @param {number} userId - User ID
 * @returns {Object} All user data
 */
const collectUserData = async (db, userId) => {
  const data = {
    exportMetadata: {
      generatedAt: new Date().toISOString(),
      userId: userId,
      version: '1.0'
    }
  };

  // User profile
  const userResult = await db.query(
    `SELECT id, username, name, government_id, email, phone, 
            wallet_address, is_verified, verification_status, 
            created_at, updated_at, avax_address
     FROM users WHERE id = $1`,
    [userId]
  );
  data.profile = userResult.rows[0] || null;

  // Biometric data
  const biometricResult = await db.query(
    `SELECT id, facemesh_hash, is_active, verification_status, 
            verification_score, last_verified_at, created_at
     FROM biometric_data WHERE user_id = $1`,
    [userId]
  );
  data.biometricData = biometricResult.rows;

  // Professional records
  const recordsResult = await db.query(
    `SELECT id, record_type, institution, title, description, 
            start_date, end_date, is_current, is_verified, 
            verified_at, created_at, updated_at
     FROM professional_records WHERE user_id = $1`,
    [userId]
  );
  data.professionalRecords = recordsResult.rows;

  // Document records
  const documentsResult = await db.query(
    `SELECT id, file_hash, original_name, mime_type, file_size, 
            verification_status, verification_date, created_at
     FROM document_records WHERE user_id = $1`,
    [userId]
  );
  data.documents = documentsResult.rows;

  // Sessions
  const sessionsResult = await db.query(
    `SELECT id, ip_address, device_info, location_info, 
            session_type, created_at, last_activity_at, is_active
     FROM user_sessions WHERE user_id = $1`,
    [userId]
  );
  data.sessions = sessionsResult.rows;

  // Audit logs
  const auditResult = await db.query(
    `SELECT id, action, entity_type, details, ip_address, created_at
     FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1000`,
    [userId]
  );
  data.auditLogs = auditResult.rows;

  // Blockchain transactions
  const blockchainResult = await db.query(
    `SELECT transaction_type, transaction_hash, block_number, 
            status, network, created_at
     FROM blockchain_transactions WHERE user_id = $1`,
    [userId]
  );
  data.blockchainTransactions = blockchainResult.rows;

  // Security settings
  const securityResult = await db.query(
    `SELECT allowed_countries, blocked_countries, max_sessions,
            notify_new_device, notify_suspicious_activity, created_at
     FROM user_security_settings WHERE user_id = $1`,
    [userId]
  );
  data.securitySettings = securityResult.rows[0] || null;

  // MFA status (without sensitive secret)
  const mfaResult = await db.query(
    `SELECT mfa_enabled, mfa_type, mfa_verified_at, 
            jsonb_array_length(mfa_backup_codes) as backup_codes_count
     FROM users WHERE id = $1`,
    [userId]
  );
  data.mfaStatus = mfaResult.rows[0] || null;

  return data;
};

/**
 * Create data export request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.requestDataExport = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  const { format = 'JSON' } = req.body; // JSON or PDF

  try {
    // Check for existing pending request
    const existingResult = await db.query(
      `SELECT id FROM data_export_requests 
       WHERE user_id = $1 AND status IN ('PENDING', 'PROCESSING')`,
      [userId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ 
        message: 'You already have a data export in progress' 
      });
    }

    // Create export request
    const requestResult = await db.query(
      `INSERT INTO data_export_requests (user_id, format, status, created_at)
       VALUES ($1, $2, 'PENDING', NOW())
       RETURNING id`,
      [userId, format.toUpperCase()]
    );

    const requestId = requestResult.rows[0].id;

    // Log the request
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        'DATA_EXPORT_REQUESTED',
        'data_export_requests',
        requestId,
        JSON.stringify({ format: format.toUpperCase() }),
        req.ip
      ]
    );

    // Process export asynchronously
    processDataExport(db, userId, requestId, format.toUpperCase());

    res.status(202).json({
      success: true,
      message: 'Data export request created. You will be notified when it is ready.',
      requestId,
      status: 'PROCESSING'
    });
  } catch (error) {
    logger.error('Data export request error:', error);
    res.status(500).json({ message: 'Failed to create export request' });
  }
};

/**
 * Process data export (async function)
 * @param {Object} db - Database service
 * @param {number} userId - User ID
 * @param {number} requestId - Export request ID
 * @param {string} format - Export format
 */
const processDataExport = async (db, userId, requestId, format) => {
  try {
    // Update status to processing
    await db.query(
      `UPDATE data_export_requests 
       SET status = 'PROCESSING' 
       WHERE id = $1`,
      [requestId]
    );

    // Collect all user data
    const userData = await collectUserData(db, userId);

    // Create exports directory if not exists
    const exportsDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `trueid-export-${userId}-${timestamp}`;
    const filePath = path.join(exportsDir, `${filename}.zip`);

    // Create ZIP archive
    const output = createWriteStream(filePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') console.warn('Archive warning:', err);
        else reject(err);
      });

      archive.pipe(output);

      // Add JSON data
      archive.append(JSON.stringify(userData, null, 2), { name: 'data.json' });

      // Add human-readable README
      const readme = generateReadme(userData);
      archive.append(readme, { name: 'README.txt' });

      // Add CSV summaries
      const csvSummaries = generateCSVSummaries(userData);
      Object.entries(csvSummaries).forEach(([name, content]) => {
        archive.append(content, { name: `${name}.csv` });
      });

      archive.finalize();
    });

    const stats = fs.statSync(filePath);

    // Update request as completed
    await db.query(
      `UPDATE data_export_requests 
       SET status = 'COMPLETED', 
           file_path = $2,
           file_size = $3,
           completed_at = NOW(),
           expires_at = NOW() + INTERVAL '7 days'
       WHERE id = $1`,
      [requestId, filePath, stats.size]
    );

    console.log(`Data export completed for user ${userId}, request ${requestId}`);
  } catch (error) {
    console.error('Process data export error:', error);
    await db.query(
      `UPDATE data_export_requests 
       SET status = 'FAILED' 
       WHERE id = $1`,
      [requestId]
    );
  }
};

/**
 * Generate human-readable README
 * @param {Object} data - User data
 * @returns {string} README content
 */
const generateReadme = (data) => {
  return `TrueID Data Export
==================

Generated: ${data.exportMetadata.generatedAt}
User ID: ${data.exportMetadata.userId}

This archive contains all your personal data stored in the TrueID system.

CONTENTS:
- data.json: Complete data in JSON format
- *.csv: Summary tables in CSV format

DATA CATEGORIES:
${data.profile ? '- Profile Information' : ''}
${data.biometricData?.length ? '- Biometric Data' : ''}
${data.professionalRecords?.length ? '- Professional Records' : ''}
${data.documents?.length ? '- Documents' : ''}
${data.sessions?.length ? '- Session History' : ''}
${data.auditLogs?.length ? '- Activity Logs' : ''}
${data.blockchainTransactions?.length ? '- Blockchain Transactions' : ''}

SECURITY NOTES:
- This export contains sensitive personal information
- Keep this file secure and do not share it
- The export link expires 7 days from generation

For questions or concerns, contact privacy@trueid.gov
`;
};

/**
 * Generate CSV summaries
 * @param {Object} data - User data
 * @returns {Object} CSV contents
 */
const generateCSVSummaries = (data) => {
  const csvs = {};

  if (data.professionalRecords?.length) {
    const headers = ['Type', 'Institution', 'Title', 'Start Date', 'End Date', 'Verified'];
    const rows = data.professionalRecords.map(r => [
      r.record_type, r.institution, r.title, 
      r.start_date, r.end_date || 'Present', r.is_verified
    ]);
    csvs.professional_records = [headers, ...rows].map(r => r.join(',')).join('\n');
  }

  if (data.sessions?.length) {
    const headers = ['Device', 'Browser', 'IP Address', 'Created', 'Last Activity'];
    const rows = data.sessions.map(s => [
      s.device_info?.type || 'Unknown',
      s.device_info?.browser || 'Unknown',
      s.ip_address,
      s.created_at,
      s.last_activity_at
    ]);
    csvs.sessions = [headers, ...rows].map(r => r.join(',')).join('\n');
  }

  return csvs;
};

/**
 * Download exported data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.downloadExport = async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.id;
  const { requestId } = req.params;

  try {
    const result = await db.query(
      `SELECT file_path, status, expires_at 
       FROM data_export_requests 
       WHERE id = $1 AND user_id = $2`,
      [requestId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Export not found' });
    }

    const exportData = result.rows[0];

    if (exportData.status !== 'COMPLETED') {
      return res.status(400).json({ 
        message: 'Export is not ready yet',
        status: exportData.status
      });
    }

    if (new Date(exportData.expires_at) < new Date()) {
      return res.status(410).json({ message: 'Export has expired' });
    }

    if (!fs.existsSync(exportData.file_path)) {
      return res.status(404).json({ message: 'Export file not found' });
    }

    // Log download
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'DATA_EXPORT_DOWNLOADED', 'data_export_requests', requestId, req.ip]
    );

    res.download(exportData.file_path, `trueid-data-export-${requestId}.zip`);
  } catch (error) {
    console.error('Download export error:', error);
    res.status(500).json({ message: 'Failed to download export' });
  }
};

/**
 * Get export history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getExportHistory = async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT id, status, format, file_size, created_at, completed_at, expires_at
       FROM data_export_requests 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      exports: result.rows.map(e => ({
        id: e.id,
        status: e.status,
        format: e.format,
        fileSize: e.file_size,
        createdAt: e.created_at,
        completedAt: e.completed_at,
        expiresAt: e.expires_at,
        isExpired: new Date(e.expires_at) < new Date()
      }))
    });
  } catch (error) {
    console.error('Get export history error:', error);
    res.status(500).json({ message: 'Failed to retrieve export history' });
  }
};

/**
 * Request account deletion (GDPR Right to be Forgotten)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.requestAccountDeletion = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  const { reason, password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  try {
    // Verify password
    const userResult = await db.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(password, userResult.rows[0].password);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Check for existing deletion request
    const existingResult = await db.query(
      `SELECT id FROM account_deletion_requests 
       WHERE user_id = $1 AND status IN ('PENDING', 'PROCESSING')`,
      [userId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ 
        message: 'You already have a deletion request in progress' 
      });
    }

    // Generate confirmation code
    const confirmationCode = crypto.randomBytes(32).toString('hex');

    // Create deletion request (30-day grace period)
    const requestResult = await db.query(
      `INSERT INTO account_deletion_requests 
       (user_id, reason, confirmation_code, scheduled_deletion_at, created_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '30 days', NOW())
       RETURNING id`,
      [userId, reason || null, confirmationCode]
    );

    const requestId = requestResult.rows[0].id;

    // Log the request
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        'ACCOUNT_DELETION_REQUESTED',
        'account_deletion_requests',
        requestId,
        JSON.stringify({ reason: reason || 'Not provided' }),
        req.ip
      ]
    );

    res.status(202).json({
      success: true,
      message: 'Account deletion requested. You have 30 days to cancel this request.',
      requestId,
      scheduledDeletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      gracePeriodDays: 30
    });
  } catch (error) {
    logger.error('Account deletion request error:', error);
    res.status(500).json({ message: 'Failed to create deletion request' });
  }
};

/**
 * Cancel account deletion request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.cancelAccountDeletion = async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.id;
  const { requestId } = req.params;

  try {
    const result = await db.query(
      `UPDATE account_deletion_requests 
       SET status = 'CANCELLED'
       WHERE id = $1 AND user_id = $2 AND status = 'PENDING'
       RETURNING id`,
      [requestId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Deletion request not found or already processed' 
      });
    }

    // Log cancellation
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'ACCOUNT_DELETION_CANCELLED', 'account_deletion_requests', requestId, req.ip]
    );

    res.status(200).json({
      success: true,
      message: 'Account deletion request cancelled'
    });
  } catch (error) {
    console.error('Cancel deletion error:', error);
    res.status(500).json({ message: 'Failed to cancel deletion request' });
  }
};

/**
 * Get deletion request status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getDeletionStatus = async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT id, status, reason, scheduled_deletion_at, created_at
       FROM account_deletion_requests 
       WHERE user_id = $1 
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        hasPendingRequest: false
      });
    }

    const request = result.rows[0];

    res.status(200).json({
      hasPendingRequest: request.status === 'PENDING',
      request: {
        id: request.id,
        status: request.status,
        reason: request.reason,
        scheduledDeletion: request.scheduled_deletion_at,
        createdAt: request.created_at,
        daysRemaining: request.status === 'PENDING' 
          ? Math.ceil((new Date(request.scheduled_deletion_at) - new Date()) / (1000 * 60 * 60 * 24))
          : 0
      }
    });
  } catch (error) {
    console.error('Get deletion status error:', error);
    res.status(500).json({ message: 'Failed to retrieve deletion status' });
  }
};
