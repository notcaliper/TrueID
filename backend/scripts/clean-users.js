const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { Pool } = require('pg');

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'trueid_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
};

// Hide password in logs
console.log('Using database configuration:', {
  ...dbConfig,
  password: '********'
});

const pool = new Pool(dbConfig);

// Tables that should not be cleaned
const PROTECTED_TABLES = [
  'migrations',           // System table
  'health_status',       // System monitoring
  'dashboard_metrics',   // System metrics
  'admins',             // Admin accounts should be preserved
];

// Tables with user_id foreign key
const USER_TABLES = [
  { name: 'user_sessions', userColumn: 'user_id' },
  { name: 'audit_logs', userColumn: 'user_id' },
  { name: 'biometric_data', userColumn: 'user_id' },
  { name: 'biometric_verifications', userColumn: 'user_id' },
  { name: 'blockchain_transactions', userColumn: 'user_id' },
  { name: 'document_records', userColumn: 'user_id' },
  { name: 'educational_records', userColumn: 'user_id' },
  { name: 'profession_verification', userColumn: 'user_id' },
  { name: 'professional_records', userColumn: 'user_id' },
  { name: 'records', userColumn: 'user_id' },
  { name: 'uploads', userColumn: 'user_id' },
  { name: 'verification_requests', userColumn: 'user_id' }
];

// Tables with cascading relationships that need special handling
const CASCADING_TABLES = [
  { name: 'blockchain_professional_records', dependencies: ['professional_records'] }
];

async function cleanDatabase() {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    console.log('\n🔍 Finding target user...');
    const userResult = await client.query(
      'SELECT id, username FROM users WHERE username = $1',
      ['pro3443421']
    );

    if (userResult.rows.length === 0) {
      throw new Error('User pro3443421 not found! Aborting cleanup.');
    }

    const targetUserId = userResult.rows[0].id;
    console.log(`✅ Found target user: ID ${targetUserId}`);

    // Function to safely delete records
    async function safeDelete(tableName, userIdColumn = 'user_id') {
      if (PROTECTED_TABLES.includes(tableName)) {
        console.log(`ℹ️ Skipping protected table: ${tableName}`);
        return 0;
      }

      try {
        const result = await client.query(
          `DELETE FROM ${tableName} WHERE ${userIdColumn} = $1 RETURNING ${userIdColumn}`,
          [targetUserId]
        );
        console.log(`✅ Deleted ${result.rowCount} records from ${tableName}`);
        return result.rowCount;
      } catch (error) {
        console.error(`❌ Error deleting from ${tableName}:`, error.message);
        throw error;
      }
    }

    // Function to clean cascading tables
    async function cleanCascadingTable(table) {
      try {
        // First get the record IDs from dependent tables
        const validIds = [];
        for (const dep of table.dependencies) {
          const depResult = await client.query(
            `SELECT id FROM ${dep} WHERE user_id = $1`,
            [targetUserId]
          );
          validIds.push(...depResult.rows.map(r => r.id));
        }

        // Then delete records related to these IDs
        const result = await client.query(
          `DELETE FROM ${table.name} WHERE record_id = ANY($1::int[]) RETURNING id`,
          [validIds]
        );
        console.log(`✅ Deleted ${result.rowCount} records from ${table.name}`);
        return result.rowCount;
      } catch (error) {
        console.error(`❌ Error cleaning cascading table ${table.name}:`, error.message);
        throw error;
      }
    }

    console.log('\n🗑️ Starting cleanup process...');
    
    // 1. First handle cascading tables
    console.log('\n📊 Cleaning cascading relationships...');
    for (const table of CASCADING_TABLES) {
      await cleanCascadingTable(table);
    }

    // 2. Clean all user-related tables
    console.log('\n📊 Cleaning user-related tables...');
    for (const table of USER_TABLES) {
      await safeDelete(table.name, table.userColumn);
    }

    // 3. Finally, delete the user
    const deletedUsers = await client.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, username',
      [targetUserId]
    );
    console.log(`✅ Deleted user ${deletedUsers.rows[0].username}`);

    // Commit transaction
    await client.query('COMMIT');
    
    console.log('\n✅ Database cleanup completed successfully!');
    console.log('\nSummary:');
    console.log(`- User pro3443421 (ID: ${targetUserId}) and all associated data have been removed`);
    console.log('- Protected system tables were not modified:', PROTECTED_TABLES.join(', '));

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('\n❌ Error during cleanup:', error.message);
    console.error('All changes have been rolled back.');
    throw error;
  } finally {
    // Release client back to pool
    client.release();
    await pool.end();
  }
}

// Add confirmation prompt
if (process.argv.includes('--confirm')) {
  console.log('=== Database Cleanup Script ===');
  console.log('WARNING: This script will delete user pro3443421 and all their data');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  
  cleanDatabase().catch(error => {
    process.exit(1);
  });
} else {
  console.log('\n⚠️ WARNING: This is a destructive operation!');
  console.log('This script will:');
  console.log('1. Delete user pro3443421');
  console.log('2. Delete ALL associated data for this user');
  console.log('3. Preserve system tables:', PROTECTED_TABLES.join(', '));
  console.log('\nTo proceed, run the script with --confirm flag:');
  console.log('node clean-users.js --confirm');
} 