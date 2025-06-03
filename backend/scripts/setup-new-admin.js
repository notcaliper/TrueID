const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  user: 'postgres',
  host: '144.24.106.127',
  database: 'postgres',
  password: 'terimakichud@U33',
  port: 5432,
});

async function createAdmin() {
  try {
    // Create password hash
    const password = 'Admin@123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new admin
    const result = await pool.query(
      `INSERT INTO admins (username, password, email, role, is_active) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (username) 
       DO UPDATE SET password = EXCLUDED.password, is_active = true 
       RETURNING id, username, email, role`,
      ['superadmin', hashedPassword, 'superadmin@trueid.gov', 'SUPER_ADMIN', true]
    );

    console.log('Admin created successfully:', result.rows[0]);
    console.log('\nLogin credentials:');
    console.log('Username:', 'superadmin');
    console.log('Password:', password);

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await pool.end();
  }
}

createAdmin();
