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

async function runMigration() {
  try {
    // Check if migration was already applied
    const checkResult = await pool.query(
      'SELECT COUNT(*) FROM migrations WHERE name = $1',
      ['add_verification_requests']
    );
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      console.log('Migration was already applied');
      process.exit(0);
    }
    
    console.log('Reading migration file...');
    const migrationPath = path.resolve(__dirname, '..', 'migrations', 'add_verification_requests.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running verification_requests migration...');
    await pool.query(migration);
    
    // Log the migration in migrations table
    await pool.query(
      'INSERT INTO migrations (name, applied_at) VALUES ($1, NOW())',
      ['add_verification_requests']
    );
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration(); 