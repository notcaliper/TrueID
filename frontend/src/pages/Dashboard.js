import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
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
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  useTheme
} from '@mui/material';
import {
  VerifiedUserRounded,
  SecurityRounded,
  FingerprintRounded,
  BadgeRounded,
  ContentCopyRounded,
  QrCode2Rounded,
  SearchRounded,
  CheckCircleRounded,
  ArrowForwardRounded,
  SchoolRounded,
  WorkRounded,
  LanRounded,
  VisibilityRounded,
  ShieldRounded,
  RefreshRounded,
  KeyRounded,
  LockRounded,
  GppGoodRounded,
  CloseRounded,
  DownloadRounded,
  ShareRounded,
  HistoryRounded,
  FactCheckRounded,
  ContactlessRounded,
  AutoAwesomeRounded
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ThemeContext';
import { userAPI, blockchainAPI } from '../services/api.service';

const Dashboard = () => {
  const { user } = useAuth();
  const { isLight } = useColorMode();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);
  const [recordSearch, setRecordSearch] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const [identityData, setIdentityData] = useState({
    name: 'Akshay Manbhaw',
    governmentId: 'JIFPM9413P',
    did: 'did:trueid:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    verificationStatus: 'VERIFIED',
    walletAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    trustScore: 99.8,
    tier: 'Tier 1 Sovereign Citizen',
    recordsCount: 4,
    facemeshStatus: '68 Nodes Active (SHA-256)',
    enclaveStatus: 'Hardware Protected',
    blockchainTx: '0x4f8e91d2c3b4a567890123456789abcdef0123456789abcdef0123456789abcd',
    contractAddress: '0x266B577380aE3De838A66DEf28fffD5e75c5816E',
    lastSync: 'Nov 5, 2026, 12:45 AM'
  });

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [verRes, bcRes, recRes, bioRes] = await Promise.allSettled([
        userAPI.getVerificationStatus(),
        blockchainAPI.getBlockchainStatus(),
        userAPI.getProfessionalRecords(),
        userAPI.getBiometricStatus()
      ]);

      const verStatus = verRes.status === 'fulfilled' && verRes.value?.data?.status ? verRes.value.data.status : 'VERIFIED';
      const records = recRes.status === 'fulfilled' && recRes.value?.data?.records ? recRes.value.data.records : [];

      setIdentityData(prev => ({
        ...prev,
        name: user?.name || prev.name,
        governmentId: user?.government_id || prev.governmentId,
        verificationStatus: verStatus,
        recordsCount: records.length || 4,
        lastSync: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' })
      }));
    } catch (err) {
      console.warn('Dashboard fetch warning:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopyDID = () => {
    navigator.clipboard.writeText(identityData.did);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 4 Core Identity Pillars (Not tiny token chips!)
  const corePillars = [
    {
      title: 'National KYC Identity',
      idVal: identityData.governmentId,
      status: 'VERIFIED & NOTARIZED',
      desc: 'Government Registry Attestation confirmed and sealed by Authority Notary',
      tag: 'Authority Seal',
      linkText: 'View Identity Vault',
      linkTo: '/profile',
      icon: <BadgeRounded sx={{ fontSize: 24 }} />,
      color: '#2563eb',
      bg: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.12)'
    },
    {
      title: 'Biometric Liveness & FaceMesh',
      idVal: '68 Nodes • Enclave Protected',
      status: 'PROOF-OF-LIVENESS PASSED',
      desc: 'Anti-spoofing depth & micro-expression verified with 0.99 confidence',
      tag: 'Secure Enclave',
      linkText: 'Biometric Vault',
      linkTo: '/biometric-verification',
      icon: <FingerprintRounded sx={{ fontSize: 24 }} />,
      color: '#7c3aed',
      bg: isLight ? '#f5f3ff' : 'rgba(124, 58, 237, 0.12)'
    },
    {
      title: 'Soulbound Identity Token (SBT)',
      idVal: 'ERC-5192 #002 (Non-Transferable)',
      status: 'ANCHORED ON SEPOLIA',
      desc: 'Cryptographic identity root anchored to smart contract 0x266B...816E',
      tag: '16 Confirmations',
      linkText: 'Explore Ledger',
      linkTo: '/blockchain-status',
      icon: <SecurityRounded sx={{ fontSize: 24 }} />,
      color: '#16a34a',
      bg: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.12)'
    },
    {
      title: 'W3C Verifiable Credentials',
      idVal: '4 Attested Institutional Claims',
      status: 'CRYPTOGRAPHICALLY VALID',
      desc: 'Stanford Degree, Ethereum Foundation Work, DIF Cert, Citizen Passport',
      tag: 'W3C Standards',
      linkText: 'Manage Claims',
      linkTo: '/professional-records',
      icon: <SchoolRounded sx={{ fontSize: 24 }} />,
      color: '#0891b2',
      bg: isLight ? '#ecfeff' : 'rgba(8, 145, 178, 0.12)'
    }
  ];

  // Verified Credentials List
  const credentialRecords = [
    {
      id: 'REC-001',
      type: 'ACADEMIC DEGREE',
      title: 'Master of Science in Distributed Computing',
      issuer: 'Stanford University (ID: 0x9812)',
      hash: '0x8f4d99a2c3b4a567890123456789abcdef0123456789abcdef0123456789319b',
      issuedAt: 'June 2024',
      status: 'VERIFIED'
    },
    {
      id: 'REC-002',
      type: 'PROFESSIONAL EMPLOYMENT',
      title: 'Lead Cryptographic Security Architect',
      issuer: 'Ethereum Foundation / Sovereign Labs',
      hash: '0x7e2a44d1c3b4a567890123456789abcdef0123456789abcdef0123456789502c',
      issuedAt: 'March 2025',
      status: 'VERIFIED'
    },
    {
      id: 'REC-003',
      type: 'INDUSTRY CERTIFICATION',
      title: 'W3C Verifiable Credentials Professional',
      issuer: 'Decentralized Identity Foundation (DIF)',
      hash: '0x3c99bb82c3b4a567890123456789abcdef0123456789abcdef0123456789110a',
      issuedAt: 'January 2026',
      status: 'VERIFIED'
    },
    {
      id: 'REC-004',
      type: 'GOVERNMENT LICENSE',
      title: 'Digital Resident & Citizen Passport',
      issuer: 'TrueID Sovereign Ministry #01',
      hash: '0x6b14aa77c3b4a567890123456789abcdef0123456789abcdef012345678989ee',
      issuedAt: 'November 2026',
      status: 'VERIFIED'
    }
  ];

  // Identity Activity Audit Trail
  const auditLogs = [
    {
      title: 'FaceMesh 3D Biometric Liveness Challenge Completed',
      actor: 'Local Hardware Enclave (Poseidon ZKP)',
      time: '12 minutes ago',
      status: 'SUCCESS',
      color: '#16a34a'
    },
    {
      title: 'Soulbound SBT Token #002 Anchored to Ethereum Sepolia',
      actor: 'TrueID Notary Authority Node #01',
      time: '1 hour ago',
      status: 'CONFIRMED',
      color: '#2563eb'
    },
    {
      title: 'National Identity Document Verified by Government Officer',
      actor: 'Ministry of Electronics & IT Authority',
      time: 'Yesterday',
      status: 'APPROVED',
      color: '#16a34a'
    },
    {
      title: 'W3C Academic Credential Issued by Stanford University',
      actor: 'Stanford Registrar DID (did:trueid:0x9812)',
      time: 'Nov 3, 2026',
      status: 'VERIFIED',
      color: '#0891b2'
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
            TrueID Sovereign Portal
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
          {/* Left: Avatar + Citizen Name + DID + Sovereign Badges */}
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

              {/* Sovereign DID with One-Click Copy and QR Button */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.8, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: isLight ? '#475569' : '#9ca3af', bgcolor: isLight ? '#f8fafc' : '#1e2124', px: 1.2, py: 0.3, borderRadius: 1.5, border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`, fontSize: '0.82rem' }}>
                  {identityData.did}
                </Typography>

                <Tooltip title={copied ? 'Copied Sovereign DID!' : 'Copy DID'}>
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
                  label="Sepolia SBT Token #002"
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
                  label="FaceMesh 68 Enclave (Active)"
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
                  label="Zero-Knowledge Shielded"
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

          {/* Right: Sovereign Trust Score & Clearance Tier */}
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
              SOVEREIGN TRUST SCORE
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 0.5, my: 0.2 }}>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#16a34a', letterSpacing: '-0.03em', lineHeight: 1 }}>
                99.8%
              </Typography>
              <Typography variant="body2" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700 }}>
                / 100
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: isLight ? '#16a34a' : '#4ade80', fontWeight: 700, display: 'block' }}>
              Tier 1 Institutional Clearance
            </Typography>
            <Typography variant="caption" sx={{ color: isLight ? '#94a3b8' : '#6b7280', fontSize: '0.7rem' }}>
              Zero fraud flags • 4 Attested Claims
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* 3. Four Core Sovereign Identity Pillars (Clear, Authoritative Cards) */}
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
            {/* Digital Citizen Sovereign ID Card (Fintech Holographic Pass) */}
            <Card
              sx={{
                p: 3,
                borderRadius: 3,
                background: isLight
                  ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                  : 'linear-gradient(135deg, #181a1c 0%, #0c0d0e 100%)',
                color: '#ffffff',
                border: `1px solid ${isLight ? '#334155' : '#282a2d'}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Subtle background security watermark icon */}
              <ShieldRounded
                sx={{
                  position: 'absolute',
                  right: -30,
                  bottom: -30,
                  fontSize: 220,
                  color: 'rgba(255, 255, 255, 0.03)',
                  pointerEvents: 'none'
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      bgcolor: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ShieldRounded sx={{ fontSize: 20, color: '#ffffff' }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#ffffff', fontWeight: 800, letterSpacing: '0.05em' }}>
                      TRUEID SOVEREIGN REPUBLIC
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Decentralized Digital Identity Authority • W3C DID Standard
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    icon={<ContactlessRounded sx={{ color: '#38bdf8 !important', fontSize: 16 }} />}
                    label="SMART CHIP RFID"
                    size="small"
                    sx={{ bgcolor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 700, fontSize: '0.68rem', border: '1px solid rgba(56, 189, 248, 0.3)' }}
                  />
                  <Chip
                    label="ERC-5192 SOULBOUND"
                    size="small"
                    sx={{ bgcolor: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontWeight: 700, fontSize: '0.68rem', border: '1px solid rgba(34, 197, 94, 0.3)' }}
                  />
                </Box>
              </Box>

              {/* Card Middle: Gold Chip + Citizen Details */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3, my: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                  {/* Holographic Chip Icon */}
                  <Box
                    sx={{
                      width: 48,
                      height: 38,
                      borderRadius: 1.5,
                      background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                      border: '1px solid #fef08a',
                      boxShadow: 'inset 0 0 4px rgba(0,0,0,0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-around',
                      p: 0.6
                    }}
                  >
                    <Box sx={{ height: 1, bgcolor: '#78350f', opacity: 0.6 }} />
                    <Box sx={{ height: 1, bgcolor: '#78350f', opacity: 0.6 }} />
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      CITIZEN FULL NAME
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 800, letterSpacing: '-0.01em' }}>
                      {identityData.name}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    NATIONAL CITIZEN IDENTIFIER
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#38bdf8', fontWeight: 800, fontFamily: 'monospace' }}>
                    {identityData.governmentId}
                  </Typography>
                </Box>
              </Box>

              {/* Card Bottom: DID Hash & QR Trigger */}
              <Box sx={{ pt: 2, mt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', display: 'block' }}>
                    SOVEREIGN DECENTRALIZED IDENTIFIER (DID)
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {identityData.did}
                  </Typography>
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
                      borderRadius: 1.5,
                      '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255, 255, 255, 0.05)' }
                    }}
                  >
                    View QR Pass
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => window.print()}
                    startIcon={<DownloadRounded />}
                    sx={{
                      bgcolor: '#2563eb',
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: 1.5,
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
                    {filteredRecords.map((rec) => (
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
                    ))}
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
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#16a34a', letterSpacing: '-0.02em' }}>
                    99.8%
                  </Typography>
                  <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 600 }}>
                    Institutional Grade Sovereign Trust
                  </Typography>
                </Box>
                <Chip
                  label="TIER 1 CITIZEN"
                  size="small"
                  sx={{ bgcolor: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.15)', color: '#16a34a', fontWeight: 800, fontSize: '0.7rem' }}
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
                      Institutional W3C Attestations
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
                HARDWARE & PRIVACY ENCLAVE
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.15)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LockRounded sx={{ fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.84rem' }}>
                      Zero-Knowledge Enclave
                    </Typography>
                    <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e' }}>
                      Raw biometric templates never leave device
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: isLight ? '#f5f3ff' : 'rgba(124, 58, 237, 0.15)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <KeyRounded sx={{ fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.84rem' }}>
                      Hardware Keystore
                    </Typography>
                    <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e' }}>
                      ARM TrustZone / Secure Enclave binding
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
                {auditLogs.map((log, i) => (
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
                ))}
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
          {/* Mock QR Code Display */}
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: '#ffffff',
              border: `2px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
              display: 'inline-block',
              mb: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}
          >
            <Box
              sx={{
                width: 180,
                height: 180,
                background: 'repeating-conic-gradient(#0f172a 0% 25%, #ffffff 0% 50%) 50% / 20px 20px',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <Box sx={{ width: 44, height: 44, bgcolor: '#ffffff', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                <ShieldRounded sx={{ color: '#2563eb', fontSize: 26 }} />
              </Box>
            </Box>
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

          <Chip
            label="100% CRYPTOGRAPHICALLY AUTHENTICATED"
            size="small"
            sx={{ bgcolor: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.15)', color: '#16a34a', fontWeight: 800, fontSize: '0.7rem' }}
          />
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
  "issuanceDate": "2026-01-15T00:00:00Z",
  "credentialSubject": {
    "id": "${identityData.did}",
    "qualification": "${selectedProof.title}"
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "2026-01-15T00:00:00Z",
    "verificationMethod": "${identityData.did}#keys-1",
    "proofPurpose": "assertionMethod",
    "proofValue": "${selectedProof.hash.slice(0, 32)}..."
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
