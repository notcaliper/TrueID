/**
 * Network controller for DBIS
 * Handles blockchain network selection and status
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
    // Get network info
    const networkInfo = blockchainService.getNetworkInfo();
    
    // Check contract accessibility
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
  const { network } = req.body;
  
  if (!network) {
    return res.status(400).json({ message: 'Network parameter is required' });
  }
  
  if (network !== 'local' && network !== 'polygon') {
    return res.status(400).json({ message: 'Invalid network. Must be "local" or "polygon"' });
  }
  
  try {
    // Switch network
    const success = await blockchainService.switchNetwork(network);
    
    if (!success) {
      return res.status(500).json({ message: 'Failed to switch network' });
    }
    
    // Get updated network info
    const networkInfo = blockchainService.getNetworkInfo();
    
    // Log the network switch
    await req.app.locals.db.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.admin?.id || null,
        'NETWORK_SWITCHED',
        'system',
        null,
        JSON.stringify({
          previousNetwork: network === 'local' ? 'polygon' : 'local',
          newNetwork: network,
          timestamp: new Date().toISOString()
        }),
        req.ip
      ]
    );
    
    res.status(200).json({
      message: `Switched to ${network === 'local' ? 'Local Hardhat' : 'Polygon Mumbai'} network successfully`,
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
    // Get network info
    const networkInfo = blockchainService.getNetworkInfo();
    
    // Check if contract is deployed
    const isDeployed = !!networkInfo.contractAddress;
    
    // Check contract accessibility if deployed
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
    // Get current network info
    const networkInfo = blockchainService.getNetworkInfo();
    const { network } = networkInfo;
    
    // Determine which script to run
    let deployScript;
    if (network === 'local') {
      deployScript = 'npm run blockchain:deploy-local';
    } else if (network === 'polygon') {
      deployScript = 'npm run blockchain:deploy-polygon';
    } else {
      return res.status(400).json({ message: 'Invalid network for deployment' });
    }
    
    // Start deployment process
    const rootDir = path.resolve(__dirname, '..');
    
    // Send initial response
    res.status(202).json({
      message: `Deployment to ${networkInfo.networkName} started`,
      status: 'PENDING',
      network: networkInfo.networkName
    });
    
    // Execute deployment in background
    exec(deployScript, { cwd: rootDir }, async (error, stdout, stderr) => {
      // Log the deployment result
      if (error) {
        logger.error(`Deployment error: ${error.message}`);
        logger.error(`Deployment stderr: ${stderr}`);
        
        // Log the failed deployment
        await db.query(
          `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details, ip_address)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            req.admin?.id || null,
            'CONTRACT_DEPLOYMENT_FAILED',
            'system',
            null,
            JSON.stringify({
              network: networkInfo.networkName,
              error: error.message,
              stderr,
              timestamp: new Date().toISOString()
            }),
            req.ip
          ]
        );
      } else {
        logger.info(`Deployment to ${networkInfo.networkName} successful`);
        logger.debug(`Deployment output: ${stdout}`);
        
        // Log the successful deployment
        await db.query(
          `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details, ip_address)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            req.admin?.id || null,
            'CONTRACT_DEPLOYED',
            'system',
            null,
            JSON.stringify({
              network: networkInfo.networkName,
              stdout: stdout.substring(0, 1000), // Limit the size of stored output
              timestamp: new Date().toISOString()
            }),
            req.ip
          ]
        );
      }
    });
  } catch (error) {
    logger.error('Deploy contract error:', error);
    res.status(500).json({ message: 'Server error while deploying contract' });
  }
};
