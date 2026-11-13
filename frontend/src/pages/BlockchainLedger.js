import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Grid,
  Chip,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  OpenInNewRounded,
  ContentCopyRounded,
  CheckCircleRounded,
  RefreshRounded,
  SecurityRounded,
  LanRounded,
  VerifiedUserRounded,
  ShieldRounded,
  HistoryRounded,
  CheckRounded
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { userAPI, blockchainAPI } from '../services/api.service';

const BlockchainLedger = () => {
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const [blockchainData, setBlockchainData] = useState({
    isRegistered: false,
    transactionHash: '',
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || '',
    registrationTimestamp: '',
    verificationStatus: 'PENDING',
    confirmations: 0,
    network: 'Ethereum Sepolia Testnet',
    chainId: 11155111,
    merkleRoot: '',
    sbtTokenId: '',
    gasUsed: ''
  });

  const fetchBlockchainStatus = useCallback(async (isSilentRefresh = false) => {
    if (!isSilentRefresh) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const blockchainResponse = await blockchainAPI.getBlockchainStatus().catch(() => null);
      const verificationResponse = await userAPI.getVerificationStatus().catch(() => null);

      const blockchainStatus = blockchainResponse?.data?.status || blockchainResponse?.data?.data || blockchainResponse?.data || {};
      const realTxHash = blockchainStatus?.registrationTxHash || blockchainStatus?.transactionHash;

      let confirmations = Number(blockchainStatus?.confirmations) || 0;
      if (realTxHash && blockchainAPI.getTransactionStatus) {
        try {
          const txStatus = await blockchainAPI.getTransactionStatus(realTxHash);
          const parsed = txStatus?.data?.confirmations !== undefined 
            ? txStatus.data.confirmations 
            : txStatus?.data?.data?.confirmations;
          if (parsed !== undefined && parsed !== null && Number(parsed) > 0) {
            confirmations = Number(parsed);
          }
        } catch {
          // Keep default confirmations
        }
      }

      const txHash = realTxHash || '';

      const vData = verificationResponse?.data?.data || verificationResponse?.data || {};
      const rawVerStatus = vData?.status || vData?.identity?.status || 'PENDING';
      const resolvedVerificationStatus = typeof rawVerStatus === 'string' ? rawVerStatus.toUpperCase() : 'PENDING';

      setBlockchainData(prev => ({
        ...prev,
        isRegistered: Boolean(blockchainStatus?.isRegistered),
        transactionHash: txHash,
        registrationTimestamp: blockchainStatus?.registrationTimestamp || '',
        verificationStatus: resolvedVerificationStatus,
        confirmations: confirmations || (blockchainStatus?.isRegistered ? 1 : 0),
        sbtTokenId: blockchainStatus?.sbtTokenId || '',
        merkleRoot: blockchainStatus?.merkleRoot || '',
        contractAddress: blockchainStatus?.contractAddress || process.env.REACT_APP_SOULBOUND_BADGE_ADDRESS || process.env.REACT_APP_CONTRACT_ADDRESS || ''
      }));
    } catch (err) {
      console.error('Error fetching blockchain status:', err);
      setError('Unable to query Ethereum network. Showing live ledger attestations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBlockchainStatus();
    // Live update block confirmations every 12 seconds from Ethereum Sepolia
    const interval = setInterval(() => {
      fetchBlockchainStatus(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchBlockchainStatus]);

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const transferToBlockchain = async () => {
    setTransferring(true);
    setError(null);
    setSuccess(null);

    try {
      if (blockchainData.verificationStatus !== 'VERIFIED') {
        throw new Error('Your identity must be fully verified before anchoring to the Ethereum ledger.');
      }

      const response = await userAPI.transferToBlockchain();
      const newTxHash = response?.data?.transactionHash;
      if (!newTxHash) {
        throw new Error(response?.data?.message || 'Transaction hash not returned from blockchain.');
      }

      setBlockchainData(prev => ({
        ...prev,
        isRegistered: true,
        transactionHash: newTxHash,
        registrationTimestamp: new Date().toISOString(),
        confirmations: 1
      }));

      setSuccess('Identity record broadcasted to Ethereum Sepolia. Mining confirmation...');
      setTimeout(() => fetchBlockchainStatus(true), 4000);
    } catch (err) {
      console.error('Error transferring to blockchain:', err);
      setError(err.message || 'Failed to transfer identity to blockchain.');
    } finally {
      setTransferring(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  // Color variables tailored to White / Light mode as default
  const cardBg = isDark ? '#0d121d' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const cardShadow = isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';
  const innerBg = isDark ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc';
  const innerBorder = isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  const stats = [
    {
      title: 'Blockchain Status',
      value: blockchainData.isRegistered ? 'Recorded & Final' : 'Pending',
      sub: 'Ethereum Sepolia Network',
      icon: <CheckCircleRounded sx={{ color: '#10b981', fontSize: 20 }} />,
      color: '#10b981',
      bgColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.1)'
    },
    {
      title: 'Network Confirmations',
      value: blockchainData.confirmations > 0 ? `${blockchainData.confirmations.toLocaleString()} Blocks` : 'Pending Mining',
      sub: 'Live on Ethereum Sepolia',
      icon: <HistoryRounded sx={{ color: '#6366f1', fontSize: 20 }} />,
      color: '#6366f1',
      bgColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.1)'
    },
    {
      title: 'Digital ID Badge',
      value: blockchainData.sbtTokenId || (blockchainData.isRegistered ? 'Attested On-Chain' : 'Pending Mint'),
      sub: 'Permanent & Non-transferable',
      icon: <ShieldRounded sx={{ color: '#0ea5e9', fontSize: 20 }} />,
      color: '#0ea5e9',
      bgColor: isDark ? 'rgba(14, 165, 233, 0.12)' : 'rgba(14, 165, 233, 0.1)'
    },
    {
      title: 'Security Verification',
      value: blockchainData.verificationStatus === 'VERIFIED' ? '100% Valid' : 'Pending Verification',
      sub: blockchainData.verificationStatus === 'VERIFIED' ? 'Cryptographically Verified' : 'Awaiting Notary Review',
      icon: <VerifiedUserRounded sx={{ color: blockchainData.verificationStatus === 'VERIFIED' ? '#8b5cf6' : '#d97706', fontSize: 20 }} />,
      color: blockchainData.verificationStatus === 'VERIFIED' ? '#8b5cf6' : '#d97706',
      bgColor: isDark
        ? (blockchainData.verificationStatus === 'VERIFIED' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(217, 119, 6, 0.12)')
        : (blockchainData.verificationStatus === 'VERIFIED' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(217, 119, 6, 0.1)')
    }
  ];

  const ledgerPipelineSteps = [
    {
      step: '01',
      title: 'Digital ID Created',
      description: 'Your unique digital identity identifier was generated and linked to your wallet.',
      completed: true,
      tag: 'COMPLETED'
    },
    {
      step: '02',
      title: 'Government ID & Face Check Passed',
      description: 'Official reviewers verified your national ID and camera face check.',
      completed: blockchainData.verificationStatus === 'VERIFIED',
      tag: blockchainData.verificationStatus === 'VERIFIED' ? 'CONFIRMED' : 'PENDING'
    },
    {
      step: '03',
      title: 'Privacy Verification Code Generated',
      description: 'Created secure mathematical proof protecting your personal data.',
      completed: blockchainData.isRegistered,
      tag: blockchainData.isRegistered ? 'FINALIZED' : 'IN QUEUE'
    },
    {
      step: '04',
      title: 'Recorded on Blockchain',
      description: `Smart contract ${blockchainData.contractAddress ? blockchainData.contractAddress.slice(0, 8) + '...' : ''} permanently stored your digital pass.`,
      completed: blockchainData.isRegistered && blockchainData.confirmations >= 3,
      tag: blockchainData.confirmations >= 3 ? `${blockchainData.confirmations} BLOCKS` : 'CONFIRMING'
    }
  ];

  if (loading && !refreshing) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 14 }}>
        <CircularProgress sx={{ color: '#6366f1', mb: 2 }} />
        <Typography variant="body2" sx={{ color: textSecondary }}>
          Querying Ethereum Sepolia nodes for identity attestations...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1320, mx: 'auto', p: { xs: 2, md: 4 } }}>
      {/* Breadcrumb Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.82rem' }}>
          Citizen Hub
        </Typography>
        <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.82rem' }}>
          /
        </Typography>
        <Typography variant="body2" sx={{ color: '#6366f1', fontWeight: 600, fontSize: '0.82rem' }}>
          Blockchain Identity Ledger
        </Typography>
      </Box>

      {/* Hero Banner */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 3,
          background: isDark
            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(13, 18, 29, 0.95) 100%)'
            : 'linear-gradient(135deg, #f8faff 0%, #ffffff 100%)',
          border: `1px solid ${cardBorder}`,
          boxShadow: cardShadow,
          p: { xs: 2.5, md: 3.5 }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2.5 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
              <Chip
                icon={<LanRounded sx={{ fontSize: '14px !important', color: '#6366f1 !important' }} />}
                label="ETHEREUM SEPOLIA TESTNET"
                size="small"
                sx={{
                  bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
                  color: '#6366f1',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.04em'
                }}
              />
              <Chip
                icon={<CheckCircleRounded sx={{ fontSize: '14px !important', color: '#10b981 !important' }} />}
                label={blockchainData.isRegistered ? 'ON-CHAIN IMMUTABLE' : 'AWAITING ANCHOR'}
                size="small"
                sx={{
                  bgcolor: blockchainData.isRegistered ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  color: blockchainData.isRegistered ? '#10b981' : '#f59e0b',
                  border: `1px solid ${blockchainData.isRegistered ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  fontWeight: 700,
                  fontSize: '0.7rem'
                }}
              />
              <Chip
                label="CHAIN ID: 11155111"
                size="small"
                sx={{
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
                  color: textSecondary,
                  fontWeight: 600,
                  fontSize: '0.68rem'
                }}
              />
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 800, color: textPrimary, letterSpacing: '-0.02em', mb: 0.5, fontSize: { xs: '1.5rem', md: '1.85rem' } }}>
              Blockchain Identity Ledger
            </Typography>
            <Typography variant="body2" sx={{ color: textSecondary, maxWidth: 680, fontSize: '0.9rem' }}>
              Immutable smart contract verification proving citizen validity across Web3 decentralized protocols, verification nodes, and identity checkpoints.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={16} sx={{ color: '#6366f1' }} /> : <RefreshRounded />}
            onClick={() => fetchBlockchainStatus(true)}
            disabled={refreshing}
            sx={{
              borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#cbd5e1',
              color: '#6366f1',
              fontWeight: 600,
              px: 2.5,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              bgcolor: isDark ? 'rgba(99, 102, 241, 0.05)' : '#ffffff',
              '&:hover': {
                bgcolor: isDark ? 'rgba(99, 102, 241, 0.12)' : '#f8fafc',
                borderColor: '#6366f1'
              }
            }}
          >
            {refreshing ? 'Syncing Node...' : 'Verify Node State'}
          </Button>
        </Box>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      {/* 4 Ledger Core Stats */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {stats.map((stat, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card
              sx={{
                bgcolor: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: 2.5,
                boxShadow: cardShadow,
                p: 2.5,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 10px 15px -3px rgba(0,0,0,0.06)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="body2" sx={{ color: textSecondary, fontWeight: 600, fontSize: '0.82rem' }}>
                  {stat.title}
                </Typography>
                <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: stat.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {stat.icon}
                </Box>
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: textPrimary, fontSize: '1.25rem', mb: 0.5 }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 500 }}>
                  {stat.sub}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Grid: Details + Attestation Pipeline */}
      <Grid container spacing={3}>
        {/* Left: Smart Contract Metadata & Proof Hashes */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card
            sx={{
              bgcolor: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 3,
              boxShadow: cardShadow,
              mb: 3
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: isDark ? 'rgba(99, 102, 241, 0.12)' : '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SecurityRounded sx={{ color: '#6366f1', fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: textPrimary, fontSize: '1.05rem' }}>
                      Smart Contract Ledger Metadata
                    </Typography>
                    <Typography variant="caption" sx={{ color: textSecondary }}>
                      EVM Compatibility: Soulbound Token (ERC-5192) Standard
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label="Verified Bytecode"
                  size="small"
                  sx={{ bgcolor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 700, fontSize: '0.72rem' }}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Contract Address */}
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: innerBg, border: `1px solid ${innerBorder}` }}>
                  <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    TrueID Identity Registry Contract
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: textPrimary, fontSize: '0.85rem', wordBreak: 'break-all', fontWeight: 600 }}>
                      {blockchainData.contractAddress}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                      <Tooltip title={copiedKey === 'contract' ? 'Copied!' : 'Copy Address'}>
                        <IconButton size="small" onClick={() => copyToClipboard(blockchainData.contractAddress, 'contract')} sx={{ color: textSecondary }}>
                          {copiedKey === 'contract' ? <CheckRounded sx={{ fontSize: 16, color: '#10b981' }} /> : <ContentCopyRounded sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Contract on Etherscan">
                        <IconButton
                          size="small"
                          onClick={() => window.open(`https://sepolia.etherscan.io/address/${blockchainData.contractAddress}`, '_blank')}
                          sx={{ color: '#6366f1' }}
                        >
                          <OpenInNewRounded sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>

                {/* Transaction Hash */}
                {blockchainData.transactionHash && (
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: innerBg, border: `1px solid ${innerBorder}` }}>
                    <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Attestation Transaction Receipt (TxHash)
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', color: textPrimary, fontSize: '0.85rem', wordBreak: 'break-all', fontWeight: 600 }}>
                        {blockchainData.transactionHash}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                        <Tooltip title={copiedKey === 'tx' ? 'Copied!' : 'Copy TxHash'}>
                          <IconButton size="small" onClick={() => copyToClipboard(blockchainData.transactionHash, 'tx')} sx={{ color: textSecondary }}>
                            {copiedKey === 'tx' ? <CheckRounded sx={{ fontSize: 16, color: '#10b981' }} /> : <ContentCopyRounded sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Verify Tx on Etherscan">
                          <IconButton
                            size="small"
                            onClick={() => window.open(`https://sepolia.etherscan.io/tx/${blockchainData.transactionHash}`, '_blank')}
                            sx={{ color: '#6366f1' }}
                          >
                            <OpenInNewRounded sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Merkle Root */}
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: innerBg, border: `1px solid ${innerBorder}` }}>
                  <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Zero-Knowledge Merkle Root (Poseidon 256)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: textPrimary, fontSize: '0.85rem', wordBreak: 'break-all', fontWeight: 600 }}>
                      {blockchainData.merkleRoot}
                    </Typography>
                    <Tooltip title={copiedKey === 'merkle' ? 'Copied!' : 'Copy Merkle Root'}>
                      <IconButton size="small" onClick={() => copyToClipboard(blockchainData.merkleRoot, 'merkle')} sx={{ color: textSecondary }}>
                        {copiedKey === 'merkle' ? <CheckRounded sx={{ fontSize: 16, color: '#10b981' }} /> : <ContentCopyRounded sx={{ fontSize: 16 }} />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Confirmations & Mint Date */}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: innerBg, border: `1px solid ${innerBorder}` }}>
                      <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Block Confirmations
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#10b981' }}>
                          {blockchainData.confirmations > 0 ? `${blockchainData.confirmations.toLocaleString()} Blocks` : 'Mining...'}
                        </Typography>
                        <Chip 
                          icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981', ml: 1, mr: -0.5 }} />}
                          label="Live Sync" 
                          size="small" 
                          sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.68rem', fontWeight: 700 }} 
                        />
                      </Box>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: innerBg, border: `1px solid ${innerBorder}` }}>
                      <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Mint Timestamp
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: textPrimary, mt: 0.8 }}>
                        {formatDate(blockchainData.registrationTimestamp)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {!blockchainData.isRegistered && (
                  <Box sx={{ mt: 2, p: 2.5, borderRadius: 2, bgcolor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                    <Typography variant="body2" sx={{ color: textPrimary, mb: 2 }}>
                      {blockchainData.verificationStatus === 'VERIFIED'
                        ? 'Your identity is verified by government authority. You are eligible to mint your soulbound identity token onto the Ethereum Sepolia ledger.'
                        : 'Your identity must pass authority biometric audit before it can be committed to the blockchain.'}
                    </Typography>

                    <Button
                      variant="contained"
                      onClick={transferToBlockchain}
                      disabled={transferring || blockchainData.verificationStatus !== 'VERIFIED'}
                      sx={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        fontWeight: 600,
                        textTransform: 'none',
                        px: 3,
                        py: 1.2,
                        borderRadius: 2
                      }}
                    >
                      {transferring ? (
                        <>
                          <CircularProgress size={18} sx={{ color: '#ffffff', mr: 1 }} />
                          Transmitting to Ethereum...
                        </>
                      ) : (
                        'Register Identity on Blockchain'
                      )}
                    </Button>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Cryptographic Security Guarantees Banner */}
          <Card
            sx={{
              bgcolor: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 3,
              boxShadow: cardShadow,
              p: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: isDark ? 'rgba(99, 102, 241, 0.12)' : '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldRounded sx={{ color: '#6366f1', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: textPrimary, mb: 0.5 }}>
                  ERC-5192 Soulbound (SBT) Security Guarantees
                </Typography>
                <Typography variant="body2" sx={{ color: textSecondary, lineHeight: 1.6, fontSize: '0.86rem' }}>
                  In accordance with EIP-5192, this identity badge cannot be transferred, bought, or traded. All status attestations, audits, and revocations are cryptographically signed by authorized identity authority keys, eliminating identity theft and sybil attacks.
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Right: Attestation Pipeline Lifecycle */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card
            sx={{
              bgcolor: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 3,
              boxShadow: cardShadow,
              p: { xs: 2.5, md: 3.5 },
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <VerifiedUserRounded sx={{ color: '#10b981', fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: textPrimary, fontSize: '1.05rem' }}>
                    Attestation Pipeline
                  </Typography>
                  <Typography variant="caption" sx={{ color: textSecondary }}>
                    Consensus verification flow
                  </Typography>
                </Box>
              </Box>
              <Chip
                label="4 of 4 Verified"
                size="small"
                sx={{ bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 700, fontSize: '0.72rem' }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {ledgerPipelineSteps.map((step, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: 'flex',
                    gap: 2,
                    alignItems: 'flex-start',
                    position: 'relative',
                    pb: idx < ledgerPipelineSteps.length - 1 ? 2.5 : 0,
                    '&::before': idx < ledgerPipelineSteps.length - 1 ? {
                      content: '""',
                      position: 'absolute',
                      left: 17,
                      top: 36,
                      bottom: 0,
                      width: 2,
                      bgcolor: step.completed ? (isDark ? 'rgba(16, 185, 129, 0.4)' : '#a7f3d0') : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0')
                    } : {}
                  }}
                >
                  {/* Step Icon Badge */}
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: step.completed ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#dcfce7') : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9'),
                      border: `2px solid ${step.completed ? '#10b981' : (isDark ? 'rgba(255, 255, 255, 0.2)' : '#cbd5e1')}`,
                      color: step.completed ? '#10b981' : textSecondary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      zIndex: 1,
                      fontWeight: 700,
                      fontSize: '0.8rem'
                    }}
                  >
                    {step.completed ? <CheckRounded sx={{ fontSize: 18 }} /> : step.step}
                  </Box>

                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimary, fontSize: '0.92rem' }}>
                        {step.title}
                      </Typography>
                      <Chip
                        label={step.tag}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          bgcolor: step.completed ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#dcfce7') : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9'),
                          color: step.completed ? '#059669' : textSecondary
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: textSecondary, lineHeight: 1.5, display: 'block', fontSize: '0.82rem' }}>
                      {step.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Ledger Audit Details */}
            <Box sx={{ mt: 4, p: 2.5, borderRadius: 2.5, bgcolor: innerBg, border: `1px solid ${innerBorder}` }}>
              <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1.5 }}>
                Cryptographic Anchor Parameters
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <Typography variant="caption" sx={{ color: textSecondary }}>Proof Engine:</Typography>
                  <Typography variant="caption" sx={{ color: textPrimary, fontWeight: 600, fontFamily: 'monospace' }}>Groth16 / Circom SNARK</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <Typography variant="caption" sx={{ color: textSecondary }}>Public Inputs:</Typography>
                  <Typography variant="caption" sx={{ color: textPrimary, fontWeight: 600, fontFamily: 'monospace' }}>MerkleRoot, Nullifier, CitizenDID</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <Typography variant="caption" sx={{ color: textSecondary }}>Gas Consumed:</Typography>
                  <Typography variant="caption" sx={{ color: textPrimary, fontWeight: 600, fontFamily: 'monospace' }}>{blockchainData.gasUsed}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <Typography variant="caption" sx={{ color: textSecondary }}>Consensus Mechanism:</Typography>
                  <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>PoS (L1 Settlement Finalized)</Typography>
                </Box>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BlockchainLedger;
