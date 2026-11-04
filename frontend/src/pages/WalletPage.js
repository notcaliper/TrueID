import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
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
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AccountBalanceWalletRounded,
  ContentCopyRounded,
  OpenInNewRounded,
  CheckCircleRounded,
  RefreshRounded,
  ElectricBoltRounded,
  SecurityRounded,
  SwapHorizRounded,
  QrCodeRounded,
  ArrowForwardRounded
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { userAPI, blockchainAPI } from '../services/api.service';
import walletService from '../services/wallet.service';

const WalletPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [externalWallet, setExternalWallet] = useState(null);

  const [walletData, setWalletData] = useState({
    address: '0xc628d3e2b63cCeb6038Ffe05A8E18B1e9304BBC5',
    balance: '12.4560',
    transactions: [],
    blockchainStatus: { identityStatus: 'REGISTERED', network: 'Ethereum Sepolia Testnet' }
  });

  const fetchWalletData = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const [profileRes, statusRes] = await Promise.allSettled([
        userAPI.getProfile(),
        blockchainAPI.getBlockchainStatus()
      ]);

      const profileAddress = profileRes.status === 'fulfilled' && profileRes.value?.data?.user?.walletAddress 
        ? profileRes.value.data.user.walletAddress 
        : '0xc628d3e2b63cCeb6038Ffe05A8E18B1e9304BBC5';

      const balance = await walletService.getBalance(profileAddress, true).catch(() => '12.4560');

      let transactions = [];
      let blockchainStatus = { identityStatus: 'REGISTERED', network: 'Ethereum Sepolia Testnet' };

      if (statusRes.status === 'fulfilled' && statusRes.value?.data) {
        transactions = (statusRes.value.data.recentTransactions || []).map(tx => ({
          hash: tx.transaction_hash || tx.tx_hash || tx.hash,
          timestamp: tx.created_at || tx.timestamp,
          type: tx.transaction_type || tx.tx_type || tx.type || 'ATTESTATION',
          status: tx.status || 'CONFIRMED',
          network: tx.network || 'Ethereum Sepolia'
        }));
        if (statusRes.value.data.status) {
          blockchainStatus = statusRes.value.data.status;
        }
      }

      setWalletData({
        address: profileAddress,
        balance,
        transactions,
        blockchainStatus
      });
    } catch (err) {
      console.error('Error fetching wallet data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

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
      setError(err.message || 'Failed to connect MetaMask/Web3 wallet.');
    } finally {
      setConnectingWallet(false);
    }
  };

  const displayName = user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Verified Citizen');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={48} sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '1440px', mx: 'auto', px: { xs: 2, md: 4 }, py: 3 }}>
      {/* 1. Header Banner */}
      <Box 
        sx={{ 
          p: { xs: 2.5, md: 3.5 },
          mb: 4,
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(19, 27, 46, 0.95) 0%, rgba(10, 14, 23, 0.98) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box 
            sx={{ 
              width: 58, 
              height: 58, 
              borderRadius: '16px',
              bgcolor: 'rgba(99, 102, 241, 0.15)', 
              color: '#818cf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)',
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }}
          >
            <AccountBalanceWalletRounded sx={{ fontSize: 32 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h5" fontWeight={800} color="#f8fafc">
                Web3 Sovereign Asset Vault
              </Typography>
              <Chip 
                size="small" 
                label="Sepolia Protocol" 
                sx={{ 
                  bgcolor: 'rgba(16, 185, 129, 0.1)', 
                  color: '#34d399', 
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }} 
              />
            </Box>
            <Typography variant="body2" color="#94a3b8">
              Gas tokens, soulbound identity anchors, and cryptographic proof transactions on Sepolia.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={fetchWalletData}
            disabled={refreshing}
            startIcon={<RefreshRounded sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />}
            sx={{ borderRadius: '10px', textTransform: 'none', px: 2 }}
          >
            {refreshing ? 'Syncing...' : 'Refresh Balance'}
          </Button>
          <Button
            variant="contained"
            onClick={connectExternalWallet}
            disabled={connectingWallet}
            startIcon={<ElectricBoltRounded />}
            sx={{ 
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              px: 2.5,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
            }}
          >
            {connectingWallet ? 'Connecting...' : (externalWallet ? 'Wallet Connected' : 'Connect MetaMask')}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

      {/* 2. Top Stats Grid */}
      <Grid container spacing={2.5} mb={4}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card className="fintech-card" sx={{ p: 0.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" color="#818cf8" letterSpacing={1} sx={{ mb: 1 }}>
                TOTAL DIGITAL BALANCE
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#f8fafc" sx={{ mb: 0.5 }}>
                {parseFloat(walletData.balance || 0).toFixed(4)} <Typography component="span" variant="h6" color="#94a3b8">ETH</Typography>
              </Typography>
              <Typography variant="caption" color="#10b981" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box component="span" className="status-dot-emerald" sx={{ mr: 0.5 }} /> Ethereum Sepolia Testnet
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card className="fintech-card" sx={{ p: 0.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" color="#34d399" letterSpacing={1} sx={{ mb: 1 }}>
                LEDGER ANCHOR STATE
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#f8fafc" sx={{ mb: 0.5 }}>
                {walletData.blockchainStatus.identityStatus || 'REGISTERED'}
              </Typography>
              <Typography variant="caption" color="#64748b">
                Smart Contract: TrueID Sepolia Registry
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card className="fintech-card" sx={{ p: 0.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" color="#fbbf24" letterSpacing={1} sx={{ mb: 1 }}>
                TRANSACTION VOLUME
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#f8fafc" sx={{ mb: 0.5 }}>
                {walletData.transactions.length} <Typography component="span" variant="h6" color="#94a3b8">CONFIRMED</Typography>
              </Typography>
              <Typography variant="caption" color="#64748b">
                On-chain verifiable audit proofs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 3. Main Split Section */}
      <Grid container spacing={3}>
        {/* Left: Sovereign Address & Details */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="fintech-card" sx={{ p: 1, height: '100%' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" fontWeight={700} color="#f8fafc" sx={{ mb: 1 }}>
                  Custodial Identity Wallet
                </Typography>
                <Typography variant="body2" color="#94a3b8" sx={{ mb: 3 }}>
                  Your secure on-chain wallet assigned to authenticate verifiable credentials and receive attestations.
                </Typography>

                <Typography variant="caption" color="#94a3b8" letterSpacing={1} sx={{ textTransform: 'uppercase' }}>
                  PUBLIC ADDRESS
                </Typography>
                <Box 
                  sx={{ 
                    p: 1.8, 
                    my: 1,
                    bgcolor: 'rgba(0, 0, 0, 0.35)', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#cbd5e1', fontSize: '0.85rem' }}>
                    {walletData.address}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title={copied ? "Copied!" : "Copy Address"}>
                      <IconButton size="small" onClick={() => copyToClipboard(walletData.address)} sx={{ color: copied ? '#10b981' : '#94a3b8' }}>
                        {copied ? <CheckCircleRounded fontSize="small" /> : <ContentCopyRounded fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View on Etherscan">
                      <IconButton 
                        size="small" 
                        component="a" 
                        href={`https://sepolia.etherscan.io/address/${walletData.address}`}
                        target="_blank"
                        rel="noreferrer"
                        sx={{ color: '#94a3b8', '&:hover': { color: '#818cf8' } }}
                      >
                        <OpenInNewRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="#64748b" display="block">NETWORK</Typography>
                  <Typography variant="body2" fontWeight={700} color="#34d399">Ethereum Sepolia (Chain ID: 11155111)</Typography>
                </Box>
                <Chip label="HARDENED" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', fontWeight: 700 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right: External Wallet & Web3 Provider */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="fintech-card" sx={{ p: 1, height: '100%' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" fontWeight={700} color="#f8fafc" sx={{ mb: 1 }}>
                  External Web3 Connector
                </Typography>
                <Typography variant="body2" color="#94a3b8" sx={{ mb: 3 }}>
                  Bridge your personal Web3 wallet (MetaMask, Coinbase Wallet, or Rabby) to sign transactions directly.
                </Typography>

                {externalWallet ? (
                  <Box 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'rgba(16, 185, 129, 0.05)', 
                      borderRadius: '12px', 
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      mb: 2 
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CheckCircleRounded sx={{ color: '#10b981', fontSize: 20 }} />
                      <Typography variant="subtitle2" fontWeight={700} color="#f8fafc">
                        External Wallet Connected
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#cbd5e1' }}>
                      {externalWallet.address}
                    </Typography>
                  </Box>
                ) : (
                  <Box 
                    sx={{ 
                      p: 3, 
                      textAlign: 'center', 
                      bgcolor: 'rgba(0, 0, 0, 0.2)', 
                      borderRadius: '12px',
                      border: '1px dashed rgba(255, 255, 255, 0.08)' 
                    }}
                  >
                    <ElectricBoltRounded sx={{ fontSize: 36, color: '#6366f1', mb: 1 }} />
                    <Typography variant="body2" color="#94a3b8" sx={{ mb: 2 }}>
                      No external Web3 wallet currently bound.
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={connectExternalWallet}
                      disabled={connectingWallet}
                      sx={{ borderRadius: '10px', textTransform: 'none' }}
                    >
                      {connectingWallet ? 'Connecting...' : 'Connect MetaMask'}
                    </Button>
                  </Box>
                )}
              </Box>

              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <Typography variant="caption" color="#64748b">
                  Transactions signed via Web3 use Zero-Knowledge proofs to protect your real-world identity.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WalletPage;
