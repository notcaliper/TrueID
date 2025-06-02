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
  Grid,
  Badge
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon, 
  Pending as PendingIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  AutorenewRounded as AutorenewIcon
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

  const [refreshing, setRefreshing] = useState(false);

  const fetchVerificationStatus = async () => {
    setError(null);
    setRefreshing(true);
    
    try {
      // Only show loading indicator on initial load, not during refresh
      if (loading) {
        setLoading(true);
      }
      
      const response = await userAPI.getVerificationStatus();
      console.log('Verification status response:', response);
      
      // Check if we have the expected data structure
      if (!response.data) {
        throw new Error('Invalid response format from API');
      }
      
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
        verificationSteps: steps,
        lastUpdated: new Date() // Add timestamp for last update
      });
    } catch (err) {
      console.error('Error fetching verification status:', err);
      setError('Failed to load verification status. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Initial fetch when component mounts
  useEffect(() => {
    fetchVerificationStatus();
    
    // Set up polling every 30 seconds to check for status updates
    const pollingInterval = setInterval(() => {
      fetchVerificationStatus();
    }, 30000); // 30 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(pollingInterval);
  }, []);
  
  // Debug function to help diagnose status issues
  const debugStatus = () => {
    console.log('Current verification data:', verificationData);
    return null;
  }

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
          <Button 
            variant="outlined" 
            size="small" 
            onClick={fetchVerificationStatus} 
            sx={{ mr: 2 }}
            startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
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
        
        {verificationData.lastUpdated && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Last updated: {formatDate(verificationData.lastUpdated.toISOString())}
            <span style={{ fontStyle: 'italic', marginLeft: '8px' }}>(Updates automatically every 30 seconds)</span>
          </Typography>
        )}
        
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
