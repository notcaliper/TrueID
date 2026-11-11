import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../services/adminApi.service';
import { useColorMode } from '../../context/ThemeContext';
import { getAdminThemeTokens, getCardStyle, getBannerStyle, getInputStyle } from '../utils/adminTheme';
import {
  Box,
  Typography,
  Card,
  Button,
  Grid,
  Chip,
  TextField,
  Switch,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  SettingsRounded,
  NotificationsRounded,
  AdminPanelSettingsRounded,
  SaveRounded,
  KeyRounded,
  LanRounded
} from '@mui/icons-material';

const AdminSettings = () => {
  const { user } = useAuth();
  const { isLight } = useColorMode();
  const t = getAdminThemeTokens(isLight);

  const currentUser = user || { name: 'Authority Admin', email: 'admin@trueid.org', role: 'SUPER_ADMIN' };
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifyVerification: true,
    notifyRejection: true,
    notifyUpdate: true,
    notifyNewUser: false
  });

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || 'Authority Admin',
        email: currentUser.email || 'admin@trueid.org'
      }));
    }
    fetchAdminProfile();
  }, [currentUser]);

  const fetchAdminProfile = async () => {
    try {
      const profile = await ApiService.getAdminProfile();
      if (profile) {
        setFormData(prev => ({
          ...prev,
          ...profile,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
    } catch (err) {
      console.warn('Profile fetch warning (using defaults):', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setError('Current password is required to set a new password');
        setLoading(false);
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match');
        setLoading(false);
        return;
      }
      if (formData.newPassword.length < 8) {
        setError('Password must be at least 8 characters long');
        setLoading(false);
        return;
      }
    }

    try {
      const profileData = {
        name: formData.name,
        email: formData.email,
        notifyVerification: formData.notifyVerification,
        notifyRejection: formData.notifyRejection,
        notifyUpdate: formData.notifyUpdate,
        notifyNewUser: formData.notifyNewUser
      };

      await ApiService.updateAdminProfile(profileData);

      if (formData.newPassword) {
        await ApiService.changePassword(formData.currentPassword, formData.newPassword);
      }

      setSuccess(true);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to update settings. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      {/* Header Banner */}
      <Card sx={getBannerStyle(isLight)}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Chip
                icon={<SettingsRounded sx={{ fontSize: '14px !important', color: `${t.primary} !important` }} />}
                label="GOVERNMENT NODE SETTINGS"
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
                icon={<LanRounded sx={{ fontSize: '14px !important', color: `${t.success} !important` }} />}
                label="SEPOLIA TESTNET"
                size="small"
                sx={{
                  bgcolor: t.successBg,
                  color: t.successText,
                  border: `1px solid ${t.successBorder}`,
                  fontWeight: 700,
                  fontSize: '0.68rem'
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: t.textPrimary, letterSpacing: '-0.02em', mb: 0.5 }}>
              Authority Configuration
            </Typography>
            <Typography variant="body2" sx={{ color: t.textMuted, maxWidth: 640 }}>
              Node operator cryptographic access keys, notification webhooks, and administrative credentials.
            </Typography>
          </Box>
        </Box>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: t.errorBg, color: t.errorText, border: `1px solid ${t.errorBorder}` }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2, bgcolor: t.successBg, color: t.successText, border: `1px solid ${t.successBorder}` }}>
          Configuration updated and signed successfully.
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Operator Profile Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={getCardStyle(isLight, { p: 3, height: '100%' })}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: t.primaryBg, color: t.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AdminPanelSettingsRounded sx={{ fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: t.textPrimary, fontSize: '1rem' }}>
                    Operator Identity
                  </Typography>
                  <Typography variant="caption" sx={{ color: t.textMuted }}>
                    Officer profile in verified registry
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: t.textSecondary, fontWeight: 600, mb: 0.5, display: 'block' }}>
                    Authority Name
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    InputProps={{ sx: getInputStyle(isLight) }}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: t.textSecondary, fontWeight: 600, mb: 0.5, display: 'block' }}>
                    Official Email
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    InputProps={{ sx: getInputStyle(isLight) }}
                  />
                </Box>

                <Box sx={{ p: 2, borderRadius: 2, bgcolor: t.primaryBg, border: `1px solid ${t.primaryBorder}` }}>
                  <Typography variant="caption" sx={{ color: t.primary, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Authority Node Role
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: t.textPrimary, mt: 0.5 }}>
                    GOVERNMENT_AUTHORITY_ROOT (SUPER_ADMIN)
                  </Typography>
                  <Typography variant="caption" sx={{ color: t.textMuted }}>
                    Authorized to issue Soulbound tokens on Sepolia testnet
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* Security & Password Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={getCardStyle(isLight, { p: 3, height: '100%' })}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: t.successBg, color: t.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <KeyRounded sx={{ fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: t.textPrimary, fontSize: '1rem' }}>
                    Security & Credentials
                  </Typography>
                  <Typography variant="caption" sx={{ color: t.textMuted }}>
                    Update administrative master password
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: t.textSecondary, fontWeight: 600, mb: 0.5, display: 'block' }}>
                    Current Password
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    name="currentPassword"
                    type="password"
                    placeholder="••••••••••••"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    InputProps={{ sx: getInputStyle(isLight) }}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: t.textSecondary, fontWeight: 600, mb: 0.5, display: 'block' }}>
                    New Master Password
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    name="newPassword"
                    type="password"
                    placeholder="Min 8 characters"
                    value={formData.newPassword}
                    onChange={handleChange}
                    InputProps={{ sx: getInputStyle(isLight) }}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: t.textSecondary, fontWeight: 600, mb: 0.5, display: 'block' }}>
                    Confirm New Password
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter new password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    InputProps={{ sx: getInputStyle(isLight) }}
                  />
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* Webhook & Notification Card */}
          <Grid size={12}>
            <Card sx={getCardStyle(isLight, { p: 3 })}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: t.warningBg, color: t.warning, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <NotificationsRounded sx={{ fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: t.textPrimary, fontSize: '1rem' }}>
                    System Event Notifications
                  </Typography>
                  <Typography variant="caption" sx={{ color: t.textMuted }}>
                    Real-time alerts for identity state modifications
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: t.textPrimary }}>
                        Verification Approvals
                      </Typography>
                      <Typography variant="caption" sx={{ color: t.textMuted }}>
                        Alert when identity tokens are minted
                      </Typography>
                    </Box>
                    <Switch
                      name="notifyVerification"
                      checked={formData.notifyVerification}
                      onChange={handleChange}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: t.primary } }}
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: t.textPrimary }}>
                        Fraud & Rejection Flags
                      </Typography>
                      <Typography variant="caption" sx={{ color: t.textMuted }}>
                        High priority alert on suspicious submissions
                      </Typography>
                    </Box>
                    <Switch
                      name="notifyRejection"
                      checked={formData.notifyRejection}
                      onChange={handleChange}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: t.primary } }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Card>
          </Grid>

          {/* Submit Button */}
          <Grid size={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <SaveRounded />}
                disabled={loading}
                sx={{
                  bgcolor: t.primary,
                  color: '#ffffff',
                  fontWeight: 700,
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  boxShadow: isLight ? '0 4px 14px rgba(37, 99, 235, 0.3)' : '0 4px 18px rgba(59, 130, 246, 0.4)',
                  '&:hover': {
                    bgcolor: t.primaryDark
                  }
                }}
              >
                {loading ? 'Saving Settings...' : 'Save Configuration'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AdminSettings;
