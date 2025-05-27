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

// Smart contract ABI
const IdentityManagementABI = [
  // Events
  "event IdentityCreated(address indexed user, bytes32 biometricHash, uint256 timestamp)",
  "event IdentityUpdated(address indexed user, address indexed updatedBy, uint256 timestamp)",
  "event IdentityVerified(address indexed user, address indexed verifier, uint256 timestamp)",
  "event ProfessionalRecordAdded(address indexed user, bytes32 dataHash, uint256 timestamp)",
  "event ProfessionalRecordVerified(address indexed user, uint256 recordIndex, address verifier, uint256 timestamp)",
  "event RoleGranted(address indexed account, bytes32 indexed role, address indexed grantor)",
  "event RoleRevoked(address indexed account, bytes32 indexed role, address indexed revoker)",
  
  // Functions
  "function createIdentity(bytes32 biometricHash, bytes32 professionalDataHash) external",
  "function updateBiometricHash(address user, bytes32 newBiometricHash) external",
  "function updateProfessionalData(bytes32 newProfessionalDataHash) external",
  "function verifyIdentity(address user) external",
  "function addProfessionalRecord(bytes32 dataHash, uint256 startDate, uint256 endDate) external",
  "function verifyProfessionalRecord(address user, uint256 recordIndex) external",
  "function grantRole(address account, bytes32 role) external",
  "function revokeRole(address account, bytes32 role) external",
  "function hasRole(address account, bytes32 role) external view returns (bool)",
  "function getBiometricHash(address user) external view returns (bytes32)",
  "function isIdentityVerified(address user) external view returns (bool)",
  "function getProfessionalRecordCount(address user) external view returns (uint256)",
  "function getProfessionalRecord(address user, uint256 recordIndex) external view returns (bytes32 dataHash, uint256 startDate, uint256 endDate, address verifier, bool isVerified, uint256 createdAt)"
];

// Role constants
const USER_ROLE = ethers.utils.id("USER");
const GOVERNMENT_ROLE = ethers.utils.id("GOVERNMENT");
const ADMIN_ROLE = ethers.utils.id("ADMIN");

/**
 * Get blockchain configuration - always use Avalanche Fuji Testnet
 * @returns {Object} Blockchain configuration
 */
const getBlockchainConfig = () => {
  // Always use AVAX Fuji Testnet
  const rpcUrl = process.env.AVALANCHE_FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
  const contractAddress = process.env.AVALANCHE_FUJI_CONTRACT_ADDRESS;
  const chainId = 43113;
  const networkName = 'Avalanche Fuji Testnet';

  return {
    rpcUrl,
    contractAddress,
    privateKey: process.env.ADMIN_PRIVATE_KEY,
    networkName,
    chainId
  };
};

/**
 * Initialize blockchain provider and contract
 * @returns {Object} Provider and contract instances
 */
const initBlockchain = () => {
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
    
<<<<<<< HEAD
    // Create provider with explicit network configuration
    const provider = new ethers.providers.JsonRpcProvider(
      rpcUrl,
      {
        name: networkName,
        chainId: chainId,
        ensAddress: null
      }
    );
=======
    // Create provider
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
>>>>>>> parent of 645e0af (Merge pull request #4 from notcaliper/blockchain)
    
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
      network: {
        networkName: config.networkName,
        rpcUrl: config.rpcUrl,
        contractAddress: config.contractAddress
      }
    };
  } catch (error) {
    console.error('Get network info error:', error);
    return {
      error: error.message
    };
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
    await contract.hasRole(ethers.constants.AddressZero, ADMIN_ROLE);
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
  try {
    const { contract } = initBlockchain();
    
    // Get biometric hash to check if identity exists
    const biometricHash = await contract.getBiometricHash(walletAddress);
    
    // If biometric hash is zero, identity is not registered
    return biometricHash !== ethers.constants.HashZero;
  } catch (error) {
    console.error('Check identity registration error:', error);
    throw new Error('Failed to check if identity is registered on blockchain');
  }
};

/**
 * Register identity on blockchain
 * @param {String} walletAddress - User's wallet address
 * @param {String} biometricHash - Hash of user's biometric data
 * @param {String} professionalDataHash - Hash of user's professional data
 * @returns {Object} Transaction result
 */
exports.registerIdentity = async (walletAddress, biometricHash, professionalDataHash) => {
  try {
    const { contract, networkName } = initBlockchain();
    
    // Convert hashes to bytes32
    const biometricHashBytes = ethers.utils.id(biometricHash);
    const professionalDataHashBytes = ethers.utils.id(professionalDataHash);
    
    // Create identity on blockchain
    const tx = await contract.createIdentity(
      walletAddress,
      biometricHashBytes,
      professionalDataHashBytes
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
    const biometricHashBytes = ethers.utils.id(newBiometricHash);
    
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
    const dataHashBytes = ethers.utils.id(dataHash);
    
    // Add professional record on blockchain
    const tx = await contract.addProfessionalRecord(
      walletAddress,
      dataHashBytes,
      startTimestamp,
      endTimestamp,
      { gasLimit: 300000 }
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
  try {
    const { contract } = initBlockchain();
    const verified = await contract.isIdentityVerified(walletAddress);
    return verified;
  } catch (error) {
    console.error('Check identity verification error:', error);
    throw new Error('Failed to check if identity is verified on blockchain');
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
    return count.toNumber();
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
      startDate: record.startDate.toNumber(),
      endDate: record.endDate.toNumber(),
      verifier: record.verifier,
      isVerified: record.isVerified,
      createdAt: record.createdAt.toNumber()
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
    const hashBytes = ethers.utils.id(hash);
    
    // Verify document hash on blockchain
    const result = await contract.verifyDocument(hashBytes);
    
    return {
      exists: result.exists,
      timestamp: result.timestamp.toNumber(),
      issuer: result.issuer,
      network: networkName
    };
  } catch (error) {
    console.error('Verify document hash error:', error);
    throw new Error('Failed to verify document hash on blockchain');
  }
};
