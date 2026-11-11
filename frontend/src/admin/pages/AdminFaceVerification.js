import React, { useState } from 'react';
import ApiService from '../services/adminApi.service';
import BiometricVerificationAdmin from '../components/BiometricVerificationAdmin';
import { useColorMode } from '../../context/ThemeContext';
import { getAdminThemeTokens, getCardStyle, getBannerStyle } from '../utils/adminTheme';
import {
  Box,
  Typography,
  Card,
  Button,
  Grid,
  Chip,
  Alert
} from '@mui/material';
import {
  FingerprintRounded,
  CameraAltRounded,
  CheckCircleRounded,
  RefreshRounded
} from '@mui/icons-material';

const AdminFaceVerification = () => {
  const { isLight } = useColorMode();
  const t = getAdminThemeTokens(isLight);

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

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      {/* Header Banner */}
      <Card sx={getBannerStyle(isLight)}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Chip
                icon={<FingerprintRounded sx={{ fontSize: '14px !important', color: `${t.primary} !important` }} />}
                label="OPTICAL FACEMESH SENSOR"
                size="small"
                sx={{
                  bgcolor: t.primaryBg,
                  color: t.primary,
                  border: `1px solid ${t.primaryBorder}`,
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  letterSpacing: '0.06em'
                }}
              />
              <Chip
                label="68-LANDMARK RECOGNITION"
                size="small"
                sx={{
                  bgcolor: t.successBg,
                  color: t.successText,
                  border: `1px solid ${t.successBorder}`,
                  fontWeight: 700,
                  fontSize: '0.68rem'
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: t.textPrimary, letterSpacing: '-0.02em', mb: 0.5 }}>
              Biometric Face Verification
            </Typography>
            <Typography variant="body2" sx={{ color: t.textMuted, maxWidth: 640 }}>
              Live biometric optical checkpoint for border control and government credential attestation.
            </Typography>
          </Box>
        </Box>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: t.errorBg, color: t.errorText, border: `1px solid ${t.errorBorder}` }}>
          {error}
        </Alert>
      )}

      {/* State 1: Idle Camera Launcher */}
      {!scanning && !verificationResult && (
        <Card
          sx={getCardStyle(isLight, {
            p: { xs: 3, md: 5 },
            textAlign: 'center'
          })}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: t.primaryBg,
              border: `1px solid ${t.primaryBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3
            }}
          >
            <CameraAltRounded sx={{ fontSize: 40, color: t.primary }} />
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700, color: t.textPrimary, mb: 1 }}>
            Optical Facial Sensor Inactive
          </Typography>
          <Typography variant="body2" sx={{ color: t.textMuted, maxWidth: 480, mx: 'auto', mb: 4, lineHeight: 1.6 }}>
            Initialize local hardware video feed to scan citizen geometry and automatically match against the registered decentralized biometric directory.
          </Typography>

          <Button
            variant="contained"
            startIcon={<CameraAltRounded />}
            onClick={handleStartScan}
            sx={{
              bgcolor: t.primary,
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1rem',
              px: 4,
              py: 1.5,
              borderRadius: 2.5,
              boxShadow: isLight ? '0 4px 14px rgba(37, 99, 235, 0.3)' : '0 4px 20px rgba(59, 130, 246, 0.4)',
              textTransform: 'none',
              '&:hover': {
                bgcolor: t.primaryDark,
                boxShadow: isLight ? '0 6px 18px rgba(37, 99, 235, 0.4)' : '0 6px 24px rgba(59, 130, 246, 0.5)'
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
          sx={getCardStyle(isLight, {
            border: `1px solid ${t.primary}`,
            p: 3
          })}
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
            sx={getCardStyle(isLight, {
              bgcolor: t.successBg,
              border: `1px solid ${t.successBorder}`,
              p: 3
            })}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: isLight ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.25)', border: `1px solid ${t.success}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircleRounded sx={{ color: t.success, fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: t.textPrimary }}>
                    Citizen Identity Authenticated
                  </Typography>
                  <Typography variant="caption" sx={{ color: t.successText, fontWeight: 700 }}>
                    FaceMesh biometric vectors matched with 99.4% confidence score
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="outlined"
                startIcon={<RefreshRounded />}
                onClick={handleReset}
                sx={{
                  borderColor: t.border,
                  color: t.textPrimary,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: t.primary,
                    bgcolor: t.primaryBg
                  }
                }}
              >
                Scan Next Citizen
              </Button>
            </Box>
          </Card>

          {/* Dossier Card */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={getCardStyle(isLight, { p: 3, height: '100%' })}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: t.textPrimary, mb: 2 }}>
                  Matched Dossier Details
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}` }}>
                    <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                      Citizen Legal Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: t.textPrimary, mt: 0.5 }}>
                      {verificationResult.name}
                    </Typography>
                  </Box>

                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}` }}>
                    <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                      Government ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 700, color: t.primary, mt: 0.5 }}>
                      {verificationResult.government_id}
                    </Typography>
                  </Box>

                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}` }}>
                    <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                      Email / Communications
                    </Typography>
                    <Typography variant="body2" sx={{ color: t.textSecondary, mt: 0.5 }}>
                      {verificationResult.email}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            {/* Linked Credentials Card */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={getCardStyle(isLight, { p: 3, height: '100%' })}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: t.textPrimary, mb: 2 }}>
                  Verified Professional Records ({professionalRecords.length})
                </Typography>

                {professionalRecords.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4, color: t.textMuted }}>
                    <Typography variant="body2">No registered academic or professional records found.</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {professionalRecords.map((r, i) => (
                      <Box key={r.id || i} sx={{ p: 2, borderRadius: 2, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}` }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: t.textPrimary }}>
                          {r.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: t.primary, fontWeight: 600 }}>
                          {r.institution || r.organization} • {r.record_type || r.type}
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
