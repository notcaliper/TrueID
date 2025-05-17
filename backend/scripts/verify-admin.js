/**
 * Script to verify admin credentials and test password verification
 */

require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const argon2 = require('argon2');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dbis',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function verifyAdmin() {
  try {
    console.log('Checking admin user in database...');
    
    // Query admin by email
    const adminResult = await pool.query(
      'SELECT id, username, email, password, role FROM admins WHERE email = $1',
      ['admin@dbis.gov']
    );
    
    if (adminResult.rows.length === 0) {
      console.error('Error: Admin user not found in database');
      return;
    }
    
    const admin = adminResult.rows[0];
    console.log('Admin user found:');
    console.log(`ID: ${admin.id}`);
    console.log(`Username: ${admin.username}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Password Hash: ${admin.password}`);
    
    // Verify password
    const testPassword = 'admin123';
    console.log(`\nTesting password verification for: "${testPassword}"`);
    
    let passwordValid;
    try {
      // Check if password is hashed with argon2
      if (admin.password.startsWith('$argon2')) {
        console.log('Password is hashed with Argon2');
        passwordValid = await argon2.verify(admin.password, testPassword);
      } else {
        // Fallback to bcrypt if needed
        console.log('Password is not hashed with Argon2, trying bcrypt');
        const bcrypt = require('bcryptjs');
        passwordValid = await bcrypt.compare(testPassword, admin.password);
      }
      
      console.log(`Password verification result: ${passwordValid ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.error('Error during password verification:', error);
    }
    
  } catch (error) {
    console.error('Database query error:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the verification
verifyAdmin();
