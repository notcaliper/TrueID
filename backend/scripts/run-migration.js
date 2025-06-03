/**
 * Script to run the blockchain migration with proper error handling
 */
const { spawn } = require('child_process');
const path = require('path');

// Path to the migration script
const migrationScriptPath = path.join(__dirname, 'migrate-to-blockchain.js');

console.log('Starting blockchain migration...');
console.log(`Running script: ${migrationScriptPath}`);

// Run the migration script as a child process
const migration = spawn('node', [migrationScriptPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

// Handle process events
migration.on('error', (error) => {
  console.error('Failed to start migration process:', error);
  process.exit(1);
});

migration.on('close', (code) => {
  if (code === 0) {
    console.log('Migration completed successfully');
    process.exit(0);
  } else {
    console.error(`Migration process exited with code ${code}`);
    process.exit(code);
  }
});
