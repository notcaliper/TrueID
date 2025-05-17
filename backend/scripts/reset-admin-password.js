/**
 * Script to reset admin password
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

async function resetAdminPassword() {
  try {
    console.log('Resetting admin password...');
    
    // Generate new password hash
    const password = 'admin123';
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4
    });
    
    console.log(`New password hash generated for "${password}"`);
    
    // Update admin password
    const updateResult = await pool.query(
      'UPDATE admins SET password = $1 WHERE email = $2 RETURNING id, username, email',
      [hashedPassword, 'admin@dbis.gov']
    );
    
    if (updateResult.rows.length === 0) {
      console.error('Error: Admin user not found');
      return;
    }
    
    const admin = updateResult.rows[0];
    console.log('Admin password updated successfully:');
    console.log(`ID: ${admin.id}`);
    console.log(`Username: ${admin.username}`);
    console.log(`Email: ${admin.email}`);
    
    // Verify the new password works
    const adminResult = await pool.query(
      'SELECT password FROM admins WHERE email = $1',
      ['admin@dbis.gov']
    );
    
    const storedHash = adminResult.rows[0].password;
    const verificationResult = await argon2.verify(storedHash, password);
    
    console.log(`\nVerification test with new hash: ${verificationResult ? 'SUCCESS' : 'FAILED'}`);
    console.log('\nYou can now log in with:');
    console.log('Email: admin@dbis.gov');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the reset function
resetAdminPassword();
