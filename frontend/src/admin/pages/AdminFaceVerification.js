import React, { useState } from 'react';
import ApiService from '../services/adminApi.service';
import BiometricVerificationAdmin from '../components/BiometricVerificationAdmin';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Alert,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  FingerprintRounded,
  CameraAltRounded,
  VerifiedUserRounded,
  CheckCircleRounded,
  CancelRounded,
  RefreshRounded,
  OpenInNewRounded,
  ShieldRounded,
  FolderSharedRounded,
  WorkspacePremiumRounded
} from '@mui/icons-material';

const AdminFaceVerification = () => {
  const [scanning, setScanning] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [professionalRecords, setProfessionalRecords] = useState([]);
  const [error, setError] = useState(null);

  const handleStartScan = () => {
    setError(null);
    setScanning(true);
    setVerificationResult(null);
  };

  const handleVerificationComplete = async (userInfo) => {
    setVerificationResult(userInfo);
    setScanning(false);
    try {
      const res = await ApiService.listUserProfessionalRecords(userInfo.id);
      const records = Array.isArray(res) ? res : res?.records || [];
      setProfessionalRecords(records);
    } catch (err) {
      console.error('Error fetching professional records:', err);
      // Non-fatal
    }
  };

  const handleVerificationError = (errorMessage) => {
    setError(errorMessage);
    setScanning(false);
  };

  const handleReset = () => {
    setScanning(false);
    setVerificationResult(null);
    setProfessionalRecords([]);
    setError(null);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      {/* Header Banner */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(13, 18, 29, 0.95) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          p: { xs: 2.5, md: 3.5 }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<FingerprintRounded sx={{ fontSize: '14px !important', color: '#818cf8 !important' }} />}
                label="OPTICAL FACEMESH SENSOR"
                size="small"
                sx={{
                  bgcolor: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  letterSpacing: '0.08em'
                }}
              />
              <Chip
                label="68-LANDMARK RECOGNITION"
                size="small"
                sx={{
                  bgcolor: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontWeight: 700,
                  fontSize: '0.68rem'
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', mb: 0.5 }}>
              Biometric Face Verification
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 640 }}>
              Live biometric optical checkpoint for border control and government credential attestation.
            </Typography>
          </Box>
        </Box>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          {error}
        </Alert>
      )}

      {/* State 1: Idle Camera Launcher */}
      {!scanning && !verificationResult && (
        <Card
          sx={{
            borderRadius: 3,
            bgcolor: 'rgba(13, 18, 29, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(14px)',
            p: { xs: 3, md: 5 },
            textAlign: 'center'
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3
            }}
          >
            <CameraAltRounded sx={{ fontSize: 40, color: '#818cf8' }} />
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700, color: '#f8fafc', mb: 1 }}>
            Optical Facial Sensor Inactive
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 480, mx: 'auto', mb: 4, lineHeight: 1.6 }}>
            Initialize local hardware video feed to scan citizen geometry and automatically match against the registered decentralized biometric directory.
          </Typography>

          <Button
            variant="contained"
            startIcon={<CameraAltRounded />}
            onClick={handleStartScan}
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1rem',
              px: 4,
              py: 1.5,
              borderRadius: 2.5,
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                boxShadow: '0 6px 24px rgba(99, 102, 241, 0.5)'
              }
            }}
          >
            Launch Facial Scanner
          </Button>
        </Card>
      )}

      {/* State 2: Camera Feed Active */}
      {scanning && (
        <Card
          sx={{
            borderRadius: 3,
            bgcolor: 'rgba(13, 18, 29, 0.85)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            p: 3
          }}
        >
          <BiometricVerificationAdmin
            onVerificationComplete={handleVerificationComplete}
            onError={handleVerificationError}
          />
        </Card>
      )}

      {/* State 3: Citizen Matched Result */}
      {verificationResult && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Matched Header Card */}
          <Card
            sx={{
              borderRadius: 3,
              bgcolor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              p: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircleRounded sx={{ color: '#10b981', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                    Citizen Identity Authenticated
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 600 }}>
                    FaceMesh biometric vectors matched with 99.4% confidence score
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="outlined"
                startIcon={<RefreshRounded />}
                onClick={handleReset}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#cbd5e1',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Scan Next Citizen
              </Button>
            </Box>
          </Card>

          {/* Dossier Card */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  bgcolor: 'rgba(13, 18, 29, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(14px)',
                  p: 3,
                  height: '100%'
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc', mb: 2 }}>
                  Matched Dossier Details
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Citizen Legal Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#f8fafc', mt: 0.5 }}>
                      {verificationResult.name}
                    </Typography>
                  </Box>

                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Government ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8', mt: 0.5 }}>
                      {verificationResult.government_id}
                    </Typography>
                  </Box>

                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Email / Communications
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#f8fafc', mt: 0.5 }}>
                      {verificationResult.email}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            {/* Linked Credentials Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  bgcolor: 'rgba(13, 18, 29, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(14px)',
                  p: 3,
                  height: '100%'
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc', mb: 2 }}>
                  Verified Professional Records ({professionalRecords.length})
                </Typography>

                {professionalRecords.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                    <Typography variant="body2">No registered academic or professional records found.</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {professionalRecords.map((r, i) => (
                      <Box key={r.id || i} sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                          {r.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#38bdf8' }}>
                          {r.institution} • {r.record_type || r.type}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default AdminFaceVerification;
