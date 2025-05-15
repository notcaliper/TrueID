import { ethers } from 'ethers';
import IdentityManagementABI from '../utils/IdentityManagementABI.json';

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Check if MetaMask is installed
      if (window.ethereum) {
        // Connect to the Ethereum network using MetaMask
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Get the signer
        this.signer = this.provider.getSigner();
        
        // Create contract instance
        this.contract = new ethers.Contract(
          this.contractAddress,
          IdentityManagementABI,
          this.signer
        );
        
        this.initialized = true;
        console.log('Blockchain service initialized');
        return true;
      } else {
        console.error('MetaMask not installed');
        return false;
      }
    } catch (error) {
      console.error('Error initializing blockchain service:', error);
      return false;
    }
  }

  async verifyIdentity(userAddress) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      const tx = await this.contract.verifyIdentity(userAddress);
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error verifying identity:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateBiometricHash(userAddress, newBiometricHash) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      const tx = await this.contract.updateBiometricHash(userAddress, newBiometricHash);
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error updating biometric hash:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyProfessionalRecord(userAddress, recordIndex) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      const tx = await this.contract.verifyProfessionalRecord(userAddress, recordIndex);
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error verifying professional record:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async isIdentityVerified(userAddress) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      const isVerified = await this.contract.isIdentityVerified(userAddress);
      return {
        success: true,
        isVerified
      };
    } catch (error) {
      console.error('Error checking identity verification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getProfessionalRecords(userAddress) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      const count = await this.contract.getProfessionalRecordCount(userAddress);
      const records = [];
      
      for (let i = 0; i < count; i++) {
        const record = await this.contract.getProfessionalRecord(userAddress, i);
        records.push({
          dataHash: record.dataHash,
          startDate: new Date(record.startDate * 1000),
          endDate: record.endDate > 0 ? new Date(record.endDate * 1000) : null,
          verifier: record.verifier,
          isVerified: record.isVerified,
          createdAt: new Date(record.createdAt * 1000)
        });
      }
      
      return {
        success: true,
        records
      };
    } catch (error) {
      console.error('Error getting professional records:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getBiometricHash(userAddress) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      const hash = await this.contract.getBiometricHash(userAddress);
      return {
        success: true,
        hash
      };
    } catch (error) {
      console.error('Error getting biometric hash:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new BlockchainService();
