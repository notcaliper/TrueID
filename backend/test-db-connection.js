/**
 * Simple Database Connection Test
 * Tests direct connection to PostgreSQL database
 */

const { Pool } = require('pg');
require('dotenv').config();

// Get config from environment or use defaults
const config = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000
};

console.log('═══════════════════════════════════════════════════');
console.log('       Database Connection Test');
console.log('═══════════════════════════════════════════════════\n');

console.log('Connection config:');
console.log(`  Host: ${config.host}`);
console.log(`  Port: ${config.port}`);
console.log(`  Database: ${config.database}`);
console.log(`  User: ${config.user}`);
console.log(`  SSL: ${config.ssl ? 'enabled' : 'disabled'}\n`);

const pool = new Pool(config);

async function testConnection() {
  let client;
  
  try {
    console.log('⏳ Attempting to connect...');
    client = await pool.connect();
    
    console.log('✅ Successfully connected to database!\n');
    
    // Test basic query
    const timeResult = await client.query('SELECT NOW() as current_time');
    console.log('📅 Database time:', timeResult.rows[0].current_time);
    
    // Check database version
    const versionResult = await client.query('SELECT version()');
    console.log('🔧 PostgreSQL version:', versionResult.rows[0].version.split(' ')[0] + ' ' + versionResult.rows[0].version.split(' ')[1]);
    
    // List tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`\n📋 Tables found: ${tablesResult.rows.length}`);
    tablesResult.rows.forEach(row => {
      console.log(`   • ${row.table_name}`);
    });
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('       ✅ Connection Test PASSED');
    console.log('═══════════════════════════════════════════════════');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Connection failed!\n');
    console.error('Error details:');
    console.error(`  Code: ${error.code || 'N/A'}`);
    console.error(`  Message: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 The database server refused the connection.');
      console.error('   - Check if PostgreSQL is running on the host');
      console.error('   - Verify the host IP and port are correct');
      console.error('   - Check firewall rules');
    }
    
    if (error.code === '28P01') {
      console.error('\n💡 Authentication failed.');
      console.error('   - Check username and password');
    }
    
    if (error.code === '3D000') {
      console.error('\n💡 Database does not exist.');
      console.error('   - The database "trueId" needs to be created first');
    }
    
    if (error.code === 'ETIMEDOUT') {
      console.error('\n💡 Connection timed out.');
      console.error('   - Host may be unreachable');
      console.error('   - Check network connectivity');
    }
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('       ❌ Connection Test FAILED');
    console.log('═══════════════════════════════════════════════════');
    
    return false;
    
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

testConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
