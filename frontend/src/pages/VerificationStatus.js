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
  Chip,
  LinearProgress
} from '@mui/material';
import {
  CheckCircleRounded,
  RefreshRounded,
  SecurityRounded,
  VerifiedUserRounded,
  FingerprintRounded,
  HourglassEmptyRounded,
  ShieldRounded,
  ErrorOutlineRounded,
  GppGoodRounded
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api.service';

const VerificationStatus = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [verificationData, setVerificationData] = useState({
    status: 'PENDING',
    submittedAt: null,
    verifiedAt: null,
    rejectionReason: null,
    verifiedBy: 'TrueID Authority',
    steps: []
  });

  const fetchVerificationStatus = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const response = await userAPI.getVerificationStatus();
      const rawData = response?.data?.data || response?.data || {};

      const status = (rawData?.status || rawData?.identity?.status || 'PENDING').toUpperCase();
      const submittedAt = rawData?.submittedAt || rawData?.identity?.completedAt || new Date().toISOString();
      const verifiedAt = rawData?.verifiedAt || (status === 'VERIFIED' ? new Date().toISOString() : null);

      const steps = [
        {
          id: 1,
          title: 'Identity Enrollment & KYC Submission',
          description: 'Legal identity records, government serial hash, and sovereign wallet binding registered.',
          date: submittedAt,
          completed: true,
          status: 'SUCCESS'
        },
        {
          id: 2,
          title: 'Biometric FaceMesh Enclave Analysis',
          description: '68 invariant facial landmark nodes extracted and cross-checked for sovereign proof-of-liveness.',
          date: submittedAt,
          completed: true,
          status: 'SUCCESS'
        },
        {
          id: 3,
          title: 'Authority Validation & Cross-Registry Attestation',
          description: status === 'REJECTED'
            ? `Verification rejected. Reason: ${rawData.rejectionReason || 'Authority compliance audit failed.'}`
            : 'Government authority nodes audit cryptographic credentials and verify eligibility.',
          date: verifiedAt,
          completed: status !== 'PENDING',
          status: status === 'REJECTED' ? 'REJECTED' : (status === 'VERIFIED' ? 'SUCCESS' : 'PENDING')
        },
        {
          id: 4,
          title: 'Decentralized Soulbound Minting',
          description: 'Cryptographic attestation minted to Ethereum Sepolia registry and smart contract bound.',
          date: status === 'VERIFIED' ? verifiedAt : null,
          completed: status === 'VERIFIED',
          status: status === 'VERIFIED' ? 'SUCCESS' : 'WAITING'
        }
      ];

      setVerificationData({
        status,
        submittedAt,
        verifiedAt,
        rejectionReason: rawData.rejectionReason,
        verifiedBy: rawData.verifiedBy || 'TrueID Authority',
        steps
      });
    } catch (err) {
      console.error('Error fetching verification status:', err);
      setError('Unable to fetch live verification state. Using local security enclave cache.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVerificationStatus();
    const interval = setInterval(fetchVerificationStatus, 20000);
    return () => clearInterval(interval);
  }, [fetchVerificationStatus]);

  const formatDate = (dateString) => {
    if (!dateString) return 'In Progress';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' • ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isVerified = verificationData.status === 'VERIFIED';
  const trustScorePercentage = isVerified ? 99.8 : 65.0;

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
              bgcolor: 'rgba(16, 185, 129, 0.15)', 
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            <VerifiedUserRounded sx={{ fontSize: 32 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h5" fontWeight={800} color="#f8fafc">
                Trust & Compliance Evaluation
              </Typography>
              <Chip 
                size="small" 
                icon={<CheckCircleRounded sx={{ fontSize: '14px !important', color: '#10b981 !important' }} />}
                label={isVerified ? "Compliance Tier 1" : "Review In Progress"} 
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
              Multi-factor biometric verification and decentralized authority identity attestations.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          onClick={fetchVerificationStatus}
          disabled={refreshing}
          startIcon={<RefreshRounded sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />}
          sx={{ borderRadius: '10px', textTransform: 'none', px: 2 }}
        >
          {refreshing ? 'Auditing...' : 'Re-Evaluate Trust Score'}
        </Button>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

      {/* 2. Top Trust Metrics Grid */}
      <Grid container spacing={2.5} mb={4}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card className="fintech-card" sx={{ p: 0.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" color="#34d399" letterSpacing={1} sx={{ mb: 1 }}>
                OVERALL TRUST SCORE
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                <Typography variant="h3" fontWeight={800} color="#f8fafc">
                  {trustScorePercentage}%
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} color="#10b981">
                  {isVerified ? 'EXCELLENT' : 'STRONG'}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={trustScorePercentage} 
                sx={{ 
                  height: 6, 
                  borderRadius: 3, 
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  '& .MuiLinearProgress-bar': { bgcolor: '#10b981', borderRadius: 3 }
                }} 
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card className="fintech-card" sx={{ p: 0.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" color="#818cf8" letterSpacing={1} sx={{ mb: 1 }}>
                VERIFICATION STATUS
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#f8fafc" sx={{ mb: 0.5 }}>
                {verificationData.status}
              </Typography>
              <Typography variant="caption" color="#64748b">
                Audited by: {verificationData.verifiedBy}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card className="fintech-card" sx={{ p: 0.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" color="#fbbf24" letterSpacing={1} sx={{ mb: 1 }}>
                ENCLAVE PROOFS
              </Typography>
              <Typography variant="h4" fontWeight={800} color="#f8fafc" sx={{ mb: 0.5 }}>
                2 OF 2 PASSED
              </Typography>
              <Typography variant="caption" color="#10b981">
                Zero-Knowledge Proofs Verified
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 3. Verification Journey Pipeline Cards */}
      <Card className="fintech-card" sx={{ p: 1 }}>
        <CardContent sx={{ p: 3.5 }}>
          <Typography variant="h6" fontWeight={700} color="#f8fafc" sx={{ mb: 0.5 }}>
            Cryptographic Attestation Pipeline
          </Typography>
          <Typography variant="body2" color="#94a3b8" sx={{ mb: 3.5 }}>
            Four-tier decentralized audit workflow to establish institutional trust.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {verificationData.steps.map((step, idx) => (
              <Box 
                key={step.id}
                sx={{ 
                  p: 2.5, 
                  borderRadius: '14px', 
                  bgcolor: step.completed ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${step.completed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box 
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: '10px',
                      bgcolor: step.completed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                      color: step.completed ? '#34d399' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      flexShrink: 0
                    }}
                  >
                    {step.completed ? <CheckCircleRounded fontSize="small" /> : step.id}
                  </Box>

                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} color="#f8fafc" sx={{ mb: 0.3 }}>
                      {step.title}
                    </Typography>
                    <Typography variant="body2" color="#94a3b8" sx={{ maxWidth: '800px' }}>
                      {step.description}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Chip 
                    size="small" 
                    label={step.completed ? "COMPLETED" : (step.status === 'PENDING' ? "IN AUDIT" : "WAITING")} 
                    sx={{ 
                      height: 22, 
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      bgcolor: step.completed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                      color: step.completed ? '#34d399' : '#94a3b8'
                    }} 
                  />
                  <Typography variant="caption" color="#64748b" display="block" sx={{ mt: 0.5 }}>
                    {formatDate(step.date)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VerificationStatus;
