import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/adminApi.service';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PeopleAltRounded,
  VerifiedUserRounded,
  HourglassEmptyRounded,
  CancelRounded,
  RefreshRounded,
  ArrowForwardRounded,
  SecurityRounded,
  FolderSharedRounded,
  FingerprintRounded,
  WorkspacePremiumRounded,
  HistoryRounded,
  SettingsRounded,
  OpenInNewRounded,
  TrendingUpRounded,
  CheckCircleRounded
} from '@mui/icons-material';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUser = user || { username: 'admin', role: 'SUPER_ADMIN' };

  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingUsers: 0,
    rejectedUsers: 0,
    recentActivities: [],
    lastUpdated: null,
    trends: {
      totalChange: 0,
      verifiedChange: 0,
      pendingChange: 0,
      rejectedChange: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const response = await ApiService.getDashboardStats();
      const data = response.data || response;

      const transformedData = {
        totalUsers: data.userStats?.total || 0,
        verifiedUsers: data.userStats?.verified || 0,
        pendingUsers: data.userStats?.pending || 0,
        rejectedUsers: data.userStats?.rejected || 0,
        lastUpdated: new Date(),
        trends: {
          totalChange: 0,
          verifiedChange: 0,
          pendingChange: 0,
          rejectedChange: 0
        },
        recentActivities: (data.recentActivity || []).map(activity => ({
          id: activity.id || Math.random().toString(36).substr(2, 9),
          action: activity.action,
          timestamp: new Date(activity.created_at || activity.timestamp || Date.now()),
          userName: activity.user_name || activity.userName || 'Unknown User',
          userId: activity.government_id || activity.userId || '-',
          adminName: activity.admin_username || activity.adminName || currentUser?.username || 'System',
          txHash: activity.details?.transactionHash || activity.txHash
        }))
      };

      setStats(transformedData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load live dashboard statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser?.username]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  const getActionColor = (action) => {
    if (!action) return { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.2)' };
    const act = action.toUpperCase();
    if (act.includes('VERIF') || act.includes('SUCCESS')) {
      return { color: '#34d399', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)' };
    }
    if (act.includes('REJECT') || act.includes('FAIL')) {
      return { color: '#f87171', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)' };
    }
    if (act.includes('UPDATE') || act.includes('BIOMETRIC')) {
      return { color: '#818cf8', bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.25)' };
    }
    return { color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)' };
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Top Banner */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(13, 18, 29, 0.95) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          p: { xs: 2.5, md: 3.5 }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<SecurityRounded sx={{ fontSize: '14px !important', color: '#818cf8 !important' }} />}
                label="GOVERNMENT NODE #01"
                size="small"
                sx={{
                  bgcolor: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  letterSpacing: '0.08em'
                }}
              />
              <Chip
                label="CONSENSUS ACTIVE"
                size="small"
                sx={{
                  bgcolor: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  letterSpacing: '0.08em'
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', mb: 0.5 }}>
              Authority Operations Command
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 640 }}>
              Live biometric enrollment surveillance, soulbound attestation metrics, and tamper-proof audit trails.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {stats.lastUpdated && (
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Synced: {formatDate(stats.lastUpdated)}
              </Typography>
            )}
            <Button
              variant="outlined"
              startIcon={refreshing ? <CircularProgress size={16} sx={{ color: '#818cf8' }} /> : <RefreshRounded />}
              onClick={() => fetchDashboardData(false)}
              disabled={loading || refreshing}
              sx={{
                borderColor: 'rgba(99, 102, 241, 0.3)',
                color: '#a5b4fc',
                fontWeight: 600,
                px: 2.5,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                bgcolor: 'rgba(99, 102, 241, 0.05)',
                '&:hover': {
                  bgcolor: 'rgba(99, 102, 241, 0.12)',
                  borderColor: '#6366f1'
                }
              }}
            >
              {refreshing ? 'Updating...' : 'Refresh Metrics'}
            </Button>
          </Box>
        </Box>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          {error}
        </Alert>
      )}

      {/* 4 Stat KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* Total Users */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              borderRadius: 3,
              bgcolor: 'rgba(13, 18, 29, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(14px)',
              p: 2.5,
              transition: 'all 0.2s',
              '&:hover': { borderColor: 'rgba(99, 102, 241, 0.4)', transform: 'translateY(-2px)' }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                Total Enrolled
              </Typography>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PeopleAltRounded sx={{ fontSize: 20 }} />
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#f8fafc', mb: 0.5 }}>
              {stats.totalUsers}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Identities registered in directory
            </Typography>
          </Card>
        </Grid>

        {/* Verified Users */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              borderRadius: 3,
              bgcolor: 'rgba(13, 18, 29, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(14px)',
              p: 2.5,
              transition: 'all 0.2s',
              '&:hover': { borderColor: 'rgba(16, 185, 129, 0.4)', transform: 'translateY(-2px)' }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                Verified DIDs
              </Typography>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <VerifiedUserRounded sx={{ fontSize: 20 }} />
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#10b981', mb: 0.5 }}>
              {stats.verifiedUsers}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Full consensus & biometric approval
            </Typography>
          </Card>
        </Grid>

        {/* Pending Verification */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              borderRadius: 3,
              bgcolor: 'rgba(13, 18, 29, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(14px)',
              p: 2.5,
              transition: 'all 0.2s',
              '&:hover': { borderColor: 'rgba(245, 158, 11, 0.4)', transform: 'translateY(-2px)' }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                Pending Review
              </Typography>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HourglassEmptyRounded sx={{ fontSize: 20 }} />
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#f59e0b', mb: 0.5 }}>
              {stats.pendingUsers}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Awaiting FaceMesh / document audit
            </Typography>
          </Card>
        </Grid>

        {/* Rejected Claims */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              borderRadius: 3,
              bgcolor: 'rgba(13, 18, 29, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(14px)',
              p: 2.5,
              transition: 'all 0.2s',
              '&:hover': { borderColor: 'rgba(239, 68, 68, 0.4)', transform: 'translateY(-2px)' }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                Rejected Claims
              </Typography>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.12)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CancelRounded sx={{ fontSize: 20 }} />
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#ef4444', mb: 0.5 }}>
              {stats.rejectedUsers}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Fraud flagged or invalid proof
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Main Sections: Recent Activities & Quick Navigation */}
      <Grid container spacing={3}>
        {/* Left Column: Recent Authority Activities */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card
            sx={{
              borderRadius: 3,
              bgcolor: 'rgba(13, 18, 29, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(14px)'
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HistoryRounded sx={{ fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#f8fafc', fontSize: '1.05rem' }}>
                      Authority Audit Stream
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      Chronological log of identity actions & biometric attestation events
                    </Typography>
                  </Box>
                </Box>
                <Button
                  size="small"
                  endIcon={<ArrowForwardRounded />}
                  onClick={() => navigate('/admin/activity-logs')}
                  sx={{ color: '#a5b4fc', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  Full Log
                </Button>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress size={32} sx={{ color: '#6366f1' }} />
                </Box>
              ) : stats.recentActivities.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, color: '#64748b' }}>
                  <Typography variant="body2">No recent audit actions recorded.</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {stats.recentActivities.slice(0, 6).map((activity) => {
                    const meta = getActionColor(activity.action);
                    return (
                      <Box
                        key={activity.id}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: 'rgba(15, 23, 42, 0.5)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          justifyContent: 'space-between',
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          gap: 1.5,
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            bgcolor: 'rgba(15, 23, 42, 0.8)',
                            borderColor: 'rgba(255, 255, 255, 0.1)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Chip
                            label={activity.action}
                            size="small"
                            sx={{
                              bgcolor: meta.bg,
                              color: meta.color,
                              border: `1px solid ${meta.border}`,
                              fontWeight: 700,
                              fontSize: '0.68rem',
                              letterSpacing: '0.04em'
                            }}
                          />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#f8fafc' }}>
                              {activity.userName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace' }}>
                              ID: {activity.userId}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                              by {activity.adminName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {formatDate(activity.timestamp)}
                            </Typography>
                          </Box>

                          {activity.txHash && (
                            <Tooltip title="View Transaction on Etherscan">
                              <IconButton
                                size="small"
                                onClick={() => window.open(`https://sepolia.etherscan.io/tx/${activity.txHash}`, '_blank')}
                                sx={{ color: '#6366f1' }}
                              >
                                <OpenInNewRounded sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Authority Console Shortcuts */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Quick Action Card 1: Records */}
            <Card
              onClick={() => navigate('/admin/records')}
              sx={{
                borderRadius: 3,
                bgcolor: 'rgba(13, 18, 29, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(14px)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'rgba(99, 102, 241, 0.4)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                }
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FolderSharedRounded sx={{ fontSize: 24 }} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
                      Identity Directory
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      Inspect, verify, or reject user claims
                    </Typography>
                  </Box>
                  <ArrowForwardRounded sx={{ color: '#64748b', fontSize: 18 }} />
                </Box>
              </CardContent>
            </Card>

            {/* Quick Action Card 2: FaceMesh Biometrics */}
            <Card
              onClick={() => navigate('/admin/face-verification')}
              sx={{
                borderRadius: 3,
                bgcolor: 'rgba(13, 18, 29, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(14px)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'rgba(16, 185, 129, 0.4)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                }
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FingerprintRounded sx={{ fontSize: 24 }} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
                      FaceMesh Biometrics
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      Live camera face matching scanner
                    </Typography>
                  </Box>
                  <ArrowForwardRounded sx={{ color: '#64748b', fontSize: 18 }} />
                </Box>
              </CardContent>
            </Card>

            {/* Quick Action Card 3: Professional Credentials */}
            <Card
              onClick={() => navigate('/admin/professional-records')}
              sx={{
                borderRadius: 3,
                bgcolor: 'rgba(13, 18, 29, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(14px)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'rgba(245, 158, 11, 0.4)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                }
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <WorkspacePremiumRounded sx={{ fontSize: 24 }} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
                      Professional Records
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      Audit employment & university degrees
                    </Typography>
                  </Box>
                  <ArrowForwardRounded sx={{ color: '#64748b', fontSize: 18 }} />
                </Box>
              </CardContent>
            </Card>

            {/* Quick Action Card 4: Security Settings */}
            <Card
              onClick={() => navigate('/admin/settings')}
              sx={{
                borderRadius: 3,
                bgcolor: 'rgba(13, 18, 29, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(14px)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'rgba(99, 102, 241, 0.4)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                }
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', color: '#a5b4fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SettingsRounded sx={{ fontSize: 24 }} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
                      Node Configuration
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      Security keys & notification webhooks
                    </Typography>
                  </Box>
                  <ArrowForwardRounded sx={{ color: '#64748b', fontSize: 18 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
