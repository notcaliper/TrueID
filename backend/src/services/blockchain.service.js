/**
 * Blockchain service for DBIS
 * Handles interaction with the blockchain network
 */
const ethers = require('ethers');
const IdentityManagementABI = require('../blockchain/contracts/abi/IdentityManagement.json');

// Load environment variables
const {
  BLOCKCHAIN_RPC_URL,
  CONTRACT_ADDRESS,
  PRIVATE_KEY
} = process.env;

/**
 * Initialize blockchain provider and contract
 * @returns {Object} Provider and contract instances
 */
const initBlockchain = () => {
  try {
    // Create provider
    const provider = new ethers.providers.JsonRpcProvider(BLOCKCHAIN_RPC_URL);
    
    // Create wallet
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    // Create contract instance
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      IdentityManagementABI,
      wallet
    );
    
    return { provider, wallet, contract };
  } catch (error) {
    console.error('Blockchain initialization error:', error);
    throw new Error('Failed to initialize blockchain connection');
  }
};

/**
 * Register identity on blockchain
 * @param {String} userAddress - User's wallet address
 * @param {String} biometricHash - SHA-256 hash of biometric data
 * @param {String} professionalDataHash - Hash of professional data
 * @returns {Object} Transaction details
 */
exports.registerIdentity = async (userAddress, biometricHash, professionalDataHash) => {
  try {
    const { contract } = initBlockchain();
    
    // Convert string hashes to bytes32
    const biometricHashBytes = ethers.utils.id(biometricHash);
    const professionalDataHashBytes = ethers.utils.id(professionalDataHash);
    
    // Call contract method
    const tx = await contract.createIdentity(
      biometricHashBytes,
      professionalDataHashBytes,
      { gasLimit: 300000 }
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failed'
    };
  } catch (error) {
    console.error('Register identity on blockchain error:', error);
    throw new Error('Failed to register identity on blockchain');
  }
};

/**
 * Update biometric hash on blockchain
 * @param {String} userAddress - User's wallet address
 * @param {String} newBiometricHash - New SHA-256 hash of biometric data
 * @returns {Object} Transaction details
 */
exports.updateBiometricHash = async (userAddress, newBiometricHash) => {
  try {
    const { contract } = initBlockchain();
    
    // Convert string hash to bytes32
    const biometricHashBytes = ethers.utils.id(newBiometricHash);
    
    // Call contract method
    const tx = await contract.updateBiometricHash(
      userAddress,
      biometricHashBytes,
      { gasLimit: 200000 }
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failed'
    };
  } catch (error) {
    console.error('Update biometric hash on blockchain error:', error);
    throw new Error('Failed to update biometric hash on blockchain');
  }
};

/**
 * Update professional data hash on blockchain
 * @param {String} userAddress - User's wallet address
 * @param {String} newProfessionalDataHash - New hash of professional data
 * @returns {Object} Transaction details
 */
exports.updateProfessionalData = async (userAddress, newProfessionalDataHash) => {
  try {
    const { contract } = initBlockchain();
    
    // Convert string hash to bytes32
    const professionalDataHashBytes = ethers.utils.id(newProfessionalDataHash);
    
    // Call contract method
    const tx = await contract.updateProfessionalData(
      professionalDataHashBytes,
      { gasLimit: 200000 }
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failed'
    };
  } catch (error) {
    console.error('Update professional data on blockchain error:', error);
    throw new Error('Failed to update professional data on blockchain');
  }
};

/**
 * Verify identity on blockchain (government only)
 * @param {String} userAddress - User's wallet address
 * @returns {Object} Transaction details
 */
exports.verifyIdentity = async (userAddress) => {
  try {
    const { contract } = initBlockchain();
    
    // Call contract method
    const tx = await contract.verifyIdentity(
      userAddress,
      { gasLimit: 200000 }
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failed'
    };
  } catch (error) {
    console.error('Verify identity on blockchain error:', error);
    throw new Error('Failed to verify identity on blockchain');
  }
};

/**
 * Add professional record to blockchain
 * @param {String} userAddress - User's wallet address
 * @param {String} dataHash - Hash of professional record data
 * @param {Number} startDate - Start date timestamp
 * @param {Number} endDate - End date timestamp (0 if current)
 * @returns {Object} Transaction details
 */
exports.addProfessionalRecord = async (userAddress, dataHash, startDate, endDate) => {
  try {
    const { contract } = initBlockchain();
    
    // Convert string hash to bytes32
    const dataHashBytes = ethers.utils.id(dataHash);
    
    // Convert dates to UNIX timestamps
    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
    const endTimestamp = endDate ? Math.floor(new Date(endDate).getTime() / 1000) : 0;
    
    // Call contract method
    const tx = await contract.addProfessionalRecord(
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
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failed'
    };
  } catch (error) {
    console.error('Add professional record on blockchain error:', error);
    throw new Error('Failed to add professional record on blockchain');
  }
};

/**
 * Verify professional record on blockchain (government only)
 * @param {String} userAddress - User's wallet address
 * @param {Number} recordIndex - Index of the record in the user's professional history
 * @returns {Object} Transaction details
 */
exports.verifyProfessionalRecord = async (userAddress, recordIndex) => {
  try {
    const { contract } = initBlockchain();
    
    // Call contract method
    const tx = await contract.verifyProfessionalRecord(
      userAddress,
      recordIndex,
      { gasLimit: 200000 }
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failed'
    };
  } catch (error) {
    console.error('Verify professional record on blockchain error:', error);
    throw new Error('Failed to verify professional record on blockchain');
  }
};

/**
 * Get biometric hash from blockchain
 * @param {String} userAddress - User's wallet address
 * @returns {String} Biometric hash
 */
exports.getBiometricHash = async (userAddress) => {
  try {
    const { contract } = initBlockchain();
    
    // Call contract method
    const biometricHashBytes = await contract.getBiometricHash(userAddress);
    
    // Convert bytes32 to string
    return ethers.utils.parseBytes32String(biometricHashBytes);
  } catch (error) {
    console.error('Get biometric hash from blockchain error:', error);
    throw new Error('Failed to get biometric hash from blockchain');
  }
};

/**
 * Check if identity is verified on blockchain
 * @param {String} userAddress - User's wallet address
 * @returns {Boolean} Verification status
 */
exports.isIdentityVerified = async (userAddress) => {
  try {
    const { contract } = initBlockchain();
    
    // Call contract method
    return await contract.isIdentityVerified(userAddress);
  } catch (error) {
    console.error('Check identity verification on blockchain error:', error);
    throw new Error('Failed to check identity verification on blockchain');
  }
};

/**
 * Get professional record count from blockchain
 * @param {String} userAddress - User's wallet address
 * @returns {Number} Number of professional records
 */
exports.getProfessionalRecordCount = async (userAddress) => {
  try {
    const { contract } = initBlockchain();
    
    // Call contract method
    const count = await contract.getProfessionalRecordCount(userAddress);
    
    return count.toNumber();
  } catch (error) {
    console.error('Get professional record count from blockchain error:', error);
    throw new Error('Failed to get professional record count from blockchain');
  }
};

/**
 * Get professional record from blockchain
 * @param {String} userAddress - User's wallet address
 * @param {Number} recordIndex - Index of the record
 * @returns {Object} Professional record details
 */
exports.getProfessionalRecord = async (userAddress, recordIndex) => {
  try {
    const { contract } = initBlockchain();
    
    // Call contract method
    const record = await contract.getProfessionalRecord(userAddress, recordIndex);
    
    return {
      dataHash: ethers.utils.parseBytes32String(record.dataHash),
      startDate: new Date(record.startDate.toNumber() * 1000),
      endDate: record.endDate.toNumber() > 0 ? new Date(record.endDate.toNumber() * 1000) : null,
      verifier: record.verifier,
      isVerified: record.isVerified,
      createdAt: new Date(record.createdAt.toNumber() * 1000)
    };
  } catch (error) {
    console.error('Get professional record from blockchain error:', error);
    throw new Error('Failed to get professional record from blockchain');
  }
};
