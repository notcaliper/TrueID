const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function main() {
  console.log("==== DBIS Smart Contract Connection Diagnostic ====");
  
  // Get blockchain configuration
  const network = process.env.BLOCKCHAIN_NETWORK || 'local';
  let rpcUrl, contractAddress, networkName, chainId;
  
  if (network === 'local') {
    rpcUrl = process.env.LOCAL_RPC_URL || 'http://127.0.0.1:8545';
    contractAddress = process.env.LOCAL_CONTRACT_ADDRESS;
    networkName = 'Local Hardhat';
    chainId = 31337;
  } else if (network === 'polygon') {
    rpcUrl = process.env.POLYGON_RPC_URL || 'https://rpc-mumbai.maticvigil.com';
    contractAddress = process.env.POLYGON_CONTRACT_ADDRESS;
    networkName = 'Polygon Mumbai';
    chainId = 80001;
  }
  
  console.log(`🌐 Network: ${networkName}`);
  console.log(`🔗 RPC URL: ${rpcUrl}`);

  // ✅ Create provider with explicit network configuration
  const provider = new ethers.providers.JsonRpcProvider(
    rpcUrl,
    {
      name: networkName,
      chainId: chainId
    }
  );
  
  // Smart contract ABI (simplified for test)
  const IdentityManagementABI = [
    "function hasRole(address account, bytes32 role) external view returns (bool)"
  ];

  try {
    console.log("📡 Testing provider connection...");
    const network = await provider.getNetwork();
    console.log(`✅ Connected to network: ${network.name} (chainId: ${network.chainId})`);
    
    // ✅ Get the list of available accounts
    console.log("📋 Fetching accounts...");
    const accounts = await provider.listAccounts();
    
    if (accounts && accounts.length > 0) {
      console.log(`✅ Found ${accounts.length} accounts on the network`);
      console.log(`🧾 First account: ${accounts[0]}`);
      
      // Create signer from first account
      const signer = provider.getSigner(accounts[0]);
      console.log(`✅ Created signer from account: ${await signer.getAddress()}`);
      
      if (contractAddress) {
        console.log(`📝 Testing connection to contract at ${contractAddress}`);
        
        // Create contract instance
        const contract = new ethers.Contract(
          contractAddress,
          IdentityManagementABI,
          signer
        );
        
        console.log("✅ Contract instance created successfully");
        
        // Optional - try a simple read operation
        try {
          const adminRole = ethers.utils.id("ADMIN");
          const adminCheck = await contract.hasRole(accounts[0], adminRole);
          console.log(`ℹ️ Account has admin role: ${adminCheck}`);
        } catch (err) {
          console.log(`⚠️ Could not check admin role: ${err.message}`);
        }
      } else {
        console.log("⚠️ No contract address specified in environment");
      }
    } else {
      console.log("⚠️ No accounts available from provider");
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
    console.error(err);
  }
}

main()
  .then(() => console.log("🎉 Diagnostic complete"))
  .catch(console.error); 