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
    // No initialization needed as we'll use backend API
    this.initialized = true;
    return true;
  }

  async verifyIdentity(userId) {
    try {
      const response = await fetch(`/api/admin/users/${userId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ action: 'VERIFY' })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify identity');
      }
      
      return {
        success: true,
        txHash: data.txHash
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

const blockchainServiceInstance = new BlockchainService();
export default blockchainServiceInstance;
