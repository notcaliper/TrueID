/**
 * TrueID Web3 Wallet Client Service
 * Connects directly to window.ethereum (MetaMask, Rabby, Coinbase Wallet) or Ethers provider
 */

class WalletService {
  constructor() {
    this.connectedAddress = null;
  }

  /**
   * Request connection to injected Ethereum provider (MetaMask / Web3 browser extension)
   */
  async connectWallet() {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const address = accounts[0];
        this.connectedAddress = address;

        const balanceHex = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest']
        });
        const balanceEth = (parseInt(balanceHex, 16) / 1e18).toFixed(4);

        return {
          address,
          balance: balanceEth,
          network: chainId === '0xaa36a7' ? 'Ethereum Sepolia Testnet' : 'EVM Network',
          chainId: parseInt(chainId, 16),
          currency: 'ETH',
          connected: true
        };
      } catch (err) {
        if (err.code === 4001) {
          throw new Error('Wallet connection rejected by user.');
        }
        throw err;
      }
    }

    throw new Error('No Ethereum wallet extension detected (e.g. MetaMask). Please install an extension to connect.');
  }

  /**
   * Query live balance of address via Web3 or Sepolia RPC
   */
  async getBalance(address) {
    if (!address) return '0.0000';
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const balanceHex = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest']
        });
        return (parseInt(balanceHex, 16) / 1e18).toFixed(4);
      } catch {
        // Fall back to direct RPC
      }
    }

    try {
      const rpcUrl = process.env.REACT_APP_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1
        })
      });
      const data = await response.json();
      if (data && data.result) {
        return (parseInt(data.result, 16) / 1e18).toFixed(4);
      }
    } catch (e) {
      console.warn('Direct RPC balance fetch error:', e);
    }
    return '0.0000';
  }

  isValidAddress(address) {
    return Boolean(address && address.startsWith('0x') && address.length === 42);
  }

  disconnect() {
    this.connectedAddress = null;
    return { disconnected: true };
  }

  isConnected() {
    return Boolean(this.connectedAddress);
  }

  getAddress() {
    return this.connectedAddress;
  }
}

const walletServiceInstance = new WalletService();
export default walletServiceInstance;
