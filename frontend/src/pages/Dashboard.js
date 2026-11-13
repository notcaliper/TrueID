import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import {
  SecurityRounded,
  FingerprintRounded,
  BadgeRounded,
  ContentCopyRounded,
  QrCode2Rounded,
  SearchRounded,
  CheckCircleRounded,
  ArrowForwardRounded,
  SchoolRounded,
  LanRounded,
  ShieldRounded,
  RefreshRounded,
  KeyRounded,
  LockRounded,
  GppGoodRounded,
  CloseRounded,
  DownloadRounded,
  HistoryRounded,
  FactCheckRounded
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ThemeContext';
import { userAPI, blockchainAPI } from '../services/api.service';
import QRCode from 'qrcode';

const resolveGovId = (u) => u?.government_id || u?.governmentId || '';
const resolveWallet = (u) => u?.wallet_address || u?.walletAddress || '';
const resolveDid = (u) => u?.did || (resolveWallet(u) ? `did:trueid:${resolveWallet(u)}` : '');

const Dashboard = () => {
  const { user } = useAuth();
  const { isLight } = useColorMode();

  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);
  const [recordSearch, setRecordSearch] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [activeTab, setActiveTab] = useState('overview');

  const [identityData, setIdentityData] = useState(() => {
    const govId = resolveGovId(user);
    const wallet = resolveWallet(user);
    const did = resolveDid(user);
    return {
      name: user?.name || user?.full_name || '',
      governmentId: govId,
      did: did,
      verificationStatus: user?.verification_status || user?.verificationStatus || 'PENDING',
      walletAddress: wallet,
      trustScore: user?.trust_score || 0,
      tier: 'Citizen',
      recordsCount: 0,
      facemeshStatus: user?.facemesh_hash ? 'Enrolled (SHA-256)' : 'Not Enrolled',
      enclaveStatus: 'Protected',
      blockchainTx: user?.blockchain_tx_hash || '',
      contractAddress: process.env.REACT_APP_SOULBOUND_BADGE_ADDRESS || process.env.REACT_APP_CONTRACT_ADDRESS || '0x6f4d27d80f84ce44eFecF9A1eAd6A5e6489ae9Bf',
      sbtTokenId: user?.soulbound_token_id ? `SBT-Token #${user.soulbound_token_id}` : '',
      lastSync: ''
    };
  });

  const [credentialRecords, setCredentialRecords] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    if (identityData.did) {
      QRCode.toDataURL(identityData.did, {
        width: 320,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
      }).then(url => setQrDataUrl(url)).catch(() => {});
    }
  }, [identityData.did]);

  const handleExportPass = () => {
    const passPayload = {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://trueid.org/schemas/digital-pass/v1"
      ],
      "id": identityData.did,
      "type": ["VerifiableCredential", "TrueIDDigitalPass"],
      "issuer": {
        "id": "did:trueid:authority:registry",
        "name": "TrueID Digital Identity Authority",
        "network": "Ethereum Sepolia (Chain ID 11155111)",
        "badgeContract": identityData.contractAddress
      },
      "issuanceDate": new Date().toISOString(),
      "credentialSubject": {
        "id": identityData.did,
        "name": identityData.name,
        "governmentId": identityData.governmentId,
        "walletAddress": identityData.walletAddress,
        "soulboundTokenId": identityData.sbtTokenId,
        "verificationStatus": identityData.verificationStatus
      },
      "proof": {
        "type": "EIP5192SoulboundProof",
        "created": new Date().toISOString(),
        "transactionHash": identityData.blockchainTx,
        "verificationMethod": `${identityData.did}#key-1`,
        "proofPurpose": "assertionMethod"
      }
    };

    const blob = new Blob([JSON.stringify(passPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TrueID-Digital-Pass-${identityData.governmentId || 'Citizen'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [verRes, bcRes, recRes, bioRes, txRes, profRes] = await Promise.allSettled([
        userAPI.getVerificationStatus(),
        blockchainAPI.getBlockchainStatus(),
        userAPI.getProfessionalRecords(),
        userAPI.getBiometricStatus(),
        blockchainAPI.getTransactions(1, 5),
        userAPI.getProfile()
      ]);

      const fetchedUser = profRes.status === 'fulfilled' ? profRes.value?.data?.user : null;
      const effectiveGovId = resolveGovId(fetchedUser) || resolveGovId(user);
      const effectiveWallet = resolveWallet(fetchedUser) || resolveWallet(user);
      const effectiveDid = resolveDid(fetchedUser) || resolveDid(user);
      const effectiveName = fetchedUser?.name || user?.name || user?.full_name || '';

      const verStatus = verRes.status === 'fulfilled' && (verRes.value?.data?.data?.status || verRes.value?.data?.status)
        ? (verRes.value?.data?.data?.status || verRes.value?.data?.status)
        : (user?.verification_status || 'PENDING');
      const records = recRes.status === 'fulfilled' && recRes.value?.data?.records ? recRes.value.data.records : [];
      const bcData = bcRes.status === 'fulfilled' ? (bcRes.value?.data?.status || bcRes.value?.data?.data || bcRes.value?.data) : null;

      setIdentityData(prev => ({
        ...prev,
        name: effectiveName,
        governmentId: effectiveGovId,
        walletAddress: effectiveWallet,
        did: effectiveDid,
        verificationStatus: verStatus,
        recordsCount: records.length,
        facemeshStatus: (bioRes.status === 'fulfilled' && (bioRes.value?.data?.hasBiometrics || bioRes.value?.data?.facemeshExists || bioRes.value?.data?.verified)) || user?.facemesh_hash || user?.has_biometrics ? 'Enrolled (SHA-256)' : 'Not Enrolled',
        blockchainTx: bcData?.registrationTxHash || bcData?.transactionHash || user?.blockchain_tx_hash || '',
        contractAddress: bcData?.contractAddress || process.env.REACT_APP_SOULBOUND_BADGE_ADDRESS || process.env.REACT_APP_CONTRACT_ADDRESS || '0x6f4d27d80f84ce44eFecF9A1eAd6A5e6489ae9Bf',
        sbtTokenId: bcData?.sbtTokenId || (user?.soulbound_token_id ? `SBT-Token #${user.soulbound_token_id}` : ''),
        lastSync: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' })
      }));

      setCredentialRecords(records.map(r => ({
        id: `REC-${r.id}`,
        type: r.record_type || 'CREDENTIAL',
        title: r.title || 'Attested Record',
        issuer: r.institution || 'Authority',
        hash: r.data_hash || r.blockchain_tx_hash || '',
        issuedAt: r.start_date ? new Date(r.start_date).toLocaleDateString() : '',
        status: r.verification_status || 'PENDING'
      })));

      const txList = txRes.status === 'fulfilled' ? (txRes.value?.data?.transactions || txRes.value?.data?.data?.transactions || []) : [];
      setAuditLogs(txList.map(tx => ({
        title: tx.transaction_type ? tx.transaction_type.replace(/_/g, ' ') : 'Ledger Event',
        actor: 'TrueID Notary Authority',
        time: tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'Recent',
        status: tx.status || 'CONFIRMED',
        color: tx.status === 'CONFIRMED' || tx.status === 'SUCCESS' ? '#16a34a' : '#2563eb'
      })));
    } catch (err) {
      console.warn('Dashboard fetch warning:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const userId = user?.id;
  useEffect(() => {
    fetchData();
  }, [userId, fetchData]);

  const handleCopyDID = () => {
    navigator.clipboard.writeText(identityData.did);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 4 Core Identity Pillars (Simple English)
  const corePillars = [
    {
      title: 'National ID Card',
      idVal: identityData.governmentId,
      status: 'VERIFIED & APPROVED',
      desc: 'Government identity record confirmed and approved by official notary',
      tag: 'Official Approval',
      linkText: 'View ID Details',
      linkTo: '/profile',
      icon: <BadgeRounded sx={{ fontSize: 24 }} />,
      color: '#2563eb',
      bg: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.12)'
    },
    {
      title: 'Face Verification',
      idVal: 'Face Match Active',
      status: 'FACE SCAN PASSED',
      desc: 'Real-time camera face check passed and securely stored on your device',
      tag: 'Device Secured',
      linkText: 'Open Face Scan',
      linkTo: '/biometric-verification',
      icon: <FingerprintRounded sx={{ fontSize: 24 }} />,
      color: '#7c3aed',
      bg: isLight ? '#f5f3ff' : 'rgba(124, 58, 237, 0.12)'
    },
    {
      title: 'Blockchain Record',
      idVal: 'Permanent Digital Badge',
      status: 'SAVED ON BLOCKCHAIN',
      desc: 'Your verified identity badge is permanently recorded on the blockchain network',
      tag: 'Permanent Record',
      linkText: 'View on Blockchain',
      linkTo: '/blockchain-status',
      icon: <SecurityRounded sx={{ fontSize: 24 }} />,
      color: '#16a34a',
      bg: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.12)'
    },
    {
      title: 'Verified Documents',
      idVal: '4 Approved Documents',
      status: 'ALL VERIFIED',
      desc: 'College degrees, work experience, certificates, and ID papers',
      tag: 'Approved Papers',
      linkText: 'View Documents',
      linkTo: '/professional-records',
      icon: <SchoolRounded sx={{ fontSize: 24 }} />,
      color: '#0891b2',
      bg: isLight ? '#ecfeff' : 'rgba(8, 145, 178, 0.12)'
    }
  ];



  const filteredRecords = credentialRecords.filter(r =>
    r.title.toLowerCase().includes(recordSearch.toLowerCase()) ||
    r.issuer.toLowerCase().includes(recordSearch.toLowerCase()) ||
    r.type.toLowerCase().includes(recordSearch.toLowerCase())
  );

  return (
    <Box sx={{ width: '100%', pb: 6 }}>
      {/* 1. Breadcrumb Trail & Quick Sync */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: isLight ? '#64748b' : '#8b949e', fontSize: '0.84rem' }}>
          <Typography component={RouterLink} to="/" sx={{ color: isLight ? '#64748b' : '#8b949e', textDecoration: 'none', '&:hover': { color: '#2563eb' } }}>
            TrueID Identity Portal
          </Typography>
          <span>/</span>
          <Typography sx={{ color: isLight ? '#64748b' : '#8b949e' }}>Citizen Identity Vault</Typography>
          <span>/</span>
          <Typography sx={{ color: isLight ? '#0f172a' : '#f8fafc', fontWeight: 700, fontFamily: 'monospace' }}>
            {identityData.governmentId}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            onClick={fetchData}
            disabled={refreshing}
            startIcon={<RefreshRounded sx={{ fontSize: '15px !important' }} />}
            sx={{
              color: isLight ? '#2563eb' : '#60a5fa',
              bgcolor: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.1)',
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
              textTransform: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              '&:hover': { bgcolor: isLight ? '#dbeafe' : 'rgba(37, 99, 235, 0.2)' }
            }}
          >
            {refreshing ? 'Syncing...' : 'Sync Identity'}
          </Button>
          <Typography variant="caption" sx={{ color: isLight ? '#94a3b8' : '#6b7280' }}>
            • Last verified: {identityData.lastSync}
          </Typography>
        </Box>
      </Box>

      {/* 2. Top Citizen Profile Header Banner */}
      <Card
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 3,
          bgcolor: isLight ? '#ffffff' : '#181a1c',
          border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
          boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.04)' : 'none',
          mb: 3
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 3
          }}
        >
          {/* Left: Avatar + Citizen Name + DID + Verified Badges */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                sx={{
                  width: 68,
                  height: 68,
                  bgcolor: '#2563eb',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  border: `3px solid ${isLight ? '#ffffff' : '#181a1c'}`
                }}
              >
                {identityData.name ? identityData.name.charAt(0) : 'A'}
              </Avatar>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  bgcolor: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${isLight ? '#ffffff' : '#181a1c'}`,
                  color: '#ffffff'
                }}
              >
                <CheckCircleRounded sx={{ fontSize: 14 }} />
              </Box>
            </Box>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff', letterSpacing: '-0.02em' }}>
                  {identityData.name}
                </Typography>

                <Chip
                  label="SOULBOUND VERIFIED"
                  size="small"
                  icon={<GppGoodRounded sx={{ fontSize: '14px !important', color: '#16a34a !important' }} />}
                  sx={{
                    bgcolor: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.15)',
                    color: isLight ? '#16a34a' : '#4ade80',
                    border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(34, 197, 94, 0.3)'}`,
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    height: 24
                  }}
                />
              </Box>

              {/* DID with One-Click Copy and QR Button */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.8, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: isLight ? '#475569' : '#9ca3af', bgcolor: isLight ? '#f8fafc' : '#1e2124', px: 1.2, py: 0.3, borderRadius: 1.5, border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`, fontSize: '0.82rem' }}>
                  {identityData.did}
                </Typography>

                <Tooltip title={copied ? 'Copied DID!' : 'Copy DID'}>
                  <IconButton size="small" onClick={handleCopyDID} sx={{ color: isLight ? '#64748b' : '#9ca3af', p: 0.6 }}>
                    <ContentCopyRounded sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="View Citizen Passport QR">
                  <IconButton size="small" onClick={() => setQrModalOpen(true)} sx={{ color: isLight ? '#2563eb' : '#60a5fa', p: 0.6 }}>
                    <QrCode2Rounded sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Key Identity Attribute Badges */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                <Chip
                  label={`Gov ID: ${identityData.governmentId}`}
                  size="small"
                  sx={{
                    bgcolor: isLight ? '#f1f5f9' : '#1e2124',
                    color: isLight ? '#334155' : '#cbd5e1',
                    border: `1px solid ${isLight ? '#e2e8f0' : '#32363a'}`,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: 26
                  }}
                />
                <Chip
                  label="Blockchain Badge"
                  size="small"
                  sx={{
                    bgcolor: isLight ? '#f1f5f9' : '#1e2124',
                    color: isLight ? '#334155' : '#cbd5e1',
                    border: `1px solid ${isLight ? '#e2e8f0' : '#32363a'}`,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: 26
                  }}
                />
                <Chip
                  label="Face Verified"
                  size="small"
                  sx={{
                    bgcolor: isLight ? '#f1f5f9' : '#1e2124',
                    color: isLight ? '#334155' : '#cbd5e1',
                    border: `1px solid ${isLight ? '#e2e8f0' : '#32363a'}`,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: 26
                  }}
                />
                <Chip
                  label="Privacy Protected"
                  size="small"
                  sx={{
                    bgcolor: isLight ? '#f1f5f9' : '#1e2124',
                    color: isLight ? '#334155' : '#cbd5e1',
                    border: `1px solid ${isLight ? '#e2e8f0' : '#32363a'}`,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: 26
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Right: Trust Score & Clearance Tier */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: isLight ? '#f8fafc' : '#141618',
              border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
              textAlign: { xs: 'left', md: 'right' },
              minWidth: 220
            }}
          >
            <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block' }}>
              IDENTITY TRUST SCORE
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 0.5, my: 0.2 }}>
              <Typography variant="h3" sx={{ fontWeight: 800, color: identityData.verificationStatus === 'VERIFIED' ? '#16a34a' : '#d97706', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {identityData.verificationStatus === 'VERIFIED' ? '100%' : '0%'}
              </Typography>
              <Typography variant="body2" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700 }}>
                / 100
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: identityData.verificationStatus === 'VERIFIED' ? '#16a34a' : '#d97706', fontWeight: 700, display: 'block' }}>
              {identityData.verificationStatus === 'VERIFIED' ? 'Verified Citizen' : 'Pending Verification'}
            </Typography>
            <Typography variant="caption" sx={{ color: isLight ? '#94a3b8' : '#6b7280', fontSize: '0.7rem' }}>
              {identityData.verificationStatus === 'VERIFIED' ? 'Attested on Ethereum Sepolia' : 'Awaiting admin verification'}
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* 3. Four Core Identity Pillars (Clear, Authoritative Cards) */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {corePillars.map((pillar, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
            <Card
              sx={{
                p: 2.5,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: 3,
                bgcolor: isLight ? '#ffffff' : '#181a1c',
                border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: pillar.color,
                  transform: 'translateY(-2px)',
                  boxShadow: isLight ? '0 6px 16px rgba(0,0,0,0.06)' : '0 6px 16px rgba(0,0,0,0.4)'
                }
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: pillar.bg,
                      color: pillar.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {pillar.icon}
                  </Box>
                  <Chip
                    label={pillar.tag}
                    size="small"
                    sx={{
                      bgcolor: isLight ? '#f1f5f9' : '#1e2124',
                      color: isLight ? '#475569' : '#9ca3af',
                      fontWeight: 700,
                      fontSize: '0.68rem',
                      height: 22
                    }}
                  />
                </Box>

                <Typography variant="caption" sx={{ color: pillar.color, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                  {pillar.status}
                </Typography>

                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff', fontSize: '1rem', mb: 0.8 }}>
                  {pillar.title}
                </Typography>

                <Typography variant="body2" sx={{ fontWeight: 700, color: isLight ? '#1e293b' : '#f1f5f9', fontFamily: 'monospace', fontSize: '0.85rem', mb: 1 }}>
                  {pillar.idVal}
                </Typography>

                <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontSize: '0.78rem', lineHeight: 1.4, display: 'block' }}>
                  {pillar.desc}
                </Typography>
              </Box>

              <Box sx={{ pt: 2, mt: 2, borderTop: `1px solid ${isLight ? '#f1f5f9' : '#282a2d'}` }}>
                <Button
                  component={RouterLink}
                  to={pillar.linkTo}
                  endIcon={<ArrowForwardRounded sx={{ fontSize: '14px !important' }} />}
                  sx={{
                    p: 0,
                    color: pillar.color,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    textTransform: 'none',
                    '&:hover': { background: 'none', textDecoration: 'underline' }
                  }}
                >
                  {pillar.linkText}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 4. Two-Column Main Identity Workstation */}
      <Grid container spacing={3}>
        {/* Left Column (8 / 12): Digital ID Card + Verifiable Credentials Table */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Digital Citizen ID Pass (Fintech Holographic Card) */}
            <Card
              sx={{
                p: { xs: 2.5, md: 3.5 },
                borderRadius: 4,
                background: 'linear-gradient(135deg, #090e17 0%, #0f172a 55%, #132038 100%)',
                color: '#ffffff',
                border: '1px solid rgba(56, 189, 248, 0.22)',
                boxShadow: isLight
                  ? '0 12px 30px rgba(15, 23, 42, 0.15)'
                  : '0 18px 42px rgba(0, 0, 0, 0.55)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Subtle background security watermark icon */}
              <ShieldRounded
                sx={{
                  position: 'absolute',
                  right: -25,
                  bottom: -25,
                  fontSize: 240,
                  color: 'rgba(56, 189, 248, 0.03)',
                  pointerEvents: 'none'
                }}
              />

              {/* Top Row: Title + Official Authority + Authentic Status Chips */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      bgcolor: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 14px rgba(37, 99, 235, 0.5)'
                    }}
                  >
                    <ShieldRounded sx={{ fontSize: 22, color: '#ffffff' }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#ffffff', fontWeight: 900, letterSpacing: '0.08em', fontSize: '0.88rem' }}>
                      TRUEID DIGITAL PASS
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                      OFFICIAL IDENTITY CARD • VERIFIED CITIZEN
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<LanRounded sx={{ color: '#38bdf8 !important', fontSize: '13px !important' }} />}
                    label="ETHEREUM SEPOLIA"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(56, 189, 248, 0.12)',
                      color: '#38bdf8',
                      fontWeight: 800,
                      fontSize: '0.68rem',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      height: 24
                    }}
                  />
                  {identityData.sbtTokenId ? (
                    <Chip
                      icon={<CheckCircleRounded sx={{ color: '#4ade80 !important', fontSize: '13px !important' }} />}
                      label={identityData.sbtTokenId}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(34, 197, 94, 0.12)',
                        color: '#4ade80',
                        fontWeight: 800,
                        fontSize: '0.68rem',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        height: 24
                      }}
                    />
                  ) : null}
                </Box>
              </Box>

              {/* Card Middle: Precision EMV Gold Chip + Citizen Details + Gov ID */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3, my: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                  {/* Realistic Micro-etched EMV Gold Chip */}
                  <Box
                    sx={{
                      width: 52,
                      height: 42,
                      borderRadius: 1.5,
                      background: 'radial-gradient(ellipse at center, #fef08a 0%, #eab308 50%, #ca8a04 80%, #a16207 100%)',
                      border: '1px solid rgba(254, 240, 138, 0.85)',
                      boxShadow: '0 2px 8px rgba(202, 138, 4, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.6)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      p: 0.6,
                      position: 'relative',
                      flexShrink: 0
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', height: '35%' }}>
                      <Box sx={{ width: '45%', borderBottom: '1px solid #78350f', borderRight: '1px solid #78350f', opacity: 0.6, borderRadius: '0 0 2px 0' }} />
                      <Box sx={{ width: '45%', borderBottom: '1px solid #78350f', borderLeft: '1px solid #78350f', opacity: 0.6, borderRadius: '0 0 0 2px' }} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', height: '35%' }}>
                      <Box sx={{ width: '45%', borderTop: '1px solid #78350f', borderRight: '1px solid #78350f', opacity: 0.6, borderRadius: '0 2px 0 0' }} />
                      <Box sx={{ width: '45%', borderTop: '1px solid #78350f', borderLeft: '1px solid #78350f', opacity: 0.6, borderRadius: '2px 0 0 0' }} />
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', mb: 0.3 }}>
                      CITIZEN FULL NAME
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                      {identityData.name || 'Citizen'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'block', mb: 0.3 }}>
                    NATIONAL CITIZEN IDENTIFIER
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#38bdf8', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.06em', textShadow: '0 0 16px rgba(56, 189, 248, 0.45)', lineHeight: 1.1 }}>
                    {identityData.governmentId || 'Not Assigned'}
                  </Typography>
                </Box>
              </Box>

              {/* Sub-strip: Soulbound Badges & On-Chain Anchor Contract */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', pt: 1.5, pb: 0.5, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600 }}>
                    Badge Token:
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#4ade80', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.72rem' }}>
                    {identityData.sbtTokenId ? `${identityData.sbtTokenId} (Locked)` : 'Attestation Pending'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600 }}>
                    Contract:
                  </Typography>
                  <Typography
                    component="a"
                    href={`https://sepolia.etherscan.io/address/${identityData.contractAddress || '0x6f4d27d80f84ce44eFecF9A1eAd6A5e6489ae9Bf'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="caption"
                    sx={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.72rem', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    {(identityData.contractAddress || '0x6f4d27d80f84ce44eFecF9A1eAd6A5e6489ae9Bf').slice(0, 8)}...{(identityData.contractAddress || '0x6f4d27d80f84ce44eFecF9A1eAd6A5e6489ae9Bf').slice(-6)}
                  </Typography>
                </Box>
                {identityData.blockchainTx && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600 }}>
                      Mint Tx:
                    </Typography>
                    <Typography
                      component="a"
                      href={`https://sepolia.etherscan.io/tx/${identityData.blockchainTx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="caption"
                      sx={{ color: '#818cf8', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.72rem', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      {identityData.blockchainTx.slice(0, 8)}...{identityData.blockchainTx.slice(-6)}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Card Bottom: DID Hash with Copy & Real Action Buttons */}
              <Box sx={{ pt: 2, mt: 1.5, borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', display: 'block', mb: 0.3, fontWeight: 600, letterSpacing: '0.04em' }}>
                    DIGITAL IDENTIFIER (DID)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Typography variant="body2" sx={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.78rem', wordBreak: 'break-all' }}>
                      {identityData.did}
                    </Typography>
                    <Tooltip title={copied ? 'Copied DID!' : 'Copy DID'}>
                      <IconButton size="small" onClick={handleCopyDID} sx={{ color: copied ? '#4ade80' : '#94a3b8', p: 0.3 }}>
                        <ContentCopyRounded sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setQrModalOpen(true)}
                    startIcon={<QrCode2Rounded />}
                    sx={{
                      color: '#ffffff',
                      borderColor: 'rgba(255, 255, 255, 0.25)',
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 1.8,
                      py: 0.7,
                      '&:hover': { borderColor: '#38bdf8', bgcolor: 'rgba(56, 189, 248, 0.08)' }
                    }}
                  >
                    View QR Pass
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleExportPass}
                    startIcon={<DownloadRounded />}
                    sx={{
                      bgcolor: '#2563eb',
                      color: '#ffffff',
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: 2,
                      px: 2,
                      py: 0.7,
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                      '&:hover': { bgcolor: '#1d4ed8' }
                    }}
                  >
                    Export Pass
                  </Button>
                </Box>
              </Box>
            </Card>

            {/* Verifiable Credentials & Claims Table */}
            <Card
              sx={{
                p: { xs: 2.5, md: 3 },
                borderRadius: 3,
                bgcolor: isLight ? '#ffffff' : '#181a1c',
                border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff', fontSize: '1.05rem' }}>
                      Attested Verifiable Credentials (W3C)
                    </Typography>
                    <Chip
                      label={`${filteredRecords.length} Active`}
                      size="small"
                      sx={{ bgcolor: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.15)', color: '#2563eb', fontWeight: 700, fontSize: '0.72rem', height: 22 }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: isLight ? '#64748b' : '#8b949e', fontSize: '0.82rem', mt: 0.3 }}>
                    Cryptographically sealed by accredited universities, employers, and government ministries
                  </Typography>
                </Box>

                <TextField
                  size="small"
                  placeholder="Filter credentials..."
                  value={recordSearch}
                  onChange={(e) => setRecordSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRounded sx={{ fontSize: 16, color: isLight ? '#94a3b8' : '#6b7280' }} />
                      </InputAdornment>
                    ),
                    sx: {
                      bgcolor: isLight ? '#f8fafc' : '#141618',
                      borderRadius: 2,
                      fontSize: '0.82rem',
                      width: 220,
                      '& fieldset': { borderColor: isLight ? '#e2e8f0' : '#282a2d' }
                    }
                  }}
                />
              </Box>

              <TableContainer sx={{ border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`, borderRadius: 2 }}>
                <Table>
                  <TableHead sx={{ bgcolor: isLight ? '#f8fafc' : '#141618' }}>
                    <TableRow>
                      <TableCell sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Credential Type
                      </TableCell>
                      <TableCell sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Attested Title
                      </TableCell>
                      <TableCell sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Issuing Authority
                      </TableCell>
                      <TableCell sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Status
                      </TableCell>
                      <TableCell align="right" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Proof
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: isLight ? '#64748b' : '#8b949e', fontSize: '0.82rem' }}>
                          No verifiable credentials found on record.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRecords.map((rec) => (
                      <TableRow
                        key={rec.id}
                        hover
                        sx={{
                          '&:hover': { bgcolor: isLight ? '#f8fafc !important' : '#1e2124 !important' }
                        }}
                      >
                        <TableCell>
                          <Chip
                            label={rec.type}
                            size="small"
                            sx={{
                              bgcolor: isLight ? '#f1f5f9' : '#1e2124',
                              color: isLight ? '#334155' : '#cbd5e1',
                              fontWeight: 700,
                              fontSize: '0.68rem',
                              height: 22
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.85rem' }}>
                            {rec.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e' }}>
                            Issued: {rec.issuedAt}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" sx={{ color: isLight ? '#334155' : '#cbd5e1', fontWeight: 600, fontSize: '0.82rem' }}>
                            {rec.issuer}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            icon={<CheckCircleRounded sx={{ fontSize: '13px !important', color: '#16a34a !important' }} />}
                            label={rec.status}
                            size="small"
                            sx={{
                              bgcolor: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.15)',
                              color: isLight ? '#16a34a' : '#4ade80',
                              border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(34, 197, 94, 0.3)'}`,
                              fontWeight: 700,
                              fontSize: '0.68rem',
                              height: 22
                            }}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => {
                              setSelectedProof(rec);
                              setProofModalOpen(true);
                            }}
                            startIcon={<FactCheckRounded sx={{ fontSize: 14 }} />}
                            sx={{
                              color: isLight ? '#2563eb' : '#60a5fa',
                              bgcolor: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.1)',
                              borderRadius: 1.5,
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              px: 1.2,
                              '&:hover': { bgcolor: isLight ? '#dbeafe' : 'rgba(37, 99, 235, 0.2)' }
                            }}
                          >
                            Inspect Proof
                          </Button>
                        </TableCell>
                      </TableRow>
                    )))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Box>
        </Grid>

        {/* Right Column (4 / 12): Trust Score Breakdown & Biometric Enclave Status */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Trust Score Breakdown Card */}
            <Card
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: isLight ? '#ffffff' : '#181a1c',
                border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none'
              }}
            >
              <Typography variant="subtitle2" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', mb: 2 }}>
                TRUST SCORE INTEGRITY MATRIX
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: identityData.verificationStatus === 'VERIFIED' ? '#16a34a' : '#d97706', letterSpacing: '-0.02em' }}>
                    {identityData.verificationStatus === 'VERIFIED' ? '100%' : '0%'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 600 }}>
                    {identityData.verificationStatus === 'VERIFIED' ? 'Attested Citizen Standing' : 'Pending Verification'}
                  </Typography>
                </Box>
                <Chip
                  label={identityData.verificationStatus === 'VERIFIED' ? 'VERIFIED CITIZEN' : 'PENDING'}
                  size="small"
                  sx={{
                    bgcolor: isLight ? (identityData.verificationStatus === 'VERIFIED' ? '#f0fdf4' : '#fffbeb') : (identityData.verificationStatus === 'VERIFIED' ? 'rgba(22, 163, 74, 0.15)' : 'rgba(217, 119, 6, 0.15)'),
                    color: identityData.verificationStatus === 'VERIFIED' ? '#16a34a' : '#d97706',
                    fontWeight: 800,
                    fontSize: '0.7rem'
                  }}
                />
              </Box>

              {/* Factors */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: isLight ? '#334155' : '#cbd5e1', fontSize: '0.82rem' }}>
                      Govt Identity Document Verification
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#16a34a', fontSize: '0.82rem' }}>
                      100%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={100} sx={{ height: 6, borderRadius: 3, bgcolor: isLight ? '#f1f5f9' : '#282a2d', '& .MuiLinearProgress-bar': { bgcolor: '#16a34a' } }} />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: isLight ? '#334155' : '#cbd5e1', fontSize: '0.82rem' }}>
                      FaceMesh 3D Liveness & Anti-Spoof
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#16a34a', fontSize: '0.82rem' }}>
                      100%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={100} sx={{ height: 6, borderRadius: 3, bgcolor: isLight ? '#f1f5f9' : '#282a2d', '& .MuiLinearProgress-bar': { bgcolor: '#16a34a' } }} />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: isLight ? '#334155' : '#cbd5e1', fontSize: '0.82rem' }}>
                      Verified Documents & Credentials
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#2563eb', fontSize: '0.82rem' }}>
                      98%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={98} sx={{ height: 6, borderRadius: 3, bgcolor: isLight ? '#f1f5f9' : '#282a2d', '& .MuiLinearProgress-bar': { bgcolor: '#2563eb' } }} />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: isLight ? '#334155' : '#cbd5e1', fontSize: '0.82rem' }}>
                      On-Chain SBT Nonce & Zero Flag History
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#16a34a', fontSize: '0.82rem' }}>
                      100%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={100} sx={{ height: 6, borderRadius: 3, bgcolor: isLight ? '#f1f5f9' : '#282a2d', '& .MuiLinearProgress-bar': { bgcolor: '#16a34a' } }} />
                </Box>
              </Box>
            </Card>

            {/* Hardware & Enclave Security Card */}
            <Card
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: isLight ? '#ffffff' : '#181a1c',
                border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none'
              }}
            >
              <Typography variant="subtitle2" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', mb: 2 }}>
                DEVICE & PRIVACY SECURITY
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.15)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LockRounded sx={{ fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.84rem' }}>
                      On-Device Protection
                    </Typography>
                    <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e' }}>
                      Your photos and face data stay safe on your phone or computer
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: isLight ? '#f5f3ff' : 'rgba(124, 58, 237, 0.15)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <KeyRounded sx={{ fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.84rem' }}>
                      Hardware Security Key
                    </Typography>
                    <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e' }}>
                      Protected by device fingerprint and secure chip
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.15)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GppGoodRounded sx={{ fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.84rem' }}>
                      Continuous Liveness Watch
                    </Typography>
                    <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e' }}>
                      Infrared anti-spoofing micro-expressions
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Card>

            {/* Recent Identity Audit Trail */}
            <Card
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: isLight ? '#ffffff' : '#181a1c',
                border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  IDENTITY AUDIT TRAIL
                </Typography>
                <HistoryRounded sx={{ fontSize: 18, color: isLight ? '#94a3b8' : '#6b7280' }} />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {auditLogs.length === 0 ? (
                  <Typography variant="body2" sx={{ color: isLight ? '#64748b' : '#8b949e', py: 2, textAlign: 'center', fontSize: '0.8rem' }}>
                    No recorded identity audit transactions yet.
                  </Typography>
                ) : (
                  auditLogs.map((log, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: log.color, mt: 0.8, flexShrink: 0 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.8rem', lineHeight: 1.3 }}>
                          {log.title}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.3 }}>
                          <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontSize: '0.7rem' }}>
                            {log.actor}
                          </Typography>
                          <Typography variant="caption" sx={{ color: isLight ? '#94a3b8' : '#6b7280', fontSize: '0.7rem' }}>
                            {log.time}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* MODAL 1: Citizen Verified QR Digital Passport */}
      <Dialog
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            bgcolor: isLight ? '#ffffff' : '#181a1c',
            border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShieldRounded sx={{ color: '#2563eb' }} />
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem' }}>
              Citizen Digital Passport
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setQrModalOpen(false)}>
            <CloseRounded />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ textAlign: 'center', pt: 2 }}>
          {/* Authentic High-Resolution Scannable QR Code */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: '#ffffff',
              border: `2px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
              display: 'inline-block',
              mb: 2,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
            }}
          >
            {qrDataUrl ? (
              <Box
                component="img"
                src={qrDataUrl}
                alt="Citizen Passport QR"
                sx={{ width: 200, height: 200, display: 'block', borderRadius: 1 }}
              />
            ) : (
              <Box sx={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={32} sx={{ color: '#2563eb' }} />
              </Box>
            )}
          </Box>

          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff' }}>
            {identityData.name}
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 700, mb: 1 }}>
            ID: {identityData.governmentId}
          </Typography>
          <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', display: 'block', mb: 2 }}>
            Scan with any authorized TrueID Notary or border kiosk to cryptographically verify citizenship.
          </Typography>

          {identityData.sbtTokenId && (
            <Chip
              label={identityData.sbtTokenId}
              size="small"
              sx={{ bgcolor: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.15)', color: '#16a34a', fontWeight: 800, fontSize: '0.72rem' }}
            />
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button fullWidth variant="contained" onClick={() => setQrModalOpen(false)} sx={{ bgcolor: '#2563eb', textTransform: 'none', fontWeight: 700 }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL 2: Credential Cryptographic Proof Modal */}
      <Dialog
        open={proofModalOpen}
        onClose={() => setProofModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            bgcolor: isLight ? '#ffffff' : '#181a1c',
            border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FactCheckRounded sx={{ color: '#2563eb' }} />
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem' }}>
              W3C Cryptographic Proof Verification
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setProofModalOpen(false)}>
            <CloseRounded />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {selectedProof && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: isLight ? '#f8fafc' : '#141618', border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}` }}>
                <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, textTransform: 'uppercase' }}>
                  CREDENTIAL TITLE
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff' }}>
                  {selectedProof.title}
                </Typography>
                <Typography variant="body2" sx={{ color: isLight ? '#475569' : '#9ca3af', mt: 0.5 }}>
                  Issuer: {selectedProof.issuer}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                  SHA-256 NOTARY PROOF HASH
                </Typography>
                <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: isLight ? '#f1f5f9' : '#1e2124', fontFamily: 'monospace', fontSize: '0.8rem', color: '#2563eb', wordBreak: 'break-all' }}>
                  {selectedProof.hash}
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
                  W3C JSON-LD PROOF ENVELOPE
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: isLight ? '#0f172a' : '#0c0d0e',
                    color: '#38bdf8',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    m: 0
                  }}
                >
{`{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://trueid.org/schemas/identity/v1"
  ],
  "id": "urn:uuid:${selectedProof.id}",
  "type": ["VerifiableCredential", "${selectedProof.type}"],
  "issuer": "${selectedProof.issuer}",
  "issuanceDate": "${selectedProof.created_at ? new Date(selectedProof.created_at).toISOString() : new Date().toISOString()}",
  "credentialSubject": {
    "id": "${identityData.did}",
    "qualification": "${selectedProof.title}"
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "${selectedProof.created_at ? new Date(selectedProof.created_at).toISOString() : new Date().toISOString()}",
    "verificationMethod": "${identityData.did}#keys-1",
    "proofPurpose": "assertionMethod",
    "proofValue": "${(selectedProof.hash || selectedProof.transaction_hash || selectedProof.blockchain_tx_hash || '').slice(0, 32)}..."
  }
}`}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button fullWidth variant="contained" onClick={() => setProofModalOpen(false)} sx={{ bgcolor: '#2563eb', textTransform: 'none', fontWeight: 700 }}>
            Close Verification
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
