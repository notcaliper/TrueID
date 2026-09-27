/**
 * Session Management Controller
 * Handles active session tracking, revocation, and monitoring
 */

const crypto = require('crypto');
const useragent = require('useragent');

/**
 * Parse user agent string to get device info
 * @param {string} userAgentString - User agent header
 * @returns {Object} Device information
 */
const parseDeviceInfo = (userAgentString) => {
  if (!userAgentString) return { type: 'UNKNOWN', browser: 'Unknown', os: 'Unknown' };
  
  const agent = useragent.parse(userAgentString);
  const deviceType = agent.device.family === 'Other' ? 'Desktop' : agent.device.family;
  
  return {
    type: deviceType,
    browser: agent.family,
    browserVersion: agent.toVersion(),
    os: agent.os.family,
    osVersion: agent.os.toVersion(),
    userAgent: userAgentString.substring(0, 500) // Limit length
  };
};

/**
 * Get location info from IP (placeholder for actual geolocation service)
 * @param {string} ip - IP address
 * @returns {Object} Location information
 */
const getLocationInfo = (ip) => {
  // In production, integrate with MaxMind GeoIP2 or similar service
  // For now, return placeholder data
  return {
    ip: ip,
    country: null,
    city: null,
    region: null,
    timezone: null,
    latitude: null,
    longitude: null
  };
};

/**
 * Create a new session with metadata
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createSession = async (req, userId, token, refreshToken) => {
  const db = req.app.locals.db;
  
  try {
    const deviceInfo = parseDeviceInfo(req.headers['user-agent']);
    const locationInfo = getLocationInfo(req.ip);
    
    await db.query(
      `INSERT INTO user_sessions (
        user_id, token, refresh_token, ip_address, user_agent, 
        device_info, location_info, expires_at, last_activity_at, session_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '24 hours', NOW(), $8)`,
      [
        userId, 
        token, 
        refreshToken, 
        req.ip, 
        req.headers['user-agent'],
        JSON.stringify(deviceInfo),
        JSON.stringify(locationInfo),
        'WEB'
      ]
    );
    
    return { success: true };
  } catch (error) {
    console.error('Create session error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all active sessions for current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSessions = async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.id;
  
  try {
    const result = await db.query(
      `SELECT id, device_info, location_info, ip_address, created_at, 
              last_activity_at, session_type, is_active,
              CASE WHEN token = $2 THEN TRUE ELSE FALSE END as is_current
       FROM user_sessions 
       WHERE user_id = $1 AND is_active = TRUE AND expires_at > NOW()
       ORDER BY last_activity_at DESC`,
      [userId, req.headers.authorization?.split(' ')[1] || '']
    );
    
    const sessions = result.rows.map(session => ({
      id: session.id,
      device: session.device_info?.type || 'Unknown',
      browser: session.device_info?.browser || 'Unknown',
      os: session.device_info?.os || 'Unknown',
      location: session.location_info,
      ipAddress: session.ip_address,
      createdAt: session.created_at,
      lastActivity: session.last_activity_at,
      isCurrent: session.is_current,
      sessionType: session.session_type
    }));
    
    res.status(200).json({
      success: true,
      sessions,
      total: sessions.length
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ message: 'Failed to retrieve sessions' });
  }
};

/**
 * Revoke a specific session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.revokeSession = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  const { sessionId } = req.params;
  
  try {
    // Verify the session belongs to this user
    const sessionResult = await db.query(
      'SELECT id, token FROM user_sessions WHERE id = $1 AND user_id = $2 AND is_active = TRUE',
      [sessionId, userId]
    );
    
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    const session = sessionResult.rows[0];
    
    // Revoke the session
    await db.query(
      `UPDATE user_sessions 
       SET is_active = FALSE, revoked_at = NOW(), revoked_by = $1
       WHERE id = $2`,
      [userId, sessionId]
    );
    
    // Log the revocation
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        'SESSION_REVOKED',
        'user_sessions',
        sessionId,
        JSON.stringify({ session_token_prefix: session.token?.substring(0, 10) }),
        req.ip
      ]
    );
    
    res.status(200).json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    logger.error('Revoke session error:', error);
    res.status(500).json({ message: 'Failed to revoke session' });
  }
};

/**
 * Revoke all other sessions (except current)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.revokeOtherSessions = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  const currentToken = req.headers.authorization?.split(' ')[1];
  
  try {
    // Get count of other active sessions
    const countResult = await db.query(
      'SELECT COUNT(*) as count FROM user_sessions WHERE user_id = $1 AND is_active = TRUE AND token != $2',
      [userId, currentToken]
    );
    
    const otherSessionsCount = parseInt(countResult.rows[0].count);
    
    if (otherSessionsCount === 0) {
      return res.status(200).json({
        success: true,
        message: 'No other sessions to revoke',
        revokedCount: 0
      });
    }
    
    // Revoke all other sessions
    await db.query(
      `UPDATE user_sessions 
       SET is_active = FALSE, revoked_at = NOW(), revoked_by = $1
       WHERE user_id = $1 AND is_active = TRUE AND token != $2`,
      [userId, currentToken]
    );
    
    // Log the bulk revocation
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, details, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        'ALL_OTHER_SESSIONS_REVOKED',
        'user_sessions',
        JSON.stringify({ revoked_count: otherSessionsCount }),
        req.ip
      ]
    );
    
    res.status(200).json({
      success: true,
      message: `Revoked ${otherSessionsCount} session(s)`,
      revokedCount: otherSessionsCount
    });
  } catch (error) {
    logger.error('Revoke other sessions error:', error);
    res.status(500).json({ message: 'Failed to revoke sessions' });
  }
};

/**
 * Update last activity for current session
 * @param {Object} req - Express request object
 */
exports.updateLastActivity = async (req) => {
  const db = req.app.locals.db;
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) return;
  
  try {
    // Update every 5 minutes to reduce DB writes
    await db.query(
      `UPDATE user_sessions 
       SET last_activity_at = NOW()
       WHERE token = $1 AND (last_activity_at < NOW() - INTERVAL '5 minutes' OR last_activity_at IS NULL)`,
      [token]
    );
  } catch (error) {
    // Silent fail - don't break request for activity update
    console.error('Update last activity error:', error);
  }
};

/**
 * Get security settings for user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSecuritySettings = async (req, res) => {
  const db = req.app.locals.db;
  const userId = req.user.id;
  
  try {
    const result = await db.query(
      `SELECT allowed_countries, blocked_countries, max_sessions, 
              require_ip_verification, notify_new_device, notify_suspicious_activity
       FROM user_security_settings 
       WHERE user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Return default settings
      return res.status(200).json({
        success: true,
        settings: {
          allowedCountries: [],
          blockedCountries: [],
          maxSessions: 5,
          requireIpVerification: false,
          notifyNewDevice: true,
          notifySuspiciousActivity: true
        }
      });
    }
    
    const settings = result.rows[0];
    
    res.status(200).json({
      success: true,
      settings: {
        allowedCountries: settings.allowed_countries || [],
        blockedCountries: settings.blocked_countries || [],
        maxSessions: settings.max_sessions,
        requireIpVerification: settings.require_ip_verification,
        notifyNewDevice: settings.notify_new_device,
        notifySuspiciousActivity: settings.notify_suspicious_activity
      }
    });
  } catch (error) {
    console.error('Get security settings error:', error);
    res.status(500).json({ message: 'Failed to retrieve security settings' });
  }
};

/**
 * Update security settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateSecuritySettings = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  const {
    allowedCountries,
    blockedCountries,
    maxSessions,
    requireIpVerification,
    notifyNewDevice,
    notifySuspiciousActivity
  } = req.body;
  
  try {
    await db.query(
      `INSERT INTO user_security_settings (
        user_id, allowed_countries, blocked_countries, max_sessions,
        require_ip_verification, notify_new_device, notify_suspicious_activity, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        allowed_countries = $2,
        blocked_countries = $3,
        max_sessions = $4,
        require_ip_verification = $5,
        notify_new_device = $6,
        notify_suspicious_activity = $7,
        updated_at = NOW()`,
      [
        userId,
        JSON.stringify(allowedCountries || []),
        JSON.stringify(blockedCountries || []),
        maxSessions || 5,
        requireIpVerification || false,
        notifyNewDevice !== false,
        notifySuspiciousActivity !== false
      ]
    );
    
    // Log settings change
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        'SECURITY_SETTINGS_UPDATED',
        'user_security_settings',
        userId,
        JSON.stringify({ changes: Object.keys(req.body) }),
        req.ip
      ]
    );
    
    res.status(200).json({
      success: true,
      message: 'Security settings updated'
    });
  } catch (error) {
    logger.error('Update security settings error:', error);
    res.status(500).json({ message: 'Failed to update security settings' });
  }
};
