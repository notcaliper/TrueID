import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/adminApi.service';
import { useAuth } from '../../context/AuthContext';
import { useColorMode } from '../../context/ThemeContext';
import { getAdminThemeTokens, getCardStyle, getBannerStyle } from '../utils/adminTheme';
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
  OpenInNewRounded
} from '@mui/icons-material';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLight } = useColorMode();
  const t = getAdminThemeTokens(isLight);
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
    if (!action) return { color: t.textMuted, bg: t.surfaceHover, border: t.border };
    const act = action.toUpperCase();
    if (act.includes('VERIF') || act.includes('SUCCESS')) {
      return { color: t.successText, bg: t.successBg, border: t.successBorder };
    }
    if (act.includes('REJECT') || act.includes('FAIL')) {
      return { color: t.errorText, bg: t.errorBg, border: t.errorBorder };
    }
    if (act.includes('UPDATE') || act.includes('BIOMETRIC')) {
      return { color: t.primary, bg: t.primaryBg, border: t.primaryBorder };
    }
    return { color: t.warningText, bg: t.warningBg, border: t.warningBorder };
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Top Banner */}
      <Card sx={getBannerStyle(isLight)}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Chip
                icon={<SecurityRounded sx={{ fontSize: '14px !important', color: `${t.primary} !important` }} />}
                label="GOVERNMENT NODE #01"
                size="small"
                sx={{
                  bgcolor: t.primaryBg,
                  color: t.primary,
                  border: `1px solid ${t.primaryBorder}`,
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  letterSpacing: '0.06em'
                }}
              />
              <Chip
                label="CONSENSUS ACTIVE"
                size="small"
                sx={{
                  bgcolor: t.successBg,
                  color: t.successText,
                  border: `1px solid ${t.successBorder}`,
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  letterSpacing: '0.06em'
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: t.textPrimary, letterSpacing: '-0.02em', mb: 0.5 }}>
              Authority Operations Command
            </Typography>
            <Typography variant="body2" sx={{ color: t.textMuted, maxWidth: 640 }}>
              Live biometric enrollment surveillance, attestation metrics, and tamper-proof audit trails.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {stats.lastUpdated && (
              <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 500 }}>
                Synced: {formatDate(stats.lastUpdated)}
              </Typography>
            )}
            <Button
              variant="outlined"
              startIcon={refreshing ? <CircularProgress size={16} sx={{ color: t.primary }} /> : <RefreshRounded />}
              onClick={() => fetchDashboardData(false)}
              disabled={loading || refreshing}
              sx={{
                borderColor: t.primaryBorder,
                color: t.primary,
                fontWeight: 600,
                px: 2.5,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                bgcolor: t.primaryBg,
                '&:hover': {
                  bgcolor: isLight ? 'rgba(37, 99, 235, 0.14)' : 'rgba(59, 130, 246, 0.2)',
                  borderColor: t.primary
                }
              }}
            >
              {refreshing ? 'Updating...' : 'Refresh Metrics'}
            </Button>
          </Box>
        </Box>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: t.errorBg, color: t.errorText, border: `1px solid ${t.errorBorder}` }}>
          {error}
        </Alert>
      )}

      {/* 4 Stat KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* Total Users */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={getCardStyle(isLight, {
              p: 2.5,
              '&:hover': { borderColor: t.primary, transform: 'translateY(-2px)' }
            })}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="caption" sx={{ color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                Total Enrolled
              </Typography>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: t.primaryBg, color: t.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PeopleAltRounded sx={{ fontSize: 20 }} />
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: t.textPrimary, mb: 0.5 }}>
              {stats.totalUsers}
            </Typography>
            <Typography variant="caption" sx={{ color: t.textMuted }}>
              Identities registered in directory
            </Typography>
          </Card>
        </Grid>

        {/* Verified Users */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={getCardStyle(isLight, {
              p: 2.5,
              '&:hover': { borderColor: t.success, transform: 'translateY(-2px)' }
            })}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="caption" sx={{ color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                Verified DIDs
              </Typography>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: t.successBg, color: t.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <VerifiedUserRounded sx={{ fontSize: 20 }} />
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: t.successText, mb: 0.5 }}>
              {stats.verifiedUsers}
            </Typography>
            <Typography variant="caption" sx={{ color: t.textMuted }}>
              Full consensus & biometric approval
            </Typography>
          </Card>
        </Grid>

        {/* Pending Verification */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={getCardStyle(isLight, {
              p: 2.5,
              '&:hover': { borderColor: t.warning, transform: 'translateY(-2px)' }
            })}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="caption" sx={{ color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                Pending Review
              </Typography>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: t.warningBg, color: t.warning, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HourglassEmptyRounded sx={{ fontSize: 20 }} />
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: t.warningText, mb: 0.5 }}>
              {stats.pendingUsers}
            </Typography>
            <Typography variant="caption" sx={{ color: t.textMuted }}>
              Awaiting FaceMesh / document audit
            </Typography>
          </Card>
        </Grid>

        {/* Rejected Claims */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={getCardStyle(isLight, {
              p: 2.5,
              '&:hover': { borderColor: t.error, transform: 'translateY(-2px)' }
            })}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="caption" sx={{ color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                Rejected Claims
              </Typography>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: t.errorBg, color: t.error, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CancelRounded sx={{ fontSize: 20 }} />
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: t.errorText, mb: 0.5 }}>
              {stats.rejectedUsers}
            </Typography>
            <Typography variant="caption" sx={{ color: t.textMuted }}>
              Fraud flagged or invalid proof
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Main Sections: Recent Activities & Quick Navigation */}
      <Grid container spacing={3}>
        {/* Left Column: Recent Authority Activities */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={getCardStyle(isLight)}>
            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: t.primaryBg, color: t.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HistoryRounded sx={{ fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: t.textPrimary, fontSize: '1.05rem' }}>
                      Authority Audit Stream
                    </Typography>
                    <Typography variant="caption" sx={{ color: t.textMuted }}>
                      Chronological log of identity actions & biometric attestation events
                    </Typography>
                  </Box>
                </Box>
                <Button
                  size="small"
                  endIcon={<ArrowForwardRounded />}
                  onClick={() => navigate('/admin/activity-logs')}
                  sx={{ color: t.primary, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  Full Log
                </Button>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress size={32} sx={{ color: t.primary }} />
                </Box>
              ) : stats.recentActivities.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, color: t.textMuted }}>
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
                          bgcolor: t.surfaceSubtle,
                          border: `1px solid ${t.border}`,
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          justifyContent: 'space-between',
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          gap: 1.5,
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            bgcolor: t.surfaceHover,
                            borderColor: t.primaryBorder
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
                            <Typography variant="body2" sx={{ fontWeight: 600, color: t.textPrimary }}>
                              {activity.userName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: t.textMuted, fontFamily: 'monospace' }}>
                              ID: {activity.userId}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                            <Typography variant="caption" sx={{ color: t.textSecondary, display: 'block' }}>
                              by {activity.adminName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: t.textMuted }}>
                              {formatDate(activity.timestamp)}
                            </Typography>
                          </Box>

                          {activity.txHash && (
                            <Tooltip title="View Transaction on Etherscan">
                              <IconButton
                                size="small"
                                onClick={() => window.open(`https://sepolia.etherscan.io/tx/${activity.txHash}`, '_blank')}
                                sx={{ color: t.primary }}
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Quick Action Card 1: Records */}
            <Card
              onClick={() => navigate('/admin/records')}
              sx={getCardStyle(isLight, {
                cursor: 'pointer',
                '&:hover': {
                  borderColor: t.primary,
                  transform: 'translateY(-2px)'
                }
              })}
            >
              <CardContent sx={{ p: 2.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: t.primaryBg, border: `1px solid ${t.primaryBorder}`, color: t.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FolderSharedRounded sx={{ fontSize: 24 }} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: t.textPrimary, lineHeight: 1.2 }}>
                      Identity Directory
                    </Typography>
                    <Typography variant="caption" sx={{ color: t.textMuted }}>
                      Inspect, verify, or reject user claims
                    </Typography>
                  </Box>
                  <ArrowForwardRounded sx={{ color: t.textMuted, fontSize: 18 }} />
                </Box>
              </CardContent>
            </Card>

            {/* Quick Action Card 2: FaceMesh Biometrics */}
            <Card
              onClick={() => navigate('/admin/face-verification')}
              sx={getCardStyle(isLight, {
                cursor: 'pointer',
                '&:hover': {
                  borderColor: t.success,
                  transform: 'translateY(-2px)'
                }
              })}
            >
              <CardContent sx={{ p: 2.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: t.successBg, border: `1px solid ${t.successBorder}`, color: t.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FingerprintRounded sx={{ fontSize: 24 }} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: t.textPrimary, lineHeight: 1.2 }}>
                      FaceMesh Biometrics
                    </Typography>
                    <Typography variant="caption" sx={{ color: t.textMuted }}>
                      Live camera face matching scanner
                    </Typography>
                  </Box>
                  <ArrowForwardRounded sx={{ color: t.textMuted, fontSize: 18 }} />
                </Box>
              </CardContent>
            </Card>

            {/* Quick Action Card 3: Professional Credentials */}
            <Card
              onClick={() => navigate('/admin/professional-records')}
              sx={getCardStyle(isLight, {
                cursor: 'pointer',
                '&:hover': {
                  borderColor: t.warning,
                  transform: 'translateY(-2px)'
                }
              })}
            >
              <CardContent sx={{ p: 2.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: t.warningBg, border: `1px solid ${t.warningBorder}`, color: t.warning, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <WorkspacePremiumRounded sx={{ fontSize: 24 }} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: t.textPrimary, lineHeight: 1.2 }}>
                      Professional Records
                    </Typography>
                    <Typography variant="caption" sx={{ color: t.textMuted }}>
                      Audit employment & university degrees
                    </Typography>
                  </Box>
                  <ArrowForwardRounded sx={{ color: t.textMuted, fontSize: 18 }} />
                </Box>
              </CardContent>
            </Card>

            {/* Quick Action Card 4: Security Settings */}
            <Card
              onClick={() => navigate('/admin/settings')}
              sx={getCardStyle(isLight, {
                cursor: 'pointer',
                '&:hover': {
                  borderColor: t.primary,
                  transform: 'translateY(-2px)'
                }
              })}
            >
              <CardContent sx={{ p: 2.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: t.primaryBg, border: `1px solid ${t.primaryBorder}`, color: t.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SettingsRounded sx={{ fontSize: 24 }} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: t.textPrimary, lineHeight: 1.2 }}>
                      Node Configuration
                    </Typography>
                    <Typography variant="caption" sx={{ color: t.textMuted }}>
                      Security keys & notification webhooks
                    </Typography>
                  </Box>
                  <ArrowForwardRounded sx={{ color: t.textMuted, fontSize: 18 }} />
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
