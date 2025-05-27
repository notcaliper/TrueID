/**
 * Script to create a new admin user for DBIS
 * 
 * Usage:
 * node create-admin.js
 * 
 * The script will prompt for username, password, email, and role
 */

require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const argon2 = require('argon2');
const readline = require('readline');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dbis',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function collectInput() {
  try {
    console.log('=== Create New Admin User ===');
    
    // Get username
    let username = '';
    while (!username) {
      username = await prompt('Enter username: ');
      if (!username) console.log('Username is required.');
    }
    
    // Get password
    let password = '';
    while (!password) {
      password = await prompt('Enter password: ');
      if (!password) console.log('Password is required.');
      
      if (password.length < 8) {
        console.log('Password must be at least 8 characters long.');
        password = '';
      }
    }
    
    // Get email
    let email = '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    while (!email || !emailRegex.test(email)) {
      email = await prompt('Enter email: ');
      if (!email) {
        console.log('Email is required.');
      } else if (!emailRegex.test(email)) {
        console.log('Please enter a valid email address.');
        email = '';
      }
    }
    
    // Get role
    const validRoles = ['ADMIN', 'SUPER_ADMIN'];
    let role = '';
    while (!validRoles.includes(role)) {
      role = await prompt(`Enter role (${validRoles.join('/')}): `);
      if (!role) {
        role = 'ADMIN'; // Default role
        console.log(`No role specified, using default role: ${role}`);
      } else if (!validRoles.includes(role)) {
        console.log(`Invalid role. Choose from: ${validRoles.join(', ')}`);
      }
    }
    
    // Confirm information
    console.log('\nPlease confirm the information:');
    console.log(`Username: ${username}`);
    console.log(`Password: ${'*'.repeat(password.length)}`);
    console.log(`Email: ${email}`);
    console.log(`Role: ${role}`);
    
    const confirm = await prompt('\nCreate admin with this information? (y/n): ');
    
    if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
      return { username, password, email, role };
    } else {
      console.log('Admin creation cancelled.');
      process.exit(0);
    }
  } finally {
    rl.close();
  }
}

async function createAdmin(userData) {
  const { username, password, email, role } = userData;

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
    console.log('\nAdmin created successfully:');
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
    console.log(`Password: ${'*'.repeat(password.length)}`);
    console.log('\nYou can now log in to the Government Admin Portal with these credentials.');

  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Main function
async function main() {
  const userData = await collectInput();
  await createAdmin(userData);
}

// Run the main function
main();
