/**
 * Create Database Script
 * Creates the trueId database if it doesn't exist
 */

const { Pool, Client } = require('pg');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 5432,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

const DB_NAME = process.env.DB_NAME || 'trueId';

console.log('═══════════════════════════════════════════════════');
console.log('       Create Database');
console.log('═══════════════════════════════════════════════════\n');

console.log('Config:');
console.log(`  Host: ${config.host}`);
console.log(`  User: ${config.user}`);
console.log(`  Target DB: ${DB_NAME}\n`);

async function createDatabase() {
  const client = new Client({
    ...config,
    database: 'postgres' // Connect to default postgres database
  });

  try {
    console.log('⏳ Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');

    // Check if database exists
    console.log(`🔍 Checking if database "${DB_NAME}" exists...`);
    const checkResult = await client.query(
      'SELECT datname FROM pg_database WHERE datname = $1',
      [DB_NAME]
    );

    if (checkResult.rows.length > 0) {
      console.log(`✅ Database "${DB_NAME}" already exists\n`);
    } else {
      console.log(`🆕 Creating database "${DB_NAME}"...`);
      await client.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`✅ Database "${DB_NAME}" created successfully\n`);
    }

    // Verify by connecting to the new database
    console.log('🔍 Verifying connection to new database...');
    const testPool = new Pool({
      ...config,
      database: DB_NAME
    });

    const testResult = await testPool.query('SELECT NOW() as time');
    console.log(`✅ Successfully connected to "${DB_NAME}"`);
    console.log(`   Server time: ${testResult.rows[0].time}\n`);

    await testPool.end();

    console.log('═══════════════════════════════════════════════════');
    console.log('       ✅ Database Ready');
    console.log('═══════════════════════════════════════════════════');
    console.log('\nNext step: Run the setup script to create tables');
    console.log('   node setup-database.js');

    return true;

  } catch (error) {
    console.error('\n❌ Error:\n');
    console.error(`  Code: ${error.code || 'N/A'}`);
    console.error(`  Message: ${error.message}\n`);

    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Cannot connect to PostgreSQL server');
      console.error('   - Check if PostgreSQL is running');
      console.error('   - Verify host and port');
    }

    if (error.code === '28P01') {
      console.error('💡 Authentication failed - check username/password');
    }

    if (error.code === '42501') {
      console.error('💡 Permission denied - user cannot create databases');
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('       ❌ Failed');
    console.log('═══════════════════════════════════════════════════');

    return false;

  } finally {
    await client.end().catch(() => {});
  }
}

createDatabase()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
