/**
 * Hardhat configuration for DBIS
 * Local development configuration
 */
require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-ethers');
require('dotenv').config();

// Load private key from .env file
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000';

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
    // Hardhat local network (default)
    hardhat: {
      chainId: 31337
    },
    // Local development network
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    }
  },
  // Etherscan API key for contract verification
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || ""
  }
};
