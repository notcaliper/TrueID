/**
 * Script to create a new admin user for DBIS
 * 
 * Usage:
 * node create-admin.js <username> <password> <email> <role>
 * 
 * Example:
 * node create-admin.js govadmin Password123! govadmin@dbis.gov ADMIN
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

async function createAdmin(username, password, email, role = 'ADMIN') {
  if (!username || !password || !email) {
    console.error('Error: Username, password, and email are required');
    process.exit(1);
  }

  // Validate role
  const validRoles = ['ADMIN', 'SUPER_ADMIN'];
  if (!validRoles.includes(role)) {
    console.error(`Error: Role must be one of: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  try {
    // Check if username or email already exists
    const existingAdmin = await pool.query(
      'SELECT id FROM admins WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingAdmin.rows.length > 0) {
      console.error('Error: Username or email already exists');
      process.exit(1);
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

    // Log the admin creation
    await pool.query(
      `INSERT INTO audit_logs (action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        'ADMIN_CREATED',
        'admins',
        newAdmin.id,
        JSON.stringify({
          username: newAdmin.username,
          email: newAdmin.email,
          role: newAdmin.role,
          created_by: 'script'
        }),
        '127.0.0.1'
      ]
    );

    console.log('\nLogin credentials:');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log('\nYou can now log in to the Government Admin Portal with these credentials.');

  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const username = args[0];
const password = args[1];
const email = args[2];
const role = args[3] || 'ADMIN';

createAdmin(username, password, email, role);
