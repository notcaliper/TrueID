import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip
} from '@mui/material';
import {
  FingerprintRounded,
  CheckCircleRounded,
  ShieldRounded,
  LockRounded,
  ElectricBoltRounded,
  CameraAltRounded
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import BiometricVerification from '../components/BiometricVerification';

const BiometricVerificationPage = () => {
  const { user } = useAuth();
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const handleVerificationComplete = (success) => {
    setVerificationComplete(true);
    setVerificationSuccess(success);
  };

  return (
    <Box sx={{ maxWidth: '1440px', mx: 'auto', px: { xs: 2, md: 4 }, py: 3 }}>
      {/* 1. Header Hero Banner */}
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
            <FingerprintRounded sx={{ fontSize: 32 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h5" fontWeight={800} color="#f8fafc">
                Biometric Identity Studio
              </Typography>
              <Chip 
                size="small" 
                label="Neural FaceMesh Active" 
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
              68-node biometric facial landmark extraction and zero-knowledge cryptographic proof-of-liveness.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Verification Success Alert */}
      {verificationComplete && verificationSuccess && (
        <Alert 
          icon={<CheckCircleRounded fontSize="inherit" />} 
          severity="success" 
          sx={{ mb: 3, borderRadius: '14px', bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.25)' }}
        >
          Your biometric identity proof has been cryptographically confirmed. High-security operations unlocked.
        </Alert>
      )}

      {/* 2. Main Studio Grid */}
      <Grid container spacing={3}>
        {/* Left Column: Live Camera Scanner */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card className="fintech-card" sx={{ p: 1 }}>
            <CardContent sx={{ p: 3.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={700} color="#f8fafc">
                    FaceMesh Landmark Scanner
                  </Typography>
                  <Typography variant="body2" color="#94a3b8">
                    Align your face within the optical guide box to calculate invariant geometric coordinates.
                  </Typography>
                </Box>
                <Chip 
                  size="small" 
                  icon={<CameraAltRounded sx={{ fontSize: '13px !important' }} />}
                  label="Local Enclave" 
                  sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', color: '#cbd5e1' }}
                />
              </Box>

              {user ? (
                <BiometricVerification 
                  userId={user.id} 
                  onVerificationComplete={handleVerificationComplete}
                />
              ) : (
                <Alert severity="warning" sx={{ borderRadius: '12px' }}>
                  Please sign in to access your biometric enclave.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Security Enclave Specs & Zero-Knowledge Architecture */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Card className="fintech-card" sx={{ p: 0.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" color="#818cf8" letterSpacing={1} sx={{ mb: 2 }}>
                  ZERO-KNOWLEDGE PRIVACY
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <ShieldRounded sx={{ color: '#10b981', mt: 0.3 }} />
                    <Box>
                      <Typography variant="body2" fontWeight={700} color="#f8fafc">
                        Raw Video Never Transmitted
                      </Typography>
                      <Typography variant="caption" color="#94a3b8">
                        Facial image frames remain strictly on your local device. Only 68 topological distance vectors are computed.
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <LockRounded sx={{ color: '#818cf8', mt: 0.3 }} />
                    <Box>
                      <Typography variant="body2" fontWeight={700} color="#f8fafc">
                        Irreversible Biometric Hash
                      </Typography>
                      <Typography variant="caption" color="#94a3b8">
                        Vectors are hashed with SHA-256 and salted with your sovereign ID key before submission.
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <ElectricBoltRounded sx={{ color: '#38bdf8', mt: 0.3 }} />
                    <Box>
                      <Typography variant="body2" fontWeight={700} color="#f8fafc">
                        On-Demand Authentication
                      </Typography>
                      <Typography variant="caption" color="#94a3b8">
                        Used exclusively to authorize sensitive actions, credential exports, or high-value ledger operations.
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card className="fintech-card" sx={{ p: 0.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" color="#34d399" letterSpacing={1} sx={{ mb: 1 }}>
                  SYSTEM PROTOCOL
                </Typography>
                <Typography variant="body2" color="#94a3b8" sx={{ mb: 1.5 }}>
                  Compliant with W3C Decentralized Identifiers (DIDs) & OpenID Connect for Verifiable Credentials.
                </Typography>
                <Chip 
                  size="small" 
                  label="W3C DID COMPLIANT" 
                  sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', fontWeight: 700, fontSize: '0.65rem' }} 
                />
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BiometricVerificationPage;
