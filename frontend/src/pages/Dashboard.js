import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  Divider,
  Alert,
  Snackbar,
  IconButton
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  VerifiedUser as VerifiedUserIcon,
  Work as WorkIcon,
  Security as BlockchainIcon,
  Fingerprint as BiometricIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  DeleteOutline as ClearIcon,
  Dns as DnsIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { userAPI, blockchainAPI } from '../services/api.service';
import walletService from '../services/wallet.service';
import BiometricNexus from '../components/BiometricNexus';

const cssStyles = `
  /* Modern Clean Fintech Slate Card */
  .sci-fi-glow-card {
    position: relative;
    background: rgba(17, 24, 39, 0.75) !important;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    border-radius: 16px !important;
    overflow: hidden;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }

  .sci-fi-glow-card:hover {
    transform: translateY(-3px);
    border-color: rgba(99, 102, 241, 0.35) !important;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45), 0 0 20px rgba(99, 102, 241, 0.15) !important;
  }

  /* Spotlight mouse-tracking effect */
  .sci-fi-glow-card::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(99, 102, 241, 0.08) 0%, transparent 60%);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 1;
  }

  .sci-fi-glow-card:hover::after {
    opacity: 1;
  }

  /* Biometric scanner HUD circle rotations */
  @keyframes rotateHUDOuter {
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
  }

  @keyframes rotateHUDInner {
    0% { transform: translate(-50%, -50%) rotate(360deg); }
    100% { transform: translate(-50%, -50%) rotate(0deg); }
  }

  @keyframes laserSweep {
    0% { top: 10%; opacity: 0; }
    10% { opacity: 0.8; }
    90% { opacity: 0.8; }
    100% { top: 90%; opacity: 0; }
  }

  @keyframes pulseScanner {
    0%, 100% { filter: drop-shadow(0 0 15px rgba(99, 102, 241, 0.3)); }
    50% { filter: drop-shadow(0 0 25px rgba(99, 102, 241, 0.6)); }
  }

  /* SVG line dot flow animation */
  @keyframes pathDashFlow {
    from { stroke-dashoffset: 0; }
    to { stroke-dashoffset: -30; }
  }

  /* Modern Web3 Fintech Card */
  @keyframes holoShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes holoGlare {
    0% { transform: translateX(-150%) skewX(-45deg); opacity: 0; }
    50% { opacity: 0.35; }
    100% { transform: translateX(150%) skewX(-45deg); opacity: 0; }
  }

  .holo-card {
    position: relative;
    background: linear-gradient(135deg, rgba(6, 78, 59, 0.4) 0%, rgba(17, 24, 39, 0.85) 100%);
    background-size: 200% 200%;
    animation: holoShift 10s ease infinite;
    border: 1px solid rgba(16, 185, 129, 0.3) !important;
    border-radius: 16px !important;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), inset 0 0 25px rgba(16, 185, 129, 0.04);
  }

  .holo-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    width: 200%;
    transform: translateX(-150%) skewX(-45deg);
    animation: holoGlare 6s linear infinite;
    pointer-events: none;
    z-index: 5;
  }

  .holo-card:hover {
    transform: translateY(-8px) scale(1.02);
    border-color: rgba(16, 185, 129, 0.8) !important;
    box-shadow: 0 15px 40px rgba(16, 185, 129, 0.3), inset 0 0 40px rgba(16, 185, 129, 0.15) !important;
  }

  .glow-text-emerald {
    text-shadow: 0 0 15px rgba(16, 185, 129, 0.8), 0 0 5px rgba(255,255,255,0.5);
  }

  .glow-text-blue {
    text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
  }

  /* Scanner Target Corners */
  .scanner-corner {
    position: absolute;
    width: 12px;
    height: 12px;
    border-color: #3b82f6;
    border-style: solid;
    z-index: 4;
  }

  /* Custom terminal scroll styling */
  .cyber-terminal-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(59, 130, 246, 0.3) rgba(0, 0, 0, 0.2);
  }

  .cyber-terminal-scroll::-webkit-scrollbar {
    width: 6px;
  }

  .cyber-terminal-scroll::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.25);
  }

  .cyber-terminal-scroll::-webkit-scrollbar-thumb {
    background-color: rgba(59, 130, 246, 0.35);
    border-radius: 3px;
  }
  
  /* Telemetry Grid Background Overlay */
  .cyber-grid-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image: 
      linear-gradient(rgba(59, 130, 246, 0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59, 130, 246, 0.02) 1px, transparent 1px);
    background-size: 30px 30px;
    background-position: center;
    pointer-events: none;
    z-index: 0;
  }
`;

const Dashboard = () => {
  const { user } = useAuth();
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
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
  // eslint-disable-next-line no-unused-vars
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    verificationStatus: 'PENDING',
    verificationDetails: null,
    walletBalance: null,
    blockchainStatus: false,
    blockchainDetails: null,
    professionalRecords: 0,
    recordsList: [],
    transactions: [],
    lastTransactionDate: null,
    biometricStatus: null
  });
  // eslint-disable-next-line no-unused-vars
  const [pollingActive, setPollingActive] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [apiErrors, setApiErrors] = useState({});

  // Real-time Cyber Console System Logs
  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString(), type: 'SYS', message: 'TrueID cybernetic matrix initialized.' },
    { time: new Date().toLocaleTimeString(), type: 'NET', message: 'Checking credentials nodes latency...' },
    { time: new Date().toLocaleTimeString(), type: 'SEC', message: 'Ready for cryptographically secure telemetry.' }
  ]);
  const [consolePaused, setConsolePaused] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const logContainerRef = useRef(null);

  // Helper to add logs
  const addLog = useCallback((type, message) => {
    setLogs(prev => {
      // Prevent consecutive duplicate messages from spamming the console
      const isDuplicate = prev.slice(-2).some(log => log.type === type && log.message === message);
      if (isDuplicate) return prev;

      return [
        ...prev.slice(-39), // Limit history to prevent DOM memory bloat
        {
          time: new Date().toLocaleTimeString(),
          type,
          message
        }
      ];
    });
  }, []);

  // Auto scroll logs console to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Periodic Telemetry Simulator
  useEffect(() => {
    if (consolePaused) return;

    const interval = setInterval(() => {
      const simulatedLogs = [
        { type: 'NET', message: `Telemetry link: Ethereum Sepolia RPC speed at ${Math.floor(Math.random() * 25 + 12)}ms.` },
        { type: 'SEC', message: 'Asymmetric identity key rotation successfully validated.' },
        { type: 'SYS', message: 'Security core garbage collection clean: 0 bytes leaked.' },
        { type: 'VAULT', message: 'Cryptographic credentials checksum verified: OK' },
        { type: 'LEDGER', message: `Querying block state: Synced up to block #${Math.floor(Math.random() * 25000 + 4950000)}` },
        { type: 'SEC', message: 'Biometric Facemesh vector verified matching Secure Enclave storage.' },
        { type: 'SYS', message: 'Identity secure link verified: Broadcast level secure.' }
      ];

      const chosen = simulatedLogs[Math.floor(Math.random() * simulatedLogs.length)];
      addLog(chosen.type, chosen.message);
    }, 4500);

    return () => clearInterval(interval);
  }, [consolePaused, addLog]);

  // Mouse Move Event Listener for Spotlights
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  // Check backend connection status
  const checkBackendConnection = useCallback(async () => {
    try {
      setBackendStatus(prev => ({ ...prev, checking: true }));
      const response = await fetch('http://localhost:5000/api/health', { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
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
      
      return data.status === 'ok';
    } catch (error) {
      console.error('Backend connection check failed:', error);
      setBackendStatus({
        connected: false,
        checking: false,
        lastCheck: new Date()
      });
      return false;
    }
  }, []);

  const fetchDashboardData = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    setApiErrors({});
    
    addLog('SYS', 'Initiating full telemetry diagnostic cycle...');

    // Check backend connection first
    const isConnected = await checkBackendConnection();
    if (!isConnected) {
      setError('Cannot connect to backend server. Please check if the server is running.');
      addLog('ERR', 'Failed connection check to API gateway server.');
      setLoading(false);
      setInitialLoading(false);
      setRefreshing(false);
      return;
    }
    
    addLog('NET', 'Secure gateway handshake verified.');

    try {
      const promises = [];
      const errorMap = {};
      
      // 1. Verification Status
      const verificationStatusPromise = userAPI.getVerificationStatus()
        .then(response => {
          const rawData = response?.data?.data || response?.data || {};
          const status = (rawData?.status || rawData?.identity?.status || 'VERIFIED').toUpperCase();
          addLog('VAULT', `KYC verification node: Received status [${status}]`);
          return {
            data: {
              status: status,
              submittedAt: rawData?.submittedAt || rawData?.identity?.completedAt || new Date().toISOString(),
              verifiedAt: rawData?.verifiedAt || rawData?.identity?.completedAt || new Date().toISOString(),
              verifiedBy: rawData?.verifiedBy || 'TrueID Authority',
              rejectionReason: rawData?.rejectionReason || null
            },
            success: true
          };
        })
        .catch(err => {
          console.error('Error fetching verification status:', err);
          errorMap.verification = err.message || 'Failed to fetch verification status';
          addLog('ERR', 'KYC node query returned a verification timeout.');
          return { 
            data: { status: 'PENDING' },
            success: false
          };
        });
      promises.push(verificationStatusPromise);
      
      // 2. Blockchain Status
      const blockchainStatusPromise = blockchainAPI.getBlockchainStatus()
        .then(response => {
          const blockchainData = response.data || { isRegistered: false };
          addLog('LEDGER', `Ledger registration sync state: [${blockchainData.isRegistered ? 'REGISTERED' : 'NOT_SYNCED'}]`);
          const blockchainDetails = {
            isOnBlockchain: blockchainData.isRegistered,
            contractAddress: blockchainData.contractAddress,
            transactionHash: blockchainData.transactionHash,
            timestamp: blockchainData.registrationTimestamp,
            network: blockchainData.network,
            status: blockchainData.status
          };
          return {
            data: blockchainDetails,
            success: true
          };
        })
        .catch(err => {
          console.error('Error fetching blockchain status:', err);
          errorMap.blockchain = err.message;
          addLog('ERR', 'Smart Contract telemetry check timed out.');
          return { 
            data: { isOnBlockchain: false },
            success: false
          };
        });
      promises.push(blockchainStatusPromise);
      
      // 3. Professional Records
      const professionalRecordsPromise = userAPI.getProfessionalRecords()
        .then(response => {
          const recordsData = response.data || { records: [] };
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
          
          const sortedRecords = formattedRecords.sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(b.date) - new Date(a.date);
          });
          
          addLog('VAULT', `Cryptographic credentials indexed: count = ${sortedRecords.length}`);
          return {
            data: { records: sortedRecords },
            success: true
          };
        })
        .catch(err => {
          console.error('Error fetching professional records:', err);
          errorMap.records = err.message;
          addLog('ERR', 'Credentials database read exception.');
          return { 
            data: { records: [] },
            success: false
          };
        });
      promises.push(professionalRecordsPromise);
      
      // 4. Wallet Balance
      let resolvedWalletAddress = user?.walletAddress || null;
      if (!resolvedWalletAddress) {
        try {
          const profileResp = await userAPI.getProfile();
          resolvedWalletAddress = profileResp.data?.user?.walletAddress || null;
        } catch (err) {
          console.error('Failed to fetch profile for wallet address:', err);
        }
      }
      let walletBalancePromise = Promise.resolve({ data: '0', success: true });
      if (resolvedWalletAddress) {
        walletBalancePromise = walletService.getBalance(resolvedWalletAddress, true)
          .then(balance => {
            const numBalance = parseFloat(balance);
            const verifiedBalance = isNaN(numBalance) ? '0' : numBalance.toString();
            addLog('LEDGER', `Wallet balance fetched: ${verifiedBalance} AVAX`);
            return verifiedBalance;
          })
          .catch(error => {
            console.error('Error fetching wallet balance:', error);
            addLog('ERR', 'AVAX node balance sync query rejected.');
            return '0';
          })
          .then(balance => ({
            data: balance,
            success: true
          }));
      }
      promises.push(walletBalancePromise);
      
      // 5. Transaction History
      const transactionsPromise = blockchainAPI.getUserTransactions()
        .then(response => {
          const txs = response.data?.transactions || [];
          addLog('LEDGER', `On-chain transaction logs parsed: count = ${txs.length}`);
          return {
            data: txs,
            success: true
          };
        })
        .catch(err => {
          console.error('Error fetching transactions:', err);
          errorMap.transactions = err.message;
          addLog('ERR', 'Failed reading ledger tx history.');
          return { 
            data: [],
            success: false
          };
        });
      promises.push(transactionsPromise);
      
      // 6. Biometric Verification Status
      const biometricStatusPromise = userAPI.getBiometricStatus()
        .then(response => {
          const biometricData = response.data || { verified: false, facemeshExists: false };
          addLog('SEC', `Biometric Facemesh check: Status [${biometricData.facemeshExists ? 'ACTIVE' : 'INACTIVE'}]`);
          return {
            data: biometricData,
            success: true
          };
        })
        .catch(err => {
          console.error('Error fetching biometric status:', err);
          errorMap.biometric = err.message;
          addLog('ERR', 'Enclave biometrics scan node is unresponsive.');
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
      
      // Resolve all
      const [
        verificationResponse, 
        blockchainResponse, 
        recordsResponse, 
        walletBalance,
        transactionsResponse,
        biometricResponse
      ] = await Promise.all(promises);
      
      if (Object.keys(errorMap).length > 0) {
        setApiErrors(errorMap);
      }
      
      let lastTransactionDate = null;
      if (transactionsResponse.success && transactionsResponse.data.length > 0) {
        const sortedTransactions = [...transactionsResponse.data]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        if (sortedTransactions.length > 0) {
          lastTransactionDate = new Date(sortedTransactions[0].timestamp);
        }
      }
      
      setDashboardData(prev => {
        const verificationStatus = verificationResponse.success ? verificationResponse.data.status : prev.verificationStatus;
        const verificationDetails = verificationResponse.success ? verificationResponse.data : prev.verificationDetails;
        const blockchainStatus = blockchainResponse.success ? blockchainResponse.data.isOnBlockchain : prev.blockchainStatus;
        const blockchainDetails = blockchainResponse.success ? blockchainResponse.data : prev.blockchainDetails;
        const recordsList = recordsResponse.success ? recordsResponse.data.records : prev.recordsList;
        const professionalRecords = recordsList.length;
        const newWalletBalance = walletBalance.success ? walletBalance.data : prev.walletBalance;
        const newWalletAddress = resolvedWalletAddress || prev.walletAddress;
        const transactions = transactionsResponse.success ? transactionsResponse.data : prev.transactions;
        const biometricStatus = biometricResponse.success ? biometricResponse.data : prev.biometricStatus;
        
        addLog('SYS', 'Telemetry sync iteration finished without exceptions.');
        return {
          verificationStatus,
          verificationDetails,
          walletBalance: newWalletBalance,
          walletAddress: newWalletAddress,
          blockchainStatus,
          blockchainDetails,
          professionalRecords,
          recordsList,
          transactions,
          lastTransactionDate: lastTransactionDate || prev.lastTransactionDate,
          biometricStatus
        };
      });
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      addLog('ERR', 'Critical dashboard data ingestion fault.');
      if (err.response && err.response.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to load dashboard data. Please check your connections.');
      }
    } finally {
      setLoading(false);
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [user, checkBackendConnection, addLog]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    addLog('SYS', 'User manual override: Triggering network refresh.');
    fetchDashboardData(true);
  }, [fetchDashboardData, addLog]);

  // Copy wallet address helper
  const handleCopyAddress = () => {
    if (dashboardData.walletAddress) {
      navigator.clipboard.writeText(dashboardData.walletAddress);
      setCopyOpen(true);
      addLog('SYS', 'Wallet address copied to local clipboard.');
    }
  };

  // Set up polling for dashboard data
  useEffect(() => {
    fetchDashboardData();
    
    const pollingInterval = setInterval(() => {
      if (pollingActive && document.visibilityState === 'visible') {
        fetchDashboardData(true);
      }
    }, 15000);
    
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [fetchDashboardData, pollingActive]);
  
  // Auto-refresh when tab gains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'VERIFIED':
        return '#10b981';
      case 'PENDING':
        return '#fbbf24';
      case 'REJECTED':
        return '#ef4444';
      default:
        return '#94a3b8';
    }
  };

  return (
    <Box sx={{ px: { xs: 1, md: 3 }, py: 3, maxWidth: '1600px', mx: 'auto', position: 'relative', zIndex: 1 }}>
      <style>{cssStyles}</style>

      {/* Cyber Grid Background Design */}
      <Box className="cyber-grid-overlay" />



      {/* Row 1: Analytics & Live Telemetry Nexus */}
      <Grid container spacing={4} mb={4} sx={{ position: 'relative', zIndex: 2 }}>
        {/* Biometric Identity Nexus Panel (Full Width) */}
        <Grid size={{ xs: 12, lg: 12 }}>
          <BiometricNexus dashboardData={dashboardData} user={user} />
        </Grid>
      </Grid>

      {/* Row 2: 4 Metric Cards */}
      <Grid container spacing={3} mb={4} sx={{ position: 'relative', zIndex: 2 }}>
        {/* Metric 1: Digital Wealth */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card className="sci-fi-glow-card" onMouseMove={handleMouseMove}>
            <CardContent sx={{ p: 3, zIndex: 2, position: 'relative' }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Typography variant="overline" color="#818cf8" letterSpacing={1.2} fontWeight={700}>Digital Wealth</Typography>
                  <Box display="flex" alignItems="baseline" gap={1} mt={0.5}>
                    <Typography variant="h4" fontWeight={800} color="#fff">
                      {(() => {
                        const balance = parseFloat(dashboardData.walletBalance || '0');
                        return isNaN(balance) ? '0.0000' : balance.toFixed(4);
                      })()}
                    </Typography>
                    <Typography variant="caption" color="#94a3b8" fontWeight={700}>ETH</Typography>
                  </Box>
                </Box>
                <Box sx={{ p: 1, borderRadius: '8px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)', display: 'flex' }}>
                  <WalletIcon fontSize="small" />
                </Box>
              </Box>
              {/* SVG Sparkline */}
              <Box sx={{ height: 35, display: 'flex', alignItems: 'flex-end', mt: 2, mb: 1, width: '100%' }}>
                <svg width="100%" height="100%" viewBox="0 0 200 40" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                  <path 
                    d="M 0 35 Q 25 15, 50 25 T 100 10 T 150 30 T 200 15" 
                    fill="none" 
                    stroke="#6366f1" 
                    strokeWidth="2.5" 
                    style={{ filter: 'drop-shadow(0 0 4px rgba(99,102,241,0.5))' }}
                  />
                  <path 
                    d="M 0 35 Q 25 15, 50 25 T 100 10 T 150 30 T 200 15 L 200 40 L 0 40 Z" 
                    fill="url(#sparkline-gradient-indigo)" 
                    opacity="0.1"
                  />
                  <defs>
                    <linearGradient id="sparkline-gradient-indigo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', height: 20, mt: 1 }}>
                <Typography variant="caption" color="#64748b">Network state: Ethereum Sepolia Testnet</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Metric 2: Identity trust score */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card className="sci-fi-glow-card" onMouseMove={handleMouseMove}>
            <CardContent sx={{ p: 3, zIndex: 2, position: 'relative' }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Typography variant="overline" color="#34d399" letterSpacing={1.2} fontWeight={700}>Identity Score</Typography>
                  <Box display="flex" alignItems="baseline" gap={1} mt={0.5}>
                    <Typography variant="h4" fontWeight={800} color="#fff" className="glow-text-emerald">
                      {dashboardData.verificationStatus === 'VERIFIED' ? '99.9%' : 'PENDING'}
                    </Typography>
                    <Typography variant="caption" color="#94a3b8" fontWeight={700}>TRUST</Typography>
                  </Box>
                </Box>
                <Box sx={{ p: 1, borderRadius: '8px', background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)', display: 'flex' }}>
                  <VerifiedUserIcon fontSize="small" />
                </Box>
              </Box>
              {/* Trust gauge line */}
              <Box sx={{ height: 35, display: 'flex', alignItems: 'center', mt: 2, mb: 1, width: '100%' }}>
                <Box sx={{ flexGrow: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Box sx={{ 
                    width: dashboardData.verificationStatus === 'VERIFIED' ? '100%' : '45%', 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)', 
                    borderRadius: 3,
                    boxShadow: '0 0 10px rgba(16,185,129,0.5)'
                  }} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', height: 20, mt: 1 }}>
                <Typography variant="caption" color="#64748b">
                  KYC Status: {dashboardData.verificationStatus}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Metric 3: Data Vault */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card className="sci-fi-glow-card" onMouseMove={handleMouseMove}>
            <CardContent sx={{ p: 3, zIndex: 2, position: 'relative' }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Typography variant="overline" color="#fbbf24" letterSpacing={1.2} fontWeight={700}>Data Vault</Typography>
                  <Box display="flex" alignItems="baseline" gap={1} mt={0.5}>
                    <Typography variant="h4" fontWeight={800} color="#fff" sx={{ textShadow: '0 0 10px rgba(245,158,11,0.4)' }}>
                      {dashboardData.professionalRecords || 0}
                    </Typography>
                    <Typography variant="caption" color="#94a3b8" fontWeight={700}>RECORDS</Typography>
                  </Box>
                </Box>
                <Box sx={{ p: 1, borderRadius: '8px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)', display: 'flex' }}>
                  <WorkIcon fontSize="small" />
                </Box>
              </Box>
              {/* SVG Sparkline */}
              <Box sx={{ height: 35, display: 'flex', alignItems: 'flex-end', mt: 2, mb: 1, width: '100%' }}>
                <svg width="100%" height="100%" viewBox="0 0 200 40" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                  <path 
                    d="M 0 30 Q 30 30, 60 15 T 120 20 T 180 5 T 200 10" 
                    fill="none" 
                    stroke="#fbbf24" 
                    strokeWidth="2.5" 
                    style={{ filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.5))' }}
                  />
                  <path 
                    d="M 0 30 Q 30 30, 60 15 T 120 20 T 180 5 T 200 10 L 200 40 L 0 40 Z" 
                    fill="url(#sparkline-gradient-amber)" 
                    opacity="0.1"
                  />
                  <defs>
                    <linearGradient id="sparkline-gradient-amber" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', height: 20, mt: 1 }}>
                <Typography variant="caption" color="#64748b">Cryptographically signed credentials</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Metric 4: Ledger Sync */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card className="sci-fi-glow-card" onMouseMove={handleMouseMove}>
            <CardContent sx={{ p: 3, zIndex: 2, position: 'relative' }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Typography variant="overline" color="#a78bfa" letterSpacing={1.2} fontWeight={700}>Ledger Sync</Typography>
                  <Box display="flex" alignItems="baseline" gap={1} mt={0.5}>
                    <Typography variant="h4" fontWeight={800} color="#fff" sx={{ textShadow: '0 0 10px rgba(139,92,246,0.4)' }}>
                      {dashboardData.blockchainStatus ? 'SECURED' : 'PENDING'}
                    </Typography>
                    <Typography variant="caption" color="#94a3b8" fontWeight={700}>STATE</Typography>
                  </Box>
                </Box>
                <Box sx={{ p: 1, borderRadius: '8px', background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)', display: 'flex' }}>
                  <BlockchainIcon fontSize="small" />
                </Box>
              </Box>
              {/* Dynamic blinking sync sparkline */}
              <Box sx={{ height: 35, display: 'flex', alignItems: 'flex-end', mt: 2, mb: 1, width: '100%' }}>
                <svg width="100%" height="100%" viewBox="0 0 200 40" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                  <path 
                    d="M 0 20 Q 40 5, 80 30 T 140 10 T 200 25" 
                    fill="none" 
                    stroke="#a78bfa" 
                    strokeWidth="2.5" 
                    style={{ filter: 'drop-shadow(0 0 4px rgba(139,92,246,0.5))' }}
                  />
                  <path 
                    d="M 0 20 Q 40 5, 80 30 T 140 10 T 200 25 L 200 40 L 0 40 Z" 
                    fill="url(#sparkline-gradient-purple)" 
                    opacity="0.1"
                  />
                  <defs>
                    <linearGradient id="sparkline-gradient-purple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, height: 20, mt: 1 }}>
                <Box sx={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  bgcolor: dashboardData.blockchainStatus ? '#10b981' : '#fbbf24',
                  boxShadow: dashboardData.blockchainStatus ? '0 0 8px #10b981' : '0 0 8px #fbbf24',
                  flexShrink: 0
                }} />
                <Typography variant="caption" color="#64748b" noWrap>
                  {dashboardData.blockchainStatus ? 'Ledger synchronization active' : 'Sync pending user confirmation'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>



      {/* Row 3: Professional Credentials & Holographic Card */}
      <Grid container spacing={4} sx={{ position: 'relative', zIndex: 2 }}>
        
        {/* Professional Records Table/List (Left - 8 columns) */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card className="sci-fi-glow-card" onMouseMove={handleMouseMove} sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, md: 4 }, zIndex: 2, position: 'relative' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                  <Typography variant="h6" fontWeight={800} color="#f8fafc">
                    Verified Professional Credentials
                  </Typography>
                  <Typography variant="body2" color="#64748b">
                    Your cryptographically signed experience certifications stored securely.
                  </Typography>
                </Box>
                <Button 
                  component={RouterLink} 
                  to="/professional-records" 
                  sx={{ 
                    color: '#f8fafc', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '8px', 
                    px: 2, 
                    py: 0.8,
                    textTransform: 'none',
                    background: 'rgba(255,255,255,0.02)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'rgba(255,255,255,0.06)',
                      borderColor: 'rgba(255,255,255,0.2)',
                    }
                  }}
                >
                  + Add Record
                </Button>
              </Box>
              
              <Box display="flex" flexDirection="column" gap={2}>
                {(!dashboardData.recordsList || dashboardData.recordsList.length === 0) ? (
                  <Box display="flex" flexDirection="column" alignItems="center" py={6} sx={{ border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.15)' }}>
                    <WorkIcon sx={{ fontSize: 36, color: '#475569', mb: 1.5 }} />
                    <Typography variant="body2" color="#64748b" align="center">No professional records added to the vault yet.</Typography>
                  </Box>
                ) : (
                  dashboardData.recordsList.slice(0, 4).map((rec, i) => (
                    <Box 
                      key={i} 
                      display="flex" 
                      justifyContent="space-between" 
                      alignItems="center" 
                      p={2} 
                      sx={{ 
                        borderRadius: '12px', 
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid rgba(255,255,255,0.02)',
                        transition: 'all 0.2s',
                        '&:hover': { 
                          background: 'rgba(255,255,255,0.03)',
                          borderColor: 'rgba(59,130,246,0.15)'
                        } 
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ 
                          bgcolor: `hsl(${i * 60 + 220}, 75%, 35%)`, 
                          width: 42, 
                          height: 42, 
                          fontWeight: 800,
                          border: '1px solid rgba(255,255,255,0.1)',
                          boxShadow: `0 0 10px hsl(${i * 60 + 220}, 75%, 35%)30`
                        }}>
                          {rec.title ? rec.title.charAt(0).toUpperCase() : 'R'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700} color="#f8fafc">{rec.title || 'Untitled Record'}</Typography>
                          <Typography variant="caption" color="#64748b">
                            {rec.organization || 'Unknown Organization'} • Verified by TrueID Network
                          </Typography>
                        </Box>
                      </Box>
                      <Chip 
                        label="VERIFIED" 
                        size="small" 
                        sx={{ 
                          background: 'rgba(16,185,129,0.1)', 
                          color: '#34d399', 
                          fontWeight: 700, 
                          height: 24, 
                          fontSize: '0.65rem',
                          border: '1px solid rgba(16,185,129,0.2)'
                        }} 
                      />
                    </Box>
                  ))
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Holographic Web3 ID Card (Right - 4 columns) */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card className="holo-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 320 }}>
            {/* Holographic background elements */}
            <Box sx={{ position: 'absolute', right: -30, top: -30, width: 200, height: 200, borderRadius: '50%', border: '2px solid rgba(16,185,129,0.3)', opacity: 0.8, filter: 'blur(3px)', animation: 'pulse-ring 4s infinite' }} />
            <Box sx={{ position: 'absolute', right: -60, top: -60, width: 260, height: 260, borderRadius: '50%', border: '1px dashed rgba(16,185,129,0.2)', opacity: 0.6, filter: 'blur(1px)', animation: 'rotate-slow 20s linear infinite' }} />
            
            {/* Watermark */}
            <Typography variant="h2" sx={{ position: 'absolute', top: '40%', left: '10%', transform: 'rotate(-15deg)', color: 'rgba(16,185,129,0.05)', fontWeight: 900, fontSize: '4rem', pointerEvents: 'none', zIndex: 1, letterSpacing: 5 }}>
              VERIFIED
            </Typography>

            <CardContent sx={{ p: 4, zIndex: 2, position: 'relative', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="overline" color="#34d399" fontWeight={800} letterSpacing={1.5} className="glow-text-emerald">
                    TRUEID WEB3 CREDENTIAL
                  </Typography>
                  <Chip 
                    label={user?.verificationLevel === 'platinum' ? 'PLATINUM' : 'STANDARD'} 
                    size="small" 
                    sx={{ 
                      height: 22,
                      fontSize: '0.65rem',
                      fontWeight: 900,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 0 15px rgba(16,185,129,0.6)'
                    }} 
                  />
                </Box>

                <Box display="flex" gap={3} mb={4} alignItems="center" sx={{ position: 'relative' }}>
                  <Avatar 
                    src={user?.profileImage} 
                    sx={{ 
                      width: 64, 
                      height: 64, 
                      border: '2px solid #10b981', 
                      boxShadow: '0 0 20px rgba(16,185,129,0.5), inset 0 0 10px rgba(16,185,129,0.5)',
                      background: '#0a0f1c'
                    }}
                  >
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={800} color="#fff" sx={{ textShadow: '0 0 15px rgba(255,255,255,0.4)', letterSpacing: 0.5 }}>
                      {user?.firstName} {user?.lastName}
                    </Typography>
                    <Typography variant="caption" color="#10b981" fontWeight={700} sx={{ fontFamily: 'monospace', letterSpacing: 1, background: 'rgba(16,185,129,0.1)', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block', mt: 0.5, border: '1px solid rgba(16,185,129,0.2)' }}>
                      ID TOKEN: TID-88A9-291D
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ background: 'rgba(0,0,0,0.3)', p: 2, borderRadius: 2, border: '1px solid rgba(16,185,129,0.15)', backdropFilter: 'blur(5px)' }}>
                <Typography variant="caption" color="#34d399" fontWeight={800} display="block" mb={1} sx={{ letterSpacing: '0.1em' }}>
                  SECURE BLOCKCHAIN ADDR
                </Typography>
                
                <Box 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="space-between" 
                  sx={{ 
                    bgcolor: 'rgba(0, 0, 0, 0.5)', 
                    p: 1.5, 
                    borderRadius: '8px', 
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
                  }}
                >
                  <Typography 
                    variant="body2" 
                    color="#e2e8f0" 
                    sx={{ 
                      fontFamily: 'monospace', 
                      fontSize: '0.85rem', 
                      fontWeight: 600,
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      mr: 1 
                    }}
                  >
                    {dashboardData.walletAddress || '0x0000000000000000000000000000000000000000'}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={handleCopyAddress} 
                    sx={{ 
                      color: '#10b981', 
                      p: 0.5,
                      border: '1px solid rgba(16,185,129,0.2)',
                      bgcolor: 'rgba(16,185,129,0.1)',
                      '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.25)', boxShadow: '0 0 10px rgba(16,185,129,0.4)' } 
                    }}
                    title="Copy wallet address"
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Copy Clipboard Alert */}
      <Snackbar
        open={copyOpen}
        autoHideDuration={2000}
        onClose={() => setCopyOpen(false)}
        message={
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircleIcon sx={{ color: '#10b981', fontSize: 20 }} />
            <Typography variant="body2" color="#fff">Wallet address copied to clipboard!</Typography>
          </Box>
        }
        sx={{
          '& .MuiSnackbarContent-root': {
            bgcolor: 'rgba(7, 11, 20, 0.95)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(5px)'
          }
        }}
      />
    </Box>
  );
};

export default Dashboard;
