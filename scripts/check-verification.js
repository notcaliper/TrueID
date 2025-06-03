const axios = require('axios');
const { ethers } = require('ethers');

// Configuration
const config = {
  baseURL: 'http://localhost:5000/api',
  credentials: {
    username: 'pro344342',
    password: 'pro344342'
  },
  blockchain: {
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    chainId: 43113,
    contractAddress: '0x266B577380aE3De838A66DEf28fffD5e75c5816E'
  }
};

async function checkVerificationStatus() {
  try {
    // Step 1: Login to get the auth token
    console.log('Logging in...');
    const requestBody = {
      username: config.credentials.username,
      password: config.credentials.password
    };
    const loginResponse = await axios.post(`${config.baseURL}/user/login`, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!loginResponse.data.tokens?.accessToken) {
      throw new Error('Login failed: No access token received');
    }

    const accessToken = loginResponse.data.tokens.accessToken;
    console.log('Login successful! Token received.');

    // Step 2: Get verification status using the token
    console.log('\nFetching verification status...');
    const verificationResponse = await axios.get(`${config.baseURL}/users/verification-status`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Get user profile to check wallet address
    const profileResponse = await axios.get(`${config.baseURL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Get blockchain status
    let blockchainData = { isOnBlockchain: false, transactionHash: null };
    try {
      // Use the blockchain API endpoint
      const blockchainResponse = await axios.get(`${config.baseURL}/blockchain/status`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      blockchainData = blockchainResponse.data;
    } catch (err) {
      console.log('\nNote: Could not fetch blockchain status from API');
      console.log('Using ethers.js to check blockchain directly...');
    }
    
    // Initialize ethers provider
    const provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
    
    // Step 3: Display the results
    console.log('\nVerification Status:');
    console.log('-------------------');
    const { status, submittedAt, verifiedAt, verifiedBy, rejectionReason } = verificationResponse.data.data;
    console.log('Status:', status);
    console.log('Submitted At:', submittedAt);
    console.log('Verified At:', verifiedAt || 'Not yet verified');
    console.log('Verified By:', verifiedBy || 'Not yet verified');
    if (rejectionReason) {
      console.log('Rejection Reason:', rejectionReason);
    }
    
    console.log('\nWallet Information:');
    console.log('-------------------');
    const walletAddress = profileResponse.data.user.walletAddress;
    console.log('Wallet Address:', walletAddress || 'Not set');
    
    if (walletAddress) {
      // Get wallet balance
      const balance = await provider.getBalance(walletAddress);
      console.log('Balance:', ethers.formatEther(balance), 'AVAX');
      console.log('Snowtrace:', `https://testnet.snowtrace.io/address/${walletAddress}`);
    } else {
      console.log('\nNo wallet address found for this account.');
      console.log('To generate a wallet, run: node backend/scripts/generate_testnet_wallet.js');
    }
    
    console.log('\nBlockchain Status:');
    console.log('-------------------');
    console.log('Contract Address:', config.blockchain.contractAddress);
    console.log('Network: Avalanche Fuji Testnet (Chain ID:', config.blockchain.chainId, ')');
    
    // Display blockchain status from API response
    if (blockchainData.status) {
      console.log('Registration Status:', blockchainData.status.isRegistered ? 'REGISTERED' : 'NOT REGISTERED');
      if (blockchainData.status.registrationTimestamp) {
        console.log('Registration Date:', new Date(blockchainData.status.registrationTimestamp).toLocaleString());
      }
      if (blockchainData.status.registrationTxHash) {
        blockchainData.transactionHash = blockchainData.status.registrationTxHash;
      }
    }
    
    if (blockchainData.transactionHash) {
      console.log('\nTransaction Details:');
      console.log('-------------------');
      console.log('Transaction Hash:', blockchainData.transactionHash);
      console.log('Snowtrace:', `https://testnet.snowtrace.io/tx/${blockchainData.transactionHash}`);
      
      // Get transaction status
      const tx = await provider.getTransaction(blockchainData.transactionHash);
      if (tx) {
        const confirmations = tx.confirmations || 0;
        console.log('Confirmations:', confirmations, confirmations >= 3 ? '(Confirmed)' : '(Pending)');
        
        if (tx.blockNumber) {
          const block = await provider.getBlock(tx.blockNumber);
          console.log('Timestamp:', new Date(block.timestamp * 1000).toLocaleString());
        }
      }
    }

  } catch (error) {
    console.error('\nError:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the check
checkVerificationStatus();
