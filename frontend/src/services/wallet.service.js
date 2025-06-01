import { ethers } from 'ethers';

/**
 * Wallet Service for frontend
 * Handles Avalanche C-Chain wallet operations
 */
class WalletService {
  constructor() {
    this.provider = null;
    this.initProvider();
  }

  /**
   * Initialize connection to Avalanche Fuji Testnet
   */
  initProvider() {
    // Default Avalanche Fuji Testnet RPC URL
    const rpcUrl = process.env.REACT_APP_AVALANCHE_FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Get wallet balance
   * @param {String} address - Wallet address
   * @returns {Promise<String>} Balance in AVAX
   */
  async getBalance(address) {
    try {
      if (!this.provider) {
        this.initProvider();
      }
      
      const balance = await this.provider.getBalance(address);
      // Convert from wei to AVAX (18 decimals)
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw new Error('Failed to get wallet balance');
    }
  }

  /**
   * Validate if an address is a valid Ethereum/Avalanche address
   * @param {String} address - Address to validate
   * @returns {Boolean} True if valid, false otherwise
   */
  isValidAddress(address) {
    try {
      return ethers.utils.isAddress(address);
    } catch (error) {
      return false;
    }
  }

  /**
   * Connect to MetaMask or other web3 provider
   * @returns {Promise<Object>} Connected wallet info
   */
  async connectWallet() {
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to use this feature.');
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask and try again.');
      }

      // Get the connected wallet address
      const address = accounts[0];
      
      // Create a Web3Provider using the window.ethereum object
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Get the network information
      const network = await provider.getNetwork();
      
      // Check if connected to Avalanche Fuji Testnet (Chain ID: 43113)
      if (network.chainId !== 43113) {
        try {
          // Try to switch to Avalanche Fuji Testnet
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xA869' }], // 43113 in hex
          });
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xA869', // 43113 in hex
                chainName: 'Avalanche Fuji Testnet',
                nativeCurrency: {
                  name: 'AVAX',
                  symbol: 'AVAX',
                  decimals: 18
                },
                rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
                blockExplorerUrls: ['https://testnet.snowtrace.io/']
              }]
            });
          } else {
            throw switchError;
          }
        }
      }

      // Get the balance
      const balance = await this.getBalance(address);

      return {
        address,
        balance,
        network: network.name,
        chainId: network.chainId
      };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  /**
   * Get transaction history for an address from the Snowtrace API
   * @param {String} address - Wallet address
   * @returns {Promise<Array>} Array of transactions
   */
  async getTransactionHistory(address) {
    // Note: In a production app, you would typically call your backend API
    // which would then make the call to Snowtrace API with your API key
    // This is a simplified example
    try {
      const response = await fetch(
        `https://api-testnet.snowtrace.io/api?module=account&action=txlist&address=${address}&sort=desc`
      );
      const data = await response.json();
      
      if (data.status === '1') {
        return data.result;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }
}

export default new WalletService();
