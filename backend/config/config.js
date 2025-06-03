/**
 * Configuration settings for the TrueID backend
 */
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  // Server configuration
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  
  // Frontend URLs for CORS
  FRONTEND_URL: process.env.FRONTEND_URL,
  
  // Database configuration
  DB_USER: process.env.DB_USER,
  DB_HOST: process.env.DB_HOST,
  DB_NAME: process.env.DB_NAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_PORT: process.env.DB_PORT,
  
  // Database connection retry settings
  DB_CONNECTION_RETRIES: process.env.DB_CONNECTION_RETRIES,
  DB_CONNECTION_RETRY_DELAY: process.env.DB_CONNECTION_RETRY_DELAY,
  
  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRATION: process.env.REFRESH_TOKEN_EXPIRATION,
  
  // Blockchain configuration (Avalanche Fuji Testnet)
  BLOCKCHAIN_RPC_URL: process.env.BLOCKCHAIN_RPC_URL,
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
  ADMIN_WALLET_PRIVATE_KEY: process.env.ADMIN_WALLET_PRIVATE_KEY,
};
