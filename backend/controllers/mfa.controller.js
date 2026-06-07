/**
 * Multi-Factor Authentication (MFA) Controller
 * Supports TOTP (Time-based One-Time Password) via authenticator apps
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate random recovery codes
 * @param {number} count - Number of codes to generate
 * @returns {Array} Array of recovery code objects
 */
const generateRecoveryCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
    codes.push({
      code: code,
      used: false,
      created_at: new Date().toISOString()
    });
  }
  return codes;
};

/**
 * Hash a recovery code for secure storage
 * @param {string} code - Recovery code to hash
 * @returns {string} SHA-256 hash of code
 */
const hashRecoveryCode = (code) => {
  return crypto.createHash('sha256').update(code).digest('hex');
};

/**
 * Initialize MFA setup - Generate secret and QR code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.setupMFA = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;

  try {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `TrueID:${req.user.governmentId || req.user.id}`,
      issuer: 'TrueID',
      length: 32
    });

    // Generate QR code URL
    const otpauthUrl = secret.otpauth_url;
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Store secret temporarily (not enabled until verified)
    await db.query(
      `UPDATE users 
       SET mfa_secret = $1, 
           mfa_setup_pending = true,
           mfa_type = 'TOTP',
           updated_at = NOW()
       WHERE id = $2`,
      [secret.base32, userId]
    );

    // Log MFA setup initiation
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        'MFA_SETUP_INITIATED',
        'users',
        userId,
        JSON.stringify({ mfa_type: 'TOTP' }),
        req.ip
      ]
    );

    res.status(200).json({
      success: true,
      message: 'MFA setup initiated',
      secret: secret.base32, // For manual entry
      qrCode: qrCodeDataUrl, // QR code for scanning
      otpauthUrl: otpauthUrl // Direct URL
    });
  } catch (error) {
    logger.error('MFA setup error:', error);
    res.status(500).json({ message: 'Server error during MFA setup' });
  }
};

/**
 * Verify MFA setup - Confirm token and enable MFA
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.verifyMFASetup = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Verification token is required' });
  }

  try {
    // Get user's pending MFA secret
    const userResult = await db.query(
      'SELECT mfa_secret, mfa_setup_pending FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    if (!user.mfa_setup_pending || !user.mfa_secret) {
      return res.status(400).json({ message: 'MFA setup not initiated' });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 1 step before/after for time drift
    });

    if (!verified) {
      // Log failed verification
      await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          'MFA_SETUP_VERIFICATION_FAILED',
          'users',
          userId,
          JSON.stringify({ reason: 'Invalid token' }),
          req.ip
        ]
      );

      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Generate recovery codes
    const recoveryCodes = generateRecoveryCodes(10);
    const hashedCodes = recoveryCodes.map(rc => ({
      ...rc,
      code: hashRecoveryCode(rc.code) // Store hashed version
    }));

    // Enable MFA
    await db.query(
      `UPDATE users 
       SET mfa_enabled = true,
           mfa_setup_pending = false,
           mfa_verified_at = NOW(),
           mfa_backup_codes = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(hashedCodes), userId]
    );

    // Log successful MFA enable
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        'MFA_ENABLED',
        'users',
        userId,
        JSON.stringify({ mfa_type: 'TOTP' }),
        req.ip
      ]
    );

    // Return recovery codes (only shown once!)
    res.status(200).json({
      success: true,
      message: 'MFA enabled successfully',
      recoveryCodes: recoveryCodes.map(rc => rc.code), // Plain text for display
      warning: 'Save these recovery codes securely. They will not be shown again!'
    });
  } catch (error) {
    logger.error('MFA verification error:', error);
    res.status(500).json({ message: 'Server error during MFA verification' });
  }
};

/**
 * Verify MFA token during login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.verifyMFALogin = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { tempToken, mfaToken } = req.body;

  if (!tempToken || !mfaToken) {
    return res.status(400).json({ message: 'Temporary token and MFA code are required' });
  }

  try {
    // Find MFA session
    const sessionResult = await db.query(
      `SELECT ms.*, u.mfa_secret, u.mfa_backup_codes, u.id as user_id, 
              u.username, u.name, u.government_id, u.email, u.phone,
              u.is_verified, u.verification_status, u.avax_address
       FROM mfa_sessions ms
       JOIN users u ON ms.user_id = u.id
       WHERE ms.temp_token = $1 AND ms.expires_at > NOW() AND ms.used_at IS NULL`,
      [tempToken]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    const session = sessionResult.rows[0];

    // Check attempts
    if (session.attempts >= session.max_attempts) {
      // Invalidate session
      await db.query(
        'UPDATE mfa_sessions SET used_at = NOW() WHERE id = $1',
        [session.id]
      );
      return res.status(401).json({ message: 'Too many failed attempts. Please login again.' });
    }

    // Try TOTP verification
    let verified = speakeasy.totp.verify({
      secret: session.mfa_secret,
      encoding: 'base32',
      token: mfaToken,
      window: 2
    });

    // If TOTP fails, try recovery code
    if (!verified) {
      const backupCodes = session.mfa_backup_codes || [];
      const hashedInput = hashRecoveryCode(mfaToken.toUpperCase().replace(/[^A-Z0-9]/g, ''));
      
      const codeIndex = backupCodes.findIndex(bc => bc.code === hashedInput && !bc.used);
      
      if (codeIndex !== -1) {
        // Mark recovery code as used
        backupCodes[codeIndex].used = true;
        backupCodes[codeIndex].used_at = new Date().toISOString();
        
        await db.query(
          'UPDATE users SET mfa_backup_codes = $1 WHERE id = $2',
          [JSON.stringify(backupCodes), session.user_id]
        );
        
        verified = true;
        
        // Log recovery code usage
        await db.query(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            session.user_id,
            'MFA_RECOVERY_CODE_USED',
            'users',
            session.user_id,
            JSON.stringify({ code_index: codeIndex }),
            req.ip
          ]
        );
      }
    }

    if (!verified) {
      // Increment attempts
      await db.query(
        'UPDATE mfa_sessions SET attempts = attempts + 1 WHERE id = $1',
        [session.id]
      );

      // Log failed attempt
      await db.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          session.user_id,
          'MFA_LOGIN_FAILED',
          'users',
          session.user_id,
          JSON.stringify({ attempts: session.attempts + 1 }),
          req.ip
        ]
      );

      return res.status(401).json({ 
        message: 'Invalid MFA code',
        attemptsRemaining: session.max_attempts - session.attempts - 1
      });
    }

    // Mark session as used
    await db.query(
      'UPDATE mfa_sessions SET used_at = NOW() WHERE id = $1',
      [session.id]
    );

    // Generate JWT tokens
    const jwt = require('jsonwebtoken');
    const payload = {
      id: session.user_id,
      governmentId: session.government_id,
      type: 'user',
      mfaVerified: true
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
    const refreshToken = jwt.sign({ ...payload, jti: uuidv4() }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: '7d' });

    // Store session
    await db.query(
      `INSERT INTO user_sessions (user_id, token, refresh_token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '24 hours')`,
      [session.user_id, accessToken, refreshToken, req.ip, req.headers['user-agent']]
    );

    // Log successful login
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        session.user_id,
        'LOGIN_SUCCESS_MFA',
        'users',
        session.user_id,
        JSON.stringify({ method: 'MFA' }),
        req.ip
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: session.user_id,
        name: session.name,
        governmentId: session.government_id,
        email: session.email,
        phone: session.phone,
        isVerified: session.is_verified,
        verificationStatus: session.verification_status
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 86400
      }
    });
  } catch (error) {
    logger.error('MFA login verification error:', error);
    res.status(500).json({ message: 'Server error during MFA verification' });
  }
};

/**
 * Disable MFA
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.disableMFA = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  const { password, mfaToken } = req.body;

  if (!password || !mfaToken) {
    return res.status(400).json({ message: 'Password and MFA code are required' });
  }

  try {
    // Verify password
    const userResult = await db.query(
      'SELECT password, mfa_secret, mfa_enabled FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    if (!user.mfa_enabled) {
      return res.status(400).json({ message: 'MFA is not enabled' });
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Verify MFA token
    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: mfaToken,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({ message: 'Invalid MFA code' });
    }

    // Disable MFA
    await db.query(
      `UPDATE users 
       SET mfa_enabled = false,
           mfa_secret = NULL,
           mfa_backup_codes = '[]'::jsonb,
           mfa_verified_at = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    // Log MFA disable
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        'MFA_DISABLED',
        'users',
        userId,
        JSON.stringify({ reason: 'User initiated' }),
        req.ip
      ]
    );

    res.status(200).json({
      success: true,
      message: 'MFA disabled successfully'
    });
  } catch (error) {
    logger.error('MFA disable error:', error);
    res.status(500).json({ message: 'Server error during MFA disable' });
  }
};

/**
 * Get MFA status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getMFAStatus = async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT mfa_enabled, mfa_type, mfa_verified_at, mfa_setup_pending,
              jsonb_array_length(mfa_backup_codes) as backup_codes_count
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const mfaStatus = result.rows[0];

    res.status(200).json({
      enabled: mfaStatus.mfa_enabled,
      type: mfaStatus.mfa_type,
      verifiedAt: mfaStatus.mfa_verified_at,
      setupPending: mfaStatus.mfa_setup_pending,
      backupCodesCount: parseInt(mfaStatus.backup_codes_count) || 0
    });
  } catch (error) {
    console.error('MFA status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Regenerate recovery codes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.regenerateRecoveryCodes = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  const { mfaToken } = req.body;

  if (!mfaToken) {
    return res.status(400).json({ message: 'MFA code is required' });
  }

  try {
    // Get user MFA secret
    const userResult = await db.query(
      'SELECT mfa_secret, mfa_enabled FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    if (!user.mfa_enabled) {
      return res.status(400).json({ message: 'MFA is not enabled' });
    }

    // Verify MFA token
    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: mfaToken,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({ message: 'Invalid MFA code' });
    }

    // Generate new recovery codes
    const recoveryCodes = generateRecoveryCodes(10);
    const hashedCodes = recoveryCodes.map(rc => ({
      ...rc,
      code: hashRecoveryCode(rc.code)
    }));

    // Update recovery codes
    await db.query(
      'UPDATE users SET mfa_backup_codes = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(hashedCodes), userId]
    );

    // Log recovery code regeneration
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        'MFA_RECOVERY_CODES_REGENERATED',
        'users',
        userId,
        JSON.stringify({ count: 10 }),
        req.ip
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Recovery codes regenerated',
      recoveryCodes: recoveryCodes.map(rc => rc.code),
      warning: 'Save these recovery codes securely. They will not be shown again!'
    });
  } catch (error) {
    logger.error('Recovery code regeneration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
