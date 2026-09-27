import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
  TextField,
  CircularProgress,
  Link,
  Chip
} from '@mui/material';
import {
  Security,
  CheckCircle,
  Error as ErrorIcon,
  PhoneAndroid,
  ContentCopy,
  Warning
} from '@mui/icons-material';

/**
 * MFA Setup Component
 * Guides user through setting up TOTP-based MFA
 */
const MFASetup = ({ onSetup, onVerify, onCancel, loading, error, setupData }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState('');

  const steps = ['Scan QR Code', 'Verify Setup'];

  // Copy secret to clipboard
  const copySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Copy manual setup key
  const copyManualKey = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle verification
  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setLocalError('Please enter a valid 6-digit code');
      return;
    }
    
    const result = await onVerify(verificationCode);
    if (result.success) {
      setActiveStep(2); // Go to success step
    }
  };

  // Reset and start over
  const handleStartOver = () => {
    setActiveStep(0);
    setVerificationCode('');
    setLocalError('');
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 500, mx: 'auto' }}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(59,130,246,0.05) 100%)',
          border: '1px solid rgba(139,92,246,0.2)',
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <Security sx={{ color: '#fff', fontSize: 32 }} />
          </Box>
          <Typography variant="h5" fontWeight={700} color="#fff" gutterBottom>
            Set Up Two-Factor Authentication
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add an extra layer of security to your account
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper 
          activeStep={activeStep} 
          sx={{ 
            mb: 4,
            '& .MuiStepLabel-label': { color: 'text.secondary', fontSize: '0.75rem' },
            '& .MuiStepLabel-label.Mui-active': { color: '#a78bfa' },
            '& .MuiStepIcon-root': { color: 'rgba(255,255,255,0.2)' },
            '& .MuiStepIcon-root.Mui-active': { color: '#8b5cf6' },
            '& .MuiStepIcon-root.Mui-completed': { color: '#10b981' },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {(error || localError) && (
          <Alert 
            severity="error" 
            icon={<ErrorIcon />}
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            {error || localError}
          </Alert>
        )}

        {/* Step Content */}
        {activeStep === 0 && (
          <Box>
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3, 
                borderRadius: 2,
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#93c5fd',
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              Scan this QR code with your authenticator app (Google Authenticator, Authy, or Microsoft Authenticator)
            </Alert>

            {/* QR Code */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 3,
                p: 3,
                background: '#fff',
                borderRadius: 2,
              }}
            >
              {setupData?.qrCode ? (
                <img 
                  src={setupData.qrCode} 
                  alt="MFA QR Code" 
                  style={{ width: 200, height: 200 }}
                />
              ) : (
                <Box
                  sx={{
                    width: 200,
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f3f4f6',
                    borderRadius: 1,
                  }}
                >
                  <CircularProgress size={40} sx={{ color: '#8b5cf6' }} />
                </Box>
              )}
            </Box>

            {/* Manual Entry */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Can&apos;t scan the QR code? Enter this key manually:
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 2,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <Typography
                  variant="body1"
                  fontFamily="monospace"
                  fontWeight={600}
                  color="#a78bfa"
                  sx={{ flex: 1, letterSpacing: 2 }}
                >
                  {setupData?.secret || '••••••••••••••••'}
                </Typography>
                <Button
                  size="small"
                  onClick={copyManualKey}
                  startIcon={<ContentCopy fontSize="small" />}
                  sx={{ color: '#a78bfa' }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </Box>
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={() => setActiveStep(1)}
              disabled={!setupData?.qrCode}
              sx={{
                py: 1.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                fontWeight: 600,
                '&:hover': { background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)' },
              }}
            >
              I&apos;ve scanned the QR code
            </Button>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Alert 
              severity="warning" 
              icon={<Warning />}
              sx={{ 
                mb: 3, 
                borderRadius: 2,
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#fcd34d',
                border: '1px solid rgba(245, 158, 11, 0.2)',
              }}
            >
              Enter the 6-digit code from your authenticator app to verify setup
            </Alert>

            <TextField
              fullWidth
              label="Verification Code"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationCode(value);
                setLocalError('');
              }}
              placeholder="000000"
              disabled={loading}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
              }}
              inputProps={{
                style: { 
                  textAlign: 'center', 
                  fontSize: '1.5rem', 
                  fontWeight: 600,
                  letterSpacing: 8 
                },
              }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={handleVerify}
              disabled={loading || verificationCode.length !== 6}
              sx={{
                py: 1.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                fontWeight: 600,
                '&:hover': { background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)' },
                '&:disabled': { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: '#fff' }} />
              ) : (
                'Verify & Enable MFA'
              )}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link
                component="button"
                type="button"
                onClick={() => setActiveStep(0)}
                sx={{
                  color: '#94a3b8',
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  '&:hover': { color: '#a78bfa' },
                }}
              >
                Go back to QR code
              </Link>
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
            <Typography variant="h6" fontWeight={600} color="#fff" gutterBottom>
              MFA Enabled Successfully!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your account is now protected with two-factor authentication
            </Typography>
            <Chip
              icon={<Security />}
              label="Extra Security Active"
              color="success"
              sx={{ mb: 3 }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={onCancel}
              sx={{
                py: 1.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                fontWeight: 600,
                '&:hover': { background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)' },
              }}
            >
              Done
            </Button>
          </Box>
        )}

        {/* Cancel Button */}
        {activeStep < 2 && (
          <Button
            fullWidth
            onClick={onCancel}
            disabled={loading}
            sx={{ 
              mt: 2, 
              color: '#94a3b8',
              '&:hover': { background: 'rgba(255,255,255,0.05)' }
            }}
          >
            Cancel Setup
          </Button>
        )}
      </Paper>
    </Box>
  );
};

export default MFASetup;
