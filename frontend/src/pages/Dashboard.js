import React, { useState, useEffect, useCallback } from 'react';
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
  Avatar,
  Tooltip,
  Badge
} from '@mui/material';
import ConnectionTest from '../components/ConnectionTest';
import {
  AccountBalanceWallet as WalletIcon,
  VerifiedUser as VerifiedUserIcon,
  Work as WorkIcon,
  Security as BlockchainIcon,
  Fingerprint as BiometricIcon,
  Refresh as RefreshIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { userAPI, blockchainAPI, walletAPI } from '../services/api.service';
import walletService from '../services/wallet.service';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState({
    connected: false,
    checking: true,
    lastCheck: null,
    database: null,
    uptime: null
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    verificationStatus: 'PENDING',
    verificationDetails: null,
    walletBalance: '0',
    blockchainStatus: false,
    blockchainDetails: null,
    professionalRecords: 0,
    recordsList: [],
    transactions: [],
    lastTransactionDate: null,
    biometricStatus: null
  });
  const [pollingActive, setPollingActive] = useState(true);
  const [apiErrors, setApiErrors] = useState({});

  // Check backend connection status
  const checkBackendConnection = useCallback(async () => {
    try {
      setBackendStatus(prev => ({ ...prev, checking: true }));
      // Simple health check endpoint
      const response = await fetch('http://localhost:5000/api/health', { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        // timeout: 5000 // Timeout is not a standard fetch option, consider AbortController
      });
      
      if (!response.ok) {
        throw new Error(`Backend health check failed with status ${response.status}`);
      }
      
      const data = await response.json();
      setBackendStatus({
        connected: data.status === 'ok',
        checking: false,
        lastCheck: new Date(),
        database: data.database,
        uptime: data.uptime
      });
      
      return data.status === 'ok'; // Corrected return value
    } catch (error) {
      console.error('Backend connection check failed:', error);
      setBackendStatus({
        connected: false,
        checking: false,
        lastCheck: new Date()
      });
      return false;
    }
  }, [/* setBackendStatus is stable */]);

  const fetchDashboardData = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    setApiErrors({});
    
    // Check backend connection first
    const isConnected = await checkBackendConnection();
    if (!isConnected) {
      setError('Cannot connect to backend server. Please check if the server is running.');
      setLoading(false);
      setInitialLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      // Create an array of promises to fetch data in parallel
      const promises = [];
      const errorMap = {};
      
      // 1. Verification Status - with detailed information
      const verificationStatusPromise = userAPI.getVerificationStatus()
        .then(response => {
          console.log('Verification status response:', response);
          // Extract and format verification details
          const verificationData = response.data || { status: 'PENDING' };
          
          // Ensure we have a properly formatted verification details object
          const verificationDetails = {
            status: verificationData.status || 'PENDING',
            submittedAt: verificationData.submittedAt || null,
            lastUpdated: verificationData.lastUpdated || verificationData.updatedAt || null,
            reviewer: verificationData.reviewer || null,
            rejectionReason: verificationData.rejectionReason || null,
            documentCount: verificationData.documents?.length || 0,
            notes: verificationData.notes || null
          };
          
          return {
            data: verificationDetails,
            success: true
          };
        })
        .catch(err => {
          console.error('Error fetching verification status:', err);
          errorMap.verification = err.message || 'Failed to fetch verification status';
          return { 
            data: { status: 'PENDING' },
            success: false
          };
        });
      promises.push(verificationStatusPromise);
      
      // 2. Blockchain Status - with transaction details
      const blockchainStatusPromise = userAPI.getBlockchainStatus()
        .then(response => {
          console.log('Blockchain status response:', response);
          // Extract and format blockchain details
          const blockchainData = response.data || { isOnBlockchain: false };
          
          // Ensure we have a properly formatted blockchain details object
          const blockchainDetails = {
            isOnBlockchain: blockchainData.isOnBlockchain || false,
            contractAddress: blockchainData.contractAddress || '0x266B577380aE3De838A66DEf28fffD5e75c5816E',
            transactionHash: blockchainData.transactionHash || null,
            timestamp: blockchainData.timestamp || blockchainData.recordedAt || null,
            network: blockchainData.network || 'Avalanche Fuji Testnet',
            status: blockchainData.status || (blockchainData.isOnBlockchain ? 'CONFIRMED' : 'NOT_RECORDED')
          };
          
          return {
            data: blockchainDetails,
            success: true
          };
        })
        .catch(err => {
          console.error('Error fetching blockchain status:', err);
          errorMap.blockchain = err.message || 'Failed to fetch blockchain status';
          return { 
            data: { isOnBlockchain: false },
            success: false
          };
        });
      promises.push(blockchainStatusPromise);
      
      // 3. Professional Records - with full record details
      const professionalRecordsPromise = userAPI.getProfessionalRecords()
        .then(response => {
          console.log('Professional records response:', response);
          // Extract and format professional records
          const recordsData = response.data || { records: [] };
          
          // Ensure each record has all required fields
          const formattedRecords = (recordsData.records || []).map(record => ({
            id: record.id || Math.random().toString(36).substring(2, 9),
            title: record.title || 'Untitled Record',
            organization: record.organization || 'Unknown Organization',
            date: record.date || record.issuedAt || null,
            verified: record.verified || false,
            onBlockchain: record.onBlockchain || false,
            description: record.description || '',
            category: record.category || 'Other'
          }));
          
          // Sort records by date (newest first) if available
          const sortedRecords = formattedRecords.sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(b.date) - new Date(a.date);
          });
          
          return {
            data: { records: sortedRecords },
            success: true
          };
        })
        .catch(err => {
          console.error('Error fetching professional records:', err);
          errorMap.records = err.message || 'Failed to fetch professional records';
          return { 
            data: { records: [] },
            success: false
          };
        });
      promises.push(professionalRecordsPromise);
      
      // 4. Wallet Balance - using wallet service for better caching and retry
      let walletBalancePromise = Promise.resolve({ data: '0', success: true });
      if (user && user.walletAddress) {
        walletBalancePromise = walletService.getBalance(user.walletAddress, isRefreshing)
          .then(balance => ({
            data: balance,
            success: true
          }))
          .catch(err => {
            console.error('Error fetching wallet balance:', err);
            errorMap.wallet = err.message || 'Failed to fetch wallet balance';
            return { 
              data: '0',
              success: false
            };
          });
      }
      promises.push(walletBalancePromise);
      
      // 5. Transaction History - for blockchain activity
      const transactionsPromise = blockchainAPI.getUserTransactions()
        .then(response => {
          console.log('Transactions response:', response);
          return {
            data: response.data?.transactions || [],
            success: true
          };
        })
        .catch(err => {
          console.error('Error fetching transactions:', err);
          errorMap.transactions = err.message || 'Failed to fetch transaction history';
          return { 
            data: [],
            success: false
          };
        });
      promises.push(transactionsPromise);
      
      // 6. Biometric Verification Status
      const biometricStatusPromise = userAPI.getBiometricStatus()
        .then(response => {
          console.log('Biometric status response:', response);
          return {
            data: response.data || {
              verified: false,
              facemeshExists: false,
              lastVerified: null,
              verificationCount: 0,
              successfulVerifications: 0
            },
            success: true
          };
        })
        .catch(err => {
          console.error('Error fetching biometric status:', err);
          errorMap.biometric = err.message || 'Failed to fetch biometric status';
          return { 
            data: {
              verified: false,
              facemeshExists: false,
              lastVerified: null,
              verificationCount: 0,
              successfulVerifications: 0
            },
            success: false
          };
        });
      promises.push(biometricStatusPromise);
      
      // Wait for all promises to resolve
      const [
        verificationResponse, 
        blockchainResponse, 
        recordsResponse, 
        walletBalance,
        transactionsResponse,
        biometricResponse
      ] = await Promise.all(promises);
      
      // Set any API errors that occurred
      if (Object.keys(errorMap).length > 0) {
        setApiErrors(errorMap);
      }
      
      // Calculate the last transaction date if available
      let lastTransactionDate = null;
      if (transactionsResponse.success && transactionsResponse.data.length > 0) {
        const sortedTransactions = [...transactionsResponse.data]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        if (sortedTransactions.length > 0) {
          lastTransactionDate = new Date(sortedTransactions[0].timestamp);
        }
      }
      
      // Update dashboard data with whatever we could successfully fetch
      setDashboardData(prev => {
        // Process verification data
        const verificationStatus = verificationResponse.success ? verificationResponse.data.status : prev.verificationStatus;
        const verificationDetails = verificationResponse.success ? verificationResponse.data : prev.verificationDetails;
        
        // Process blockchain data
        const blockchainStatus = blockchainResponse.success ? blockchainResponse.data.isOnBlockchain : prev.blockchainStatus;
        const blockchainDetails = blockchainResponse.success ? blockchainResponse.data : prev.blockchainDetails;
        
        // Process professional records data
        const recordsList = recordsResponse.success ? recordsResponse.data.records : prev.recordsList;
        const professionalRecords = recordsList.length;
        
        // Process wallet and transaction data
        const walletBalance = walletBalance.success ? walletBalance.data : prev.walletBalance;
        const transactions = transactionsResponse.success ? transactionsResponse.data : prev.transactions;
        
        // Process biometric status
        const biometricStatus = biometricResponse.success ? biometricResponse.data : prev.biometricStatus;
        
        // Log the updated data for debugging
        console.log('Updated dashboard data:', {
          verificationStatus,
          blockchainStatus,
          professionalRecords,
          walletBalance,
          transactionCount: transactions.length,
          lastTransactionDate,
          biometricStatus
        });
        
        return {
          verificationStatus,
          verificationDetails,
          walletBalance,
          blockchainStatus,
          blockchainDetails,
          professionalRecords,
          recordsList,
          transactions,
          lastTransactionDate: lastTransactionDate || prev.lastTransactionDate,
          biometricStatus
        };
      });
      
      // Set the last updated timestamp
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      
      // Handle specific error types
      if (err.response && err.response.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (err.message && err.message.includes('Network Error')) {
        setError('Network error. Please check your connection and try again.');
      } else if (err.message && err.message.includes('timeout')) {
        setError('Request timed out. The server may be overloaded or unavailable.');
      } else {
        setError('Failed to load dashboard data. Please try again later.');
      }
    } finally {
      setLoading(false);
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [user, checkBackendConnection]);

  // Function to handle manual refresh
  const handleRefresh = useCallback(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Toggle polling on/off
  const togglePolling = useCallback(() => {
    setPollingActive(prev => !prev);
  }, []);

  // Set up polling for dashboard data
  useEffect(() => {
    // Initial fetch
    fetchDashboardData();
    
    // Set up polling interval (every 15 seconds) if polling is active
    let intervalId = null;
    if (pollingActive) {
      intervalId = setInterval(() => {
        fetchDashboardData(true);
      }, 15000); // 15 seconds
    }
    
    // Clean up interval on unmount or when polling is toggled off
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchDashboardData, pollingActive]);
  
  // Auto-refresh when user becomes active after being away
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // User has returned to the tab - refresh data
        fetchDashboardData(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleRefresh);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleRefresh);
    };
  }, [fetchDashboardData, handleRefresh]);

  // Initial data fetch only (polling is handled in the other useEffect)
  useEffect(() => {
    const initializeData = async () => {
      const isConnected = await checkBackendConnection();
      if (isConnected) {
        fetchDashboardData();
      }
    };
    
    if (initialLoading) { // Only run initializeData on initial load
        initializeData();
    }
  }, [checkBackendConnection, fetchDashboardData, initialLoading]);

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

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Backend connection status */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" gutterBottom>
            Backend Connection Status
          </Typography>
          <Box>
            <Tooltip title={pollingActive ? "Disable auto-refresh" : "Enable auto-refresh"}>
              <Button 
                size="small" 
                onClick={togglePolling} 
                startIcon={pollingActive ? <SyncIcon color="primary" /> : <SyncIcon color="disabled" />}
              >
                {pollingActive ? "Auto-refresh ON" : "Auto-refresh OFF"}
              </Button>
            </Tooltip>
            <Button 
              size="small" 
              onClick={handleRefresh} 
              disabled={refreshing}
              startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
              sx={{ ml: 1 }}
            >
              {refreshing ? "Refreshing..." : "Refresh Now"}
            </Button>
          </Box>
        </Box>
        {backendStatus.checking ? (
          <Box display="flex" alignItems="center">
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2">Checking connection...</Typography>
          </Box>
        ) : backendStatus.connected ? (
          <Alert severity="success" sx={{ mb: 1 }}>
            API is connected successfully! {backendStatus.uptime && `Server uptime: ${backendStatus.uptime}`}
            {backendStatus.database && <Box component="span" sx={{ ml: 1 }}>Database: {backendStatus.database.status}</Box>}
          </Alert>
        ) : (
          <Alert severity="error" sx={{ mb: 1 }}>
            Cannot connect to backend server. Please check if the server is running on port 5000.
          </Alert>
        )}
        {lastUpdated && (
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastUpdated.toLocaleString()}
          </Typography>
        )}
      </Box>

      {/* Error message */}
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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Identity Status
          </Typography>
          {apiErrors.verification && (
            <Tooltip title={apiErrors.verification}>
              <Chip label="API Error" color="error" size="small" />
            </Tooltip>
          )}
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Chip 
                label={dashboardData.verificationStatus} 
                color={getStatusColor(dashboardData.verificationStatus)} 
                icon={<VerifiedUserIcon />}
                sx={{ mr: 1 }}
              />
              {refreshing && (
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                  <CircularProgress size={12} sx={{ mr: 0.5 }} />
                  <Typography variant="caption" color="text.secondary">
                    Updating...
                  </Typography>
                </Box>
              )}
            </Box>
            <Typography variant="body1">
              {dashboardData.verificationStatus === 'VERIFIED' 
                ? 'Your identity has been verified successfully.' 
                : dashboardData.verificationStatus === 'PENDING' 
                  ? 'Your identity verification is pending review.' 
                  : dashboardData.verificationStatus === 'REJECTED'
                    ? 'Your identity verification was rejected.'
                    : 'Your identity verification status is unknown.'}
            </Typography>
            {dashboardData.verificationDetails?.message && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {dashboardData.verificationDetails.message}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Verification Details
              </Typography>
              <Typography variant="body2" component="div">
                <Box component="span" sx={{ display: 'block', mb: 0.5 }}>
                  <strong>Submitted:</strong> {dashboardData.verificationDetails?.submittedAt 
                    ? new Date(dashboardData.verificationDetails.submittedAt).toLocaleString() 
                    : 'Not submitted'}
                </Box>
                {dashboardData.verificationDetails?.reviewedAt && (
                  <Box component="span" sx={{ display: 'block', mb: 0.5 }}>
                    <strong>Reviewed:</strong> {new Date(dashboardData.verificationDetails.reviewedAt).toLocaleString()}
                  </Box>
                )}
                {dashboardData.verificationDetails?.reviewer && (
                  <Box component="span" sx={{ display: 'block', mb: 0.5 }}>
                    <strong>Reviewer:</strong> {dashboardData.verificationDetails.reviewer}
                  </Box>
                )}
                {dashboardData.verificationDetails?.documents && (
                  <Box component="span" sx={{ display: 'block' }}>
                    <strong>Documents:</strong> {dashboardData.verificationDetails.documents.length} submitted
                  </Box>
                )}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            size="small" 
            component={RouterLink} 
            to="/verification-status"
            endIcon={<VerifiedUserIcon />}
          >
            View Full Verification Details
          </Button>
        </Box>
      </Paper>
      
      <Grid container spacing={3}>
        
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <WalletIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Wallet</Typography>
                </Box>
                {apiErrors.wallet && (
                  <Tooltip title={apiErrors.wallet}>
                    <Chip label="API Error" color="error" size="small" />
                  </Tooltip>
                )}
              </Box>
              <Box sx={{ position: 'relative' }}>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {parseFloat(dashboardData.walletBalance || '0').toFixed(4)} AVAX
                </Typography>
                {refreshing && (
                  <Box sx={{ position: 'absolute', top: 0, right: 0, display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={16} sx={{ mr: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">
                      Updating...
                    </Typography>
                  </Box>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                Your Avalanche C-Chain balance on Fuji Testnet
              </Typography>
              
              {user?.walletAddress && (
                <Box sx={{ mt: 2, bgcolor: 'background.default', p: 1.5, borderRadius: 1, wordBreak: 'break-all' }}>
                  <Typography variant="caption" component="div">
                    <strong>Address:</strong> {user.walletAddress}
                  </Typography>
                  {dashboardData.transactions && dashboardData.transactions.length > 0 && (
                    <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                      <strong>Last transaction:</strong> {dashboardData.lastTransactionDate ? 
                        dashboardData.lastTransactionDate.toLocaleString() : 'Unknown'}
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
            <Divider />
            <CardActions>
              <Button 
                size="small" 
                component={RouterLink} 
                to="/wallet"
                endIcon={<WalletIcon />}
              >
                View Wallet Details
              </Button>
              {user?.walletAddress && (
                <Button 
                  size="small"
                  component="a"
                  href={`https://testnet.snowtrace.io/address/${user.walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Snowtrace
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <VerifiedUserIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Verification</Typography>
                </Box>
                {apiErrors.verification && (
                  <Tooltip title={apiErrors.verification}>
                    <Chip label="API Error" color="error" size="small" />
                  </Tooltip>
                )}
              </Box>
              <Box sx={{ position: 'relative' }}>
                <Chip 
                  label={dashboardData.verificationStatus} 
                  color={getStatusColor(dashboardData.verificationStatus)} 
                  sx={{ mb: 1 }}
                />
                {refreshing && (
                  <Box sx={{ position: 'absolute', top: 0, right: 0, display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={16} sx={{ mr: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">
                      Updating...
                    </Typography>
                  </Box>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {dashboardData.verificationStatus === 'VERIFIED' 
                  ? "Your identity has been successfully verified" 
                  : dashboardData.verificationStatus === 'PENDING'
                    ? "Your identity verification is being reviewed"
                    : dashboardData.verificationStatus === 'REJECTED'
                      ? "Your identity verification was rejected"
                      : "Identity verification status"}
              </Typography>
              
              {dashboardData.verificationDetails && (
                <Box sx={{ mt: 1.5, bgcolor: 'background.default', p: 1.5, borderRadius: 1 }}>
                  {dashboardData.verificationDetails.submittedAt && (
                    <Typography variant="caption" component="div">
                      <strong>Submitted:</strong> {new Date(dashboardData.verificationDetails.submittedAt).toLocaleDateString()}
                    </Typography>
                  )}
                  {dashboardData.verificationDetails.lastUpdated && (
                    <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
                      <strong>Last updated:</strong> {new Date(dashboardData.verificationDetails.lastUpdated).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
            <Divider />
            <CardActions>
              <Button 
                size="small" 
                component={RouterLink} 
                to="/verification-status"
                endIcon={<VerifiedUserIcon />}
              >
                View Verification Details
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BiometricIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Biometric Verification</Typography>
                </Box>
                {apiErrors.biometric && (
                  <Tooltip title={apiErrors.biometric}>
                    <Chip label="API Error" color="error" size="small" />
                  </Tooltip>
                )}
              </Box>
              <Box sx={{ position: 'relative' }}>
                <Chip 
                  label={dashboardData.biometricStatus?.verified ? "Verified" : "Not Verified"} 
                  color={dashboardData.biometricStatus?.verified ? "success" : "default"} 
                  sx={{ mb: 1 }}
                />
                {refreshing && (
                  <Box sx={{ position: 'absolute', top: 0, right: 0, display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={16} sx={{ mr: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">
                      Updating...
                    </Typography>
                  </Box>
                )}
              </Box>
              <Typography variant="body2" paragraph>
                Verify your identity using biometrics for sensitive operations
              </Typography>
              
              {dashboardData.biometricStatus?.facemeshExists ? (
                <Box sx={{ mt: 1.5, bgcolor: 'background.default', p: 1.5, borderRadius: 1 }}>
                  {dashboardData.biometricStatus.lastVerified && (
                    <Typography variant="caption" component="div">
                      <strong>Last verified:</strong> {new Date(dashboardData.biometricStatus.lastVerified).toLocaleString()}
                    </Typography>
                  )}
                  {dashboardData.biometricStatus.verificationCount > 0 && (
                    <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
                      <strong>Verification attempts:</strong> {dashboardData.biometricStatus.successfulVerifications} successful out of {dashboardData.biometricStatus.verificationCount}
                    </Typography>
                  )}
                  {dashboardData.biometricStatus.biometricDetails?.verificationScore && (
                    <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
                      <strong>Match score:</strong> {(dashboardData.biometricStatus.biometricDetails.verificationScore * 100).toFixed(1)}%
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No biometric data has been registered yet. Please complete the verification process.
                </Typography>
              )}
            </CardContent>
            <Divider />
            <CardActions>
              <Button 
                size="small" 
                component={RouterLink} 
                to="/biometric-verification"
                endIcon={<BiometricIcon />}
              >
                {dashboardData.biometricStatus?.verified ? "Update Biometrics" : "Verify Now"}
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <WorkIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Professional Records</Typography>
                </Box>
                {apiErrors.records && (
                  <Tooltip title={apiErrors.records}>
                    <Chip label="API Error" color="error" size="small" />
                  </Tooltip>
                )}
              </Box>
              <Box sx={{ position: 'relative' }}>
                <Typography variant="h4">{dashboardData.professionalRecords}</Typography>
                {refreshing && (
                  <Box sx={{ position: 'absolute', top: 0, right: 0, display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={16} sx={{ mr: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">
                      Updating...
                    </Typography>
                  </Box>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {dashboardData.professionalRecords === 0 
                  ? "No professional records added yet" 
                  : dashboardData.professionalRecords === 1
                    ? "Professional record added"
                    : `${dashboardData.professionalRecords} professional records added`}
              </Typography>
              
              {dashboardData.recordsList && dashboardData.recordsList.length > 0 && (
                <Box sx={{ mt: 2, bgcolor: 'background.default', p: 1.5, borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recent Records:
                  </Typography>
                  {dashboardData.recordsList.slice(0, 2).map((record, index) => (
                    <Box key={index} sx={{ mb: index < Math.min(dashboardData.recordsList.length, 2) - 1 ? 1 : 0 }}>
                      <Typography variant="caption" component="div" sx={{ fontWeight: 'bold' }}>
                        {record.title || 'Untitled Record'}
                      </Typography>
                      <Typography variant="caption" component="div" color="text.secondary">
                        {record.organization || 'Unknown organization'}
                      </Typography>
                    </Box>
                  ))}
                  {dashboardData.recordsList.length > 2 && (
                    <Typography variant="caption" color="text.secondary">
                      +{dashboardData.recordsList.length - 2} more records
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
            <Divider />
            <CardActions>
              <Button 
                size="small" 
                component={RouterLink} 
                to="/professional-records"
                endIcon={<WorkIcon />}
              >
                View All Records
              </Button>
              <Button 
                size="small"
                component={RouterLink}
                to="/professional-records/add"
              >
                Add New Record
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BlockchainIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Blockchain Status</Typography>
                </Box>
                {apiErrors.blockchain && (
                  <Tooltip title={apiErrors.blockchain}>
                    <Chip label="API Error" color="error" size="small" />
                  </Tooltip>
                )}
              </Box>
              <Box sx={{ position: 'relative' }}>
                <Chip 
                  label={dashboardData.blockchainStatus ? "On Blockchain" : "Not on Blockchain"} 
                  color={dashboardData.blockchainStatus ? "success" : "default"} 
                  sx={{ mb: 1 }}
                />
                {refreshing && (
                  <Box sx={{ position: 'absolute', top: 0, right: 0, display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={16} sx={{ mr: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">
                      Updating...
                    </Typography>
                  </Box>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {dashboardData.blockchainStatus 
                  ? "Your identity is securely stored on the Avalanche blockchain" 
                  : dashboardData.verificationStatus === 'VERIFIED'
                    ? "Your identity is verified and ready to be transferred to blockchain"
                    : "Complete identity verification to enable blockchain transfer"}
              </Typography>
              
              {dashboardData.blockchainDetails && (
                <Box sx={{ mt: 2, bgcolor: 'background.default', p: 1.5, borderRadius: 1 }}>
                  <Typography variant="caption" component="div">
                    <strong>Contract:</strong> {dashboardData.blockchainDetails.contractAddress 
                      ? dashboardData.blockchainDetails.contractAddress.substring(0, 10) + '...' 
                      : '0x266B577380aE3De838A66DEf28fffD5e75c5816E'}
                  </Typography>
                  {dashboardData.blockchainDetails.transactionHash && (
                    <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
                      <strong>Transaction:</strong> {dashboardData.blockchainDetails.transactionHash.substring(0, 10) + '...'}
                    </Typography>
                  )}
                  {dashboardData.blockchainDetails.timestamp && (
                    <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
                      <strong>Recorded:</strong> {new Date(dashboardData.blockchainDetails.timestamp).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
            <Divider />
            <CardActions>
              <Button 
                size="small" 
                component={RouterLink} 
                to="/blockchain-status"
                endIcon={<BlockchainIcon />}
              >
                {dashboardData.blockchainStatus ? "View Blockchain Details" : "Transfer to Blockchain"}
              </Button>
              {dashboardData.blockchainDetails?.transactionHash && (
                <Button 
                  size="small"
                  component="a"
                  href={`https://testnet.snowtrace.io/tx/${dashboardData.blockchainDetails.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Transaction
                </Button>
              )}
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
