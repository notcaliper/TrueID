/**
 * Script to add network column to blockchain_transactions table
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create database connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'dbis',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

/**
 * Run the migration
 */
async function runMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = path.resolve(__dirname, 'add_network_column.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration...');
    await pool.query(migration);
    
    console.log('Migration completed successfully');
    return true;
  } catch (error) {
    console.error('Error running migration:', error);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');
    
    // Run migration
    const migrationSuccessful = await runMigration();
    if (!migrationSuccessful) {
      throw new Error('Failed to run migration');
    }
    
    console.log('Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Database migration failed:', error);
    process.exit(1);
  } finally {
    // Close pool
    await pool.end();
  }
}

// Run the script
main();
