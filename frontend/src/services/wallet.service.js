import { mockWalletData, mockTransactions } from './mockData.service';

/**
 * Wallet Service - Standalone Mode
 * Mock wallet operations for frontend development
 */
class WalletService {
  constructor() {
    this.mockMode = true;
    this.connectedAddress = null;
    this.balance = '12.456';
  }

  /**
   * Simulate connecting to a wallet
   * @returns {Promise<Object>} Connected wallet info
   */
  async connectWallet() {
    // Simulate MetaMask connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f8dEe3';
    this.connectedAddress = mockAddress;
    
    return {
      address: mockAddress,
      balance: this.balance,
      network: 'Ethereum Sepolia Testnet',
      chainId: 11155111,
      currency: 'ETH',
      connected: true
    };
  }

  /**
   * Get wallet balance
   * @returns {Promise<String>} Balance in AVAX
   */
  async getBalance(address) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.balance;
  }

  /**
   * Get complete wallet data
   * @returns {Promise<Object>} Wallet data with tokens and NFTs
   */
  async getWalletData() {
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockWalletData;
  }

  /**
   * Validate if an address is valid (mock)
   * @param {String} address - Address to validate
   * @returns {Boolean} Always returns true for valid-looking addresses
   */
  isValidAddress(address) {
    return address && address.startsWith('0x') && address.length === 42;
  }

  /**
   * Get transaction history
   * @returns {Promise<Array>} Mock transactions
   */
  async getTransactionHistory(address) {
    await new Promise(resolve => setTimeout(resolve, 700));
    return mockTransactions;
  }

  /**
   * Simulate sending a transaction
   * @param {Object} transaction - Transaction details
   * @returns {Promise<Object>} Transaction result
   */
  async sendTransaction(transaction) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const txHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    
    return {
      hash: txHash,
      status: 'confirmed',
      from: this.connectedAddress,
      to: transaction.to,
      value: transaction.value || '0',
      gas: '21000',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Simulate token transfer
   * @param {String} token - Token symbol
   * @param {String} to - Recipient address
   * @param {String} amount - Amount to transfer
   * @returns {Promise<Object>} Transfer result
   */
  async transferToken(token, to, amount) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      token,
      amount,
      to,
      txHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get gas estimate
   * @returns {Promise<Object>} Gas prices
   */
  async getGasEstimate() {
    return {
      slow: '15',
      average: '20',
      fast: '25',
      unit: 'Gwei'
    };
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    this.connectedAddress = null;
    return { disconnected: true };
  }

  /**
   * Check if wallet is connected
   * @returns {Boolean}
   */
  isConnected() {
    return !!this.connectedAddress;
  }

  /**
   * Get connected address
   * @returns {String|null}
   */
  getAddress() {
    return this.connectedAddress;
  }
}

// Create a singleton instance
const walletServiceInstance = new WalletService();
export default walletServiceInstance;
