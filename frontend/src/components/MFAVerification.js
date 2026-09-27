import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Divider,
  Link,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Security,
  ArrowBack,
  Refresh,
  HelpOutline,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';

/**
 * MFA Verification Component
 * Used during login when MFA is enabled
 */
const MFAVerification = ({ onVerify, onCancel, error, loading }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [showRecoveryCode, setShowRecoveryCode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [localError, setLocalError] = useState('');
  const inputRefs = useRef([]);

  // Handle input change
  const handleChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take last character
    setCode(newCode);
    setLocalError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle key press (backspace)
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Allow paste
    if (e.key === 'v' && e.ctrlKey) {
      return;
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    
    pastedData.split('').forEach((char, index) => {
      if (index < 6) newCode[index] = char;
    });
    
    setCode(newCode);
    
    // Focus next empty input or last input
    const nextEmptyIndex = newCode.findIndex(c => !c);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  // Submit verification
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const fullCode = code.join('');
    
    if (showRecoveryCode) {
      if (recoveryCode.length < 6) {
        setLocalError('Please enter a valid recovery code');
        return;
      }
      await onVerify(recoveryCode.toUpperCase().replace(/[^A-Z0-9]/g, ''));
    } else {
      if (fullCode.length !== 6) {
        setLocalError('Please enter a complete 6-digit code');
        return;
      }
      await onVerify(fullCode);
    }
  };

  // Toggle between TOTP and recovery code
  const toggleMode = () => {
    setShowRecoveryCode(!showRecoveryCode);
    setLocalError('');
    setCode(['', '', '', '', '', '']);
    setRecoveryCode('');
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: '100%',
        maxWidth: 450,
        mx: 'auto',
        p: 4,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.1) 100%)',
          border: '1px solid rgba(139,92,246,0.2)',
        }}
      >
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
            Two-Factor Authentication
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {showRecoveryCode 
              ? 'Enter a recovery code to access your account'
              : 'Enter the 6-digit code from your authenticator app'
            }
          </Typography>
        </Box>

        {(error || localError) && (
          <Alert 
            severity="error" 
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

        {showRecoveryCode ? (
          <TextField
            fullWidth
            label="Recovery Code"
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value)}
            placeholder="XXXX-XXXX"
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
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowRecoveryCode(!showRecoveryCode)}
                    edge="end"
                    sx={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    {showRecoveryCode ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mb: 3 }}>
            {code.map((digit, index) => (
              <TextField
                key={index}
                inputRef={(el) => (inputRefs.current[index] = el)}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                inputProps={{
                  maxLength: 1,
                  style: {
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    padding: '8px',
                    color: '#fff',
                  },
                }}
                disabled={loading}
                sx={{
                  width: 50,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.05)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                  },
                }}
              />
            ))}
          </Box>
        )}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading || (showRecoveryCode ? recoveryCode.length < 6 : code.join('').length !== 6)}
          sx={{
            py: 1.5,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
            fontWeight: 600,
            '&:hover': { background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)' },
            '&:disabled': { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' },
          }}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </Button>

        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

        <Box sx={{ textAlign: 'center' }}>
          <Link
            component="button"
            type="button"
            onClick={toggleMode}
            sx={{
              color: '#a78bfa',
              fontSize: '0.875rem',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {showRecoveryCode 
              ? 'Use authenticator app instead'
              : 'Use recovery code instead'
            }
          </Link>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={onCancel}
            disabled={loading}
            sx={{ color: '#94a3b8', '&:hover': { background: 'rgba(255,255,255,0.05)' } }}
          >
            Back to Login
          </Button>
          <Button
            startIcon={<HelpOutline />}
            onClick={() => alert('Contact support if you lost access to your authenticator app and recovery codes.')}
            sx={{ color: '#94a3b8', '&:hover': { background: 'rgba(255,255,255,0.05)' } }}
          >
            Need Help?
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default MFAVerification;
