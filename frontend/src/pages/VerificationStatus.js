import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Grid
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon, 
  Pending as PendingIcon,
  Error as ErrorIcon 
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api.service';

const VerificationStatus = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verificationData, setVerificationData] = useState({
    status: 'PENDING',
    submittedAt: null,
    verifiedAt: null,
    rejectionReason: null,
    verificationSteps: []
  });

  useEffect(() => {
    const fetchVerificationStatus = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await userAPI.getVerificationStatus();
        
        // Format verification steps based on status
        const steps = [
          {
            label: 'Registration Submitted',
            description: 'Your registration has been submitted successfully.',
            completed: true,
            date: response.data.submittedAt
          },
          {
            label: 'Identity Verification',
            description: response.data.status === 'REJECTED' 
              ? `Your identity verification was rejected. Reason: ${response.data.rejectionReason || 'Not specified'}`
              : 'Your identity is being verified by government authorities.',
            completed: response.data.status !== 'PENDING',
            date: response.data.verifiedAt,
            status: response.data.status
          },
          {
            label: 'Wallet Activation',
            description: 'Your Avalanche wallet will be activated once your identity is verified.',
            completed: response.data.status === 'VERIFIED',
            date: response.data.status === 'VERIFIED' ? response.data.verifiedAt : null
          }
        ];
        
        setVerificationData({
          status: response.data.status,
          submittedAt: response.data.submittedAt,
          verifiedAt: response.data.verifiedAt,
          rejectionReason: response.data.rejectionReason,
          verificationSteps: steps
        });
      } catch (err) {
        console.error('Error fetching verification status:', err);
        setError('Failed to load verification status. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVerificationStatus();
  }, []);

  const getStatusIcon = (step) => {
    if (step.completed) {
      if (step.status === 'REJECTED') {
        return <ErrorIcon color="error" />;
      }
      return <CheckCircleIcon color="success" />;
    }
    return <PendingIcon color="action" />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'VERIFIED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Pending';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Verification Status
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Current Status
          </Typography>
          <Chip 
            label={verificationData.status} 
            color={getStatusColor(verificationData.status)} 
            icon={
              verificationData.status === 'VERIFIED' ? <CheckCircleIcon /> :
              verificationData.status === 'PENDING' ? <PendingIcon /> :
              <ErrorIcon />
            }
          />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Submitted At
            </Typography>
            <Typography variant="body1">
              {formatDate(verificationData.submittedAt)}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Verified At
            </Typography>
            <Typography variant="body1">
              {formatDate(verificationData.verifiedAt)}
            </Typography>
          </Grid>
          
          {verificationData.status === 'REJECTED' && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                Rejection Reason
              </Typography>
              <Typography variant="body1" color="error">
                {verificationData.rejectionReason || 'No reason provided'}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Verification Process
        </Typography>
        
        <Stepper orientation="vertical" activeStep={-1}>
          {verificationData.verificationSteps.map((step, index) => (
            <Step key={step.label} completed={step.completed}>
              <StepLabel 
                StepIconComponent={() => getStatusIcon(step)}
              >
                <Typography variant="subtitle1">
                  {step.label}
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {step.description}
                </Typography>
                {step.date && (
                  <Typography variant="body2" color="text.secondary">
                    Date: {formatDate(step.date)}
                  </Typography>
                )}
              </StepContent>
            </Step>
          ))}
        </Stepper>
        
        {verificationData.status === 'REJECTED' && (
          <Box sx={{ mt: 3 }}>
            <Alert severity="info">
              If your verification was rejected, please contact the government authorities for more information.
            </Alert>
          </Box>
        )}
        
        {verificationData.status === 'PENDING' && (
          <Box sx={{ mt: 3 }}>
            <Alert severity="info">
              Your verification is in progress. This process typically takes 1-3 business days.
            </Alert>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default VerificationStatus;
