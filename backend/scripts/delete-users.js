require('dotenv').config();
const { Pool } = require('pg');

// Load environment variables
const dbConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

// Validate required environment variables
const requiredVars = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Error: Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

const pool = new Pool(dbConfig);

async function deleteAllUsers() {
  const client = await pool.connect();
  try {
    console.log('Connecting to database...');
    await client.query('BEGIN');
    
    // Get count before deletion for logging
    const countResult = await client.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(countResult.rows[0].count);
    
    if (userCount === 0) {
      console.log('No users found in the database.');
      return;
    }
    
    console.log(`Found ${userCount} users to delete...`);
    
    // Delete all users with CASCADE to handle related records
    await client.query('TRUNCATE users CASCADE');
    await client.query('COMMIT');
    
    console.log(`\n✅ Successfully deleted all ${userCount} users and their related data.`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error deleting users:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
console.log('=== User Deletion Script ===');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Database:', `${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
console.log('\nWARNING: This will permanently delete ALL users and their related data!\n');

// Ask for confirmation
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Are you sure you want to continue? (yes/no) ', async (answer) => {
  if (answer.toLowerCase() === 'yes') {
    try {
      await deleteAllUsers();
    } catch (error) {
      process.exit(1);
    }
  } else {
    console.log('Operation cancelled.');
  }
  readline.close();
});
