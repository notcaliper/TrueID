/**
 * Hardhat configuration for DBIS
 * Configured for Avalanche Fuji Testnet (AVAX Testnet)
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
  networks: {
    // Hardhat local network (for testing contract compilation only)
    hardhat: {
      chainId: 31337
    },
    // Avalanche Fuji Testnet - main deployment target
    avalanche_fuji: {
      url: process.env.AVALANCHE_FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: [PRIVATE_KEY],
      chainId: 43113
    }
  },
  // Contract verification is done manually through the Snowtrace interface
  etherscan: {
    apiKey: {
      avalancheFujiTestnet: ""
    }
  }
};
