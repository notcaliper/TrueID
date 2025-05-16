/**
 * Database initialization script for DBIS
 * Sets up the database schema and creates initial admin user
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const argon2 = require('argon2');

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
 * Initialize the database schema
 */
async function initSchema() {
  try {
    console.log('Reading schema file...');
    const schemaPath = path.resolve(__dirname, '..', 'config', 'database.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Initializing database schema...');
    await pool.query(schema);
    
    console.log('Database schema initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database schema:', error);
    return false;
  }
}

/**
 * Create initial admin user
 */
async function createInitialAdmin() {
  try {
    // Check if admin already exists
    const checkResult = await pool.query(
      'SELECT COUNT(*) FROM admins WHERE username = $1',
      ['admin']
    );
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      console.log('Initial admin user already exists');
      return true;
    }
    
    // Create admin password hash
    const password = process.env.INITIAL_ADMIN_PASSWORD || 'admin123';
    const passwordHash = await argon2.hash(password);
    
    // Insert admin user
    await pool.query(
      `INSERT INTO admins (username, password, email, role)
       VALUES ($1, $2, $3, $4)`,
      ['admin', passwordHash, 'admin@dbis.gov', 'SUPER_ADMIN']
    );
    
    console.log('Initial admin user created successfully');
    console.log('Username: admin');
    console.log(`Password: ${password}`);
    console.log('Please change this password after first login!');
    
    return true;
  } catch (error) {
    console.error('Error creating initial admin user:', error);
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
    
    // Initialize schema
    const schemaInitialized = await initSchema();
    if (!schemaInitialized) {
      throw new Error('Failed to initialize database schema');
    }
    
    // Create initial admin
    const adminCreated = await createInitialAdmin();
    if (!adminCreated) {
      throw new Error('Failed to create initial admin user');
    }
    
    console.log('Database initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    // Close pool
    await pool.end();
  }
}

// Run the script
main();
