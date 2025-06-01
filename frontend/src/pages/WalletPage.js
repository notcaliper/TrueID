import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Link,
  Card,
  CardContent
} from '@mui/material';
import { ContentCopy as CopyIcon, OpenInNew as ExternalLinkIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api.service';
import walletService from '../services/wallet.service';

const WalletPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletData, setWalletData] = useState({
    address: '',
    balance: '0',
    transactions: []
  });
  const [copied, setCopied] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [externalWallet, setExternalWallet] = useState(null);

  useEffect(() => {
    const fetchWalletData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch user profile to get wallet address
        const profileResponse = await userAPI.getProfile();
        const walletAddress = profileResponse.data.avax_address;
        
        if (!walletAddress) {
          setError('No wallet address found for your account.');
          setLoading(false);
          return;
        }
        
        // Fetch wallet balance
        const balance = await walletService.getBalance(walletAddress);
        
        // Fetch transactions (simplified for demo)
        // In a real app, you would fetch this from the backend
        const mockTransactions = [
          {
            hash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
            timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'IDENTITY_VERIFICATION',
            status: 'CONFIRMED'
          },
          {
            hash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
            timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'RECORD_ADDED',
            status: 'CONFIRMED'
          }
        ];
        
        setWalletData({
          address: walletAddress,
          balance,
          transactions: mockTransactions
        });
      } catch (err) {
        console.error('Error fetching wallet data:', err);
        setError('Failed to load wallet data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWalletData();
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const connectExternalWallet = async () => {
    setConnectingWallet(true);
    setError(null);
    
    try {
      const walletInfo = await walletService.connectWallet();
      setExternalWallet(walletInfo);
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet. Please try again.');
    } finally {
      setConnectingWallet(false);
    }
  };

  const formatDate = (dateString) => {
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
        Your Wallet
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Avalanche C-Chain Wallet
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Wallet Address
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontFamily: 'monospace', 
                    bgcolor: 'background.paper', 
                    p: 1, 
                    borderRadius: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '80%'
                  }}
                >
                  {walletData.address}
                </Typography>
                <Button 
                  size="small" 
                  startIcon={<CopyIcon />} 
                  onClick={() => copyToClipboard(walletData.address)}
                  sx={{ ml: 1 }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Balance
              </Typography>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {walletData.balance} AVAX
              </Typography>
              <Typography variant="body2" color="text.secondary">
                on Avalanche Fuji Testnet
              </Typography>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Button 
                variant="outlined" 
                color="primary"
                component={Link}
                href={`https://testnet.snowtrace.io/address/${walletData.address}`}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<ExternalLinkIcon />}
              >
                View on Snowtrace
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Connect External Wallet
            </Typography>
            <Typography variant="body2" paragraph>
              Connect your MetaMask or other Web3 wallet to interact with the TrueID system.
            </Typography>
            
            {externalWallet ? (
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Connected Wallet
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 1 }}>
                    {externalWallet.address}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                    Balance
                  </Typography>
                  <Typography variant="body1">
                    {externalWallet.balance} AVAX
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                    Network
                  </Typography>
                  <Typography variant="body1">
                    {externalWallet.network} (Chain ID: {externalWallet.chainId})
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Button
                variant="contained"
                onClick={connectExternalWallet}
                disabled={connectingWallet}
                sx={{ mt: 1 }}
              >
                {connectingWallet ? (
                  <CircularProgress size={24} />
                ) : (
                  'Connect Wallet'
                )}
              </Button>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Transaction History
            </Typography>
            
            {walletData.transactions.length === 0 ? (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
                No transactions found
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Transaction Hash</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {walletData.transactions.map((tx) => (
                      <TableRow key={tx.hash}>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontFamily: 'monospace',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '150px'
                            }}
                          >
                            {tx.hash}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(tx.timestamp)}</TableCell>
                        <TableCell>{tx.type}</TableCell>
                        <TableCell>
                          <Chip 
                            label={tx.status} 
                            color={tx.status === 'CONFIRMED' ? 'success' : 'warning'} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            component={Link}
                            href={`https://testnet.snowtrace.io/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            endIcon={<ExternalLinkIcon />}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WalletPage;
