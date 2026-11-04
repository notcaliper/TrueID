/**
 * Network controller for TrueID
 * Handles blockchain network selection and status (Ethereum Sepolia)
 */
const blockchainService = require('../services/blockchain.service');
const { exec } = require('child_process');
const path = require('path');

/**
 * Get current blockchain network status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getNetworkStatus = async (req, res) => {
  const logger = req.app.locals.logger;
  
  try {
    const networkInfo = blockchainService.getNetworkInfo();
    const contractStatus = await blockchainService.isContractAccessible();
    
    res.status(200).json({
      message: 'Network status retrieved successfully',
      network: {
        ...networkInfo,
        contractStatus
      }
    });
  } catch (error) {
    logger.error('Get network status error:', error);
    res.status(500).json({ message: 'Server error while retrieving network status' });
  }
};

/**
 * Switch blockchain network
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.switchNetwork = async (req, res) => {
  const logger = req.app.locals.logger;
  let { network } = req.body;
  
  if (!network) {
    network = 'sepolia';
  }
  
  try {
    const success = await blockchainService.switchNetwork(network);
    
    if (!success) {
      return res.status(500).json({ message: 'Failed to switch network' });
    }
    
    const networkInfo = blockchainService.getNetworkInfo();
    
    await req.app.locals.db.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.admin?.id || null,
        'NETWORK_SWITCHED',
        'system',
        null,
        JSON.stringify({
          network,
          timestamp: new Date().toISOString()
        }),
        req.ip
      ]
    );
    
    res.status(200).json({
      message: `Using Ethereum Sepolia network`,
      network: networkInfo
    });
  } catch (error) {
    logger.error('Switch network error:', error);
    res.status(500).json({ message: 'Server error while switching network' });
  }
};

/**
 * Get contract deployment status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getContractStatus = async (req, res) => {
  const logger = req.app.locals.logger;
  
  try {
    const networkInfo = blockchainService.getNetworkInfo();
    const isDeployed = !!networkInfo.contractAddress;
    
    let contractStatus = { accessible: false, deployed: isDeployed };
    
    if (isDeployed) {
      contractStatus = await blockchainService.isContractAccessible();
    }
    
    res.status(200).json({
      message: 'Contract status retrieved successfully',
      contractStatus: {
        ...contractStatus,
        address: networkInfo.contractAddress,
        network: networkInfo.networkName
      }
    });
  } catch (error) {
    logger.error('Get contract status error:', error);
    res.status(500).json({ message: 'Server error while retrieving contract status' });
  }
};

/**
 * Deploy smart contract to the current network
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deployContract = async (req, res) => {
  const logger = req.app.locals.logger;
  const db = req.app.locals.db;
  
  try {
    const networkInfo = blockchainService.getNetworkInfo();
    const deployScript = 'node blockchain/scripts/deploy_suite.js';
    const rootDir = path.resolve(__dirname, '..');
    
    res.status(202).json({
      message: `Deployment to ${networkInfo.networkName} started`,
      status: 'PENDING',
      network: networkInfo.networkName
    });
    
    exec(deployScript, { cwd: rootDir }, async (error, stdout, stderr) => {
      if (error) {
        logger.error(`Deployment failed: ${error.message}`);
        return;
      }
      logger.info('Smart contract suite deployed successfully');
    });
  } catch (error) {
    logger.error('Deploy contract error:', error);
    res.status(500).json({ message: 'Server error while deploying contract' });
  }
};
