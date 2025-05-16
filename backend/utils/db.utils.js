/**
 * Database utilities for DBIS
 * Handles database operations and connection pooling
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Create a singleton database connection pool
let pool;

/**
 * Initialize the database connection pool
 * @returns {Object} Database pool instance
 */
const initPool = () => {
  if (!pool) {
    pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'dbis',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }
  
  return pool;
};

/**
 * Execute a database query with parameters
 * @param {String} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
const query = async (text, params) => {
  const pool = initPool();
  return pool.query(text, params);
};

/**
 * Get a client from the pool for transactions
 * @returns {Object} Database client
 */
const getClient = async () => {
  const pool = initPool();
  return pool.connect();
};

/**
 * Initialize the database schema
 * @returns {Promise} Result of schema initialization
 */
const initSchema = async () => {
  try {
    const schemaPath = path.resolve(__dirname, '..', 'config', 'database.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Initializing database schema...');
    
    // Execute the schema SQL
    await query(schema);
    
    console.log('Database schema initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database schema:', error);
    return false;
  }
};

/**
 * Check if the database is accessible
 * @returns {Promise<Boolean>} True if database is accessible
 */
const checkDatabase = async () => {
  try {
    const result = await query('SELECT NOW()');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database check error:', error);
    return false;
  }
};

/**
 * Execute a transaction with multiple queries
 * @param {Function} callback - Callback function that receives a client and executes queries
 * @returns {Promise} Result of the transaction
 */
const executeTransaction = async (callback) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  query,
  getClient,
  initSchema,
  checkDatabase,
  executeTransaction
};
