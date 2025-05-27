/**
 * Decentralized Biometric Identity System (DBIS)
 * Blockchain Manager - A unified tool for managing the blockchain environment
 * 
 * This script provides a menu-driven interface to:
 * - Verify environment setup
 * - Start/stop a local Hardhat node
 * - Deploy smart contracts
 * - Interact with contracts
 * - View deployment information
 * - Deploy to Avalanche networks
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');
const dotenv = require('dotenv');
const net = require('net');

// Initialize environment variables
dotenv.config();

// Constants
const NODE_PID_FILE = path.join(__dirname, '.node.pid');
const LOCAL_DEPLOYMENT_FILE = path.join(__dirname, 'blockchain', 'deployments', 'localhost-deployment.json');
const HARDHAT_LOG_FILE = path.join(__dirname, 'hardhat-node.log');
const AVALANCHE_DEPLOYMENT_FILE = path.join(__dirname, 'blockchain', 'deployments', 'avalanche-deployment.json');
const AVALANCHE_FUJI_DEPLOYMENT_FILE = path.join(__dirname, 'blockchain', 'deployments', 'avalanche_fuji-deployment.json');

// Readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  console.error(`${colors.red}ERROR: ${message}${colors.reset}`);
}

function success(message) {
  console.log(`${colors.green}SUCCESS: ${message}${colors.reset}`);
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port);
  });
}

function isHardhatNodeRunning() {
  try {
    if (fs.existsSync(NODE_PID_FILE)) {
      const pid = fs.readFileSync(NODE_PID_FILE, 'utf8').trim();
      try {
        // Check if process is running
        process.kill(pid, 0);
        return { running: true, pid };
      } catch (e) {
        // Process doesn't exist
        return { running: false, pid: null };
      }
    }
    return { running: false, pid: null };
  } catch (error) {
    return { running: false, pid: null };
  }
}

function getDeployedContracts(network = 'localhost') {
  try {
    let deploymentFile;
    
    if (network === 'localhost') {
      deploymentFile = LOCAL_DEPLOYMENT_FILE;
    } else if (network === 'avalanche') {
      deploymentFile = AVALANCHE_DEPLOYMENT_FILE;
    } else if (network === 'avalanche_fuji') {
      deploymentFile = AVALANCHE_FUJI_DEPLOYMENT_FILE;
    } else {
      return null;
    }
    
    if (fs.existsSync(deploymentFile)) {
      const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
      return deploymentInfo;
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function checkEnvironment() {
  log('\nChecking environment...', colors.cyan);
  
  // Check Node.js version
  log('Node.js version:');
  try {
    const nodeVersion = process.version;
    log(`  ${nodeVersion}`, colors.green);
  } catch (error) {
    error('Failed to check Node.js version');
  }
  
  // Check NPM version
  log('NPM version:');
  try {
    const npmVersion = execSync('npm -v').toString().trim();
    log(`  ${npmVersion}`, colors.green);
  } catch (error) {
    error('Failed to check NPM version');
  }
  
  // Check required dependencies
  log('Checking dependencies:');
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json')));
  const requiredDeps = ['hardhat', 'ethers', '@nomiclabs/hardhat-ethers', '@nomiclabs/hardhat-waffle'];
  
  for (const dep of requiredDeps) {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      log(`  ${dep}: ✓`, colors.green);
    } else {
      log(`  ${dep}: ✗ (not found in package.json)`, colors.red);
    }
  }
  
  // Check if node_modules exists
  if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
    log('node_modules: ✓', colors.green);
  } else {
    log('node_modules: ✗ (not found, run npm install)', colors.red);
  }
  
  // Check if .env file exists
  if (fs.existsSync(path.join(__dirname, '.env'))) {
    log('.env file: ✓', colors.green);
  } else {
    log('.env file: ✗ (not found)', colors.red);
    
    if (fs.existsSync(path.join(__dirname, '.env.example'))) {
      log('  .env.example found. Would you like to create .env from example? (y/n)');
      
      const answer = await new Promise(resolve => {
        rl.question('> ', resolve);
      });
      
      if (answer.toLowerCase() === 'y') {
        fs.copyFileSync(path.join(__dirname, '.env.example'), path.join(__dirname, '.env'));
        log('  Created .env file from .env.example', colors.green);
      }
    }
  }
  
  // Check for Avalanche configuration
  log('Checking Avalanche configuration:', colors.cyan);
  
  if (process.env.AVALANCHE_FUJI_RPC_URL) {
    log('  Avalanche Fuji Testnet URL: ✓', colors.green);
    log(`  URL: ${process.env.AVALANCHE_FUJI_RPC_URL}`, colors.dim);
  } else {
    log('  Avalanche Fuji Testnet URL: ✗ (not configured in .env)', colors.red);
  }
  
  if (process.env.ADMIN_PRIVATE_KEY) {
    log('  Admin Private Key: ✓', colors.green);
    const maskedKey = process.env.ADMIN_PRIVATE_KEY.substring(0, 6) + '...' + process.env.ADMIN_PRIVATE_KEY.substring(process.env.ADMIN_PRIVATE_KEY.length - 4);
    log(`  Key: ${maskedKey}`, colors.dim);
  } else {
    log('  Admin Private Key: ✗ (not configured in .env)', colors.red);
  }
  
  // Check for port conflicts
  const port8545InUse = await isPortInUse(8545);
  if (port8545InUse) {
    const nodeStatus = isHardhatNodeRunning();
    if (nodeStatus.running) {
      log(`Port 8545: In use by Hardhat node (PID: ${nodeStatus.pid})`, colors.yellow);
    } else {
      log('Port 8545: In use by another process', colors.red);
    }
  } else {
    log('Port 8545: Available ✓', colors.green);
  }
  
  // Check contract deployments
  log('Contract deployments:', colors.cyan);
  
  // Check local deployments
  const localDeployedContracts = getDeployedContracts('localhost');
  if (localDeployedContracts) {
    log('  Local Network:', colors.green);
    log(`    IdentityManagement: ${localDeployedContracts.contractAddress}`, colors.green);
    if (localDeployedContracts.biometricSystemAddress) {
      log(`    BiometricIdentitySystem: ${localDeployedContracts.biometricSystemAddress}`, colors.green);
    }
  } else {
    log('  Local Network: No deployments found', colors.yellow);
  }
  
  // Removed Avalanche C-Chain deployment check as it's not needed
  
  // Check Avalanche Fuji deployments
  const fujiDeployedContracts = getDeployedContracts('avalanche_fuji');
  if (fujiDeployedContracts) {
    log('  Avalanche Fuji Testnet:', colors.green);
    log(`    IdentityManagement: ${fujiDeployedContracts.contractAddress}`, colors.green);
    if (fujiDeployedContracts.biometricSystemAddress) {
      log(`    BiometricIdentitySystem: ${fujiDeployedContracts.biometricSystemAddress}`, colors.green);
    }
  } else {
    log('  Avalanche Fuji Testnet: No deployments found', colors.yellow);
  }
  
  // Return to menu
  log('\nPress Enter to continue...', colors.cyan);
  await new Promise(resolve => rl.question('', resolve));
  showMainMenu();
}

async function startLocalNode() {
  log('\nStarting local Hardhat node...', colors.cyan);
  
  // Check if a node is already running
  const nodeStatus = isHardhatNodeRunning();
  if (nodeStatus.running) {
    log(`A Hardhat node is already running (PID: ${nodeStatus.pid})`, colors.yellow);
    log('Do you want to stop it and start a new one? (y/n)');
    
    const answer = await new Promise(resolve => {
      rl.question('> ', resolve);
    });
    
    if (answer.toLowerCase() === 'y') {
      // Stop existing node
      try {
        process.kill(nodeStatus.pid);
        log('Stopped existing Hardhat node', colors.green);
        // Give it a moment to shut down
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        error(`Failed to stop node: ${error.message}`);
        return showMainMenu();
      }
    } else {
      return showMainMenu();
    }
  }
  
  // Check if port 8545 is available
  const port8545InUse = await isPortInUse(8545);
  if (port8545InUse) {
    error('Port 8545 is already in use by another process');
    log('Would you like to continue anyway? (y/n)', colors.yellow);
    
    const answer = await new Promise(resolve => {
      rl.question('> ', resolve);
    });
    
    if (answer.toLowerCase() !== 'y') {
      return showMainMenu();
    }
  }
  
  // Clear previous log file
  fs.writeFileSync(HARDHAT_LOG_FILE, '');
  
  // Start the node
  log('Starting Hardhat node...', colors.cyan);
  const hardhatNode = spawn('npx', ['hardhat', 'node'], {
    detached: true,
    stdio: ['ignore', fs.openSync(HARDHAT_LOG_FILE, 'a'), fs.openSync(HARDHAT_LOG_FILE, 'a')]
  });
  
  hardhatNode.unref();
  
  // Save the PID
  fs.writeFileSync(NODE_PID_FILE, hardhatNode.pid.toString());
  log(`Node started with PID: ${hardhatNode.pid}`, colors.green);
  
  // Wait a bit for the node to initialize
  log('Waiting for node to initialize...', colors.cyan);
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Check if the node is still running
  try {
    process.kill(hardhatNode.pid, 0);
    
    // Check log file for successful startup
    const logContent = fs.readFileSync(HARDHAT_LOG_FILE, 'utf8');
    if (logContent.includes('Started HTTP and WebSocket JSON-RPC server at')) {
      success('Hardhat node started successfully!');
    } else {
      // Node is running but may not be fully initialized
      log('Node is running but may not be fully initialized yet. Check logs for details.', colors.yellow);
      // Display the tail of the log
      log('\nLast 10 lines of node log:', colors.cyan);
      const logLines = logContent.split('\n');
      const lastLines = logLines.slice(-10);
      lastLines.forEach(line => console.log(`  ${line}`));
    }
  } catch (error) {
    error('Node process terminated unexpectedly');
    // Display the log
    log('\nNode log:', colors.cyan);
    const logContent = fs.readFileSync(HARDHAT_LOG_FILE, 'utf8');
    console.log(logContent);
  }
  
  log('\nPress Enter to continue...', colors.cyan);
  await new Promise(resolve => rl.question('', resolve));
  showMainMenu();
}

async function stopLocalNode() {
  log('\nStopping local Hardhat node...', colors.cyan);
  
  const nodeStatus = isHardhatNodeRunning();
  if (!nodeStatus.running) {
    log('No running Hardhat node found', colors.yellow);
  } else {
    try {
      process.kill(nodeStatus.pid);
      fs.unlinkSync(NODE_PID_FILE);
      success(`Stopped Hardhat node with PID: ${nodeStatus.pid}`);
    } catch (error) {
      error(`Failed to stop node: ${error.message}`);
    }
  }
  
  log('\nPress Enter to continue...', colors.cyan);
  await new Promise(resolve => rl.question('', resolve));
  showMainMenu();
}

async function deployContracts() {
  log('\nDeploying smart contracts to local network...', colors.cyan);
  
  // Check if node is running
  const nodeStatus = isHardhatNodeRunning();
  if (!nodeStatus.running) {
    error('Hardhat node is not running. Start the node first.');
    log('\nPress Enter to continue...', colors.cyan);
    await new Promise(resolve => rl.question('', resolve));
    return showMainMenu();
  }
  
  // Run deployment script
  try {
    log('Running deployment script...', colors.cyan);
    const output = execSync('npx hardhat run --network localhost blockchain/scripts/deploy-local.js', { encoding: 'utf8' });
    console.log(output);
    success('Contracts deployed successfully!');
    
    // Display deployment info
    const deployedContracts = getDeployedContracts();
    if (deployedContracts) {
      log('\nDeployment Information:', colors.cyan);
      log(`Network: ${deployedContracts.network}`, colors.green);
      log(`IdentityManagement: ${deployedContracts.contractAddress}`, colors.green);
      if (deployedContracts.biometricSystemAddress) {
        log(`BiometricIdentitySystem: ${deployedContracts.biometricSystemAddress}`, colors.green);
      }
      log(`Deployer: ${deployedContracts.deployer}`, colors.green);
      log(`Deployment Time: ${deployedContracts.deploymentTime}`, colors.green);
      
      // Update CONTRACT_ADDRESS in .env
      log('\nUpdating CONTRACT_ADDRESS in .env file...', colors.cyan);
      try {
        const envFile = fs.readFileSync('.env', 'utf8');
        const updatedEnv = envFile.replace(/CONTRACT_ADDRESS=.*/g, `CONTRACT_ADDRESS=${deployedContracts.contractAddress}`);
        fs.writeFileSync('.env', updatedEnv);
        success('Updated CONTRACT_ADDRESS in .env file');
      } catch (envErr) {
        error(`Failed to update .env file: ${envErr.message}`);
      }
    }
  } catch (err) {
    error(`Deployment failed: ${err.message}`);
    console.log(err.stdout?.toString() || '');
    console.log(err.stderr?.toString() || '');
  }
  
  log('\nPress Enter to continue...', colors.cyan);
  await new Promise(resolve => rl.question('', resolve));
  showMainMenu();
}

async function interactWithContracts() {
  log('\nInteracting with deployed contracts...', colors.cyan);
  
  // Check if node is running
  const nodeStatus = isHardhatNodeRunning();
  if (!nodeStatus.running) {
    error('Hardhat node is not running. Start the node first.');
    log('\nPress Enter to continue...', colors.cyan);
    await new Promise(resolve => rl.question('', resolve));
    return showMainMenu();
  }
  
  // Check if contracts are deployed
  const deployedContracts = getDeployedContracts();
  if (!deployedContracts) {
    error('No contract deployments found. Deploy contracts first.');
    log('\nPress Enter to continue...', colors.cyan);
    await new Promise(resolve => rl.question('', resolve));
    return showMainMenu();
  }
  
  // Run interaction script
  try {
    log('Running interaction script...', colors.cyan);
    const output = execSync('npx hardhat run --network localhost ./scripts/interact-with-contracts.js', { encoding: 'utf8' });
    console.log(output);
    success('Contract interaction completed!');
  } catch (err) {
    error(`Interaction failed: ${err.message}`);
    console.log(err.stdout?.toString() || '');
    console.log(err.stderr?.toString() || '');
  }
  
  log('\nPress Enter to continue...', colors.cyan);
  await new Promise(resolve => rl.question('', resolve));
  showMainMenu();
}

async function viewDeploymentInfo() {
  log('\nDeployment Information:', colors.cyan);
  
  // Check if CONTRACT_ADDRESS is set in .env
  if (process.env.CONTRACT_ADDRESS && process.env.CONTRACT_ADDRESS !== 'your_deployed_contract_address_here') {
    log('Environment Contract Address:', colors.cyan);
    log(`  CONTRACT_ADDRESS: ${process.env.CONTRACT_ADDRESS}`, colors.green);
    log('');
  }
  
  const deployedContracts = getDeployedContracts();
  if (!deployedContracts) {
    log('No contract deployments found', colors.yellow);
  } else {
    log('Network: ' + deployedContracts.network);
    log('Contract Addresses:');
    log(`  IdentityManagement: ${deployedContracts.contractAddress}`, colors.green);
    if (deployedContracts.biometricSystemAddress) {
      log(`  BiometricIdentitySystem: ${deployedContracts.biometricSystemAddress}`, colors.green);
    }
    log('Deployer: ' + deployedContracts.deployer);
    log('Deployment Time: ' + deployedContracts.deploymentTime);
    
    log('\nTo interact with these contracts in the console:', colors.cyan);
    log(`npx hardhat console --network ${deployedContracts.network}`);
    log('> const IdentityManagement = await ethers.getContractFactory("IdentityManagement")');
    log(`> const contract = await IdentityManagement.attach("${deployedContracts.contractAddress}")`);
  }
  
  log('\nPress Enter to continue...', colors.cyan);
  await new Promise(resolve => rl.question('', resolve));
  showMainMenu();
}

async function startBackendServer() {
  log('\nStarting backend server...', colors.cyan);
  
  try {
    // Using spawn to run in background
    const server = spawn('node', ['server.js'], {
      detached: true,
      stdio: 'inherit'
    });
    
    server.unref();
    success('Server started in the background');
    log('Press Ctrl+C in the terminal to stop the server', colors.yellow);
  } catch (error) {
    error(`Failed to start server: ${error.message}`);
  }
  
  log('\nPress Enter to continue...', colors.cyan);
  await new Promise(resolve => rl.question('', resolve));
  showMainMenu();
}

async function runAllTests() {
  log('\nRunning all blockchain tests...', colors.cyan);
  
  try {
    const output = execSync('npx hardhat test', { encoding: 'utf8' });
    console.log(output);
    success('Tests completed!');
  } catch (err) {
    error(`Tests failed: ${err.message}`);
    console.log(err.stdout?.toString() || '');
    console.log(err.stderr?.toString() || '');
  }
  
  log('\nPress Enter to continue...', colors.cyan);
  await new Promise(resolve => rl.question('', resolve));
  showMainMenu();
}

async function deployToAvalanche() {
  log('\nDeploying smart contracts to Avalanche...', colors.cyan);
  
  // Check if the ADMIN_PRIVATE_KEY is set and valid
  if (!process.env.ADMIN_PRIVATE_KEY || process.env.ADMIN_PRIVATE_KEY === 'your_private_key_here') {
    error('ADMIN_PRIVATE_KEY is not properly set in your .env file');
    log('You need to configure your admin wallet private key to deploy to Avalanche', colors.yellow);
    log('\nPress Enter to continue...', colors.cyan);
    await new Promise(resolve => rl.question('', resolve));
    return showMainMenu();
  }

  // Setting to Fuji Testnet only
  log('Deploying to Avalanche Fuji Testnet...', colors.cyan);
  const networkName = 'avalanche_fuji';
  
  // Run deployment script
  try {
    log(`Running deployment script for Avalanche Fuji Testnet...`, colors.cyan);
    
    // Try the proxy deployment script first, which handles bytecode mismatches better
    try {
      log('Using proxy deployment to handle potential bytecode mismatches...', colors.yellow);
      const output = execSync(`npx hardhat run --network ${networkName} ./scripts/deploy-avalanche-proxy.js`, { encoding: 'utf8' });
      console.log(output);
      success('Contracts deployed successfully to Avalanche!');
    } catch (proxyError) {
      const errorMessage = proxyError.message || 'Unknown error';
      // Only show first line of error to keep it clean
      const firstLineOfError = errorMessage.split('\n')[0];
      log(`Proxy deployment error: ${firstLineOfError}`, colors.yellow);
      log('Trying standard deployment...', colors.yellow);
      const output = execSync(`npx hardhat run --network ${networkName} ./scripts/deploy-avalanche.js`, { encoding: 'utf8' });
      console.log(output);
      success('Contracts deployed successfully to Avalanche!');
    }
    
    // Display deployment info
    const deployedContracts = getDeployedContracts(networkName);
    if (deployedContracts) {
      log('\nDeployment Information:', colors.cyan);
      log(`Network: ${deployedContracts.network}`, colors.green);
      log(`IdentityManagement: ${deployedContracts.contractAddress}`, colors.green);
      if (deployedContracts.biometricSystemAddress) {
        log(`BiometricIdentitySystem: ${deployedContracts.biometricSystemAddress}`, colors.green);
      }
      log(`Deployer: ${deployedContracts.deployer}`, colors.green);
      log(`Deployment Time: ${deployedContracts.deploymentTime}`, colors.green);
      
      // Update CONTRACT_ADDRESS in .env
      log('\nUpdating CONTRACT_ADDRESS in .env file...', colors.cyan);
      try {
        const envFile = fs.readFileSync('.env', 'utf8');
        const updatedEnv = envFile.replace(/CONTRACT_ADDRESS=.*/g, `CONTRACT_ADDRESS=${deployedContracts.contractAddress}`);
        fs.writeFileSync('.env', updatedEnv);
        success('Updated CONTRACT_ADDRESS in .env file');
      } catch (envErr) {
        error(`Failed to update .env file: ${envErr.message}`);
      }
    }
  } catch (err) {
    error(`Deployment failed: ${err.message}`);
    console.log(err.stdout?.toString() || '');
    console.log(err.stderr?.toString() || '');
  }
  
  log('\nPress Enter to continue...', colors.cyan);
  await new Promise(resolve => rl.question('', resolve));
  showMainMenu();
}

async function viewAvalancheInfo() {
  log('\nAvalanche Network Information:', colors.cyan);
  
  log('Fuji Testnet (C-Chain):', colors.cyan);
  log('  Network Name: Avalanche Fuji C-Chain');
  log('  RPC URL: https://api.avax-test.network/ext/bc/C/rpc');
  log('  ChainID: 43113');
  log('  Symbol: AVAX');
  log('  Block Explorer: https://testnet.snowtrace.io/');
  
  // Check deployments
  log('\nDeployments:', colors.cyan);
  
  const fujiDeployment = getDeployedContracts('avalanche_fuji');
  if (fujiDeployment) {
    log('  Fuji Testnet:', colors.green);
    log(`    IdentityManagement: ${fujiDeployment.contractAddress}`, colors.green);
    log(`    Contract link: https://testnet.snowtrace.io/address/${fujiDeployment.contractAddress}`, colors.blue);
  } else {
    log('  Fuji Testnet: No deployments found', colors.yellow);
  }
  
  log('\nPress Enter to continue...', colors.cyan);
  await new Promise(resolve => rl.question('', resolve));
  showMainMenu();
}

async function interactWithAvalancheContracts() {
  log('\nInteracting with Avalanche Fuji Testnet contracts...', colors.cyan);
  const networkName = 'avalanche_fuji';
  
  // Check if contracts are deployed
  const deployedContracts = getDeployedContracts(networkName);
  if (!deployedContracts) {
    error(`No contract deployments found for ${networkName === 'avalanche' ? 'Avalanche Mainnet' : 'Avalanche Fuji Testnet'}`);
    log('Deploy contracts first', colors.yellow);
    log('\nPress Enter to continue...', colors.cyan);
    await new Promise(resolve => rl.question('', resolve));
    return showMainMenu();
  }
  
  // Run interaction script
  try {
    log(`Running interaction script for ${networkName === 'avalanche' ? 'Avalanche Mainnet' : 'Avalanche Fuji Testnet'}...`, colors.cyan);
    // We'll use the same interaction script but with a different network parameter
    const output = execSync(`npx hardhat run --network ${networkName} ./scripts/interact-with-contracts.js`, { encoding: 'utf8' });
    console.log(output);
    success('Contract interaction completed!');
  } catch (err) {
    error(`Interaction failed: ${err.message}`);
    console.log(err.stdout?.toString() || '');
    console.log(err.stderr?.toString() || '');
  }
  
  log('\nPress Enter to continue...', colors.cyan);
  await new Promise(resolve => rl.question('', resolve));
  showMainMenu();
}

async function showAvalancheMenu() {
  console.clear();
  
  const fujiDeployment = getDeployedContracts('avalanche_fuji');
  
  log('===============================================', colors.blue);
  log('  AVALANCHE FUJI TESTNET MANAGEMENT', colors.bright + colors.blue);
  log('===============================================', colors.blue);
  log('');
  log('Status:', colors.cyan);
  log(`  Fuji Testnet Deployment: ${fujiDeployment ? colors.green + 'DEPLOYED' + colors.reset : colors.red + 'NOT DEPLOYED' + colors.reset}`);
  log('');
  log('Options:', colors.cyan);
  log('  1. Deploy to Avalanche Fuji Testnet');
  log('  2. View Avalanche Fuji Deployment Information');
  log('  3. Interact with Avalanche Fuji Contracts');
  log('  4. Manual Contract Verification Info');
  log('  0. Back to Main Menu');
  log('');
  
  rl.question('Enter your choice: ', async (choice) => {
    switch (choice) {
      case '1':
        await deployToAvalanche();
        break;
      case '2':
        await viewAvalancheInfo();
        break;
      case '3':
        await interactWithAvalancheContracts();
        break;
      case '4':
        await verifyContractOnSnowtrace();
        break;
      case '0':
        showMainMenu();
        break;
      default:
        log('Invalid choice. Please try again.', colors.red);
        setTimeout(showAvalancheMenu, 1000);
        break;
    }
  });
}

async function verifyContractOnSnowtrace() {
  log('\nContract verification feature is not available', colors.yellow);
  log('Contract verification requires a paid Snowtrace API key.', colors.yellow);
  log('To verify manually, visit https://testnet.snowtrace.io/verifyContract', colors.cyan);
  
  log('\nPress Enter to continue...', colors.cyan);
  await new Promise(resolve => rl.question('', resolve));
  showAvalancheMenu();
}

function showMainMenu() {
  console.clear();
  const nodeStatus = isHardhatNodeRunning();
  const contractsDeployed = getDeployedContracts() !== null;
  const avaxDeployed = getDeployedContracts('avalanche_fuji') !== null;
  
  log('===============================================', colors.blue);
  log('  DBIS BLOCKCHAIN MANAGER', colors.bright + colors.blue);
  log('===============================================', colors.blue);
  log('');
  log('Status:', colors.cyan);
  log(`  Hardhat Node: ${nodeStatus.running ? colors.green + 'RUNNING' + colors.reset + ` (PID: ${nodeStatus.pid})` : colors.red + 'STOPPED' + colors.reset}`);
  log(`  Local Contracts: ${contractsDeployed ? colors.green + 'DEPLOYED' + colors.reset : colors.red + 'NOT DEPLOYED' + colors.reset}`);
  log(`  Avalanche Contracts: ${avaxDeployed ? colors.green + 'DEPLOYED' + colors.reset : colors.red + 'NOT DEPLOYED' + colors.reset}`);
  log('');
  log('Options:', colors.cyan);
  log('  1. Check Environment Setup');
  log('  2. Start Local Hardhat Node');
  log('  3. Deploy Smart Contracts');
  log('  4. Interact with Contracts');
  log('  5. View Deployment Information');
  log('  6. Start Backend Server');
  log('  7. Run Blockchain Tests');
  log('  8. Stop Local Hardhat Node');
  log('  9. Avalanche Management');
  log('  0. Exit');
  log('');
  
  rl.question('Enter your choice: ', async (choice) => {
    switch (choice) {
      case '1':
        await checkEnvironment();
        break;
      case '2':
        await startLocalNode();
        break;
      case '3':
        await deployContracts();
        break;
      case '4':
        await interactWithContracts();
        break;
      case '5':
        await viewDeploymentInfo();
        break;
      case '6':
        await startBackendServer();
        break;
      case '7':
        await runAllTests();
        break;
      case '8':
        await stopLocalNode();
        break;
      case '9':
        await showAvalancheMenu();
        break;
      case '0':
        log('Exiting...');
        rl.close();
        process.exit(0);
        break;
      default:
        log('Invalid choice. Please try again.', colors.red);
        setTimeout(showMainMenu, 1000);
        break;
    }
  });
}

// Start the program
showMainMenu(); 