import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Container,
  Avatar
} from '@mui/material';
import ConnectionTest from '../components/ConnectionTest';
import {
  AccountBalanceWallet as WalletIcon,
  VerifiedUser as VerifiedUserIcon,
  Work as WorkIcon,
  Security as BlockchainIcon,
  Fingerprint as BiometricIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { userAPI, blockchainAPI } from '../services/api.service';
import walletService from '../services/wallet.service';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    verificationStatus: 'PENDING',
    walletBalance: '0',
    blockchainStatus: false,
    professionalRecords: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch verification status
        const verificationResponse = await userAPI.getVerificationStatus();
        
        // Fetch blockchain status
        const blockchainResponse = await userAPI.getBlockchainStatus();
        
        // Fetch professional records count
        const recordsResponse = await userAPI.getProfessionalRecords();
        
        // Fetch wallet balance if available
        let walletBalance = '0';
        if (user && user.walletAddress) {
          try {
            walletBalance = await walletService.getBalance(user.walletAddress);
          } catch (walletError) {
            console.error('Error fetching wallet balance:', walletError);
          }
        }
        
        setDashboardData({
          verificationStatus: verificationResponse.data.status,
          walletBalance,
          blockchainStatus: blockchainResponse.data.isOnBlockchain,
          professionalRecords: recordsResponse.data.records.length
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <ConnectionTest />
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
          <Typography variant="h5">
            Welcome, {user?.name || 'User'}
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Your TrueID dashboard provides an overview of your digital identity status and related information.
        </Typography>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Identity Status
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Chip 
              label={dashboardData.verificationStatus} 
              color={getStatusColor(dashboardData.verificationStatus)} 
              icon={<VerifiedUserIcon />}
            />
          </Grid>
          <Grid item>
            <Typography variant="body1">
              {dashboardData.verificationStatus === 'VERIFIED' 
                ? 'Your identity has been verified.' 
                : dashboardData.verificationStatus === 'PENDING' 
                  ? 'Your identity verification is pending.' 
                  : 'Your identity verification was rejected.'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <Grid container spacing={3}>
        
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VerifiedUserIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Verification</Typography>
              </Box>
              <Chip 
                label={dashboardData.verificationStatus} 
                color={getStatusColor(dashboardData.verificationStatus)} 
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Identity verification status
              </Typography>
            </CardContent>
            <Divider />
            <CardActions>
              <Button 
                size="small" 
                component={RouterLink} 
                to="/verification-status"
              >
                View Details
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BiometricIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Biometric Verification</Typography>
              </Box>
              <Typography variant="body2" paragraph>
                Verify your identity using biometrics for sensitive operations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Now separate from login process
              </Typography>
            </CardContent>
            <Divider />
            <CardActions>
              <Button 
                size="small" 
                component={RouterLink} 
                to="/biometric-verification"
              >
                Verify Now
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WorkIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Professional Records</Typography>
              </Box>
              <Typography variant="h4">{dashboardData.professionalRecords}</Typography>
              <Typography variant="body2" color="text.secondary">
                Number of professional records
              </Typography>
            </CardContent>
            <Divider />
            <CardActions>
              <Button 
                size="small" 
                component={RouterLink} 
                to="/professional-records"
              >
                View Records
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BlockchainIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Blockchain Status</Typography>
              </Box>
              <Chip 
                label={dashboardData.blockchainStatus ? "On Blockchain" : "Not on Blockchain"} 
                color={dashboardData.blockchainStatus ? "success" : "default"} 
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Your identity on blockchain
              </Typography>
            </CardContent>
            <Divider />
            <CardActions>
              <Button 
                size="small" 
                component={RouterLink} 
                to="/blockchain-status"
              >
                View Details
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      
      {!dashboardData.blockchainStatus && dashboardData.verificationStatus === 'VERIFIED' && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Transfer Your Identity to Blockchain
          </Typography>
          <Typography variant="body1" paragraph>
            Your identity has been verified. You can now transfer it to the blockchain for enhanced security and portability.
          </Typography>
          <Button 
            variant="contained" 
            component={RouterLink} 
            to="/blockchain-status"
          >
            Transfer to Blockchain
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default Dashboard;
