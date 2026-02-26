/**
 * TrueID Backend — Interactive Setup Script
 * ==========================================
 * Guides you through the complete backend configuration:
 *   1. Install npm dependencies
 *   2. Configure PostgreSQL (host, port, user, password, db name)
 *   3. Create the database & run schema
 *   4. Configure JWT secrets (auto-generate or manual)
 *   5. Configure blockchain wallet (private key, RPC URL)
 *   6. Optionally deploy the smart contract to Avalanche Fuji
 *   7. Create the initial admin account
 *   8. Write the .env file
 *   9. Test the connection
 *
 * Usage:
 *   cd backend
 *   node setup.js
 *
 * Or from root:
 *   node backend/setup.js
 */

const readline = require('readline');
const crypto = require('crypto');
const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question, defaultValue = '') {
  const suffix = defaultValue ? ` [${defaultValue}]` : '';
  return new Promise(resolve => {
    rl.question(`  ${question}${suffix}: `, answer => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

function askPassword(question) {
  return new Promise(resolve => {
    // For password input, we still show * for each character
    process.stdout.write(`  ${question}: `);
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    if (stdin.setRawMode) stdin.setRawMode(true);
    stdin.resume();

    let password = '';
    const onData = (char) => {
      const c = char.toString('utf8');
      if (c === '\n' || c === '\r' || c === '\u0004') {
        stdin.removeListener('data', onData);
        if (stdin.setRawMode) stdin.setRawMode(wasRaw);
        process.stdout.write('\n');
        resolve(password);
      } else if (c === '\u0003') {
        // Ctrl+C
        process.exit();
      } else if (c === '\u007F' || c === '\b') {
        // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write(`  ${question}: ${'*'.repeat(password.length)}`);
        }
      } else {
        password += c;
        process.stdout.write('*');
      }
    };
    stdin.on('data', onData);
  });
}

function askYesNo(question, defaultYes = true) {
  const hint = defaultYes ? '[Y/n]' : '[y/N]';
  return new Promise(resolve => {
    rl.question(`  ${question} ${hint}: `, answer => {
      const a = answer.trim().toLowerCase();
      if (a === '') resolve(defaultYes);
      else resolve(a === 'y' || a === 'yes');
    });
  });
}

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

function banner(text) {
  const line = '═'.repeat(62);
  console.log(`\n╔${line}╗`);
  console.log(`║  ${text.padEnd(60)}║`);
  console.log(`╚${line}╝`);
}

function section(text) {
  console.log(`\n┌─── ${text} ${'─'.repeat(Math.max(0, 55 - text.length))}┐`);
}

function success(text) {
  console.log(`  ✅ ${text}`);
}

function warn(text) {
  console.log(`  ⚠️  ${text}`);
}

function fail(text) {
  console.log(`  ❌ ${text}`);
}

function info(text) {
  console.log(`  ℹ️  ${text}`);
}

function runCmd(cmd, options = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe', ...options });
  } catch (err) {
    return null;
  }
}

// ─── Main Setup ──────────────────────────────────────────────────────────────

async function main() {
  const backendDir = path.resolve(__dirname);
  const configDir = path.join(backendDir, 'config');
  const schemaFile = path.join(configDir, 'database.sql');
  const envFile = path.join(backendDir, '.env');

  // Collect all config values
  const config = {
    NODE_ENV: 'development',
    PORT: '5000',
    API_URL: '',
    DB_USER: 'postgres',
    DB_HOST: 'localhost',
    DB_NAME: 'trueid_db',
    DB_PASSWORD: '',
    DB_PORT: '5432',
    DB_SSL: 'false',
    DB_CONNECTION_RETRIES: '5',
    DB_CONNECTION_RETRY_DELAY: '3000',
    JWT_SECRET: '',
    JWT_EXPIRATION: '24h',
    REFRESH_TOKEN_SECRET: '',
    REFRESH_TOKEN_EXPIRATION: '7d',
    BLOCKCHAIN_RPC_URL: 'https://api.avax-test.network/ext/bc/C/rpc',
    AVALANCHE_FUJI_RPC_URL: 'https://api.avax-test.network/ext/bc/C/rpc',
    CONTRACT_ADDRESS: '',
    AVALANCHE_FUJI_CONTRACT_ADDRESS: '',
    ADMIN_WALLET_PRIVATE_KEY: '',
    ADMIN_WALLET_ADDRESS: '',
    ADMIN_PRIVATE_KEY: '',
    FRONTEND_URL: 'http://localhost:3000',
    INITIAL_ADMIN_PASSWORD: 'admin123',
    LOG_LEVEL: 'info',
  };

  banner('TrueID Backend Setup Wizard');
  console.log('  This script will walk you through configuring the backend.');
  console.log('  Press Enter to accept default values shown in [brackets].\n');

  // ─── Step 1: Install dependencies ──────────────────────────────────────────

  section('Step 1/8 — Install Dependencies');

  const hasNodeModules = fs.existsSync(path.join(backendDir, 'node_modules'));
  if (hasNodeModules) {
    info('node_modules already exists.');
    const reinstall = await askYesNo('Re-install dependencies?', false);
    if (reinstall) {
      console.log('  Installing dependencies (this may take a minute)...');
      try {
        execSync('npm install', { cwd: backendDir, stdio: 'inherit' });
        success('Dependencies installed.');
      } catch {
        warn('npm install had warnings, but continuing...');
      }
    } else {
      success('Skipping dependency install.');
    }
  } else {
    console.log('  Installing dependencies (this may take a minute)...');
    try {
      execSync('npm install', { cwd: backendDir, stdio: 'inherit' });
      success('Dependencies installed.');
    } catch {
      warn('npm install had issues. You may need to run it manually.');
    }
  }

  // ─── Step 2: Server configuration ─────────────────────────────────────────

  section('Step 2/8 — Server Configuration');

  config.NODE_ENV = await ask('Environment (development/production)', 'development');
  config.PORT = await ask('Server port', '5000');
  config.FRONTEND_URL = await ask('Frontend URL (for CORS)', 'http://localhost:3000');
  config.API_URL = `http://localhost:${config.PORT}/api`;
  config.LOG_LEVEL = await ask('Log level (error/warn/info/debug)', 'info');
  success('Server configuration set.');

  // ─── Step 3: PostgreSQL configuration ─────────────────────────────────────

  section('Step 3/8 — PostgreSQL Database');

  console.log('  Enter your PostgreSQL connection details:\n');
  config.DB_HOST = await ask('PostgreSQL host/IP', 'localhost');
  config.DB_PORT = await ask('PostgreSQL port', '5432');
  config.DB_USER = await ask('PostgreSQL username', 'postgres');
  config.DB_PASSWORD = await askPassword('PostgreSQL password');
  config.DB_NAME = await ask('Database name', 'trueid_db');

  const useSSL = await askYesNo('Enable SSL for database?', false);
  config.DB_SSL = useSSL ? 'true' : 'false';

  // Test the connection
  console.log('\n  Testing PostgreSQL connection...');
  let dbConnected = false;
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      user: config.DB_USER,
      host: config.DB_HOST,
      database: 'postgres', // Connect to default DB first
      password: config.DB_PASSWORD,
      port: parseInt(config.DB_PORT),
      ssl: config.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
    });

    const client = await pool.connect();
    success('Connected to PostgreSQL successfully!');
    dbConnected = true;

    // Check if the target database exists
    const dbCheck = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`, [config.DB_NAME]
    );

    if (dbCheck.rows.length === 0) {
      console.log(`\n  Database "${config.DB_NAME}" does not exist.`);
      const createDb = await askYesNo(`Create database "${config.DB_NAME}"?`, true);
      if (createDb) {
        await client.query(`CREATE DATABASE "${config.DB_NAME}"`);
        success(`Database "${config.DB_NAME}" created.`);
      }
    } else {
      success(`Database "${config.DB_NAME}" already exists.`);
    }

    client.release();
    await pool.end();
  } catch (err) {
    fail(`Could not connect to PostgreSQL: ${err.message}`);
    warn('Make sure PostgreSQL is running and credentials are correct.');
    warn('The .env file will still be written — you can fix the values later.');
  }

  // ─── Step 4: Run database schema ──────────────────────────────────────────

  section('Step 4/8 — Database Schema');

  if (dbConnected) {
    const runSchema = await askYesNo('Run database schema (create tables)?', true);
    if (runSchema) {
      try {
        const { Pool } = require('pg');
        const appPool = new Pool({
          user: config.DB_USER,
          host: config.DB_HOST,
          database: config.DB_NAME,
          password: config.DB_PASSWORD,
          port: parseInt(config.DB_PORT),
          ssl: config.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        });

        if (fs.existsSync(schemaFile)) {
          const schema = fs.readFileSync(schemaFile, 'utf8');
          await appPool.query(schema);
          success('Database schema applied from config/database.sql');
        } else {
          // Try the root database/schema.sql
          const altSchema = path.join(backendDir, '..', 'database', 'schema.sql');
          if (fs.existsSync(altSchema)) {
            const schema = fs.readFileSync(altSchema, 'utf8');
            await appPool.query(schema);
            success('Database schema applied from database/schema.sql');
          } else {
            warn('No schema file found. You will need to create tables manually.');
          }
        }

        // Run migration files if they exist
        const migrationsDir = path.join(backendDir, 'migrations');
        if (fs.existsSync(migrationsDir)) {
          const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
          if (migrations.length > 0) {
            console.log(`  Found ${migrations.length} migration file(s)...`);
            for (const mig of migrations) {
              try {
                const sql = fs.readFileSync(path.join(migrationsDir, mig), 'utf8');
                await appPool.query(sql);
                success(`Migration applied: ${mig}`);
              } catch (migErr) {
                if (migErr.message.includes('already exists') || migErr.message.includes('duplicate')) {
                  info(`Migration already applied: ${mig}`);
                } else {
                  warn(`Migration failed: ${mig} — ${migErr.message}`);
                }
              }
            }
          }
        }

        await appPool.end();
      } catch (err) {
        fail(`Schema setup failed: ${err.message}`);
        warn('You may need to run the schema manually.');
      }
    } else {
      info('Skipping schema setup.');
    }
  } else {
    warn('Skipping schema setup (no database connection).');
  }

  // ─── Step 5: JWT configuration ────────────────────────────────────────────

  section('Step 5/8 — JWT Authentication');

  const autoJwt = await askYesNo('Auto-generate JWT secrets? (recommended)', true);
  if (autoJwt) {
    config.JWT_SECRET = generateSecret(64);
    config.REFRESH_TOKEN_SECRET = generateSecret(64);
    success('JWT secrets auto-generated.');
  } else {
    config.JWT_SECRET = await ask('JWT secret (min 32 chars)');
    config.REFRESH_TOKEN_SECRET = await ask('Refresh token secret (min 32 chars)');
  }
  config.JWT_EXPIRATION = await ask('Access token expiry', '24h');
  config.REFRESH_TOKEN_EXPIRATION = await ask('Refresh token expiry', '7d');
  success('JWT configuration set.');

  // ─── Step 6: Blockchain / Wallet Configuration ────────────────────────────

  section('Step 6/8 — Blockchain & Wallet (Avalanche Fuji Testnet)');

  console.log('  The system uses Avalanche Fuji C-Chain for on-chain identity.\n');

  const configureBlockchain = await askYesNo('Configure blockchain now?', true);

  if (configureBlockchain) {
    config.BLOCKCHAIN_RPC_URL = await ask('Avalanche Fuji RPC URL', 'https://api.avax-test.network/ext/bc/C/rpc');
    config.AVALANCHE_FUJI_RPC_URL = config.BLOCKCHAIN_RPC_URL;

    console.log('\n  You need an admin wallet private key to sign transactions.');
    console.log('  Get testnet AVAX from: https://faucet.avax.network/\n');

    config.ADMIN_WALLET_PRIVATE_KEY = await askPassword('Admin wallet private key (without 0x prefix)');
    // Strip 0x if provided
    if (config.ADMIN_WALLET_PRIVATE_KEY.startsWith('0x')) {
      config.ADMIN_WALLET_PRIVATE_KEY = config.ADMIN_WALLET_PRIVATE_KEY.slice(2);
    }
    config.ADMIN_PRIVATE_KEY = config.ADMIN_WALLET_PRIVATE_KEY;

    // Derive wallet address from private key
    if (config.ADMIN_WALLET_PRIVATE_KEY && config.ADMIN_WALLET_PRIVATE_KEY.length === 64) {
      try {
        const ethers = require('ethers');
        const wallet = new ethers.Wallet(`0x${config.ADMIN_WALLET_PRIVATE_KEY}`);
        config.ADMIN_WALLET_ADDRESS = wallet.address;
        success(`Wallet address derived: ${wallet.address}`);

        // Check balance
        try {
          const provider = new ethers.providers.JsonRpcProvider(config.BLOCKCHAIN_RPC_URL);
          const balance = await provider.getBalance(wallet.address);
          const avax = ethers.utils.formatEther(balance);
          if (parseFloat(avax) > 0) {
            success(`Wallet balance: ${avax} AVAX`);
          } else {
            warn(`Wallet balance: 0 AVAX — Get testnet tokens from https://faucet.avax.network/`);
          }
        } catch {
          warn('Could not check wallet balance (RPC may be unreachable).');
        }
      } catch {
        warn('Could not derive wallet address. Check the private key.');
        config.ADMIN_WALLET_ADDRESS = await ask('Admin wallet address (0x...)');
      }
    } else if (config.ADMIN_WALLET_PRIVATE_KEY) {
      warn('Private key should be 64 hex characters.');
      config.ADMIN_WALLET_ADDRESS = await ask('Admin wallet address (0x...)');
    }

    // Contract address
    console.log('');
    const existingDeployment = path.join(backendDir, 'blockchain', 'deployments', 'avalanche_fuji-deployment.json');
    let existingContract = '';
    if (fs.existsSync(existingDeployment)) {
      try {
        const dep = JSON.parse(fs.readFileSync(existingDeployment, 'utf8'));
        existingContract = dep.contractAddress || '';
        info(`Found existing deployment: ${existingContract}`);
      } catch {}
    }

    const hasContract = await askYesNo('Do you already have a deployed contract address?',
      existingContract ? true : false);

    if (hasContract) {
      config.CONTRACT_ADDRESS = await ask('Contract address', existingContract);
      config.AVALANCHE_FUJI_CONTRACT_ADDRESS = config.CONTRACT_ADDRESS;
      success('Contract address configured.');
    } else {
      console.log('');
      const deployNow = await askYesNo('Deploy the IdentityManagement contract now?', true);
      if (deployNow) {
        console.log('\n  Deploying contract to Avalanche Fuji Testnet...');
        console.log('  This may take 30-60 seconds...\n');

        // Write a temporary .env so hardhat can read the private key
        const tempEnv = `ADMIN_PRIVATE_KEY=0x${config.ADMIN_WALLET_PRIVATE_KEY}\nAVALANCHE_FUJI_RPC_URL=${config.BLOCKCHAIN_RPC_URL}\n`;
        fs.writeFileSync(envFile, tempEnv);

        try {
          const deployScript = path.join(backendDir, 'blockchain', 'scripts', 'deploy-avalanche-proxy.js');
          const altDeployScript = path.join(backendDir, 'blockchain', 'deploy.js');
          let deployCmd;

          if (fs.existsSync(deployScript)) {
            deployCmd = `npx hardhat run --network avalanche_fuji "${deployScript}"`;
          } else if (fs.existsSync(altDeployScript)) {
            deployCmd = `node "${altDeployScript}"`;
          }

          if (deployCmd) {
            const output = execSync(deployCmd, { cwd: backendDir, encoding: 'utf8', timeout: 120000 });
            console.log(output);

            // Try to read the deployment result
            if (fs.existsSync(existingDeployment)) {
              const dep = JSON.parse(fs.readFileSync(existingDeployment, 'utf8'));
              config.CONTRACT_ADDRESS = dep.contractAddress || '';
              config.AVALANCHE_FUJI_CONTRACT_ADDRESS = config.CONTRACT_ADDRESS;
              success(`Contract deployed at: ${config.CONTRACT_ADDRESS}`);
            } else {
              // Try to parse address from output
              const match = output.match(/0x[a-fA-F0-9]{40}/);
              if (match) {
                config.CONTRACT_ADDRESS = match[0];
                config.AVALANCHE_FUJI_CONTRACT_ADDRESS = config.CONTRACT_ADDRESS;
                success(`Contract deployed at: ${config.CONTRACT_ADDRESS}`);
              } else {
                warn('Could not auto-detect contract address from deploy output.');
                config.CONTRACT_ADDRESS = await ask('Enter the deployed contract address');
                config.AVALANCHE_FUJI_CONTRACT_ADDRESS = config.CONTRACT_ADDRESS;
              }
            }
          } else {
            warn('No deploy script found. Please deploy manually and enter the address.');
            config.CONTRACT_ADDRESS = await ask('Contract address');
            config.AVALANCHE_FUJI_CONTRACT_ADDRESS = config.CONTRACT_ADDRESS;
          }
        } catch (err) {
          fail(`Deployment failed: ${err.message}`);
          warn('You can deploy later with: npm run blockchain:deploy:fuji');
          config.CONTRACT_ADDRESS = await ask('Contract address (leave blank to skip)', '');
          config.AVALANCHE_FUJI_CONTRACT_ADDRESS = config.CONTRACT_ADDRESS;
        }
      } else {
        info('Skipping contract deployment.');
        info('Deploy later with: npm run blockchain:deploy:fuji');
      }
    }
  } else {
    info('Skipping blockchain setup. You can configure it later in the .env file.');
  }

  // ─── Step 7: Admin Account ────────────────────────────────────────────────

  section('Step 7/8 — Initial Admin Account');

  if (dbConnected) {
    const createAdmin = await askYesNo('Create an admin account now?', true);
    if (createAdmin) {
      const adminUsername = await ask('Admin username', 'admin');
      const adminEmail = await ask('Admin email', 'admin@trueid.gov');
      const adminPassword = await askPassword('Admin password (min 8 chars)');
      const adminRole = await ask('Role (ADMIN / SUPER_ADMIN)', 'SUPER_ADMIN');

      config.INITIAL_ADMIN_PASSWORD = adminPassword || 'admin123';

      try {
        const argon2 = require('argon2');
        const { Pool } = require('pg');

        const pool = new Pool({
          user: config.DB_USER,
          host: config.DB_HOST,
          database: config.DB_NAME,
          password: config.DB_PASSWORD,
          port: parseInt(config.DB_PORT),
          ssl: config.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        });

        const hashedPassword = await argon2.hash(adminPassword || 'admin123');

        // Upsert admin
        await pool.query(`
          INSERT INTO admins (username, password, email, role)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (username) DO UPDATE SET
            password = $2,
            email = $3,
            role = $4,
            updated_at = CURRENT_TIMESTAMP
        `, [adminUsername, hashedPassword, adminEmail, adminRole.toUpperCase()]);

        success(`Admin "${adminUsername}" created (role: ${adminRole.toUpperCase()}).`);
        await pool.end();
      } catch (err) {
        fail(`Could not create admin: ${err.message}`);
        warn('You can create one later: node scripts/create-admin-direct.js');
      }
    }
  } else {
    info('Skipping admin creation (no database connection).');
    config.INITIAL_ADMIN_PASSWORD = await ask('Initial admin password (for later setup)', 'admin123');
  }

  // ─── Step 8: Write .env file ──────────────────────────────────────────────

  section('Step 8/8 — Write Configuration');

  const envContent = `# ============================================
# TrueID Backend Configuration
# Generated by setup.js on ${new Date().toISOString()}
# ============================================

# Server Configuration
NODE_ENV=${config.NODE_ENV}
PORT=${config.PORT}
API_URL=${config.API_URL}
LOG_LEVEL=${config.LOG_LEVEL}

# Frontend URL (CORS)
FRONTEND_URL=${config.FRONTEND_URL}

# Database Configuration (PostgreSQL)
DB_USER=${config.DB_USER}
DB_HOST=${config.DB_HOST}
DB_NAME=${config.DB_NAME}
DB_PASSWORD=${config.DB_PASSWORD}
DB_PORT=${config.DB_PORT}
DB_SSL=${config.DB_SSL}
DB_CONNECTION_RETRIES=${config.DB_CONNECTION_RETRIES}
DB_CONNECTION_RETRY_DELAY=${config.DB_CONNECTION_RETRY_DELAY}

# JWT Authentication
JWT_SECRET=${config.JWT_SECRET}
JWT_EXPIRATION=${config.JWT_EXPIRATION}
REFRESH_TOKEN_SECRET=${config.REFRESH_TOKEN_SECRET}
REFRESH_TOKEN_EXPIRATION=${config.REFRESH_TOKEN_EXPIRATION}

# Blockchain Configuration (Avalanche Fuji Testnet)
BLOCKCHAIN_RPC_URL=${config.BLOCKCHAIN_RPC_URL}
AVALANCHE_FUJI_RPC_URL=${config.AVALANCHE_FUJI_RPC_URL}
CONTRACT_ADDRESS=${config.CONTRACT_ADDRESS}
AVALANCHE_FUJI_CONTRACT_ADDRESS=${config.AVALANCHE_FUJI_CONTRACT_ADDRESS}
ADMIN_WALLET_PRIVATE_KEY=${config.ADMIN_WALLET_PRIVATE_KEY}
ADMIN_WALLET_ADDRESS=${config.ADMIN_WALLET_ADDRESS}
ADMIN_PRIVATE_KEY=${config.ADMIN_PRIVATE_KEY ? '0x' + config.ADMIN_PRIVATE_KEY : ''}

# Initial Admin
INITIAL_ADMIN_PASSWORD=${config.INITIAL_ADMIN_PASSWORD}
`;

  // Check if .env already exists
  if (fs.existsSync(envFile)) {
    const overwrite = await askYesNo('.env file already exists. Overwrite?', false);
    if (!overwrite) {
      // Save as .env.new instead
      const newEnvFile = path.join(backendDir, '.env.new');
      fs.writeFileSync(newEnvFile, envContent);
      info(`Configuration saved to .env.new instead.`);
      info('Review and rename it to .env when ready.');
    } else {
      // Backup old .env
      const backupFile = path.join(backendDir, `.env.backup.${Date.now()}`);
      fs.copyFileSync(envFile, backupFile);
      info(`Old .env backed up to ${path.basename(backupFile)}`);
      fs.writeFileSync(envFile, envContent);
      success('.env file written.');
    }
  } else {
    fs.writeFileSync(envFile, envContent);
    success('.env file created.');
  }

  // ─── Final Connection Test ─────────────────────────────────────────────────

  banner('Setup Complete!');

  console.log('\n  Summary:');
  console.log(`    Server      : ${config.NODE_ENV} on port ${config.PORT}`);
  console.log(`    Database    : ${config.DB_USER}@${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`);
  console.log(`    JWT         : ${config.JWT_SECRET ? 'Configured' : 'Not set'}`);
  console.log(`    Blockchain  : ${config.CONTRACT_ADDRESS ? config.CONTRACT_ADDRESS : 'Not configured'}`);
  console.log(`    Wallet      : ${config.ADMIN_WALLET_ADDRESS || 'Not configured'}`);
  console.log(`    Frontend    : ${config.FRONTEND_URL}`);

  console.log('\n  Next steps:');
  if (!config.CONTRACT_ADDRESS) {
    console.log('    1. Deploy the smart contract:');
    console.log('       npm run blockchain:deploy:fuji');
    console.log('       Then add CONTRACT_ADDRESS to your .env file\n');
  }
  console.log('    Start the server:');
  console.log('      npm run dev     (development with auto-reload)');
  console.log('      npm start       (production)\n');

  rl.close();
}

// ─── Entry ───────────────────────────────────────────────────────────────────

main().catch(err => {
  console.error(`\n  ❌ Setup failed: ${err.message}`);
  console.error(err.stack);
  rl.close();
  process.exit(1);
});
