const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { Pool } = require('pg');

// Load environment variables with defaults
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'trueid_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
};

console.log('Using database configuration:', {
  ...dbConfig,
  password: '********' // Hide password in logs
});

const pool = new Pool(dbConfig);

async function searchUser(username) {
  const client = await pool.connect();
  try {
    console.log('Connecting to database...');
    
    // Search for user
    const userResult = await client.query(
      `SELECT id, username, name, email, government_id, verification_status, created_at 
       FROM users 
       WHERE username = $1`,
      [username]
    );
    
    if (userResult.rows.length === 0) {
      console.log(`\n❌ No user found with username: ${username}`);
      return;
    }
    
    const user = userResult.rows[0];
    console.log('\n✅ User found:');
    console.log('ID:', user.id);
    console.log('Username:', user.username);
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Government ID:', user.government_id);
    console.log('Verification Status:', user.verification_status);
    console.log('Created At:', user.created_at);

    // Get professional records with proper verification status
    const recordsResult = await client.query(
      `SELECT id, record_type, institution, title, start_date, end_date,
              verification_status, blockchain_tx_hash, created_at,
              CASE WHEN blockchain_tx_hash IS NOT NULL THEN true ELSE false END as on_blockchain
       FROM professional_records 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [user.id]
    );

    console.log('\n📄 Professional Records:');
    if (recordsResult.rows.length === 0) {
      console.log('No professional records found');
    } else {
      recordsResult.rows.forEach((record, index) => {
        console.log(`\nRecord #${index + 1}:`);
        console.log('ID:', record.id);
        console.log('Type:', record.record_type);
        console.log('Institution:', record.institution);
        console.log('Title:', record.title);
        console.log('Start Date:', record.start_date);
        console.log('End Date:', record.end_date || 'N/A');
        console.log('Verification Status:', record.verification_status);
        console.log('On Blockchain:', record.on_blockchain ? 'Yes' : 'No');
        console.log('Blockchain TX:', record.blockchain_tx_hash || 'N/A');
        console.log('Created At:', record.created_at);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Error searching for user:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Get username from command line argument
const username = process.argv[2];

if (!username) {
  console.error('Error: Please provide a username as an argument');
  console.log('Usage: node search-user.js <username>');
  process.exit(1);
}

// Run the script
console.log('=== User Search Script ===');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('\nSearching for username:', username);

searchUser(username).catch(error => {
  process.exit(1);
}); 