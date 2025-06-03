import { ethers } from 'ethers';

/**
 * Wallet Service for frontend
 * Handles Avalanche C-Chain wallet operations
 */
class WalletService {
  constructor() {
    this.provider = null;
    this.balanceCache = new Map();
    this.lastCacheUpdate = null;
    this.cacheExpiryMs = 30000; // 30 seconds
    this.retryAttempts = 3;
    this.retryDelayMs = 1000;
    this.lastError = null;
    this.initProvider();
  }

  /**
   * Initialize connection to Avalanche Fuji Testnet
   */
  async initProvider() {
    try {
      // Default Avalanche Fuji Testnet RPC URL
      const rpcUrl = process.env.REACT_APP_AVALANCHE_FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
      console.log('Connecting to RPC URL:', rpcUrl);
      
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      
      // Test the connection by getting the network
      const network = await this.provider.ready;
      console.log('Provider ready, getting network details...');
      
      const networkInfo = await this.provider.getNetwork();
      console.log('Connected to network:', networkInfo);
      
      if (networkInfo && networkInfo.chainId !== 43113) {
        console.warn(`Connected to chain ID ${networkInfo.chainId}, expected Avalanche Fuji Testnet (43113)`);
      }
      
      // Add event listeners for provider
      this.provider.on('error', (error) => {
        console.error('Provider error:', error);
        // Try to reinitialize provider after error
        this.provider = null;
        setTimeout(() => this.initProvider(), this.retryDelayMs);
      });
      
      return true;
    } catch (error) {
      console.error('Error initializing provider:', error);
      // Try to reinitialize provider after error
      this.provider = null;
      setTimeout(() => this.initProvider(), this.retryDelayMs);
      return false;
    }
  }

  /**
   * Get wallet balance with caching and retry logic
   * @param {String} address - Wallet address
   * @param {Boolean} forceRefresh - Force refresh from network
   * @returns {Promise<String>} Balance in AVAX
   */
  async getBalance(address, forceRefresh = false) {
    // Validate address
    if (!this.isValidAddress(address)) {
      console.error('Invalid wallet address:', address);
      return '0';
    }
    
    // Check cache if not forcing refresh
    if (!forceRefresh && this.balanceCache.has(address)) {
      const cachedData = this.balanceCache.get(address);
      const now = Date.now();
      
      // Return cached balance if not expired
      if (now - cachedData.timestamp < this.cacheExpiryMs) {
        return cachedData.balance;
      }
    }
    
    // Implement retry logic
    let attempts = 0;
    
    while (attempts < this.retryAttempts) {
      try {
        if (!this.provider) {
          const initialized = await this.initProvider();
          if (!initialized) {
            throw new Error('Failed to initialize provider');
          }
        }
        
        // Wait for provider to be ready
        await this.provider.ready;
        
        console.log('Fetching balance for address:', address);
        const balance = await this.provider.getBalance(address);
        console.log('Raw balance:', balance.toString());
        
        if (!balance) {
          throw new Error('Received null or undefined balance from provider');
        }
        
        // Convert from wei to AVAX (18 decimals)
        const formattedBalance = ethers.utils.formatEther(balance);
        console.log('Formatted balance:', formattedBalance);
        
        // Validate the formatted balance
        const numBalance = parseFloat(formattedBalance);
        if (isNaN(numBalance)) {
          throw new Error('Invalid balance received from provider');
        }
        
        // Update cache
        this.balanceCache.set(address, {
          balance: formattedBalance,
          timestamp: Date.now()
        });
        this.lastCacheUpdate = Date.now();
        
        return formattedBalance;
      } catch (error) {
        this.lastError = error;
        console.error(`Error getting wallet balance (attempt ${attempts + 1}/${this.retryAttempts}):`, error);
        attempts++;
        
        if (attempts < this.retryAttempts) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, this.retryDelayMs));
          // Reset provider on error
          this.provider = null;
        }
      }
    }
    
    // After all retries failed, check if we have a cached value to return as fallback
    if (this.balanceCache.has(address)) {
      console.warn('Using cached balance after failed refresh attempts');
      return this.balanceCache.get(address).balance;
    }
    
    console.error('Failed to get wallet balance after multiple attempts');
    return '0'; // Return 0 as fallback instead of throwing
  }
  
  /**
   * Clear the balance cache
   */
  clearCache() {
    this.balanceCache.clear();
    this.lastCacheUpdate = null;
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
      console.log('Connected to network:', network);
      
      // Check if we're on the correct network
      if (network.chainId !== 43113) {
        console.warn(`Connected to chain ID ${network.chainId}, expected Avalanche Fuji Testnet (43113)`);
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

// Create a singleton instance
const walletServiceInstance = new WalletService();
export default walletServiceInstance;
