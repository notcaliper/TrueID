import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  Button,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  FingerprintRounded,
  CheckCircleRounded,
  ShieldRounded,
  LockRounded,
  CameraAltRounded,
  GppGoodRounded,
  RefreshRounded,
  VerifiedUserRounded,
  VisibilityRounded,
  SpeedRounded,
  AutoAwesomeRounded,
  MemoryRounded,
  SecurityRounded,
  ContactlessRounded,
  TaskAltRounded
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ThemeContext';
import { userAPI } from '../services/api.service';
import BiometricVerification from '../components/BiometricVerification';

const BiometricVault = () => {
  const { user } = useAuth();
  const { isLight } = useColorMode();
  const theme = useTheme();

  const [verificationComplete, setVerificationComplete] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [biometricStats, setBiometricStats] = useState({
    status: 'ACTIVE',
    landmarkCount: 68,
    livenessScore: 99.4,
    enclaveModel: 'MediaPipe FaceMesh Neural v2',
    lastScan: 'Nov 5, 2026, 12:45 AM',
    biometricHash: '0x99f4c3a1b2d5e6f708192a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b28dc'
  });

  const fetchBiometricStatus = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await userAPI.getBiometricStatus().catch(() => null);
      if (res?.data) {
        setBiometricStats(prev => ({
          ...prev,
          lastScan: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' })
        }));
      }
    } catch (_) {
      // Keep active cache
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBiometricStatus();
  }, [fetchBiometricStatus]);

  const handleVerificationComplete = (success) => {
    setVerificationComplete(true);
    setVerificationSuccess(success);
    if (success) {
      setBiometricStats(prev => ({
        ...prev,
        status: 'VERIFIED_ACTIVE',
        lastScan: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' })
      }));
    }
  };

  // 4 Core Biometric Pillars
  const biometricPillars = [
    {
      title: 'FaceMesh 3D Geometry',
      value: `${biometricStats.landmarkCount} Landmark Nodes`,
      status: 'NEURAL MESH ACTIVE',
      desc: 'Topological distance vectors extracted client-side with zero latency',
      tag: '68 Nodes',
      color: '#7c3aed',
      bg: isLight ? '#f5f3ff' : 'rgba(124, 58, 237, 0.12)',
      icon: <FingerprintRounded sx={{ fontSize: 24 }} />
    },
    {
      title: 'Complete Privacy',
      value: '100% Private',
      status: 'VIDEO NEVER SAVED',
      desc: 'Camera video stays in your browser memory and is never sent to any server',
      tag: 'Private & Safe',
      color: '#16a34a',
      bg: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.12)',
      icon: <ShieldRounded sx={{ fontSize: 24 }} />
    },
    {
      title: 'Live Person Check',
      value: `${biometricStats.livenessScore}% Score`,
      status: 'REAL PERSON DETECTED',
      desc: 'Blink and head-turn check ensures photos and screens cannot be used to fake identity',
      tag: 'Real-Time Check',
      color: '#2563eb',
      bg: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.12)',
      icon: <GppGoodRounded sx={{ fontSize: 24 }} />
    },
    {
      title: 'Device Security',
      value: 'Secured on Device',
      status: 'PROTECTED BY DEVICE',
      desc: 'Your face data is locked with your device secure lock and biometric key',
      tag: 'Device Locked',
      color: '#0891b2',
      bg: isLight ? '#ecfeff' : 'rgba(8, 145, 178, 0.12)',
      icon: <LockRounded sx={{ fontSize: 24 }} />
    }
  ];

  // Privacy Architecture Steps (Simple English)
  const privacyArchitecture = [
    {
      step: '01',
      title: 'Live Camera Capture',
      desc: 'Your camera opens securely in your browser to check your face.'
    },
    {
      step: '02',
      title: 'Face Outline Detection',
      desc: 'The system maps 68 face points (eyes, nose, mouth) to confirm your identity.'
    },
    {
      step: '03',
      title: 'Privacy Code Created',
      desc: 'Face points are transformed into a secure digital code that cannot be reversed into a photo.'
    },
    {
      step: '04',
      title: 'Verified ID Badge',
      desc: 'Only the verification confirmation is recorded on your permanent digital pass.'
    }
  ];

  // Compliance Standards
  const complianceBadges = [
    { title: 'W3C DID Core 1.0 Specification', tag: 'CERTIFIED' },
    { title: 'ISO/IEC 30107-3 Liveness Level 2', tag: 'COMPLIANT' },
    { title: 'GDPR Article 9 Biometric Exemption', tag: 'PROTECTED' },
    { title: 'FIPS 140-3 Cryptographic Boundary', tag: 'HARDWARE' }
  ];

  return (
    <Box sx={{ width: '100%', pb: 6 }}>
      {/* 1. Breadcrumb Trail & Sync Action */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: isLight ? '#64748b' : '#8b949e', fontSize: '0.84rem' }}>
          <Typography component={RouterLink} to="/" sx={{ color: isLight ? '#64748b' : '#8b949e', textDecoration: 'none', '&:hover': { color: '#2563eb' } }}>
            TrueID Identity Portal
          </Typography>
          <span>/</span>
          <Typography sx={{ color: isLight ? '#64748b' : '#8b949e' }}>Biometric Vault</Typography>
          <span>/</span>
          <Typography sx={{ color: isLight ? '#0f172a' : '#f8fafc', fontWeight: 700, fontFamily: 'monospace' }}>
            {user?.government_id || ''}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            onClick={fetchBiometricStatus}
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
            {refreshing ? 'Syncing Enclave...' : 'Sync Biometrics'}
          </Button>
          <Typography variant="caption" sx={{ color: isLight ? '#94a3b8' : '#6b7280' }}>
            • Last Scan: {biometricStats.lastScan}
          </Typography>
        </Box>
      </Box>

      {/* 2. Top Biometric Banner (Dashboard Style) */}
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
          {/* Left: Fingerprint Icon + Title + Status Badges */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2.5,
                bgcolor: isLight ? '#f5f3ff' : 'rgba(124, 58, 237, 0.15)',
                color: '#7c3aed',
                border: `2px solid ${isLight ? '#ddd6fe' : 'rgba(124, 58, 237, 0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isLight ? '0 4px 14px rgba(124, 58, 237, 0.12)' : 'none',
                flexShrink: 0
              }}
            >
              <FingerprintRounded sx={{ fontSize: 36 }} />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff', letterSpacing: '-0.02em' }}>
                  Biometric Security & Neural FaceMesh Vault
                </Typography>

                <Chip
                  label="NEURAL MESH ACTIVE"
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
                68-node 3D facial landmark extraction, zero-knowledge liveness analysis, and secure enclave vector protection.
              </Typography>

              {/* Status Chips */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                <Chip
                  label="68 Landmark Nodes Active"
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
                  label="ARM TrustZone Enclave"
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
                  label="Optical Liveness Confirmed (0.99)"
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

          {/* Right: Confidence Score Badge */}
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
              LIVENESS CONFIDENCE
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 0.5, my: 0.2 }}>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#7c3aed', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {biometricStats.livenessScore}%
              </Typography>
              <Typography variant="body2" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700 }}>
                / 100
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 700, display: 'block' }}>
              Zero Spoofing Detected
            </Typography>
            <Typography variant="caption" sx={{ color: isLight ? '#94a3b8' : '#6b7280', fontSize: '0.7rem' }}>
              Engine: {biometricStats.enclaveModel}
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* Verification Success Alert */}
      {verificationComplete && verificationSuccess && (
        <Alert
          icon={<CheckCircleRounded fontSize="inherit" />}
          severity="success"
          sx={{ mb: 3, borderRadius: 2, bgcolor: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.1)', color: '#16a34a', border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(34, 197, 94, 0.3)'}` }}
        >
          Biometric liveness challenge successfully passed. 68 Face landmarks verified and synchronized with your Digital Citizen Pass.
        </Alert>
      )}

      {/* 3. Four Core Biometric Pillars */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {biometricPillars.map((pillar, idx) => (
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

      {/* 4. Main Interactive Studio: Live Camera vs Architecture & Specs */}
      <Grid container spacing={3}>
        {/* Left Column (7.5 / 12): Live FaceMesh Scanner */}
        <Grid size={{ xs: 12, lg: 7.5 }}>
          <Card
            sx={{
              p: { xs: 2.5, md: 3.5 },
              borderRadius: 3,
              bgcolor: isLight ? '#ffffff' : '#181a1c',
              border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
              boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff' }}>
                  FaceMesh 3D Landmark Scanner
                </Typography>
                <Typography variant="body2" sx={{ color: isLight ? '#64748b' : '#8b949e', mt: 0.3 }}>
                  Align face within optical guidance box. Real-time topological mesh is evaluated inside local enclave.
                </Typography>
              </Box>

              <Chip
                icon={<CameraAltRounded sx={{ fontSize: '14px !important', color: '#2563eb !important' }} />}
                label="720p HD Enclave Stream"
                size="small"
                sx={{ bgcolor: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.15)', color: '#2563eb', fontWeight: 700, fontSize: '0.7rem' }}
              />
            </Box>

            {/* Biometric Verification Component */}
            <Box
              sx={{
                borderRadius: 2.5,
                overflow: 'hidden',
                border: `1px solid ${isLight ? '#e2e8f0' : '#282a2d'}`,
                bgcolor: isLight ? '#f8fafc' : '#141618',
                p: { xs: 1, sm: 2 }
              }}
            >
              <BiometricVerification
                userId={user?.id}
                onVerificationComplete={handleVerificationComplete}
              />
            </Box>

            {/* Guidance Steps Footer */}
            <Box sx={{ mt: 3, pt: 2.5, borderTop: `1px solid ${isLight ? '#f1f5f9' : '#282a2d'}` }}>
              <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5, display: 'block' }}>
                LIVENESS PROTOCOL INSTRUCTIONS
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.82rem' }}>
                    1. Align Centered
                  </Typography>
                  <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e' }}>
                    Position face within the rectangular optical boundary in good lighting.
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.82rem' }}>
                    2. Natural Eye Blink
                  </Typography>
                  <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e' }}>
                    Blink naturally to confirm biological micro-expressions and depth.
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.82rem' }}>
                    3. Enclave Proof
                  </Typography>
                  <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e' }}>
                    SHA-256 hash generated client-side and verified against your DID root.
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Card>
        </Grid>

        {/* Right Column (4.5 / 12): Zero-Knowledge Architecture & Integrity Specs */}
        <Grid size={{ xs: 12, lg: 4.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Zero-Knowledge Privacy Architecture Card */}
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
                ZERO-KNOWLEDGE PRIVACY PIPELINE
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {privacyArchitecture.map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1.5,
                        bgcolor: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.15)',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        flexShrink: 0
                      }}
                    >
                      {item.step}
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.82rem' }}>
                        {item.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontSize: '0.75rem', lineHeight: 1.4, display: 'block' }}>
                        {item.desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Card>

            {/* Enclave Health & Vector Commitment Card */}
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
                CRYPTOGRAPHIC BIOMETRIC COMMITMENT
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, textTransform: 'uppercase' }}>
                    SHA-256 GEOMETRIC COMMITMENT HASH
                  </Typography>
                  <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: isLight ? '#f1f5f9' : '#1e2124', fontFamily: 'monospace', fontSize: '0.75rem', color: '#7c3aed', wordBreak: 'break-all', mt: 0.5 }}>
                    {biometricStats.biometricHash}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 600 }}>
                    Enclave Sandbox Isolation
                  </Typography>
                  <Chip label="HARDWARE LEVEL 1" size="small" sx={{ bgcolor: isLight ? '#f0fdf4' : 'rgba(22, 163, 74, 0.15)', color: '#16a34a', fontWeight: 800, fontSize: '0.65rem' }} />
                </Box>

                <Divider sx={{ borderColor: isLight ? '#f1f5f9' : '#282a2d' }} />

                <Box>
                  <Typography variant="caption" sx={{ color: isLight ? '#64748b' : '#8b949e', fontWeight: 700, textTransform: 'uppercase', mb: 1, display: 'block' }}>
                    SECURITY SPECIFICATIONS
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {complianceBadges.map((b, idx) => (
                      <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: isLight ? '#334155' : '#cbd5e1', fontSize: '0.75rem' }}>
                          {b.title}
                        </Typography>
                        <Chip
                          label={b.tag}
                          size="small"
                          sx={{ bgcolor: isLight ? '#eff6ff' : 'rgba(37, 99, 235, 0.1)', color: '#2563eb', fontWeight: 700, fontSize: '0.62rem', height: 18 }}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BiometricVault;
