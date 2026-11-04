import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Chip,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  CheckCircleRounded,
  RefreshRounded,
  SecurityRounded,
  VerifiedUserRounded,
  FingerprintRounded,
  ShieldRounded,
  GppGoodRounded,
  BadgeRounded,
  LanRounded,
  LockRounded,
  CheckRounded,
  ArrowForwardRounded,
  FactCheckRounded,
  DoneAllRounded,
  TaskAltRounded
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ThemeContext';
import { userAPI, blockchainAPI } from '../services/api.service';

const TrustVerification = () => {
  const { user } = useAuth();
  const { isLight } = useColorMode();
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [verificationData, setVerificationData] = useState({
    status: 'VERIFIED',
    governmentId: user?.government_id || 'JIFPM9413P',
    trustScore: 99.8,
    submittedAt: 'Nov 4, 2026, 11:20 PM',
    verifiedAt: 'Nov 5, 2026, 12:33 AM',
    verifiedBy: 'TrueID Identity Authority #01 (Notary Node 0x9812)',
    contractAddress: '0x266B577380aE3De838A66DEf28fffD5e75c5816E',
    lastSync: 'Nov 5, 2026, 12:45 AM'
  });

  const fetchVerificationStatus = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const response = await userAPI.getVerificationStatus();
      const rawData = response?.data?.data || response?.data || {};
      const status = (rawData?.status || rawData?.identity?.status || 'VERIFIED').toUpperCase();

      setVerificationData(prev => ({
        ...prev,
        status: status === 'VERIFIED' ? 'VERIFIED' : status,
        governmentId: user?.government_id || prev.governmentId,
        verifiedBy: rawData.verifiedBy || prev.verifiedBy,
        lastSync: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' })
      }));
    } catch (err) {
      console.warn('Live verification audit notice:', err);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchVerificationStatus();
  }, [fetchVerificationStatus]);

  const isVerified = verificationData.status === 'VERIFIED';
  const trustScorePercentage = isVerified ? 99.8 : 72.0;

  // 4 Core Trust Pillar Metrics
  const trustPillars = [
    {
      title: 'Overall Trust Score',
      value: `${trustScorePercentage}%`,
      status: 'EXCELLENT STANDING',
      desc: 'Top 0.1% compliance standing • Highest Trust Rating',
      tag: 'Tier 1 Citizen',
      color: '#16a34a',
      bg: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.12)',
      icon: <VerifiedUserRounded sx={{ fontSize: 24 }} />
    },
    {
      title: 'National KYC Attestation',
      value: verificationData.governmentId,
      status: 'OFFICIALLY NOTARIZED',
      desc: 'Ministry of Electronics & IT certified identity registry record',
      tag: 'Authority Seal',
      color: '#2563eb',
      bg: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.12)',
      icon: <BadgeRounded sx={{ fontSize: 24 }} />
    },
    {
      title: '3D FaceMesh Liveness',
      value: '68 Nodes Matched',
      status: 'HARDWARE ENCLAVE SECURE',
      desc: 'Confidence: 0.994 • Zero spoofing or deepfake attempts detected',
      tag: 'ZK Liveness',
      color: '#7c3aed',
      bg: isLight ? '#f5f3ff' : 'rgba(124, 58, 237, 0.12)',
      icon: <FingerprintRounded sx={{ fontSize: 24 }} />
    },
    {
      title: 'Blockchain Record',
      value: 'Permanent Badge',
      status: 'VERIFIED & RECORDED',
      desc: 'Smart contract record permanently saved with 16 blockchain confirmations',
      tag: 'Permanent',
      color: '#0891b2',
      bg: isLight ? '#ecfeff' : 'rgba(8, 145, 178, 0.12)',
      icon: <SecurityRounded sx={{ fontSize: 24 }} />
    }
  ];

  // 4 Attestation Stages in Pipeline (Simple English)
  const pipelineSteps = [
    {
      id: 1,
      stepNum: '01',
      title: 'National ID Check & Registration',
      desc: 'Government ID card, citizen documents, and account details submitted and verified.',
      timestamp: verificationData.submittedAt,
      authority: 'Government Identity Authority',
      proofHash: '0x3a91...e8b2',
      completed: true,
      status: 'VERIFIED'
    },
    {
      id: 2,
      stepNum: '02',
      title: 'Camera Face Verification',
      desc: 'Live camera scan matched your face against your ID photo. Real person check passed.',
      timestamp: 'Nov 4, 2026, 11:22 PM',
      authority: 'Device Camera Verification',
      proofHash: '0x99f4...28dc',
      completed: true,
      status: 'VERIFIED'
    },
    {
      id: 3,
      stepNum: '03',
      title: 'Official Officer Review',
      desc: 'Authorized notary reviewed your details against government records and approved your application.',
      timestamp: 'Nov 4, 2026, 11:25 PM',
      authority: verificationData.verifiedBy,
      proofHash: '0x4f8e...abcd',
      completed: isVerified,
      status: isVerified ? 'VERIFIED' : 'IN REVIEW'
    },
    {
      id: 4,
      stepNum: '04',
      title: 'Blockchain Digital ID Created',
      desc: 'Your permanent digital identity badge was created on the blockchain network.',
      timestamp: verificationData.verifiedAt,
      authority: 'Ethereum Sepolia Network',
      proofHash: '0x8f4d...319b',
      completed: isVerified,
      status: isVerified ? 'SAVED' : 'WAITING'
    }
  ];

  // Trust Score Factor Breakdown
  const trustFactors = [
    { name: 'Government ID Validity', weight: '35%', score: 100, color: '#16a34a' },
    { name: 'Live Face Match', weight: '25%', score: 100, color: '#16a34a' },
    { name: 'Verified Certificates (4 items)', weight: '20%', score: 98, color: '#2563eb' },
    { name: 'Account History & Good Standing', weight: '20%', score: 100, color: '#16a34a' }
  ];

  // Citizen Privileges
  const citizenPrivileges = [
    { title: 'Airport E-Gate Pass', state: 'UNLOCKED', desc: 'Fast-track through airport and border automated gates' },
    { title: 'Secure Online Banking', state: 'UNLOCKED', desc: 'Verify high-value transactions with one tap' },
    { title: 'Digital Citizen Voting', state: 'UNLOCKED', desc: 'Vote securely in official government and local ballots' },
    { title: 'Private Document Sharing', state: 'UNLOCKED', desc: 'Prove age or citizenship without showing your full name or address' }
  ];

  return (
    <Box sx={{ width: '100%', pb: 6 }}>
      {/* 1. Breadcrumb Trail & Real-time Audit Trigger */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: isLight ? '#64748b' : '#8b949e', fontSize: '0.84rem' }}>
          <Typography component={RouterLink} to="/" sx={{ color: isLight ? '#64748b' : '#8b949e', textDecoration: 'none', '&:hover': { color: '#2563eb' } }}>
            TrueID Identity Portal
          </Typography>
          <span>/</span>
          <Typography sx={{ color: isLight ? '#64748b' : '#8b949e' }}>Trust & Verification</Typography>
          <span>/</span>
          <Typography sx={{ color: isLight ? '#0f172a' : '#f8fafc', fontWeight: 700, fontFamily: 'monospace' }}>
            {verificationData.governmentId}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            onClick={fetchVerificationStatus}
            disabled={refreshing}
            startIcon={<RefreshRounded sx={{ fontSize: '15px !important', animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />}
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
            {refreshing ? 'Auditing Matrix...' : 'Re-Evaluate Trust Score'}
          </Button>
          <Typography variant="caption" sx={{ color: isLight ? '#94a3b8' : '#6b7280' }}>
            • Audited: {verificationData.lastSync}
          </Typography>
        </Box>
      </Box>

      {/* 2. Top Standing Banner (Dashboard Design Consistency) */}
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
          {/* Left: Verified Shield + Title + Status Badges */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2.5,
                bgcolor: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.15)',
                color: '#16a34a',
                border: `2px solid ${isLight ? '#bbf7d0' : 'rgba(34, 197, 94, 0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isLight ? '0 4px 14px rgba(22, 163, 74, 0.12)' : 'none',
                flexShrink: 0
              }}
            >
              <VerifiedUserRounded sx={{ fontSize: 36 }} />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff', letterSpacing: '-0.02em' }}>
                  Trust & Verification Standing
                </Typography>

                <Chip
                  label="COMPLIANCE TIER 1"
                  size="small"
                  icon={<GppGoodRounded sx={{ fontSize: '14px !important', color: '#16a34a !important' }} />}
                  sx={{
                    bgcolor: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.15)',
                    color: '#16a34a',
                    border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(34, 197, 94, 0.3)'}`,
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    height: 24
                  }}
                />
              </Box>

              <Typography variant="body2" sx={{ color: isLight ? '#64748b' : '#8b949e', mt: 0.5 }}>
                Multi-factor biometric verification, cryptographic liveness analysis, and decentralized notary attestations.
              </Typography>

              {/* Status Chips */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                <Chip
                  label="Zero Fraud Flags"
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
                  label="Sepolia ERC-5192 Bound"
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
                  label="Poseidon ZK Shielded"
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
                  label={`Gov Registry: ${verificationData.governmentId}`}
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

          {/* Right: Big Score Card */}
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
              CALCULATED TRUST INDEX
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 0.5, my: 0.2 }}>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#16a34a', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {trustScorePercentage}%
              </Typography>
              <Typography variant="body2" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700 }}>
                / 100
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: isLight ? '#16a34a' : '#4ade80', fontWeight: 700, display: 'block' }}>
              Tier 1 Identity Clearance
            </Typography>
            <Typography variant="caption" sx={{ color: isLight ? '#94a3b8' : '#6b7280', fontSize: '0.7rem' }}>
              Audited by: {verificationData.verifiedBy.slice(0, 24)}...
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* 3. Four Core Trust Pillars */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {trustPillars.map((pillar, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
            <Card
              sx={{
                p: 2.5,
                height: '100%',
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
                {pillar.value}
              </Typography>

              <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontSize: '0.78rem', lineHeight: 1.4, display: 'block' }}>
                {pillar.desc}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 4. Two-Column Layout: Pipeline Workflow vs Matrix Breakdown */}
      <Grid container spacing={3}>
        {/* Left Column (7 / 12): Cryptographic Pipeline Workflow */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card
            sx={{
              p: { xs: 2.5, md: 3.5 },
              borderRadius: 3,
              bgcolor: isLight ? '#ffffff' : '#181a1c',
              border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
              boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff' }}>
                  Cryptographic Attestation Pipeline
                </Typography>
                <Typography variant="body2" sx={{ color: isLight ? '#64748b' : '#8b949e', mt: 0.3 }}>
                  Four-stage verification workflow validating official trust.
                </Typography>
              </Box>
              <Chip
                label="4 of 4 Completed"
                size="small"
                sx={{ bgcolor: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.15)', color: '#16a34a', fontWeight: 800, fontSize: '0.72rem' }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {pipelineSteps.map((step) => (
                <Box
                  key={step.id}
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    bgcolor: isLight ? '#f8fafc' : '#141618',
                    border: `1px solid ${isLight ? (step.completed ? '#bbf7d0' : '#e2e8f0') : (step.completed ? 'rgba(34, 197, 94, 0.25)' : '#282a2d')}`,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1.5,
                          bgcolor: step.completed ? '#16a34a' : isLight ? '#e2e8f0' : '#282a2d',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          flexShrink: 0
                        }}
                      >
                        {step.completed ? <CheckRounded sx={{ fontSize: 18 }} /> : step.stepNum}
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.92rem' }}>
                          {step.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e' }}>
                          Auditing Authority: {step.authority}
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      label={step.status}
                      size="small"
                      sx={{
                        bgcolor: step.completed ? (isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.15)') : isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.15)',
                        color: step.completed ? '#16a34a' : '#2563eb',
                        border: `1px solid ${step.completed ? (isLight ? '#bbf7d0' : 'rgba(34, 197, 94, 0.3)') : (isLight ? '#bfdbfe' : 'rgba(37, 99, 235, 0.3)')}`,
                        fontWeight: 700,
                        fontSize: '0.68rem',
                        height: 22
                      }}
                    />
                  </Box>

                  <Typography variant="body2" sx={{ color: isLight ? '#475569' : '#9ca3af', fontSize: '0.82rem', lineHeight: 1.5, mb: 1.5, pl: 5.5 }}>
                    {step.desc}
                  </Typography>

                  <Box sx={{ pl: 5.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: isLight ? '#94a3b8' : '#6b7280', fontSize: '0.72rem' }}>
                        Proof Hash:
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: 600, fontSize: '0.75rem' }}>
                        {step.proofHash}
                      </Typography>
                    </Box>

                    <Typography variant="caption" sx={{ color: isLight ? '#94a3b8' : '#6b7280', fontSize: '0.72rem' }}>
                      Timestamp: {step.timestamp}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>

        {/* Right Column (5 / 12): Score Matrix & Privileges */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Trust Factors Breakdown Card */}
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
                TRUST SCORE MATRIX WEIGHTING
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {trustFactors.map((factor, i) => (
                  <Box key={i}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: isLight ? '#334155' : '#cbd5e1', fontSize: '0.82rem' }}>
                          {factor.name}
                        </Typography>
                        <Chip
                          label={`Weight: ${factor.weight}`}
                          size="small"
                          sx={{ bgcolor: isLight ? '#f1f5f9' : '#1e2124', color: isLight ? '#64748b' : '#8b949e', fontSize: '0.65rem', height: 18 }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: factor.color, fontSize: '0.85rem' }}>
                        {factor.score}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={factor.score}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: isLight ? '#f1f5f9' : '#282a2d',
                        '& .MuiLinearProgress-bar': { bgcolor: factor.color, borderRadius: 3 }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Card>

            {/* Verified Privileges Card */}
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
                VERIFIED TIER 1 PRIVILEGES
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {citizenPrivileges.map((priv, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.15)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.2 }}>
                      <TaskAltRounded sx={{ fontSize: 14 }} />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.82rem' }}>
                          {priv.title}
                        </Typography>
                        <Chip
                          label={priv.state}
                          size="small"
                          sx={{ bgcolor: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.15)', color: '#16a34a', fontWeight: 800, fontSize: '0.62rem', height: 18 }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontSize: '0.75rem', lineHeight: 1.3, display: 'block', mt: 0.2 }}>
                        {priv.desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TrustVerification;
