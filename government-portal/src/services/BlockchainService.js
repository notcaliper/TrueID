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

  async verifyProfessionalRecord(userId, recordId) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      const response = await fetch(`/api/blockchain/record-professional-record/${recordId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to record professional record on blockchain');
      }
      
      return {
        success: true,
        txHash: data.transactionHash
      };
    } catch (error) {
      console.error('Error recording professional record on blockchain:', error);
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
      const response = await fetch('/api/blockchain/expiry', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to check identity verification status');
      }
      
      return {
        success: true,
        isVerified: data.isVerified,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        daysRemaining: data.daysRemaining
      };
    } catch (error) {
      console.error('Error checking identity verification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getProfessionalRecords(userId) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      const response = await fetch(`/api/users/${userId}/professional-records`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch professional records');
      }
      
      // Format the records to match the expected structure
      const records = data.records.map(record => ({
        id: record.id,
        dataHash: record.hash,
        title: record.title,
        organization: record.organization,
        startDate: new Date(record.startDate),
        endDate: record.endDate ? new Date(record.endDate) : null,
        description: record.description,
        verificationStatus: record.verificationStatus,
        onBlockchain: record.onBlockchain,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt)
      }));
      
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
