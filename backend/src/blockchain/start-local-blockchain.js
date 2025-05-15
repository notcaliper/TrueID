/**
 * Script to start a local blockchain network using ethers.js JsonRpcProvider
 */
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Generate a random wallet for testing
function generateTestWallet() {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey.substring(2) // Remove '0x' prefix
  };
}

// Create a simple HTTP server that simulates a local blockchain
const PORT = 8545;
const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const request = JSON.parse(body);
        handleRpcRequest(request, res);
      } catch (error) {
        console.error('Error parsing request:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('DBIS Local Blockchain Server');
  }
});

// Handle JSON-RPC requests
function handleRpcRequest(request, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  
  // Simple mock response
  const response = {
    jsonrpc: '2.0',
    id: request.id,
    result: null
  };
  
  // Implement basic RPC methods
  switch (request.method) {
    case 'eth_accounts':
      response.result = [testWallet.address];
      break;
    case 'eth_getBalance':
      response.result = '0x56BC75E2D63100000'; // 100 ETH in hex
      break;
    case 'eth_blockNumber':
      response.result = '0x1';
      break;
    case 'net_version':
      response.result = '1337';
      break;
    default:
      // For other methods, just return a success response
      // In a real implementation, we would handle all methods properly
      console.log(`Received method: ${request.method}`);
      if (request.method.startsWith('eth_call')) {
        response.result = '0x0000000000000000000000000000000000000000000000000000000000000001';
      } else if (request.method.startsWith('eth_sendTransaction') || 
                request.method.startsWith('eth_sendRawTransaction')) {
        // Return a fake transaction hash
        response.result = '0x' + '1'.repeat(64);
      }
      break;
  }
  
  res.end(JSON.stringify(response));
}

// Generate a test wallet
const testWallet = generateTestWallet();

// Start the server
server.listen(PORT, () => {
  console.log(`Local blockchain started on http://localhost:${PORT}`);
  console.log('\nTest Account:');
  console.log(`Address: ${testWallet.address}`);
  console.log(`Private Key: ${testWallet.privateKey}`);
  
  // Save wallet info to .env.local
  const configPath = path.resolve(__dirname, '..', '..', '.env.local');
  const envContent = `
# Local blockchain configuration
BLOCKCHAIN_RPC_URL=http://localhost:${PORT}
PRIVATE_KEY=${testWallet.privateKey}
`;
  
  fs.writeFileSync(configPath, envContent);
  console.log(`\nWallet information saved to ${configPath}`);
  console.log('\nPress Ctrl+C to stop the blockchain server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down local blockchain...');
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
});
