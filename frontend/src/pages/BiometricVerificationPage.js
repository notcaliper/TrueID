import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Alert
} from '@mui/material';
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
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            width: '100%',
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center'
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Biometric Verification
          </Typography>
          
          <Typography variant="body1" paragraph align="center">
            This page demonstrates biometric verification separate from the login process.
            You can use this to verify your identity for sensitive operations.
          </Typography>
          
          {verificationComplete && verificationSuccess && (
            <Alert severity="success" sx={{ width: '100%', mb: 3 }}>
              Your identity has been successfully verified! You can now proceed with sensitive operations.
            </Alert>
          )}
          
          {user ? (
            <>
              <Typography variant="body2" color="text.secondary" paragraph align="center" sx={{ mb: 3 }}>
                Position your face in the center of the camera frame. The system will detect your face
                using brightness, contrast, and edge detection. A green rectangle will appear when your face is detected.
              </Typography>
              
              <BiometricVerification 
                userId={user.id} 
                onVerificationComplete={handleVerificationComplete}
              />
            </>
          ) : (
            <Alert severity="warning" sx={{ width: '100%' }}>
              You must be logged in to use biometric verification.
            </Alert>
          )}
          
          <Box sx={{ mt: 4, width: '100%' }}>
            <Typography variant="h6" gutterBottom>
              About Biometric Verification
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Biometric verification provides an additional layer of security for sensitive operations.
              Unlike the previous system, biometrics are no longer required for login - you now use your
              username and password for authentication. Biometric verification is used only when needed
              for high-security operations.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Your biometric data is securely stored and is never transmitted in its raw form.
              Only a cryptographic hash of the data is used for verification.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default BiometricVerificationPage;
