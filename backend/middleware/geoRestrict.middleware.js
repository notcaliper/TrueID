/**
 * IP Geolocation Restriction Middleware
 * Blocks requests from specific countries or allows only specific countries
 */

const dbService = require('../services/db.service');

// Simple IP to country mapping (placeholder - integrate with MaxMind GeoIP2 in production)
// In production, use: const geoip = require('geoip-lite');
const getCountryFromIP = (ip) => {
  // This is a placeholder. In production:
  // 1. Use MaxMind GeoIP2 database
  // 2. Or use a service like ipapi.com, ipinfo.io
  // 3. Cache results to avoid repeated lookups
  
  // For demo purposes, return null (allow all)
  return null;
};

/**
 * Check if IP is from blocked country
 * @param {string} ip - IP address
 * @param {Array} allowedCountries - List of allowed country codes
 * @param {Array} blockedCountries - List of blocked country codes
 * @returns {Object} Check result
 */
const checkGeoRestriction = async (ip, allowedCountries, blockedCountries) => {
  const country = getCountryFromIP(ip);
  
  if (!country) {
    // Could not determine country - allow (or block based on policy)
    return { allowed: true, country: null };
  }

  // If allowed list exists and country is not in it, block
  if (allowedCountries && allowedCountries.length > 0) {
    if (!allowedCountries.includes(country)) {
      return { 
        allowed: false, 
        country,
        reason: 'Country not in allowed list'
      };
    }
  }

  // If blocked list exists and country is in it, block
  if (blockedCountries && blockedCountries.length > 0) {
    if (blockedCountries.includes(country)) {
      return { 
        allowed: false, 
        country,
        reason: 'Country in blocked list'
      };
    }
  }

  return { allowed: true, country };
};

/**
 * Get user's security settings
 * @param {number} userId - User ID
 * @returns {Object} Security settings
 */
const getUserSecuritySettings = async (userId) => {
  try {
    const result = await dbService.query(
      `SELECT allowed_countries, blocked_countries 
       FROM user_security_settings 
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return { allowedCountries: [], blockedCountries: [] };
    }

    return {
      allowedCountries: result.rows[0].allowed_countries || [],
      blockedCountries: result.rows[0].blocked_countries || []
    };
  } catch (error) {
    console.error('Get security settings error:', error);
    return { allowedCountries: [], blockedCountries: [] };
  }
};

/**
 * Log suspicious geo activity
 * @param {number} userId - User ID
 * @param {string} ip - IP address
 * @param {string} country - Country code
 * @param {string} reason - Block reason
 */
const logSuspiciousActivity = async (userId, ip, country, reason) => {
  try {
    await dbService.query(
      `INSERT INTO suspicious_activities 
       (user_id, activity_type, ip_address, location_info, details, severity)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        'GEO_RESTRICTION_VIOLATION',
        ip,
        JSON.stringify({ country }),
        JSON.stringify({ reason }),
        'HIGH'
      ]
    );
  } catch (error) {
    console.error('Log suspicious activity error:', error);
  }
};

/**
 * Geolocation restriction middleware
 * Can be used globally or per-route
 */
const geoRestrict = () => {
  return async (req, res, next) => {
    // Skip for health checks and internal requests
    if (req.path === '/api/health' || req.ip === '127.0.0.1' || req.ip === '::1') {
      return next();
    }

    try {
      let allowedCountries = [];
      let blockedCountries = [];
      let userId = null;

      // If user is authenticated, get their settings
      if (req.user && req.user.id) {
        userId = req.user.id;
        const settings = await getUserSecuritySettings(userId);
        allowedCountries = settings.allowedCountries;
        blockedCountries = settings.blockedCountries;
      }

      // If no restrictions configured, allow all
      if (allowedCountries.length === 0 && blockedCountries.length === 0) {
        return next();
      }

      // Check geo restriction
      const check = await checkGeoRestriction(req.ip, allowedCountries, blockedCountries);

      if (!check.allowed) {
        // Log the blocked attempt
        if (userId) {
          await logSuspiciousActivity(userId, req.ip, check.country, check.reason);
        }

        return res.status(403).json({
          error: 'Access Denied',
          message: 'Access from your location is not allowed.',
          code: 'GEO_RESTRICTED'
        });
      }

      // Attach country info to request for logging
      req.geoInfo = {
        country: check.country,
        restricted: false
      };

      next();
    } catch (error) {
      console.error('Geo restriction error:', error);
      // Fail open - allow request on error
      next();
    }
  };
};

/**
 * Admin-only geolocation middleware
 * For admin routes with strict geo restrictions
 */
const strictGeoRestrict = (allowedCountries = ['US', 'CA', 'GB', 'AU']) => {
  return async (req, res, next) => {
    const check = await checkGeoRestriction(req.ip, allowedCountries, []);

    if (!check.allowed) {
      await logSuspiciousActivity(
        req.user?.id, 
        req.ip, 
        check.country, 
        'Admin route geo restriction'
      );

      return res.status(403).json({
        error: 'Access Denied',
        message: 'Admin access not allowed from your location.'
      });
    }

    next();
  };
};

module.exports = {
  geoRestrict,
  strictGeoRestrict,
  checkGeoRestriction
};
