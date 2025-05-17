/**
 * Script to update token columns in the database
 * This script alters the token and refresh_token columns in user_sessions and admin_sessions tables
 * to use TEXT type instead of VARCHAR(255) to accommodate longer JWT tokens
 */

require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dbis',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function updateTokenColumns() {
  try {
    console.log('Starting database token column updates...');
    
    // Start a transaction
    await pool.query('BEGIN');
    
    // Alter user_sessions table
    console.log('Altering user_sessions table...');
    await pool.query(`
      ALTER TABLE user_sessions 
      ALTER COLUMN token TYPE TEXT,
      ALTER COLUMN refresh_token TYPE TEXT
    `);
    
    // Alter admin_sessions table
    console.log('Altering admin_sessions table...');
    await pool.query(`
      ALTER TABLE admin_sessions 
      ALTER COLUMN token TYPE TEXT,
      ALTER COLUMN refresh_token TYPE TEXT
    `);
    
    // Commit the transaction
    await pool.query('COMMIT');
    
    console.log('Database token columns updated successfully!');
  } catch (error) {
    // Rollback in case of error
    await pool.query('ROLLBACK');
    console.error('Error updating token columns:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the update function
updateTokenColumns();
