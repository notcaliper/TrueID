import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Card,
  CardContent,
  Chip,
  Link,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Security as BlockchainIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  OpenInNew as ExternalLinkIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { userAPI, blockchainAPI } from '../services/api.service';

const BlockchainStatus = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [blockchainData, setBlockchainData] = useState({
    isOnBlockchain: false,
    transactionHash: null,
    contractAddress: '0x266B577380aE3De838A66DEf28fffD5e75c5816E', // From memory
    transferredAt: null,
    verificationStatus: 'PENDING'
  });

  useEffect(() => {
    fetchBlockchainStatus();
  }, []);

  const fetchBlockchainStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch blockchain status
      const blockchainResponse = await userAPI.getBlockchainStatus();
      
      // Fetch verification status
      const verificationResponse = await userAPI.getVerificationStatus();
      
      setBlockchainData({
        ...blockchainData,
        isOnBlockchain: blockchainResponse.data.isOnBlockchain,
        transactionHash: blockchainResponse.data.transactionHash,
        transferredAt: blockchainResponse.data.transferredAt,
        verificationStatus: verificationResponse.data.status
      });
    } catch (err) {
      console.error('Error fetching blockchain status:', err);
      setError('Failed to load blockchain status. Please try again later.');
    } finally {
      setLoading(false);
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
      
      // Transfer to blockchain
      const response = await userAPI.transferToBlockchain();
      
      setBlockchainData({
        ...blockchainData,
        isOnBlockchain: true,
        transactionHash: response.data.transactionHash,
        transferredAt: new Date().toISOString()
      });
      
      setSuccess('Your identity has been successfully transferred to the blockchain');
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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BlockchainIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">
                Blockchain Status
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Chip 
                label={blockchainData.isOnBlockchain ? "On Blockchain" : "Not on Blockchain"} 
                color={blockchainData.isOnBlockchain ? "success" : "default"} 
                icon={blockchainData.isOnBlockchain ? <CheckCircleIcon /> : <PendingIcon />}
              />
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Smart Contract Address
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                  {blockchainData.contractAddress}
                </Typography>
              </Grid>
              
              {blockchainData.isOnBlockchain && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Transaction Hash
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {blockchainData.transactionHash}
                      </Typography>
                      <Button
                        size="small"
                        component={Link}
                        href={`https://testnet.snowtrace.io/tx/${blockchainData.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        endIcon={<ExternalLinkIcon />}
                        sx={{ ml: 1 }}
                      >
                        View
                      </Button>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Transferred At
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {formatDate(blockchainData.transferredAt)}
                    </Typography>
                  </Grid>
                </>
              )}
            </Grid>
            
            {!blockchainData.isOnBlockchain && blockchainData.verificationStatus === 'VERIFIED' && (
              <Button
                variant="contained"
                color="primary"
                onClick={transferToBlockchain}
                disabled={transferring}
                sx={{ mt: 3 }}
                fullWidth
              >
                {transferring ? (
                  <CircularProgress size={24} />
                ) : (
                  'Transfer Identity to Blockchain'
                )}
              </Button>
            )}
            
            {!blockchainData.isOnBlockchain && blockchainData.verificationStatus !== 'VERIFIED' && (
              <Alert severity="info" sx={{ mt: 3 }}>
                Your identity must be verified before it can be transferred to the blockchain.
              </Alert>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Blockchain Identity Process
            </Typography>
            
            <Stepper orientation="vertical" activeStep={blockchainData.isOnBlockchain ? 3 : blockchainData.verificationStatus === 'VERIFIED' ? 2 : 1}>
              <Step>
                <StepLabel>Registration</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    Your identity has been registered in the TrueID system.
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
                <StepLabel>Blockchain Transfer</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    {blockchainData.isOnBlockchain
                      ? 'Your identity has been transferred to the Avalanche blockchain.'
                      : 'Your identity will be transferred to the Avalanche blockchain.'}
                  </Typography>
                </StepContent>
              </Step>
              
              <Step>
                <StepLabel>Blockchain Verification</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    Your identity is now securely stored on the blockchain and can be verified by authorized parties.
                  </Typography>
                </StepContent>
              </Step>
            </Stepper>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              About Blockchain Identity
            </Typography>
            
            <Typography variant="body1" paragraph>
              Storing your identity on the Avalanche blockchain provides several benefits:
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Security
                    </Typography>
                    <Typography variant="body2">
                      Your identity is cryptographically secured on the blockchain, making it tamper-proof and resistant to fraud.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Portability
                    </Typography>
                    <Typography variant="body2">
                      Your blockchain identity can be accessed and verified from anywhere in the world without requiring centralized servers.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Control
                    </Typography>
                    <Typography variant="body2">
                      You maintain control over your identity and can selectively share verification proofs without revealing sensitive information.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Technical Details
              </Typography>
              <Typography variant="body2">
                Your identity is stored on the Avalanche C-Chain using a smart contract deployed at address {blockchainData.contractAddress}. The TrueID system uses the Avalanche Fuji Testnet for all blockchain operations.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BlockchainStatus;
