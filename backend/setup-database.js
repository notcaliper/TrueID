/**
 * Database Setup Script
 * Runs all migrations in order to set up the TrueID database
 */

const fs = require('fs');
const path = require('path');
const dbService = require('./services/db.service');
require('dotenv').config();

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const SCHEMA_FILE = path.join(__dirname, 'config', 'database.sql');

// Migration files in order
const MIGRATION_FILES = [
  '001_add_mfa_to_users.sql',
  '002_session_management.sql',
  // Legacy migrations that should run after schema
  'add_verification_requests.sql',
  'add_verification_status.sql'
];

/**
 * Read and execute SQL file
 */
const runSqlFile = async (filePath, description) => {
  console.log(`\n📄 Running: ${description || path.basename(filePath)}`);
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await dbService.query(sql);
    console.log('✅ Completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    // Continue on error - some statements may already exist
    return false;
  }
};

/**
 * Create migrations tracking table
 */
const createMigrationsTable = async () => {
  try {
    await dbService.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Migrations table ready');
  } catch (error) {
    console.error('❌ Failed to create migrations table:', error.message);
    throw error;
  }
};

/**
 * Check if migration was already run
 */
const wasMigrationRun = async (name) => {
  try {
    const result = await dbService.query(
      'SELECT id FROM migrations WHERE name = $1',
      [name]
    );
    return result.rows.length > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Record migration as executed
 */
const recordMigration = async (name) => {
  try {
    await dbService.query(
      'INSERT INTO migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
      [name]
    );
  } catch (error) {
    console.warn('⚠️ Could not record migration:', error.message);
  }
};

/**
 * Run base schema
 */
const runBaseSchema = async () => {
  console.log('\n🏗️  Setting up base database schema...');
  
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.log('⚠️  Schema file not found, skipping base schema setup');
    return;
  }
  
  try {
    const sql = fs.readFileSync(SCHEMA_FILE, 'utf8');
    await dbService.query(sql);
    console.log('✅ Base schema completed');
  } catch (error) {
    console.error('❌ Schema error:', error.message);
    // Continue - tables may already exist
  }
};

/**
 * Run all migrations
 */
const runMigrations = async () => {
  console.log('\n🔄 Running migrations...');
  
  for (const file of MIGRATION_FILES) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Migration file not found: ${file}`);
      continue;
    }
    
    // Check if already run
    const alreadyRun = await wasMigrationRun(file);
    if (alreadyRun) {
      console.log(`⏭️  Skipping ${file} (already executed)`);
      continue;
    }
    
    // Run migration
    const success = await runSqlFile(filePath, file);
    
    if (success) {
      await recordMigration(file);
    }
  }
};

/**
 * Verify database connection and tables
 */
const verifySetup = async () => {
  console.log('\n🔍 Verifying database setup...');
  
  try {
    // Check connection
    const result = await dbService.query('SELECT NOW() as time');
    console.log('✅ Database connected:', result.rows[0].time);
    
    // List tables
    const tablesResult = await dbService.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tables in database:');
    tablesResult.rows.forEach(row => {
      console.log(`   • ${row.table_name}`);
    });
    
    console.log(`\n✅ Total tables: ${tablesResult.rows.length}`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
};

/**
 * Main setup function
 */
const setupDatabase = async () => {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║       TrueID Database Setup                          ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  
  try {
    // Wait for connection
    console.log('\n⏳ Connecting to database...');
    let retries = 0;
    while (!dbService.getConnectionStatus() && retries < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries++;
      process.stdout.write('.');
    }
    
    if (!dbService.getConnectionStatus()) {
      throw new Error('Could not connect to database after 30 seconds');
    }
    
    console.log('\n✅ Connected to database');
    
    // Create migrations table
    await createMigrationsTable();
    
    // Run base schema
    await runBaseSchema();
    
    // Run migrations
    await runMigrations();
    
    // Verify
    await verifySetup();
    
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║       ✅ Database Setup Complete!                   ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
};

// Run if executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
