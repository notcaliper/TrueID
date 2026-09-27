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
  defaultNetwork: "sepolia",
  networks: {
    // Ethereum Sepolia Testnet configuration
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || process.env.BLOCKCHAIN_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: [PRIVATE_KEY],
      chainId: 11155111
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || ""
    }
  }
};
