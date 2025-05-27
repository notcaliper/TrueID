/**
 * Script to create an admin user directly in the database
 * This bypasses the API and directly inserts a record into the database
 */

const { Pool } = require('pg');
const argon2 = require('argon2');
require('dotenv').config();

// Function to create admin user
async function createAdminUser(username, email, password, role = 'SUPER_ADMIN') {
  // Create a database connection
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'dbis',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
  });

  try {
    // First check if the admins table exists
    console.log('Checking if admins table exists...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admins'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      console.log('The admins table does not exist. Creating it now...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admins (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'ADMIN',
          is_active BOOLEAN DEFAULT TRUE,
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Admins table created successfully.');
    }

    // Check if username or email already exists
    const existingAdmin = await pool.query(
      'SELECT id FROM admins WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingAdmin.rows.length > 0) {
      console.log('Username or email already exists. Updating password instead...');
      
      // Hash password with Argon2
      const hashedPassword = await argon2.hash(password);
      
      // Update existing admin
      await pool.query(
        `UPDATE admins 
         SET password = $1, role = $2, updated_at = NOW() 
         WHERE username = $3 OR email = $4`,
        [hashedPassword, role, username, email]
      );
      
      console.log(`Admin user ${username} updated successfully.`);
      return;
    }
    
    // Hash password with Argon2
    const hashedPassword = await argon2.hash(password);
    
    // Insert new admin
    const result = await pool.query(
      `INSERT INTO admins (username, password, email, role, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, username, email, role, created_at`,
      [username, hashedPassword, email, role]
    );
    
    const newAdmin = result.rows[0];
    
    console.log('Admin created successfully:');
    console.log(`ID: ${newAdmin.id}`);
    console.log(`Username: ${newAdmin.username}`);
    console.log(`Email: ${newAdmin.email}`);
    console.log(`Role: ${newAdmin.role}`);
    console.log(`Created at: ${newAdmin.created_at}`);
    
    console.log('\nLogin credentials:');
    console.log(`Username: ${username}`);
    console.log(`Password: ${'*'.repeat(password.length)}`);
    console.log('\nYou can now log in to the Government Admin Portal with these credentials.');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Usage: node create-admin-direct.js <username> <email> <password> [role]');
  console.log('Example: node create-admin-direct.js admin2 admin2@trueid.gov SecurePass123 SUPER_ADMIN');
  process.exit(1);
}

const username = args[0];
const email = args[1];
const password = args[2];
const role = args[3] || 'SUPER_ADMIN';

// Call the function with command line arguments
createAdminUser(username, email, password, role)
  .then(() => console.log('Done'))
  .catch(err => console.error('Error:', err));
