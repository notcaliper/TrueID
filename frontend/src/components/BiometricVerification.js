import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

/**
 * BiometricVerification component for verifying user identity using biometrics
 * This is separate from the login process and used only for verification
 */
const BiometricVerification = ({ userId, onVerificationComplete }) => {
  const { verifyBiometric, loading } = useAuth();
  const [facemeshCapturing, setFacemeshCapturing] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null); // null, 'success', 'failed'
  const [error, setError] = useState('');

  // Simulate facemesh capture
  const captureFacemesh = async () => {
    setFacemeshCapturing(true);
    setError('');
    
    try {
      // In a real app, this would use a camera and ML model to capture facial biometrics
      // For demo purposes, we'll simulate this with a timeout and mock data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock facemesh data (in a real app, this would be actual biometric data)
      const mockFacemeshData = {
        landmarks: Array.from({ length: 68 }, () => ({
          x: Math.random() * 100,
          y: Math.random() * 100,
          z: Math.random() * 50
        })),
        timestamp: Date.now()
      };
      
      // Call the verification API
      const result = await verifyBiometric(userId, mockFacemeshData);
      
      if (result.success && result.verified) {
        setVerificationStatus('success');
        if (onVerificationComplete) {
          onVerificationComplete(true);
        }
      } else {
        setVerificationStatus('failed');
        setError('Biometric verification failed. Please try again.');
        if (onVerificationComplete) {
          onVerificationComplete(false);
        }
      }
      
      return result.success;
    } catch (err) {
      setError('Failed to capture or verify biometric data. Please try again.');
      setVerificationStatus('failed');
      if (onVerificationComplete) {
        onVerificationComplete(false);
      }
      return false;
    } finally {
      setFacemeshCapturing(false);
    }
  };

  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 3, my: 2 }}>
      <Typography variant="h6" gutterBottom>
        Biometric Verification
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        This will verify your identity using your biometric data. Please ensure you are in a well-lit environment and look directly at the camera.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {verificationStatus === 'success' && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Biometric verification successful!
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Button
          variant="contained"
          color={verificationStatus === 'success' ? "success" : "primary"}
          onClick={captureFacemesh}
          disabled={facemeshCapturing || loading || verificationStatus === 'success'}
          startIcon={facemeshCapturing ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {verificationStatus === 'success' 
            ? "Verified ✓" 
            : facemeshCapturing 
              ? "Capturing..." 
              : "Start Biometric Verification"}
        </Button>
      </Box>
    </Paper>
  );
};

export default BiometricVerification;
