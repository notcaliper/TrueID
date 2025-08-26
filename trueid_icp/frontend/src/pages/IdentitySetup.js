import React, { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const steps = [
  'Connect Internet Identity',
  'Biometric Verification',
  'Complete Setup'
];

const IdentitySetup = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { setupIdentity } = useAuth();

  const handleNext = async () => {
    setLoading(true);
    try {
      // Simulate setup process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (activeStep === steps.length - 1) {
        // Complete setup
        await setupIdentity();
      } else {
        setActiveStep((prevStep) => prevStep + 1);
      }
    } catch (error) {
      console.error('Setup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Connect Your Internet Identity
            </Typography>
            <Typography variant="body1" paragraph>
              Internet Identity provides secure, anonymous authentication for the Internet Computer.
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              You'll be redirected to Internet Identity to authenticate securely.
            </Alert>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Biometric Verification
            </Typography>
            <Typography variant="body1" paragraph>
              Set up biometric verification for enhanced security.
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This step requires camera access for facial recognition.
            </Alert>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Complete Your Setup
            </Typography>
            <Typography variant="body1" paragraph>
              Finalize your TrueID identity setup.
            </Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              Your identity will be created on the Internet Computer blockchain.
            </Alert>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Identity Setup
      </Typography>
      <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
        Set up your decentralized identity on TrueID
      </Typography>

      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ mb: 4 }}>
            {renderStepContent(activeStep)}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0 || loading}
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {activeStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default IdentitySetup;
