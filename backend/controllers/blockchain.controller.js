/**
 * Blockchain controller for DBIS
 * Handles interactions with the blockchain
 */
const blockchainService = require('../services/blockchain.service');
const ethers = require('ethers');

/**
 * Record user identity on blockchain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.recordIdentityOnBlockchain = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  try {
    // Check if user exists
    const userResult = await db.query(
      'SELECT id, name, government_id, wallet_address, is_verified FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    const isVerified = user.is_verified === true;
    
    // Check if contract is accessible
    const contractStatus = await blockchainService.isContractAccessible(isVerified);
    if (!contractStatus.accessible) {
      return res.status(503).json({ 
        message: 'Blockchain service unavailable', 
        details: contractStatus.error,
        network: contractStatus.network
      });
    }
    
    // Check if user has a wallet address
    if (!user.wallet_address) {
      return res.status(400).json({ message: 'User does not have a wallet address' });
    }
    
    // Get user's biometric data
    const biometricResult = await db.query(
      'SELECT id, facemesh_hash FROM biometric_data WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    
    if (biometricResult.rows.length === 0) {
      return res.status(400).json({ message: 'User does not have active biometric data' });
    }
    
    const biometricData = biometricResult.rows[0];
    
    // Generate a hash for professional data (placeholder)
    const professionalDataHash = 'professional_data_hash_placeholder';
    
    // Log network being used
    logger.info(`Recording identity on Ethereum Sepolia blockchain for user ${userId}`);
    
    // Record identity on blockchain
    const result = await blockchainService.registerIdentity(
      user.wallet_address,
      biometricData.facemesh_hash,
      professionalDataHash,
      isVerified
    );
    
    // Update biometric data with blockchain transaction hash
    await db.query(
      'UPDATE biometric_data SET blockchain_tx_hash = $1, blockchain_network = $2 WHERE id = $3',
      [result.transactionHash, result.network, biometricData.id]
    );
    
    // Record transaction in database
    await db.query(
      `INSERT INTO blockchain_transactions 
         (user_id, transaction_type, transaction_hash, block_number, status, network, data)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        'IDENTITY_REGISTRATION',
        result.transactionHash,
        result.blockNumber,
        result.status,
        result.network,
        JSON.stringify({
          walletAddress: user.wallet_address,
          biometricId: biometricData.id,
          isVerified: isVerified
        })
      ]
    );
    
    // Log the action
    await db.query(
      `INSERT INTO audit_logs (admin_id, user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.admin.id,
        userId,
        'IDENTITY_RECORDED_ON_BLOCKCHAIN',
        'users',
        userId,
        JSON.stringify({
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
          status: result.status,
          network: result.network
        }),
        req.ip
      ]
    );
    
    res.status(200).json({
      message: `Identity recorded on Ethereum Sepolia blockchain successfully`,
      transaction: {
        hash: result.transactionHash,
        blockNumber: result.blockNumber,
        status: result.status,
        network: result.network
      }
    });
  } catch (error) {
    logger.error('Record identity on blockchain error:', error);
    res.status(500).json({ message: 'Server error while recording identity on blockchain' });
  }
};

/**
 * Fetch user identity from blockchain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.fetchIdentityFromBlockchain = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { userId } = req.params;
  
  try {
    // Check if user exists
    const userResult = await db.query(
      'SELECT id, name, government_id, wallet_address, is_verified FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    const isVerified = user.is_verified === true;
    
    // Check if user has a wallet address
    if (!user.wallet_address) {
      return res.status(400).json({ message: 'User does not have a wallet address' });
    }
    
    // Fetch identity from blockchain
    const isRegistered = await blockchainService.isIdentityRegistered(user.wallet_address, isVerified);
    
    if (!isRegistered) {
      return res.status(404).json({
        message: `Identity not found on Ethereum Sepolia blockchain`
      });
    }
    
    const biometricHash = await blockchainService.getBiometricHash(user.wallet_address, isVerified);
    const identityVerified = await blockchainService.isIdentityVerified(user.wallet_address, isVerified);
    const recordCount = await blockchainService.getProfessionalRecordCount(user.wallet_address, isVerified);
    
    // Get records if any
    const records = [];
    for (let i = 0; i < recordCount; i++) {
      try {
        const record = await blockchainService.getProfessionalRecord(user.wallet_address, i, isVerified);
        records.push({
          index: i,
          ...record
        });
      } catch (error) {
        logger.error(`Error fetching record at index ${i}:`, error);
      }
    }
    
    // Get blockchain network info
    const networkInfo = blockchainService.getNetworkInfo();
    const networkName = networkInfo.networkName || 'Ethereum Sepolia Testnet';
    
    // Log the action
    await db.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.admin.id,
        'IDENTITY_FETCHED_FROM_BLOCKCHAIN',
        'users',
        userId,
        JSON.stringify({
          walletAddress: user.wallet_address,
          isRegistered,
          isVerified: identityVerified,
          recordCount,
          network: networkName
        }),
        req.ip
      ]
    );
    
    res.status(200).json({
      message: `Identity fetched from Ethereum Sepolia blockchain successfully`,
      identity: {
        walletAddress: user.wallet_address,
        biometricHash,
        isVerified: identityVerified,
        professionalRecordCount: recordCount,
        professionalRecords: records,
        network: networkName
      }
    });
  } catch (error) {
    logger.error('Fetch identity from blockchain error:', error);
    res.status(500).json({ message: 'Server error while fetching identity from blockchain' });
  }
};

/**
 * Get user's blockchain identity status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserBlockchainStatus = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  
  try {
    // Get full user blockchain status and wallet information
    const userResult = await db.query(
      `SELECT id, wallet_address, is_verified, verification_status,
              blockchain_status, blockchain_tx_hash, blockchain_network,
              soulbound_token_id, soulbound_badge_minted, verified_at, created_at
       FROM users WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    const walletAddress = user.wallet_address;
    const isDbVerified = user.is_verified === true || user.verification_status === 'VERIFIED';
    
    if (!walletAddress) {
      logger.warn(`User ${userId} does not have a wallet address`);
      return res.status(200).json({
        status: {
          walletAddress: null,
          isRegistered: false,
          isVerified: false,
          network: 'Ethereum Sepolia Testnet',
          identityStatus: 'NOT_REGISTERED'
        },
        recentTransactions: []
      });
    }
    
    // Get network info
    let network = 'Ethereum Sepolia Testnet';
    try {
      const networkInfo = blockchainService.getNetworkInfo();
      if (networkInfo && networkInfo.networkName) {
        network = networkInfo.networkName;
      }
    } catch (networkError) {
      logger.warn('Error getting network info:', networkError);
    }
    
    // Query active biometric data for merkle root hash
    let merkleRoot = null;
    try {
      const bioResult = await db.query(
        'SELECT facemesh_hash FROM biometric_data WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
        [userId]
      );
      if (bioResult.rows.length > 0 && bioResult.rows[0].facemesh_hash) {
        merkleRoot = `0x${bioResult.rows[0].facemesh_hash}`;
      }
    } catch (bioErr) {
      logger.warn('Error fetching biometric root hash:', bioErr);
    }

    // Get on-chain blockchain status
    let onChainRegistered = false;
    let onChainVerified = false;
    
    try {
      onChainRegistered = await blockchainService.isIdentityRegistered(walletAddress);
      if (onChainRegistered) {
        onChainVerified = await blockchainService.isIdentityVerified(walletAddress);
      }
    } catch (contractErr) {
      logger.warn(`On-chain status check error for ${walletAddress}:`, contractErr.message);
    }
    
    const isRegistered = Boolean(onChainRegistered || user.soulbound_badge_minted || user.blockchain_status === 'CONFIRMED');
    const isIdentityVerified = Boolean(onChainVerified || isDbVerified);

    // Get recent blockchain transactions
    let recentTransactions = [];
    try {
      const transactionsResult = await db.query(
        `SELECT transaction_hash, transaction_type, status, block_number, created_at, network
         FROM blockchain_transactions
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [userId]
      );
      recentTransactions = transactionsResult.rows;
    } catch (txError) {
      try {
        const transactionsResult = await db.query(
          `SELECT transaction_hash, transaction_type, status, created_at
           FROM blockchain_transactions
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT 5`,
          [userId]
        );
        recentTransactions = transactionsResult.rows.map(tx => ({
          ...tx,
          network: 'Ethereum Sepolia Testnet'
        }));
      } catch (fallbackError) {
        logger.error('Error getting transactions:', fallbackError);
      }
    }
    
    const latestTx = recentTransactions.length > 0 ? recentTransactions[0] : null;
    const txHash = user.blockchain_tx_hash || (latestTx ? latestTx.transaction_hash : '');
    const sbtTokenId = user.soulbound_token_id 
      ? `SBT-Token #${user.soulbound_token_id}` 
      : null;

    let liveConfirmations = 0;
    if (txHash) {
      try {
        const { provider } = blockchainService.initBlockchain();
        if (provider) {
          const currentBlock = await provider.getBlockNumber();
          if (latestTx && latestTx.block_number) {
            liveConfirmations = Math.max(1, currentBlock - Number(latestTx.block_number));
          } else {
            const receipt = await provider.getTransactionReceipt(txHash);
            if (receipt && receipt.blockNumber) {
              liveConfirmations = Math.max(1, currentBlock - receipt.blockNumber);
            }
          }
        }
      } catch (confirmErr) {
        logger.warn('Could not query live block confirmations for user status:', confirmErr.message);
      }
    }
    if (liveConfirmations === 0 && isRegistered) {
      liveConfirmations = 1;
    }

    let balance = '0.0000';
    if (walletAddress) {
      try {
        const walletService = require('../services/wallet.service');
        balance = await walletService.getBalance(walletAddress);
      } catch (_) {}
    }

    res.status(200).json({
      status: {
        walletAddress,
        balance,
        isRegistered,
        isVerified: isIdentityVerified,
        network,
        identityStatus: isIdentityVerified ? 'VERIFIED' : (isRegistered ? 'REGISTERED' : 'NOT_REGISTERED'),
        registrationTxHash: txHash,
        transactionHash: txHash,
        sbtTokenId: sbtTokenId,
        soulboundBadgeMinted: Boolean(user.soulbound_badge_minted || isRegistered),
        registrationTimestamp: (latestTx && latestTx.created_at) || user.verified_at || user.created_at,
        contractAddress: process.env.SOULBOUND_BADGE_ADDRESS || process.env.CONTRACT_ADDRESS,
        merkleRoot: merkleRoot || '',
        confirmations: liveConfirmations
      },
      recentTransactions: recentTransactions
    });
  } catch (error) {
    logger.error('Get user blockchain status error:', error);
    res.status(500).json({ message: 'Server error while fetching blockchain status' });
  }
};

/**
 * Record professional record on blockchain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.recordProfessionalRecord = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { userId, recordId } = req.body;
  
  if (!userId || !recordId) {
    return res.status(400).json({ message: 'User ID and Record ID are required' });
  }
  
  try {
    // Check if user exists
    const userResult = await db.query(
      'SELECT id, wallet_address, biometric_hash FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Check if user has a wallet address
    if (!user.wallet_address) {
      return res.status(400).json({ message: 'User does not have a wallet address' });
    }
    
    // Check if record exists
    const recordResult = await db.query(
      `SELECT id, record_type, institution, title, data_hash, start_date, end_date
       FROM professional_records
       WHERE id = $1 AND user_id = $2`,
      [recordId, userId]
    );
    
    if (recordResult.rows.length === 0) {
      return res.status(404).json({ message: 'Professional record not found' });
    }
    
    const record = recordResult.rows[0];

    // Check if identity exists on blockchain
    const isIdentityRegistered = await blockchainService.isIdentityRegistered(user.wallet_address);
    
    if (!isIdentityRegistered) {
      if (!user.biometric_hash) {
        return res.status(400).json({ message: 'User biometric hash required to anchor identity on blockchain' });
      }
      // Create identity on blockchain first
      await blockchainService.registerIdentity(
        process.env.ADMIN_PRIVATE_KEY,
        user.biometric_hash,
        record.data_hash
      );
      
      logger.info(`Created blockchain identity for user ${userId}`);
    }
    
    // Record on blockchain
    const startTimestamp = Math.floor(new Date(record.start_date).getTime() / 1000);
    const endTimestamp = record.end_date ? Math.floor(new Date(record.end_date).getTime() / 1000) : 0;
    
    const result = await blockchainService.addProfessionalRecord(
      user.wallet_address,
      record.data_hash,
      startTimestamp,
      endTimestamp
    );
    
    // Update record with blockchain transaction hash
    await db.query(
      'UPDATE professional_records SET blockchain_tx_hash = $1, on_blockchain = true WHERE id = $2',
      [result.transactionHash, recordId]
    );
    
    // Record transaction in database
    await db.query(
      `INSERT INTO blockchain_transactions 
         (user_id, transaction_type, transaction_hash, block_number, status, data)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        'PROFESSIONAL_RECORD_ADDED',
        result.transactionHash,
        result.blockNumber,
        result.status,
        JSON.stringify({
          recordId,
          recordType: record.record_type,
          institution: record.institution,
          title: record.title
        })
      ]
    );
    
    // Log the action
    await db.query(
      `INSERT INTO audit_logs (admin_id, user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.admin.id,
        userId,
        'PROFESSIONAL_RECORD_RECORDED_ON_BLOCKCHAIN',
        'professional_records',
        recordId,
        JSON.stringify({
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
          status: result.status
        }),
        req.ip
      ]
    );
    
    res.status(200).json({
      message: 'Professional record recorded on blockchain successfully',
      transaction: {
        hash: result.transactionHash,
        blockNumber: result.blockNumber,
        status: result.status
      }
    });
  } catch (error) {
    logger.error('Record professional record on blockchain error:', error);
    res.status(500).json({ message: 'Server error while recording professional record on blockchain' });
  }
};

/**
 * Verify a document hash on the blockchain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.verifyDocumentHash = async (req, res) => {
  const logger = req.app.locals.logger;
  const { hash } = req.params;
  
  if (!hash) {
    return res.status(400).json({ message: 'Document hash is required' });
  }
  
  try {
    // Verify hash on blockchain
    const result = await blockchainService.verifyDocumentHash(hash);
    
    res.status(200).json({
      message: 'Document hash verification completed',
      verification: result
    });
  } catch (error) {
    logger.error('Verify document hash error:', error);
    res.status(500).json({ message: 'Server error while verifying document hash' });
  }
};

/**
 * Get blockchain transactions for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserTransactions = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;
  
  try {
    // Count total transactions
    const countResult = await db.query(
      'SELECT COUNT(*) FROM blockchain_transactions WHERE user_id = $1',
      [userId]
    );
    
    const totalTransactions = parseInt(countResult.rows[0].count);
    
    // Get transactions with pagination
    const offset = (page - 1) * limit;
    
    const result = await db.query(
      `SELECT id, transaction_type, transaction_hash, block_number, status, data, created_at, updated_at
       FROM blockchain_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    let currentBlock = 0;
    try {
      const { provider } = blockchainService.initBlockchain();
      if (provider) {
        currentBlock = await provider.getBlockNumber();
      }
    } catch {}

    const transactions = result.rows.map(tx => {
      let confirmations = 1;
      if (currentBlock > 0 && tx.block_number) {
        confirmations = Math.max(1, currentBlock - Number(tx.block_number));
      }
      return {
        ...tx,
        confirmations
      };
    });
    
    res.status(200).json({
      transactions: transactions,
      pagination: {
        total: totalTransactions,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalTransactions / limit)
      }
    });
  } catch (error) {
    logger.error('Get user transactions error:', error);
    res.status(500).json({ message: 'Server error while retrieving blockchain transactions' });
  }
};

/**
 * Record a user's professional record on blockchain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.recordUserProfessionalRecord = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  const recordId = req.params.id;
  
  try {
    // Check if user exists and has a wallet address
    const userResult = await db.query(
      'SELECT id, name, government_id, wallet_address, avax_private_key FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Check if user has a wallet address
    if (!user.wallet_address) {
      return res.status(400).json({ message: 'User does not have a wallet address' });
    }
    
    // Check if professional record exists and belongs to user
    const recordResult = await db.query(
      `SELECT id, title, institution, year, data_hash, verification_status, on_blockchain 
       FROM professional_records 
       WHERE id = $1 AND user_id = $2`,
      [recordId, userId]
    );
    
    if (recordResult.rows.length === 0) {
      return res.status(404).json({ message: 'Professional record not found or does not belong to user' });
    }
    
    const record = recordResult.rows[0];
    
    // Check if record is already on blockchain
    if (record.on_blockchain) {
      return res.status(400).json({ message: 'Professional record is already on blockchain' });
    }
    
    // Check if record is verified
    if (record.verification_status !== 'VERIFIED') {
      return res.status(400).json({ message: 'Only verified professional records can be recorded on blockchain' });
    }
    
    // Calculate validity period (1 year from now)
    const startTimestamp = Math.floor(Date.now() / 1000);
    const endTimestamp = startTimestamp + (365 * 24 * 60 * 60); // 1 year in seconds
    
    // Record professional record on blockchain
    const result = await blockchainService.recordProfessionalRecord(
      user.avax_private_key,
      user.wallet_address,
      record.data_hash,
      startTimestamp,
      endTimestamp
    );
    
    // Start a transaction
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update record with blockchain status
      await client.query(
        `UPDATE professional_records 
         SET on_blockchain = true, 
             blockchain_tx_hash = $1, 
             updated_at = NOW() 
         WHERE id = $2`,
        [result.transactionHash, recordId]
      );
      
      // Record transaction in database
      await client.query(
        `INSERT INTO blockchain_transactions 
         (user_id, transaction_hash, from_address, to_address, transaction_type, status, entity_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          userId,
          result.transactionHash,
          user.wallet_address,
          process.env.CONTRACT_ADDRESS,
          'PROFESSIONAL_RECORD',
          'COMPLETED',
          recordId
        ]
      );
      
      // Log the action
      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          'PROFESSIONAL_RECORD_RECORDED_ON_BLOCKCHAIN',
          'professional_records',
          recordId,
          JSON.stringify({
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber,
            title: record.title,
            institution: record.institution,
            year: record.year
          }),
          req.ip
        ]
      );
      
      await client.query('COMMIT');
      
      res.status(200).json({
        message: 'Professional record recorded on blockchain successfully',
        transaction: {
          hash: result.transactionHash,
          blockNumber: result.blockNumber,
          status: 'COMPLETED'
        },
        record: {
          id: record.id,
          title: record.title,
          onBlockchain: true
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Record user professional record on blockchain error:', error);
    res.status(500).json({ message: 'Server error while recording professional record on blockchain' });
  }
};

/**
 * Get blockchain identity expiry information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getBlockchainExpiry = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const userId = req.user.id;
  
  try {
    // Get user's blockchain status
    const userResult = await db.query(
      `SELECT id, wallet_address, blockchain_status, blockchain_expiry 
       FROM users 
       WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Check if user has blockchain status
    if (user.blockchain_status !== 'CONFIRMED') {
      return res.status(400).json({ 
        message: 'User identity is not on blockchain', 
        blockchainStatus: user.blockchain_status || 'NOT_REGISTERED'
      });
    }
    
    // Get latest blockchain transaction
    const txResult = await db.query(
      `SELECT transaction_hash, created_at 
       FROM blockchain_transactions 
       WHERE user_id = $1 AND transaction_type = 'IDENTITY_REGISTRATION' 
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    
    let transactionInfo = null;
    if (txResult.rows.length > 0) {
      transactionInfo = {
        hash: txResult.rows[0].transaction_hash,
        timestamp: txResult.rows[0].created_at
      };
    }
    
    // Calculate expiry (1 year from registration)
    let expiryDate = user.blockchain_expiry;
    if (!expiryDate && transactionInfo) {
      // If no expiry date is set but we have a transaction, calculate it as 1 year from transaction date
      const txDate = new Date(transactionInfo.timestamp);
      expiryDate = new Date(txDate.setFullYear(txDate.getFullYear() + 1));
    } else if (!expiryDate) {
      // Default to 1 year from now if we can't determine
      expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }
    
    // Calculate days remaining until expiry
    const now = new Date();
    const expiryTime = new Date(expiryDate).getTime();
    const daysRemaining = Math.max(0, Math.floor((expiryTime - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Determine expiry status
    let expiryStatus = 'VALID';
    if (daysRemaining <= 0) {
      expiryStatus = 'EXPIRED';
    } else if (daysRemaining <= 30) {
      expiryStatus = 'EXPIRING_SOON';
    }
    
    res.status(200).json({
      blockchainStatus: user.blockchain_status,
      expiryDate: expiryDate,
      daysRemaining: daysRemaining,
      expiryStatus: expiryStatus,
      transaction: transactionInfo,
      walletAddress: user.wallet_address
    });
  } catch (error) {
    logger.error('Get blockchain expiry error:', error);
    res.status(500).json({ message: 'Server error while retrieving blockchain expiry information' });
  }
};

/**
 * Verify a professional record on the blockchain by record ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.verifyProfessionalRecord = async (req, res) => {
  const db = req.app.locals.db;
  const logger = req.app.locals.logger;
  const { id } = req.params;

  try {
    // Get professional record and ensure it has been recorded on blockchain
    const recordResult = await db.query(
      `SELECT id, data_hash, on_blockchain, blockchain_tx_hash, user_id, title, institution, year
       FROM professional_records WHERE id = $1`,
      [id]
    );

    if (recordResult.rows.length === 0) {
      return res.status(404).json({ message: 'Professional record not found' });
    }

    const record = recordResult.rows[0];

    if (!record.on_blockchain || !record.blockchain_tx_hash) {
      return res.status(400).json({ message: 'Professional record is not on blockchain' });
    }

    // Verify hash on blockchain using existing service/helper
    const verification = await blockchainService.verifyDocumentHash(record.data_hash);

    res.status(200).json({
      message: 'Blockchain verification successful',
      recordId: record.id,
      verified: verification.verified ?? verification,
      details: verification
    });
  } catch (error) {
    logger.error('Verify professional record on blockchain error:', error);
    res.status(500).json({ message: 'Server error while verifying professional record on blockchain' });
  }
};

/**
 * Get TrueID Smart Contract Suite live deployment and on-chain status
 * @route GET /api/blockchain/suite
 * @access Public / Authenticated
 */
exports.getSuiteStatus = async (req, res) => {
  const logger = req.app.locals.logger;

  try {
    const credContract = blockchainService.getCredentialRegistryContract();
    const sbtContract = blockchainService.getSoulboundBadgeContract();
    const didContract = blockchainService.getDIDRegistryContract();
    const zkContract = blockchainService.getZKVerifierContract();

    const [
      credentialRegistryAddress,
      soulboundBadgeAddress,
      didRegistryAddress,
      zkVerifierAddress,
      identityManagementAddress,
      credVersion,
      sbtName,
      didMethod,
      zkActive
    ] = await Promise.all([
      credContract.getAddress(),
      sbtContract.getAddress(),
      didContract.getAddress(),
      zkContract.getAddress(),
      process.env.CONTRACT_ADDRESS,
      credContract.VERSION().catch(() => '2.0.0'),
      sbtContract.name().catch(() => 'TrueID Digital Identity Badge'),
      didContract.METHOD_NAME().catch(() => 'trueid'),
      zkContract.verificationActive().catch(() => true)
    ]);

    res.status(200).json({
      network: 'Ethereum Sepolia Testnet',
      chainId: 11155111,
      suite: {
        IdentityManagement: {
          address: identityManagementAddress,
          role: 'Core identity registry & notary authority'
        },
        TrueIDCredentialRegistry: {
          address: credentialRegistryAddress,
          version: credVersion,
          role: 'W3C Verifiable Credentials registry for professional records'
        },
        TrueIDSoulboundBadge: {
          address: soulboundBadgeAddress,
          name: sbtName,
          standard: 'ERC-5192 Minimal Soulbound NFTs',
          role: 'Non-transferable citizen credential badge'
        },
        TrueIDDIDRegistry: {
          address: didRegistryAddress,
          method: didMethod,
          standard: 'W3C & ERC-1056 Lightweight DID',
          role: 'Decentralized Identifier registry (did:trueid:<address>)'
        },
        TrueIDZKVerifier: {
          address: zkVerifierAddress,
          active: zkActive,
          standard: 'Groth16 zk-SNARK',
          role: 'Zero-knowledge biometric proof verifier'
        }
      }
    });
  } catch (error) {
    logger.error('Get suite status error:', error);
    res.status(500).json({ message: 'Error retrieving smart contract suite status', error: error.message });
  }
};

/**
 * Get live transaction status and confirmation count
 * @route GET /api/blockchain/transaction/:txHash
 */
exports.getTransactionStatus = async (req, res) => {
  const { txHash } = req.params;
  try {
    const { provider } = blockchainService.initBlockchain();
    let confirmations = 0;
    let blockNumber = null;
    let status = 'CONFIRMED';
    
    try {
      if (provider) {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt) {
          blockNumber = receipt.blockNumber;
          const currentBlock = await provider.getBlockNumber();
          confirmations = Math.max(1, currentBlock - receipt.blockNumber);
          status = receipt.status === 1 ? 'CONFIRMED' : 'FAILED';
        }
      }
    } catch {
      // Fall back to database
    }

    if (confirmations === 0) {
      const db = req.app.locals.db;
      const dbResult = await db.query(
        'SELECT status, block_number FROM blockchain_transactions WHERE transaction_hash = $1',
        [txHash]
      );
      if (dbResult.rows.length > 0) {
        status = dbResult.rows[0].status;
        blockNumber = dbResult.rows[0].block_number;
        if (blockNumber && provider) {
          try {
            const currentBlock = await provider.getBlockNumber();
            confirmations = Math.max(1, currentBlock - Number(blockNumber));
          } catch {
            confirmations = 1;
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      confirmations,
      data: {
        transactionHash: txHash,
        status,
        blockNumber,
        confirmations
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving transaction status' });
  }
};
