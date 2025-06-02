import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  OpenInNew as ExternalLinkIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { userAPI, blockchainAPI } from '../services/api.service';

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString();
};

const BlockchainStatus = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [blockchainData, setBlockchainData] = useState({
    isRegistered: false,
    transactionHash: null,
    contractAddress: '0x266B577380aE3De838A66DEf28fffD5e75c5816E',
    registrationTimestamp: null,
    verificationStatus: 'PENDING',
    confirmations: 0,
    network: 'Avalanche Fuji Testnet',
    chainId: 43113
  });
  const [pollingActive, setPollingActive] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const getActiveStep = () => {
    if (blockchainData.isRegistered) return 4;
    if (blockchainData.verificationStatus === 'VERIFIED') return 2;
    return 1;
  };

  // Set up polling for blockchain status
  useEffect(() => {
    // Initial fetch
    fetchBlockchainStatus();
    
    // Start polling every 15 seconds
    const pollingInterval = setInterval(() => {
      if (pollingActive && document.visibilityState === 'visible') {
        fetchBlockchainStatus(true);
      }
    }, 15000);
    
    return () => clearInterval(pollingInterval);
  }, [pollingActive]);

  const fetchBlockchainStatus = async (isRefreshing = false) => {
    if (!isRefreshing) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);
    
    try {
      // Fetch blockchain status from blockchain API
      const blockchainResponse = await blockchainAPI.getBlockchainStatus();
      
      // Fetch verification status
      const verificationResponse = await userAPI.getVerificationStatus();
      
      // Get status data from response
      const { status: blockchainStatus } = blockchainResponse.data;
      
      // If there's a transaction hash, get its status
      let confirmations = 0;
      if (blockchainStatus?.registrationTxHash) {
        try {
          const txStatus = await blockchainAPI.getTransactionStatus(blockchainStatus.registrationTxHash);
          confirmations = txStatus.data.confirmations || 0;
        } catch (txErr) {
          console.error('Error fetching transaction status:', txErr);
        }
      }
      
      setBlockchainData(prev => ({
        ...prev,
        isRegistered: blockchainStatus?.isRegistered || false,
        transactionHash: blockchainStatus?.registrationTxHash || null,
        registrationTimestamp: blockchainStatus?.registrationTimestamp || null,
        verificationStatus: verificationResponse.data.data.status,
        confirmations
      }));
    } catch (err) {
      console.error('Error fetching blockchain status:', err);
      setError('Failed to load blockchain status. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const transferToBlockchain = async () => {
    setTransferring(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Check if user is verified
      if (blockchainData.verificationStatus !== 'VERIFIED') {
        throw new Error('Your identity must be verified before transferring to blockchain');
      }
      
      // Transfer to blockchain using user API
      const response = await userAPI.transferToBlockchain();
      
      setBlockchainData(prev => ({
        ...prev,
        isRegistered: true,
        transactionHash: response.data.transactionHash,
        registrationTimestamp: new Date().toISOString(),
        confirmations: 0
      }));
      
      setSuccess('Your identity is being transferred to the blockchain. This process may take a few minutes.');
      
      // Start monitoring the transaction
      const monitorTransaction = async () => {
        try {
          const txStatus = await blockchainAPI.getTransactionStatus(response.data.transactionHash);
          const confirmations = txStatus.data.confirmations || 0;
          
          setBlockchainData(prev => ({
            ...prev,
            confirmations
          }));
          
          if (confirmations >= 3) {
            setSuccess('Your identity has been successfully transferred to the blockchain and confirmed!');
            return;
          }
          
          // Continue monitoring until we get enough confirmations
          setTimeout(monitorTransaction, 5000); // Check every 5 seconds
        } catch (err) {
          console.error('Error monitoring transaction:', err);
        }
      };
      
      // Start monitoring after a short delay
      setTimeout(monitorTransaction, 5000);
    } catch (err) {
      console.error('Error transferring to blockchain:', err);
      setError(err.message || 'Failed to transfer identity to blockchain. Please try again later.');
    } finally {
      setTransferring(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Blockchain Identity Status
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">
                  Blockchain Status
                </Typography>
              </Box>
              {refreshing && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={16} sx={{ mr: 0.5 }} />
                  <Typography variant="caption" color="text.secondary">
                    Updating...
                  </Typography>
                </Box>
              )}
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Status
                    </Typography>
                    <Typography variant="body1">
                      {blockchainData.isRegistered ? 'Registered' : 'Not Registered'}
                    </Typography>
                    {blockchainData.registrationTimestamp && (
                      <Typography variant="body2" color="text.secondary">
                        Registered on: {formatDate(blockchainData.registrationTimestamp)}
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Smart Contract
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>
                      {blockchainData.contractAddress}
                      <IconButton
                        size="small"
                        onClick={() => window.open(`https://testnet.snowtrace.io/address/${blockchainData.contractAddress}`, '_blank')}
                      >
                        <ExternalLinkIcon fontSize="small" />
                      </IconButton>
                    </Typography>
                  </Grid>

                  {blockchainData.transactionHash && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Transaction Details
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>
                        {blockchainData.transactionHash}
                        <IconButton
                          size="small"
                          onClick={() => window.open(`https://testnet.snowtrace.io/tx/${blockchainData.transactionHash}`, '_blank')}
                        >
                          <ExternalLinkIcon fontSize="small" />
                        </IconButton>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Confirmations: {blockchainData.confirmations}
                        {blockchainData.confirmations >= 3 && ' (Confirmed)'}
                      </Typography>
                    </Grid>
                  )}
                </Grid>

                {!blockchainData.isRegistered && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      {blockchainData.verificationStatus === 'VERIFIED'
                        ? 'Your identity is verified. You can now register it on the blockchain.'
                        : 'Your identity must be verified before it can be registered on the blockchain.'}
                    </Typography>

                    <Button
                      variant="contained"
                      color="primary"
                      onClick={transferToBlockchain}
                      disabled={
                        transferring ||
                        blockchainData.isRegistered ||
                        blockchainData.verificationStatus !== 'VERIFIED'
                      }
                      sx={{ mt: 2 }}
                    >
                      {transferring ? (
                        <>
                          <CircularProgress size={24} sx={{ mr: 1 }} />
                          Registering on Blockchain...
                        </>
                      ) : (
                        'Register on Blockchain'
                      )}
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Blockchain Identity Process
            </Typography>

            <Stepper orientation="vertical" activeStep={getActiveStep()}>
              <Step>
                <StepLabel>Registration</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    Your identity information has been registered in the TrueID system.
                  </Typography>
                </StepContent>
              </Step>

              <Step>
                <StepLabel>Identity Verification</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    {blockchainData.verificationStatus === 'VERIFIED'
                      ? 'Your identity has been verified by government authorities.'
                      : blockchainData.verificationStatus === 'PENDING'
                        ? 'Your identity verification is pending.'
                        : 'Your identity verification was rejected.'}
                  </Typography>
                </StepContent>
              </Step>

              <Step>
                <StepLabel>Blockchain Registration</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    {blockchainData.isRegistered
                      ? 'Your identity has been registered on the Avalanche blockchain.'
                      : 'Your identity will be registered on the Avalanche blockchain once verified.'}
                  </Typography>
                </StepContent>
              </Step>

              <Step>
                <StepLabel>Blockchain Verification</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    Your identity can now be verified by authorized parties using the Avalanche blockchain.
                  </Typography>
                </StepContent>
              </Step>
            </Stepper>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BlockchainStatus;
