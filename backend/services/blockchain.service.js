/**
 * Blockchain service for DBIS
 * Handles interaction with the blockchain network
 */
const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Ethers v6/v5 compatibility helpers
const id = (val) => (ethers.id ? ethers.id(val) : ethers.utils.id(val));
const formatEther = (val) => (ethers.formatEther ? ethers.formatEther(val) : ethers.utils.formatEther(val));
const parseEther = (val) => (ethers.parseEther ? ethers.parseEther(val) : ethers.utils.parseEther(val));
const isAddress = (val) => (ethers.isAddress ? ethers.isAddress(val) : ethers.utils.isAddress(val));
const ZERO_ADDRESS = ethers.ZeroAddress || '0x0000000000000000000000000000000000000000';

// Smart contract ABI (fallback or loaded from artifacts)
let IdentityManagementABI = [
  // Events
  "event IdentityCreated(address indexed user, bytes32 biometricHash, uint256 timestamp)",
  "event IdentityUpdated(address indexed user, address indexed updatedBy, uint256 timestamp)",
  "event IdentityVerified(address indexed user, address indexed verifier, uint256 timestamp)",
  "event IdentityRevoked(address indexed user, address indexed authority, string reason, uint256 timestamp)",
  "event VerificationLevelUpdated(address indexed user, uint8 oldLevel, uint8 newLevel, address indexed authority)",
  "event BiometricVerificationLogged(address indexed user, bytes32 sessionProofHash, uint256 timestamp)",
  "event ProfessionalRecordAdded(address indexed user, bytes32 dataHash, uint256 timestamp)",
  "event ProfessionalRecordVerified(address indexed user, uint256 recordIndex, address indexed verifier, uint256 timestamp)",
  "event SoulboundBadgeIssued(address indexed recipient, uint256 indexed tokenId, string badgeType, uint256 timestamp)",
  "event RoleGranted(address indexed account, bytes32 indexed role, address indexed grantor)",
  "event RoleRevoked(address indexed account, bytes32 indexed role, address indexed revoker)",
  
  // Functions
  "function createIdentity(bytes32 biometricHash, bytes32 professionalDataHash) external",
  "function updateBiometricHash(address user, bytes32 newBiometricHash) external",
  "function updateProfessionalData(bytes32 newProfessionalDataHash) external",
  "function verifyIdentity(address user) external",
  "function setVerificationLevel(address user, uint8 level) external",
  "function revokeIdentity(address user, string calldata reason) external",
  "function logBiometricVerification(address user, bytes32 sessionProofHash) external",
  "function addProfessionalRecord(bytes32 dataHash, uint256 startDate, uint256 endDate) external",
  "function addTypedProfessionalRecord(bytes32 dataHash, uint256 startDate, uint256 endDate, string calldata recordType) external",
  "function verifyProfessionalRecord(address user, uint256 recordIndex) external",
  "function grantRole(address account, bytes32 role) external",
  "function revokeRole(address account, bytes32 role) external",
  "function hasRole(address account, bytes32 role) external view returns (bool)",
  "function getBiometricHash(address user) external view returns (bytes32)",
  "function isIdentityVerified(address user) external view returns (bool)",
  "function hasRegisteredIdentity(address user) external view returns (bool)",
  "function getIdentitySummary(address user) external view returns (bytes32 biometricHash, bytes32 professionalDataHash, uint256 createdAt, uint256 updatedAt, bool isVerified, uint8 verificationLevel, uint256 lastBiometricCheck)",
  "function getProfessionalRecordCount(address user) external view returns (uint256)",
  "function getProfessionalRecord(address user, uint256 recordIndex) external view returns (bytes32 dataHash, uint256 startDate, uint256 endDate, address verifier, bool isVerified, uint256 createdAt)",
  "function locked(uint256 tokenId) external view returns (bool)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function getUserPrimaryBadge(address user) external view returns (uint256)"
];

try {
  const abiPath = path.resolve(__dirname, '..', 'blockchain', 'contracts', 'abi', 'IdentityManagement.json');
  if (fs.existsSync(abiPath)) {
    IdentityManagementABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  }
} catch (e) {
  // Use fallback ABI
}

// Load TrueID Smart Contract Suite ABIs
let CredentialRegistryABI = [];
let SoulboundBadgeABI = [];
let DIDRegistryABI = [];
let ZKVerifierABI = [];

try {
  CredentialRegistryABI = require('../blockchain/artifacts/blockchain/contracts/TrueIDCredentialRegistry.sol/TrueIDCredentialRegistry.json').abi;
  SoulboundBadgeABI = require('../blockchain/artifacts/blockchain/contracts/TrueIDSoulboundBadge.sol/TrueIDSoulboundBadge.json').abi;
  DIDRegistryABI = require('../blockchain/artifacts/blockchain/contracts/TrueIDDIDRegistry.sol/TrueIDDIDRegistry.json').abi;
  ZKVerifierABI = require('../blockchain/artifacts/blockchain/contracts/TrueIDZKVerifier.sol/TrueIDZKVerifier.json').abi;
} catch (e) {
  // Fallbacks if compiled artifacts are not present
}

// Role constants
const USER_ROLE = id("USER");
const GOVERNMENT_ROLE = id("GOVERNMENT");
const ADMIN_ROLE = id("ADMIN");
const VERIFIER_ROLE = id("VERIFIER");

/**
 * Get blockchain configuration - Ethereum Sepolia Testnet
 * @returns {Object} Blockchain configuration
 */
const getBlockchainConfig = () => {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const chainId = 11155111;
  const networkName = 'Ethereum Sepolia Testnet';

  if (!rpcUrl) {
    throw new Error('SEPOLIA_RPC_URL environment variable is required');
  }
  if (!contractAddress) {
    throw new Error('CONTRACT_ADDRESS environment variable is required');
  }

  return {
    network: 'sepolia',
    rpcUrl,
    contractAddress,
    privateKey: process.env.ADMIN_WALLET_PRIVATE_KEY,
    networkName,
    chainId,
    currency: 'ETH',
    blockExplorer: 'https://sepolia.etherscan.io'
  };
};

/**
 * Initialize blockchain provider and contract
 * @returns {Object} Provider and contract instances
 */
const initBlockchain = exports.initBlockchain = () => {
  try {
    const config = getBlockchainConfig();
    const { rpcUrl, contractAddress, privateKey, networkName, chainId } = config;
    
    if (!rpcUrl) {
      throw new Error(`RPC URL is not defined for ${networkName} network`);
    }
    
    if (!contractAddress) {
      throw new Error(`Contract address is not defined for ${networkName} network`);
    }
    
    if (!privateKey) {
      throw new Error('ADMIN_PRIVATE_KEY is not defined in environment variables');
    }
    
    // Create provider (supports ethers v6 and v5)
    const provider = ethers.JsonRpcProvider ? new ethers.JsonRpcProvider(rpcUrl) : new ethers.providers.JsonRpcProvider(rpcUrl);
    
    // Create wallet
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Create contract instance
    const contract = new ethers.Contract(
      contractAddress,
      IdentityManagementABI,
      wallet
    );
    
    return { provider, wallet, contract, networkName };
  } catch (error) {
    console.error('Blockchain initialization error:', error);
    throw new Error(`Failed to initialize blockchain connection: ${error.message}`);
  }
};

/**
 * Get current blockchain network information
 * @returns {Object} Network information
 */
exports.getNetworkInfo = () => {
  try {
    const config = getBlockchainConfig();
    
    return {
      network: 'sepolia',
      networkName: config.networkName,
      chainId: config.chainId,
      currency: config.currency || 'ETH',
      rpcUrl: config.rpcUrl,
      contractAddress: config.contractAddress,
      blockExplorer: config.blockExplorer || 'https://sepolia.etherscan.io'
    };
  } catch (error) {
    console.error('Get network info error:', error);
    throw new Error('Failed to get network information');
  }
};

/**
 * Check if the contract is deployed and accessible
 * @returns {Object} Contract status
 */
exports.isContractAccessible = async () => {
  try {
    const { contract, networkName } = initBlockchain();
    // Try to call a view function to check if contract is accessible
    await contract.hasRole(ZERO_ADDRESS, ADMIN_ROLE);
    return {
      accessible: true,
      network: networkName
    };
  } catch (error) {
    console.error(`Contract accessibility check error:`, error);
    return {
      accessible: false,
      error: error.message,
      network: getBlockchainConfig().networkName
    };
  }
};

/**
 * Check if an identity is registered on the blockchain
 * @param {String} walletAddress - User's wallet address
 * @returns {Boolean} True if identity is registered
 */
exports.isIdentityRegistered = async (walletAddress) => {
  if (!walletAddress) return false;
  try {
    const { provider } = initBlockchain();
    
    // 1. Check Soulbound Badge contract (ERC-5192)
    const sbtAddress = process.env.SOULBOUND_BADGE_ADDRESS;
    if (sbtAddress) {
      try {
        const sbtContract = new ethers.Contract(
          sbtAddress,
          [
            'function userPrimaryBadge(address) view returns (uint256)',
            'function balanceOf(address) view returns (uint256)'
          ],
          provider
        );
        const [badgeId, balance] = await Promise.all([
          sbtContract.userPrimaryBadge(walletAddress).catch(() => 0n),
          sbtContract.balanceOf(walletAddress).catch(() => 0n)
        ]);
        if (Number(badgeId) > 0 || Number(balance) > 0) {
          return true;
        }
      } catch (sbtErr) {
        // Continue to check identity management
      }
    }
    
    // 2. Check Identity Management contract
    try {
      const { contract } = initBlockchain();
      if (typeof contract.hasRegisteredIdentity === 'function') {
        const hasReg = await contract.hasRegisteredIdentity(walletAddress);
        if (hasReg) return true;
      }
      const biometricHash = await contract.getBiometricHash(walletAddress);
      if (biometricHash && biometricHash !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        return true;
      }
    } catch (contractError) {
      // Continue
    }

    return false;
  } catch (error) {
    console.error('Check identity registration error:', error);
    return false;
  }
};

/**
 * Register identity on blockchain
 * @param {String} privateKey - Private key to use for the transaction
 * @param {String} biometricHash - Hash of user's biometric data
 * @param {String} professionalDataHash - Hash of user's professional data
 * @returns {Object} Transaction result
 */
exports.registerIdentity = async (privateKey, biometricHash, professionalDataHash) => {
  try {
    const { provider, networkName } = initBlockchain();
    
    // Create wallet instance using the provided private key
    const wallet = new ethers.Wallet(privateKey, provider);
    const { contractAddress } = getBlockchainConfig();
    
    // Create contract instance connected to the wallet
    const contract = new ethers.Contract(
      contractAddress,
      IdentityManagementABI,
      wallet
    );
    
    // Convert hashes to bytes32
    const biometricHashBytes = id(biometricHash);
    const professionalDataHashBytes = id(professionalDataHash);
    
    // Create identity on blockchain using the wallet
    // The identity will be created for the address associated with the private key
    const tx = await contract.createIdentity(
      biometricHashBytes,
      professionalDataHashBytes
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      transactionHash: receipt.hash || receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      status: receipt.status === 1 ? 'SUCCESS' : 'FAILED',
      network: networkName
    };
  } catch (error) {
    console.error('Register identity error:', error);
    throw new Error('Failed to register identity on blockchain');
  }
};

/**
 * Update biometric hash on blockchain
 * @param {String} walletAddress - User's wallet address
 * @param {String} newBiometricHash - New SHA-256 hash of biometric data
 * @returns {Object} Transaction details
 */
exports.updateBiometricHash = async (walletAddress, newBiometricHash) => {
  try {
    const { contract, networkName } = initBlockchain();
    
    // Convert string hash to bytes32
    const biometricHashBytes = id(newBiometricHash);
    
    // Call contract method
    const tx = await contract.updateBiometricHash(
      walletAddress,
      biometricHashBytes,
      { gasLimit: 200000 }
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failed',
      network: networkName
    };
  } catch (error) {
    console.error('Update biometric hash on blockchain error:', error);
    throw new Error('Failed to update biometric hash on blockchain');
  }
};

/**
 * Verify identity on blockchain (government only)
 * @param {String} walletAddress - User's wallet address
 * @returns {Object} Transaction details
 */
exports.verifyIdentity = async (walletAddress) => {
  try {
    const { contract, networkName } = initBlockchain();
    
    // Call contract method
    const tx = await contract.verifyIdentity(
      walletAddress,
      { gasLimit: 200000 }
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failed',
      network: networkName
    };
  } catch (error) {
    console.error('Verify identity on blockchain error:', error);
    throw new Error('Failed to verify identity on blockchain');
  }
};

/**
 * Add professional record to blockchain
 * @param {String} walletAddress - User's wallet address
 * @param {String} dataHash - Hash of professional record data
 * @param {Number} startTimestamp - Start timestamp of record
 * @param {Number} endTimestamp - End timestamp of record
 * @returns {Object} Transaction result
 */
exports.addProfessionalRecord = async (walletAddress, dataHash, startTimestamp, endTimestamp) => {
  try {
    const { contract, networkName } = initBlockchain();
    
    // Convert hash to bytes32
    const dataHashBytes = id(dataHash);
    
    // Add professional record on blockchain
    const tx = await contract.addProfessionalRecord(
      dataHashBytes,
      startTimestamp,
      endTimestamp
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      status: receipt.status === 1 ? 'SUCCESS' : 'FAILED',
      network: networkName
    };
  } catch (error) {
    console.error('Add professional record error:', error);
    throw new Error(`Failed to add professional record on blockchain: ${error.message}`);
  }
};

/**
 * Verify professional record on blockchain (government only)
 * @param {String} walletAddress - User's wallet address
 * @param {Number} recordIndex - Index of the record in the user's professional history
 * @returns {Object} Transaction details
 */
exports.verifyProfessionalRecord = async (walletAddress, recordIndex) => {
  try {
    const { contract, networkName } = initBlockchain();
    
    // Call contract method
    const tx = await contract.verifyProfessionalRecord(
      walletAddress,
      recordIndex,
      { gasLimit: 200000 }
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failed',
      network: networkName
    };
  } catch (error) {
    console.error('Verify professional record on blockchain error:', error);
    throw new Error('Failed to verify professional record on blockchain');
  }
};

/**
 * Get biometric hash from blockchain
 * @param {String} walletAddress - User's wallet address
 * @returns {String} Biometric hash
 */
exports.getBiometricHash = async (walletAddress) => {
  try {
    const { contract } = initBlockchain();
    const biometricHash = await contract.getBiometricHash(walletAddress);
    return biometricHash;
  } catch (error) {
    console.error('Get biometric hash error:', error);
    throw new Error('Failed to get biometric hash from blockchain');
  }
};

/**
 * Check if identity is verified on blockchain
 * @param {String} walletAddress - User's wallet address
 * @returns {Boolean} True if identity is verified
 */
exports.isIdentityVerified = async (walletAddress) => {
  if (!walletAddress) return false;
  try {
    const { provider } = initBlockchain();
    
    // Check Soulbound badge
    const sbtAddress = process.env.SOULBOUND_BADGE_ADDRESS;
    if (sbtAddress) {
      try {
        const sbtContract = new ethers.Contract(
          sbtAddress,
          [
            'function userPrimaryBadge(address) view returns (uint256)',
            'function locked(uint256) view returns (bool)'
          ],
          provider
        );
        const badgeId = await sbtContract.userPrimaryBadge(walletAddress).catch(() => 0n);
        if (Number(badgeId) > 0) {
          const isLocked = await sbtContract.locked(badgeId).catch(() => true);
          if (isLocked) return true;
        }
      } catch (sbtErr) {
        // Continue
      }
    }

    const { contract } = initBlockchain();
    try {
      const verified = await contract.isIdentityVerified(walletAddress);
      return Boolean(verified);
    } catch {
      return false;
    }
  } catch (error) {
    console.error('Check identity verification error:', error);
    return false;
  }
};

/**
 * Get professional record count from blockchain
 * @param {String} walletAddress - User's wallet address
 * @returns {Number} Number of professional records
 */
exports.getProfessionalRecordCount = async (walletAddress) => {
  try {
    const { contract } = initBlockchain();
    const count = await contract.getProfessionalRecordCount(walletAddress);
    return Number(count);
  } catch (error) {
    console.error('Get professional record count error:', error);
    throw new Error('Failed to get professional record count from blockchain');
  }
};

/**
 * Get professional record from blockchain
 * @param {String} walletAddress - User's wallet address
 * @param {Number} recordIndex - Index of the record
 * @returns {Object} Professional record
 */
exports.getProfessionalRecord = async (walletAddress, recordIndex) => {
  try {
    const { contract } = initBlockchain();
    const record = await contract.getProfessionalRecord(walletAddress, recordIndex);
    return {
      dataHash: record.dataHash,
      startDate: Number(record.startDate),
      endDate: Number(record.endDate),
      verifier: record.verifier,
      isVerified: record.isVerified,
      createdAt: Number(record.createdAt)
    };
  } catch (error) {
    console.error('Get professional record error:', error);
    throw new Error('Failed to get professional record from blockchain');
  }
};

/**
 * Grant role to a user (admin only)
 * @param {String} walletAddress - User's wallet address
 * @param {String} role - Role to grant (USER_ROLE, GOVERNMENT_ROLE, ADMIN_ROLE)
 * @returns {Object} Transaction details
 */
exports.grantRole = async (walletAddress, role) => {
  try {
    const { contract, networkName } = initBlockchain();
    
    // Convert role string to bytes32
    let roleBytes;
    if (role === 'USER_ROLE') {
      roleBytes = USER_ROLE;
    } else if (role === 'GOVERNMENT_ROLE') {
      roleBytes = GOVERNMENT_ROLE;
    } else if (role === 'ADMIN_ROLE') {
      roleBytes = ADMIN_ROLE;
    } else {
      throw new Error('Invalid role');
    }
    
    // Call contract method
    const tx = await contract.grantRole(
      walletAddress,
      roleBytes,
      { gasLimit: 200000 }
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failed',
      network: networkName
    };
  } catch (error) {
    console.error('Grant role error:', error);
    throw new Error('Failed to grant role on blockchain');
  }
};

/**
 * Verify a document hash on the blockchain
 * @param {String} hash - Document hash to verify
 * @returns {Object} Verification result
 */
exports.verifyDocumentHash = async (hash) => {
  try {
    const { contract, networkName } = initBlockchain();
    
    // Convert hash to bytes32
    const hashBytes = id(hash);
    
    // Verify document hash on blockchain
    const result = await contract.verifyDocument(hashBytes);
    
    return {
      exists: result.exists,
      timestamp: Number(result.timestamp),
      issuer: result.issuer,
      network: networkName
    };
  } catch (error) {
    console.error('Verify document hash error:', error);
    throw new Error('Failed to verify document hash on blockchain');
  }
};

/**
 * Switch blockchain network
 * @param {String} network - Target network ('sepolia', 'mainnet')
 * @returns {Boolean} True if switch was successful
 */
exports.switchNetwork = async (network) => {
  try {
    const targetNetwork = network || 'sepolia';
    const envPath = path.resolve(__dirname, '..', '.env');
    
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      envContent = envContent.replace(
        /BLOCKCHAIN_NETWORK=.*/,
        `BLOCKCHAIN_NETWORK=${targetNetwork}`
      );
      
      fs.writeFileSync(envPath, envContent);
      process.env.BLOCKCHAIN_NETWORK = targetNetwork;
      
      return true;
    } else {
      throw new Error('.env file not found');
    }
  } catch (error) {
    console.error('Switch network error:', error);
    return false;
  }
};

/**
 * Check if user data exists on blockchain
 * @param {String} walletAddress - User's wallet address
 * @returns {Boolean} True if data exists on blockchain, false otherwise
 */
async function checkUserDataOnBlockchain(walletAddress) {
  try {
    return await exports.isIdentityRegistered(walletAddress);
  } catch (error) {
    console.error(`Error checking user data on blockchain for address ${walletAddress}:`, error);
    return false;
  }
}

/**
 * Process expired blockchain statuses
 * This function checks for users with pending blockchain status who have passed
 * their 48-hour expiry time. If a user hasn't transferred their data to the blockchain
 * within 48 hours after verification, their blockchain status will be reset.
 * 
 * @param {Object} db - Database connection pool
 * @returns {Object} Processing results
 */
exports.processExpiredBlockchainStatuses = async (db) => {
  const client = await db.connect();
  try {
    console.log('Processing expired blockchain statuses...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Get users with expired blockchain status
    const expiredUsersResult = await client.query(
      `SELECT id, name, government_id, wallet_address, blockchain_status, blockchain_expiry, blockchain_tx_hash
       FROM users
       WHERE blockchain_status = 'PENDING'
       AND blockchain_expiry < NOW()`
    );
    
    console.log(`Found ${expiredUsersResult.rows.length} users with expired blockchain status`);
    
    const results = {
      total: expiredUsersResult.rows.length,
      confirmed: 0,
      expired: 0,
      details: []
    };
    
    for (const user of expiredUsersResult.rows) {
      console.log(`Processing user ${user.id} (${user.name})...`);
      
      // Check if user data exists on blockchain despite expiry
      let dataOnBlockchain = false;
      const userAddress = user.wallet_address;
      if (userAddress) {
        dataOnBlockchain = await checkUserDataOnBlockchain(userAddress);
      }
      
      if (dataOnBlockchain) {
        // If data is on blockchain, update status to CONFIRMED
        console.log(`User ${user.id} data found on blockchain, updating status to CONFIRMED`);
        await client.query(
          `UPDATE users
           SET blockchain_status = 'CONFIRMED',
               blockchain_expiry = NULL,
               updated_at = NOW()
           WHERE id = $1`,
          [user.id]
        );
        
        // Log the status update
        await client.query(
          `INSERT INTO audit_logs (action, entity_type, entity_id, details)
           VALUES ($1, $2, $3, $4)`,
          [
            'USER_BLOCKCHAIN_CONFIRMED',
            'users',
            user.id,
            JSON.stringify({
              message: 'User data confirmed on blockchain after manual check',
              previousStatus: 'PENDING'
            })
          ]
        );
        
        results.confirmed++;
        results.details.push({
          userId: user.id,
          name: user.name,
          governmentId: user.government_id,
          newStatus: 'CONFIRMED'
        });
      } else {
        // If data is not on blockchain, reset blockchain status and transfer funds back to admin
        console.log(`User ${user.id} data not found on blockchain, resetting blockchain status and transferring funds back`);
        
        // Get the transaction details to determine how much ETH was sent
        const txResult = await client.query(
          `SELECT tx_hash, from_address, to_address, amount, created_at 
           FROM blockchain_transactions 
           WHERE user_id = $1 AND tx_type = 'INITIAL_FUNDING' AND status = 'COMPLETED'
           ORDER BY created_at DESC LIMIT 1`,
          [user.id]
        );
        
        let refundResult = null;
        
        // If we found a transaction, attempt to transfer funds back to admin
        if (txResult.rows.length > 0) {
          const tx = txResult.rows[0];
          const { ethers } = require('ethers');
          
          try {
            // Get admin wallet private key from environment variables
            const adminPrivateKey = process.env.ADMIN_WALLET_PRIVATE_KEY;
            if (!adminPrivateKey) {
              throw new Error('ADMIN_WALLET_PRIVATE_KEY not defined in environment variables');
            }
            
            // Get admin wallet address from environment variables
            const adminWalletAddress = process.env.ADMIN_WALLET_ADDRESS;
            if (!adminWalletAddress) {
              throw new Error('ADMIN_WALLET_ADDRESS not defined in environment variables');
            }
            
            // Initialize provider
            const { rpcUrl } = getBlockchainConfig();
            if (!rpcUrl) {
              throw new Error('RPC URL not defined in blockchain configuration');
            }
            const provider = ethers.JsonRpcProvider ? new ethers.JsonRpcProvider(rpcUrl) : new ethers.providers.JsonRpcProvider(rpcUrl);
            
            // Create wallet instance from user's private key
            // We need to retrieve the user's private key from the database
            const userWalletResult = await client.query(
              'SELECT wallet_address, avax_private_key FROM users WHERE id = $1',
              [user.id]
            );
            
            if (userWalletResult.rows.length > 0 && userWalletResult.rows[0].avax_private_key) {
              const userWallet = new ethers.Wallet(userWalletResult.rows[0].avax_private_key, provider);
              
              // Check user wallet balance
              const balance = await provider.getBalance(userWallet.address);
              const balanceBigInt = BigInt(balance.toString());
              
              if (balanceBigInt > 0n) {
                // Calculate gas cost (21000 is standard gas limit for transfers)
                const feeData = await provider.getFeeData ? await provider.getFeeData() : { gasPrice: 1000000000n };
                const gasPrice = feeData.gasPrice ? BigInt(feeData.gasPrice.toString()) : 1000000000n;
                const gasCost = gasPrice * 21000n;
                
                // Calculate amount to send (balance - gas cost)
                const amountToSend = balanceBigInt > gasCost ? balanceBigInt - gasCost : 0n;
                
                if (amountToSend > 0n) {
                  // Create transaction
                  const tx = {
                    to: adminWalletAddress,
                    value: amountToSend,
                    gasLimit: 21000
                  };
                  
                  // Send transaction
                  const transaction = await userWallet.sendTransaction(tx);
                  const receipt = await transaction.wait();
                  
                  refundResult = {
                    success: true,
                    transactionHash: receipt.hash || receipt.transactionHash,
                    blockNumber: receipt.blockNumber,
                    fromAddress: userWallet.address,
                    toAddress: adminWalletAddress,
                    amount: formatEther(amountToSend)
                  };
                  
                  // Log the refund transaction
                  await client.query(
                    `INSERT INTO blockchain_transactions 
                     (user_id, tx_hash, from_address, to_address, amount, tx_type, status, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
                    [
                      user.id,
                      receipt.transactionHash,
                      userWallet.address,
                      adminWalletAddress,
                      ethers.utils.formatEther(amountToSend),
                      'EXPIRY_REFUND',
                      'CONFIRMED'
                    ]
                  );
                }
              }
            }
          } catch (error) {
            console.error(`Error transferring funds back from user ${user.id}:`, error);
            refundResult = {
              success: false,
              error: error.message
            };
          }
        }
        
        // Update user blockchain status
        await client.query(
          `UPDATE users
           SET blockchain_status = 'EXPIRED',
               blockchain_expiry = NULL,
               updated_at = NOW()
           WHERE id = $1`,
          [user.id]
        );
        
        // Log the status update with refund information
        await client.query(
          `INSERT INTO audit_logs (action, entity_type, entity_id, details)
           VALUES ($1, $2, $3, $4)`,
          [
            'USER_BLOCKCHAIN_EXPIRED',
            'users',
            user.id,
            JSON.stringify({
              message: '48-hour blockchain expiry period elapsed without data transfer',
              previousStatus: 'PENDING',
              txHash: user.blockchain_tx_hash,
              refundResult: refundResult
            })
          ]
        );
        
        results.expired++;
        results.details.push({
          userId: user.id,
          name: user.name,
          governmentId: user.government_id,
          newStatus: 'EXPIRED',
          refundResult: refundResult
        });
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Finished processing expired blockchain statuses');
    
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing expired blockchain statuses:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * ============================================================================
 * TrueID Smart Contract Suite Integration (Sepolia)
 * 1. TrueIDCredentialRegistry (W3C Verifiable Credentials for /professional-records)
 * 2. TrueIDSoulboundBadge (ERC-5192 Soulbound Credentials)
 * 3. TrueIDDIDRegistry (W3C Decentralized Identifiers did:trueid:<address>)
 * 4. TrueIDZKVerifier (Zero-Knowledge Proofs)
 * ============================================================================
 */

exports.getCredentialRegistryContract = () => {
  const { wallet } = initBlockchain();
  const address = process.env.CREDENTIAL_REGISTRY_ADDRESS;
  if (!address) throw new Error('CREDENTIAL_REGISTRY_ADDRESS environment variable is required');
  return new ethers.Contract(address, CredentialRegistryABI, wallet);
};

exports.getSoulboundBadgeContract = () => {
  const { wallet } = initBlockchain();
  const address = process.env.SOULBOUND_BADGE_ADDRESS;
  if (!address) throw new Error('SOULBOUND_BADGE_ADDRESS environment variable is required');
  return new ethers.Contract(address, SoulboundBadgeABI, wallet);
};

exports.getDIDRegistryContract = () => {
  const { wallet } = initBlockchain();
  const address = process.env.DID_REGISTRY_ADDRESS;
  if (!address) throw new Error('DID_REGISTRY_ADDRESS environment variable is required');
  return new ethers.Contract(address, DIDRegistryABI, wallet);
};

exports.getZKVerifierContract = () => {
  const { wallet } = initBlockchain();
  const address = process.env.ZK_VERIFIER_ADDRESS;
  if (!address) throw new Error('ZK_VERIFIER_ADDRESS environment variable is required');
  return new ethers.Contract(address, ZKVerifierABI, wallet);
};

/**
 * Register W3C Verifiable Credential on-chain in TrueIDCredentialRegistry
 */
exports.registerW3CCredential = async ({
  credentialId,
  subjectAddress,
  recordType, // 0: EDUCATION, 1: EMPLOYMENT, 2: CERTIFICATION, 3: GOVERNMENT, 4: LICENSE
  institution,
  credentialHash,
  credentialURI = '',
  validityDuration = 0
}) => {
  const contract = exports.getCredentialRegistryContract();
  const credIdBytes = credentialId.startsWith('0x') && credentialId.length === 66 
    ? credentialId 
    : id(credentialId);
  const credHashBytes = credentialHash.startsWith('0x') && credentialHash.length === 66
    ? credentialHash
    : id(credentialHash);

  const typeMap = {
    'EDUCATION': 0,
    'ACADEMIC': 0,
    'EMPLOYMENT': 1,
    'CERTIFICATION': 2,
    'GOVERNMENT': 3,
    'LICENSE': 4
  };

  const enumType = typeof recordType === 'number' ? recordType : (typeMap[recordType] ?? 0);

  const tx = await contract.registerCredential(
    credIdBytes,
    subjectAddress,
    enumType,
    institution || 'TrueID Accredited Issuer',
    credHashBytes,
    credentialURI,
    validityDuration
  );

  const receipt = await tx.wait(1);
  return {
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
    credentialId: credIdBytes,
    subject: subjectAddress,
    status: 'CONFIRMED'
  };
};

/**
 * Mint ERC-5192 Soulbound Token to citizen
 */
exports.mintSoulboundBadgeOnChain = async ({
  recipientAddress,
  badgeType = 'IDENTITY_VERIFIED',
  metadataURI = '',
  identityCommitment = '0x0000000000000000000000000000000000000000000000000000000000000000'
}) => {
  const contract = exports.getSoulboundBadgeContract();
  const commitmentBytes = identityCommitment.startsWith('0x') && identityCommitment.length === 66
    ? identityCommitment
    : id(identityCommitment);

  const tx = await contract.mintBadge(
    recipientAddress,
    badgeType,
    metadataURI,
    commitmentBytes
  );

  const receipt = await tx.wait(1);

  let mintedTokenId = null;
  if (receipt && receipt.logs) {
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && (parsed.name === 'BadgeMinted' || parsed.name === 'Transfer')) {
          mintedTokenId = parsed.args.tokenId ? parsed.args.tokenId.toString() : null;
          if (mintedTokenId) break;
        }
      } catch (e) {
        // Not a contract log, continue
      }
    }
  }

  if (!mintedTokenId) {
    try {
      const bId = await contract.userPrimaryBadge(recipientAddress);
      if (bId && Number(bId) > 0) mintedTokenId = bId.toString();
    } catch (e) {}
  }

  return {
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
    recipient: recipientAddress,
    badgeType,
    tokenId: mintedTokenId,
    status: 'CONFIRMED'
  };
};

/**
 * Attest a professional record on chain:
 * 1. Register W3C Verifiable Credential on TrueIDCredentialRegistry
 * 2. Mint ERC-5192 Soulbound Credential Badge to citizen wallet
 */
exports.attestProfessionalCredentialOnChain = async ({
  subjectAddress,
  recordId,
  credentialId,
  recordType,
  institution,
  title,
  credentialHash,
  biometricHash = ''
}) => {
  if (!subjectAddress) {
    throw new Error('Citizen wallet address is required for on-chain credential attestation');
  }

  const results = {
    subjectAddress,
    recordId,
    credentialId,
    txHashes: [],
    credentialTxHash: null,
    sbtTxHash: null,
    tokenId: null,
    status: 'CONFIRMED'
  };

  // 1. Register W3C Credential on TrueIDCredentialRegistry
  try {
    const credRes = await exports.registerW3CCredential({
      credentialId: credentialId || `urn:uuid:cred-${recordId}-${Date.now()}`,
      subjectAddress,
      recordType: recordType || 'EMPLOYMENT',
      institution: institution || 'TrueID Accredited Issuer',
      credentialHash: credentialHash || id(`trueid-credential-${recordId}`),
      credentialURI: `https://trueid.authority.gov/credentials/${recordId}`,
      validityDuration: 0 // Permanent
    });
    results.credentialTxHash = credRes.txHash;
    results.blockNumber = credRes.blockNumber;
    results.txHashes.push(credRes.txHash);
  } catch (credErr) {
    console.warn(`[Blockchain] Credential registry anchoring skipped/failed: ${credErr.message}`);
  }

  // 2. Mint ERC-5192 Soulbound Token to citizen
  try {
    const formattedBiometric = (biometricHash && biometricHash.length === 64)
      ? `0x${biometricHash}`
      : (biometricHash && biometricHash.startsWith('0x') && biometricHash.length === 66 ? biometricHash : '0x0000000000000000000000000000000000000000000000000000000000000000');

    const badgeType = `CREDENTIAL_${(recordType || 'VERIFIED').toUpperCase()}`;
    const sbtRes = await exports.mintSoulboundBadgeOnChain({
      recipientAddress: subjectAddress,
      badgeType,
      metadataURI: `https://trueid.authority.gov/credentials/badge/${recordId}`,
      identityCommitment: formattedBiometric
    });

    results.sbtTxHash = sbtRes.txHash;
    results.tokenId = sbtRes.tokenId;
    if (sbtRes.txHash && !results.txHashes.includes(sbtRes.txHash)) {
      results.txHashes.push(sbtRes.txHash);
    }
  } catch (sbtErr) {
    console.warn(`[Blockchain] Soulbound badge minting for credential skipped/failed: ${sbtErr.message}`);
  }

  results.primaryTxHash = results.sbtTxHash || results.credentialTxHash || (results.txHashes[0] || null);
  results.success = Boolean(results.primaryTxHash);
  return results;
};

/**
 * Update W3C DID biometric commitment in TrueIDDIDRegistry
 */
exports.updateDIDBiometricCommitment = async (identityAddress, commitment) => {
  const contract = exports.getDIDRegistryContract();
  const commitmentBytes = commitment.startsWith('0x') && commitment.length === 66
    ? commitment
    : id(commitment);

  const tx = await contract.setBiometricCommitment(identityAddress, commitmentBytes);
  const receipt = await tx.wait(1);
  return {
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
    identity: identityAddress,
    status: 'CONFIRMED'
  };
};

/**
 * Verify Groth16 zero-knowledge proof
 */
exports.verifyZeroKnowledgeProof = async (a, b, c, input) => {
  const contract = exports.getZKVerifierContract();
  return await contract.verifyProof(a, b, c, input);
};

/**
 * Revoke citizen identity and soulbound badge on chain
 */
exports.revokeCitizenOnChain = async (walletAddress, reason = 'Administrative revocation') => {
  if (!walletAddress) return { success: false, reason: 'No wallet address' };
  const results = { walletAddress, sbtRevoked: false, identityRevoked: false, txHashes: [] };

  // 1. Revoke Soulbound Badge
  try {
    const sbtContract = exports.getSoulboundBadgeContract();
    const badgeId = await sbtContract.userPrimaryBadge(walletAddress).catch(() => 0n);
    if (Number(badgeId) > 0) {
      const isValid = await sbtContract.isBadgeValid(badgeId).catch(() => false);
      if (isValid) {
        const tx = await sbtContract.revokeBadge(badgeId);
        const receipt = await tx.wait(1);
        results.sbtRevoked = true;
        results.sbtTokenId = Number(badgeId);
        results.txHashes.push(tx.hash || receipt.hash);
      }
    }
  } catch (sbtError) {
    console.warn(`[Blockchain] SBT revocation skipped/failed for ${walletAddress}:`, sbtError.message);
  }

  // 2. Revoke on IdentityManagement
  try {
    const { contract } = initBlockchain();
    const hasReg = await contract.hasRegisteredIdentity(walletAddress).catch(() => false);
    if (hasReg) {
      const tx = await contract.revokeIdentity(walletAddress, reason, { gasLimit: 250000 });
      const receipt = await tx.wait(1);
      results.identityRevoked = true;
      results.txHashes.push(tx.hash || receipt.hash);
    }
  } catch (idError) {
    console.warn(`[Blockchain] Identity revocation skipped/failed for ${walletAddress}:`, idError.message);
  }

  results.success = results.sbtRevoked || results.identityRevoked;
  return results;
};

/**
 * Attest citizen on chain (mints Soulbound Badge and/or registers in IdentityManagement)
 */
exports.attestCitizenOnChain = async (walletAddress, biometricHash = '') => {
  if (!walletAddress) return { success: false, reason: 'No wallet address' };
  const results = { walletAddress, badgeMinted: false, identityVerified: false, txHashes: [] };

  // 1. Check & Mint Soulbound Badge if not held
  try {
    const sbtContract = exports.getSoulboundBadgeContract();
    const badgeId = await sbtContract.userPrimaryBadge(walletAddress).catch(() => 0n);
    let hasValidBadge = false;

    if (Number(badgeId) > 0) {
      hasValidBadge = await sbtContract.isBadgeValid(badgeId).catch(() => false);
    }

    if (!hasValidBadge) {
      const formattedBiometric = (biometricHash && biometricHash.length === 64) 
        ? `0x${biometricHash}` 
        : (biometricHash && biometricHash.startsWith('0x') && biometricHash.length === 66 ? biometricHash : '0x0000000000000000000000000000000000000000000000000000000000000000');
      
      const sbtRes = await exports.mintSoulboundBadgeOnChain({
        recipientAddress: walletAddress,
        badgeType: 'STANDARD_CITIZEN',
        identityCommitment: formattedBiometric,
        metadataURI: `https://trueid.authority.gov/badge/${walletAddress.toLowerCase()}`
      });

      results.badgeMinted = true;
      results.sbtTxHash = sbtRes.txHash;
      results.txHashes.push(sbtRes.txHash);
    }
  } catch (sbtError) {
    console.warn(`[Blockchain] Soulbound badge minting skipped/failed for ${walletAddress}:`, sbtError.message);
  }

  // 2. Verify on IdentityManagement if identity exists
  try {
    const { contract } = initBlockchain();
    const hasReg = await contract.hasRegisteredIdentity(walletAddress).catch(() => false);
    if (hasReg) {
      const isVerified = await contract.isIdentityVerified(walletAddress).catch(() => false);
      if (!isVerified) {
        const tx = await contract.verifyIdentity(walletAddress, { gasLimit: 250000 });
        const receipt = await tx.wait(1);
        results.identityVerified = true;
        results.identityTxHash = tx.hash || receipt.hash;
        results.txHashes.push(tx.hash || receipt.hash);
      }
    }
  } catch (idError) {
    console.warn(`[Blockchain] Identity verification on contract skipped/failed for ${walletAddress}:`, idError.message);
  }

  results.success = results.badgeMinted || results.identityVerified || results.txHashes.length > 0;
  return results;
};

/**
 * Get comprehensive on-chain state for a citizen wallet address
 */
exports.getOnChainIdentity = async (walletAddress) => {
  if (!walletAddress) {
    return {
      isRegisteredOnChain: false,
      isVerifiedOnChain: false,
      soulboundTokenId: null,
      isBadgeValid: false,
      network: 'Ethereum Sepolia',
      contractAddress: process.env.CONTRACT_ADDRESS
    };
  }

  try {
    const sbtContract = exports.getSoulboundBadgeContract();
    const [badgeId, balance] = await Promise.all([
      sbtContract.userPrimaryBadge(walletAddress).catch(() => 0n),
      sbtContract.balanceOf(walletAddress).catch(() => 0n)
    ]);

    const numBadgeId = Number(badgeId);
    let isBadgeValid = false;
    if (numBadgeId > 0) {
      isBadgeValid = await sbtContract.isBadgeValid(numBadgeId).catch(() => false);
    }

    let isIdentityRegistered = numBadgeId > 0 || Number(balance) > 0;
    let isIdentityVerified = isBadgeValid;

    // Also check IdentityManagement contract
    try {
      const { contract } = initBlockchain();
      const hasReg = await contract.hasRegisteredIdentity(walletAddress).catch(() => false);
      if (hasReg) {
        isIdentityRegistered = true;
        const verified = await contract.isIdentityVerified(walletAddress).catch(() => false);
        if (verified) isIdentityVerified = true;
      }
    } catch (e) {
      // Ignore fallback
    }

    return {
      isRegisteredOnChain: isIdentityRegistered,
      isVerifiedOnChain: isIdentityVerified,
      soulboundTokenId: numBadgeId > 0 ? numBadgeId : null,
      isBadgeValid,
      contracts: {
        identityRegistry: process.env.CONTRACT_ADDRESS || process.env.IDENTITY_REGISTRY_ADDRESS,
        soulboundBadge: process.env.SOULBOUND_BADGE_ADDRESS,
        didRegistry: process.env.DID_REGISTRY_ADDRESS,
        credentialRegistry: process.env.CREDENTIAL_REGISTRY_ADDRESS
      },
      network: 'Ethereum Sepolia (Chain ID 11155111)',
      explorerUrl: `https://sepolia.etherscan.io/address/${walletAddress}`
    };
  } catch (error) {
    console.warn(`[Blockchain] Error inspecting on-chain identity for ${walletAddress}:`, error.message);
    return {
      isRegisteredOnChain: false,
      isVerifiedOnChain: false,
      soulboundTokenId: null,
      isBadgeValid: false,
      network: 'Ethereum Sepolia',
      contractAddress: process.env.CONTRACT_ADDRESS
    };
  }
};


