import React, { useState, useRef } from 'react';
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
  IconButton,
  useTheme
} from '@mui/material';
import {
  Security,
  ArrowBack,
  HelpOutline,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useColorMode } from '../context/ThemeContext';

/**
 * MFA Verification Component
 * Used during login when MFA is enabled
 */
const MFAVerification = ({ onVerify, onCancel, error, loading }) => {
  const theme = useTheme();
  const { isLight } = useColorMode();
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
        p: { xs: 2, sm: 3 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          background: isLight
            ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(99, 102, 241, 0.08) 100%)'
            : 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
          border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'}`,
          boxShadow: isLight
            ? '0 10px 25px rgba(15, 23, 42, 0.05)'
            : '0 20px 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)',
            }}
          >
            <Security sx={{ color: '#fff', fontSize: 30 }} />
          </Box>
          <Typography variant="h5" fontWeight={800} color="text.primary" gutterBottom>
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
              background: isLight ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.15)',
              color: isLight ? '#b91c1c' : '#fca5a5',
              border: `1px solid ${isLight ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.3)'}`,
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
                bgcolor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                color: theme.palette.text.primary,
                borderRadius: 2,
                '& fieldset': { borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)' },
                '&:hover fieldset': { borderColor: isLight ? '#94a3b8' : 'rgba(255, 255, 255, 0.3)' },
                '&.Mui-focused fieldset': { borderColor: '#2563eb' },
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowRecoveryCode(!showRecoveryCode)}
                    edge="end"
                    sx={{ color: 'text.secondary' }}
                  >
                    {showRecoveryCode ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.2, mb: 3 }}>
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
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    padding: '10px 4px',
                    color: isLight ? '#0f172a' : '#ffffff',
                  },
                }}
                disabled={loading}
                sx={{
                  width: { xs: 42, sm: 50 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                    '& fieldset': { borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)' },
                    '&:hover fieldset': { borderColor: isLight ? '#94a3b8' : 'rgba(255, 255, 255, 0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#2563eb' },
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
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '0.95rem',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
              boxShadow: '0 6px 18px rgba(37, 99, 235, 0.45)',
            },
          }}
        >
          {loading ? 'Verifying...' : 'Verify Identity'}
        </Button>

        <Divider sx={{ my: 3, borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)' }} />

        <Box sx={{ textAlign: 'center' }}>
          <Link
            component="button"
            type="button"
            onClick={toggleMode}
            sx={{
              color: '#2563eb',
              fontSize: '0.875rem',
              fontWeight: 600,
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
            size="small"
            sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}
          >
            Back to Login
          </Button>
          <Button
            startIcon={<HelpOutline />}
            onClick={() => alert('Contact your identity administrator if you have lost your recovery key.')}
            size="small"
            sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}
          >
            Need Help?
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default MFAVerification;
