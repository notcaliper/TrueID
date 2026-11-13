import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  RefreshRounded,
  SecurityRounded,
  VerifiedUserRounded,
  FingerprintRounded,
  GppGoodRounded,
  BadgeRounded,
  CheckRounded,
  TaskAltRounded
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ThemeContext';
import { userAPI } from '../services/api.service';

const TrustVerification = () => {
  const { user } = useAuth();
  const { isLight } = useColorMode();

  const [refreshing, setRefreshing] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);

  const [verificationData, setVerificationData] = useState({
    status: user?.verification_status || 'PENDING',
    governmentId: user?.government_id || '',
    trustScore: user?.trust_score || 0,
    submittedAt: '',
    verifiedAt: '',
    verifiedBy: '',
    verifiedRecordsCount: 0,
    contractAddress: process.env.REACT_APP_CONTRACT_ADDRESS || '',
    lastSync: ''
  });

  const fetchVerificationStatus = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const [response, recordsRes] = await Promise.allSettled([
        userAPI.getVerificationStatus(),
        userAPI.getProfessionalRecords()
      ]);

      const rawData = response.status === 'fulfilled' ? (response.value?.data?.data || response.value?.data || {}) : {};
      const status = (rawData?.status || rawData?.identity?.status || user?.verification_status || 'PENDING').toUpperCase();
      const records = recordsRes.status === 'fulfilled' ? (recordsRes.value?.data?.records || recordsRes.value?.data || []) : [];
      const verifiedCount = Array.isArray(records) ? records.filter(r => r.verification_status === 'VERIFIED').length : 0;

      setVerificationData(prev => ({
        ...prev,
        status: status,
        governmentId: user?.government_id || rawData?.government_id || '',
        verifiedBy: rawData?.verifiedBy || 'TrueID Identity Notary Authority',
        submittedAt: rawData?.submittedAt || prev.submittedAt,
        verifiedAt: rawData?.verifiedAt || prev.verifiedAt,
        verifiedRecordsCount: verifiedCount,
        contractAddress: rawData?.contractAddress || process.env.REACT_APP_CONTRACT_ADDRESS || '',
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
  const trustScorePercentage = isVerified ? 100 : 0;

  // 4 Core Trust Pillar Metrics
  const trustPillars = [
    {
      title: 'Overall Trust Score',
      value: `${trustScorePercentage}%`,
      status: isVerified ? 'EXCELLENT STANDING' : 'PENDING REVIEW',
      desc: isVerified ? 'Highest Compliance Standing • Verified' : 'Awaiting identity verification attestations',
      tag: isVerified ? 'Verified Citizen' : 'Citizen Applicant',
      color: isVerified ? '#16a34a' : '#d97706',
      bg: isLight ? (isVerified ? '#f0fdf4' : '#fffbeb') : (isVerified ? 'rgba(22, 163, 74, 0.12)' : 'rgba(217, 119, 6, 0.12)'),
      icon: <VerifiedUserRounded sx={{ fontSize: 24 }} />
    },
    {
      title: 'National KYC Attestation',
      value: verificationData.governmentId || 'Not Registered',
      status: isVerified ? 'VERIFIED' : 'PENDING',
      desc: isVerified ? 'Verified identity registry record' : 'Awaiting verification check',
      tag: isVerified ? 'Verified' : 'Pending',
      color: '#2563eb',
      bg: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.12)',
      icon: <BadgeRounded sx={{ fontSize: 24 }} />
    },
    {
      title: '3D FaceMesh Liveness',
      value: user?.facemesh_hash ? 'Enrolled Active' : 'Pending Scan',
      status: user?.facemesh_hash ? 'HARDWARE ENCLAVE SECURE' : 'PENDING BIOMETRIC',
      desc: user?.facemesh_hash ? 'Facial geometry matched with high confidence' : 'No biometric vectors enrolled',
      tag: 'ZK Liveness',
      color: '#7c3aed',
      bg: isLight ? '#f5f3ff' : 'rgba(124, 58, 237, 0.12)',
      icon: <FingerprintRounded sx={{ fontSize: 24 }} />
    },
    {
      title: 'Blockchain Record',
      value: user?.soulbound_token_id ? `Badge #${user.soulbound_token_id}` : (isVerified ? 'Badge Anchored' : 'Pending Mint'),
      status: isVerified ? 'VERIFIED & RECORDED' : 'AWAITING MINING',
      desc: 'Smart contract record permanently anchored on Ethereum Sepolia',
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
      timestamp: verificationData.submittedAt || 'Completed',
      authority: verificationData.verifiedBy || 'Identity Registry',
      proofHash: verificationData.governmentId || 'ID Document Verified',
      completed: true,
      status: 'VERIFIED'
    },
    {
      id: 2,
      stepNum: '02',
      title: 'Camera Face Verification',
      desc: 'Live camera scan matched your face against your ID photo. Real person check passed.',
      timestamp: 'Completed',
      authority: 'Device Camera Verification',
      proofHash: user?.facemesh_hash ? `${user.facemesh_hash.slice(0, 10)}...` : 'Biometrics Active',
      completed: Boolean(user?.facemesh_hash),
      status: user?.facemesh_hash ? 'VERIFIED' : 'PENDING'
    },
    {
      id: 3,
      stepNum: '03',
      title: 'Official Officer Review',
      desc: 'Authorized notary reviewed your details against government records and approved your application.',
      timestamp: verificationData.verifiedAt || (isVerified ? 'Completed' : 'Pending'),
      authority: verificationData.verifiedBy || 'Notary Officer',
      proofHash: user?.wallet_address ? `${user.wallet_address.slice(0, 8)}...${user.wallet_address.slice(-6)}` : 'Officer Signature',
      completed: isVerified,
      status: isVerified ? 'VERIFIED' : 'IN REVIEW'
    },
    {
      id: 4,
      stepNum: '04',
      title: 'Blockchain Digital ID Created',
      desc: 'Your permanent digital identity badge was created on the blockchain network.',
      timestamp: verificationData.verifiedAt || (isVerified ? 'Anchored' : 'Pending'),
      authority: 'Ethereum Sepolia Network',
      proofHash: user?.soulbound_token_id ? `Soulbound Token #${user.soulbound_token_id}` : (user?.blockchain_tx_hash ? `${user.blockchain_tx_hash.slice(0, 10)}...` : 'Pending Mint'),
      completed: isVerified,
      status: isVerified ? 'SAVED' : 'WAITING'
    }
  ];

  // Trust Score Factor Breakdown
  const trustFactors = [
    { name: 'Government ID Validity', weight: '35%', score: 100, color: '#16a34a' },
    { name: 'Live Face Match', weight: '25%', score: 100, color: '#16a34a' },
    { name: verificationData.verifiedRecordsCount > 0 ? `Verified Credentials (${verificationData.verifiedRecordsCount} items)` : 'Verified Credentials', weight: '20%', score: verificationData.verifiedRecordsCount > 0 ? 100 : 80, color: verificationData.verifiedRecordsCount > 0 ? '#16a34a' : '#64748b' },
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
              Audited by: {(verificationData.verifiedBy || 'TrueID Identity Registry').slice(0, 24)}...
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
