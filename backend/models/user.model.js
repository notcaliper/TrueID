/**
 * User model for DBIS
 * Handles database operations for users
 */
const db = require('../utils/db.utils');
const { generateFacemeshHash } = require('../utils/biometric.utils');

/**
 * Get user by ID
 * @param {Number} id - User ID
 * @returns {Promise<Object>} User object
 */
const getUserById = async (id) => {
  const result = await db.query(
    `SELECT id, name, government_id, email, phone, avax_address, 
            is_verified, verification_status, verification_notes, 
            created_at, updated_at
     FROM users
     WHERE id = $1`,
    [id]
  );
  
  return result.rows[0];
};

/**
 * Get user by government ID
 * @param {String} governmentId - Government ID
 * @returns {Promise<Object>} User object
 */
const getUserByGovernmentId = async (governmentId) => {
  const result = await db.query(
    `SELECT id, name, government_id, email, phone, avax_address, 
            is_verified, verification_status, verification_notes, 
            created_at, updated_at
     FROM users
     WHERE government_id = $1`,
    [governmentId]
  );
  
  return result.rows[0];
};

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {Object} facemeshData - Facemesh data
 * @returns {Promise<Object>} Created user object
 */
const createUser = async (userData, facemeshData) => {
  const { name, governmentId, email, phone, avaxAddress } = userData;
  
  // Generate facemesh hash
  const facemeshHash = generateFacemeshHash(facemeshData);
  
  return db.executeTransaction(async (client) => {
    // Insert user
    const userResult = await client.query(
      `INSERT INTO users (name, government_id, email, phone, avax_address, verification_status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')
       RETURNING id, name, government_id, email, phone, avax_address, verification_status, created_at`,
      [name, governmentId, email, phone, avaxAddress]
    );
    
    const user = userResult.rows[0];
    
    // Insert biometric data
    await client.query(
      `INSERT INTO biometric_data (user_id, facemesh_hash, facemesh_data, is_active)
       VALUES ($1, $2, $3, true)`,
      [user.id, facemeshHash, JSON.stringify(facemeshData)]
    );
    
    return user;
  });
};

/**
 * Update user information
 * @param {Number} id - User ID
 * @param {Object} userData - User data to update
 * @returns {Promise<Object>} Updated user object
 */
const updateUser = async (id, userData) => {
  const { name, email, phone, avaxAddress } = userData;
  
  const result = await db.query(
    `UPDATE users 
     SET name = COALESCE($1, name), 
         email = COALESCE($2, email),
         phone = COALESCE($3, phone),
         avax_address = COALESCE($4, avax_address),
         updated_at = NOW()
     WHERE id = $5
     RETURNING id, name, government_id, email, phone, avax_address, updated_at`,
    [name, email, phone, avaxAddress, id]
  );
  
  return result.rows[0];
};

/**
 * Update user verification status
 * @param {Number} id - User ID
 * @param {String} status - Verification status (PENDING, VERIFIED, REJECTED)
 * @param {String} notes - Verification notes
 * @param {Number} adminId - Admin ID who performed the verification
 * @returns {Promise<Object>} Updated user object
 */
const updateVerificationStatus = async (id, status, notes, adminId) => {
  const result = await db.query(
    `UPDATE users 
     SET verification_status = $1, 
         verification_notes = $2,
         verified_by = $3,
         verified_at = NOW(),
         is_verified = $4,
         updated_at = NOW()
     WHERE id = $5
     RETURNING id, name, government_id, verification_status, verified_at`,
    [
      status,
      notes,
      adminId,
      status === 'VERIFIED', // Set is_verified to true only if status is VERIFIED
      id
    ]
  );
  
  return result.rows[0];
};

/**
 * Get user's biometric data
 * @param {Number} userId - User ID
 * @returns {Promise<Object>} Biometric data object
 */
const getUserBiometricData = async (userId) => {
  const result = await db.query(
    `SELECT id, facemesh_hash, facemesh_data, is_active, blockchain_tx_hash, created_at
     FROM biometric_data
     WHERE user_id = $1 AND is_active = true`,
    [userId]
  );
  
  return result.rows[0];
};

/**
 * Update user's biometric data
 * @param {Number} userId - User ID
 * @param {Object} facemeshData - New facemesh data
 * @returns {Promise<Object>} Updated biometric data object
 */
const updateBiometricData = async (userId, facemeshData) => {
  // Generate facemesh hash
  const facemeshHash = generateFacemeshHash(facemeshData);
  
  return db.executeTransaction(async (client) => {
    // Set all existing biometric data to inactive
    await client.query(
      'UPDATE biometric_data SET is_active = false WHERE user_id = $1',
      [userId]
    );
    
    // Insert new biometric data
    const result = await client.query(
      `INSERT INTO biometric_data (user_id, facemesh_hash, facemesh_data, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING id, facemesh_hash, is_active, created_at`,
      [userId, facemeshHash, JSON.stringify(facemeshData)]
    );
    
    return result.rows[0];
  });
};

/**
 * Get all users with pagination and filtering
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Users and pagination info
 */
const getAllUsers = async (options) => {
  const { page = 1, limit = 10, search = '', status = '' } = options;
  
  let query = `
    SELECT u.id, u.name, u.government_id, u.email, u.phone, u.avax_address, 
           u.is_verified, u.verification_status, u.created_at, u.updated_at,
           EXISTS(SELECT 1 FROM biometric_data b WHERE b.user_id = u.id AND b.is_active = true) as has_biometric
    FROM users u
    WHERE 1=1
  `;
  
  const queryParams = [];
  let paramIndex = 1;
  
  if (search) {
    query += ` AND (u.name ILIKE $${paramIndex} OR u.government_id ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
    queryParams.push(`%${search}%`);
    paramIndex++;
  }
  
  if (status) {
    query += ` AND u.verification_status = $${paramIndex}`;
    queryParams.push(status);
    paramIndex++;
  }
  
  // Count total users matching the criteria
  const countQuery = `SELECT COUNT(*) FROM (${query}) AS count`;
  const countResult = await db.query(countQuery, queryParams);
  const totalUsers = parseInt(countResult.rows[0].count);
  
  // Add pagination
  const offset = (page - 1) * limit;
  query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  queryParams.push(limit, offset);
  
  const result = await db.query(query, queryParams);
  
  return {
    users: result.rows,
    pagination: {
      total: totalUsers,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(totalUsers / limit)
    }
  };
};

/**
 * Verify user's facemesh hash
 * @param {String} governmentId - Government ID
 * @param {String} facemeshHash - Facemesh hash to verify
 * @returns {Promise<Object>} User object if verification succeeds
 */
const verifyUserByFacemeshHash = async (governmentId, facemeshHash) => {
  const result = await db.query(
    `SELECT u.id, u.government_id, u.name, u.email, u.phone, u.avax_address, 
            u.is_verified, u.verification_status
     FROM users u
     JOIN biometric_data b ON u.id = b.user_id
     WHERE u.government_id = $1 AND b.facemesh_hash = $2 AND b.is_active = true`,
    [governmentId, facemeshHash]
  );
  
  return result.rows[0];
};

module.exports = {
  getUserById,
  getUserByGovernmentId,
  createUser,
  updateUser,
  updateVerificationStatus,
  getUserBiometricData,
  updateBiometricData,
  getAllUsers,
  verifyUserByFacemeshHash
};
