/**
 * Hardhat configuration for DBIS
 * Supports both local development and Avalanche Fuji testnet
 */
require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-ethers');
require('dotenv').config();

// Load private key from .env file
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001';

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./blockchain/contracts",
    tests: "./blockchain/test",
    cache: "./blockchain/cache",
    artifacts: "./blockchain/artifacts"
  },
  defaultNetwork: "avalanche_fuji",
  networks: {
    // Avalanche Fuji Testnet configuration
    avalanche_fuji: {
      url: process.env.AVALANCHE_FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: [PRIVATE_KEY],
      chainId: 43113
    }
  },
  // Contract verification is done manually through the Snowtrace interface
  snowtrace: {
    apiKey: {
      avalancheFujiTestnet: ""
    }
  }
};
