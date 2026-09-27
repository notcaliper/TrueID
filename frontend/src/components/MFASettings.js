import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Switch,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Security,
  PhoneAndroid,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Info,
  Refresh,
  ContentCopy,
  Delete,
  Shield,
  VpnKey
} from '@mui/icons-material';
import MFASetup from './MFASetup';
import RecoveryCodes from './RecoveryCodes';
import { authAPI } from '../services/api.service';

/**
 * MFA Settings Component
 * Allows users to enable, disable, and manage MFA settings
 */
const MFASettings = ({ onStatusChange }) => {
  const [mfaStatus, setMfaStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Setup flow states
  const [setupData, setSetupData] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  
  // Disable flow states
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  
  // Regenerate codes states
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [regenerateCode, setRegenerateCode] = useState('');

  // Fetch MFA status on mount
  useEffect(() => {
    fetchMFAStatus();
  }, []);

  const fetchMFAStatus = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getMFAStatus();
      setMfaStatus(response.data);
      if (onStatusChange) {
        onStatusChange(response.data.enabled);
      }
    } catch (err) {
      setError('Failed to load MFA status');
    } finally {
      setLoading(false);
    }
  };

  // Start MFA setup
  const handleEnableMFA = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authAPI.setupMFA();
      setSetupData(response.data);
      setShowSetup(true);
    } catch (err) {
      setError(err.message || 'Failed to start MFA setup');
    } finally {
      setLoading(false);
    }
  };

  // Verify MFA setup
  const handleVerifySetup = async (code) => {
    try {
      setLoading(true);
      setError('');
      const response = await authAPI.verifyMFASetup(code);
      
      if (response.data.success) {
        setRecoveryCodes(response.data.recoveryCodes);
        setShowRecoveryCodes(true);
        setShowSetup(false);
        await fetchMFAStatus();
        return { success: true };
      }
    } catch (err) {
      setError(err.message || 'Verification failed');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Close recovery codes dialog
  const handleCloseRecoveryCodes = () => {
    setShowRecoveryCodes(false);
    setRecoveryCodes(null);
    setSuccess('MFA enabled successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Open disable dialog
  const handleOpenDisable = () => {
    setShowDisableDialog(true);
    setDisablePassword('');
    setDisableCode('');
    setError('');
  };

  // Disable MFA
  const handleDisableMFA = async () => {
    try {
      setLoading(true);
      setError('');
      await authAPI.disableMFA(disablePassword, disableCode);
      setShowDisableDialog(false);
      await fetchMFAStatus();
      setSuccess('MFA disabled successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to disable MFA');
    } finally {
      setLoading(false);
    }
  };

  // Open regenerate dialog
  const handleOpenRegenerate = () => {
    setShowRegenerateDialog(true);
    setRegenerateCode('');
    setError('');
  };

  // Regenerate recovery codes
  const handleRegenerateCodes = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authAPI.regenerateRecoveryCodes(regenerateCode);
      
      if (response.data.success) {
        setRecoveryCodes(response.data.recoveryCodes);
        setShowRegenerateDialog(false);
        setShowRecoveryCodes(true);
        setSuccess('Recovery codes regenerated');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to regenerate codes');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !mfaStatus) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Loading MFA settings...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="#fff" gutterBottom>
          Two-Factor Authentication
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Add an extra layer of security to your account by requiring a verification code in addition to your password.
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#fca5a5',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert 
          severity="success"
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#6ee7b7',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}

      {/* MFA Setup Dialog */}
      <Dialog
        open={showSetup}
        onClose={() => setShowSetup(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: '#111928',
            border: '1px solid rgba(255,255,255,0.1)',
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <MFASetup
            onSetup={handleEnableMFA}
            onVerify={handleVerifySetup}
            onCancel={() => setShowSetup(false)}
            loading={loading}
            error={error}
            setupData={setupData}
          />
        </DialogContent>
      </Dialog>

      {/* Recovery Codes Dialog */}
      {recoveryCodes && (
        <RecoveryCodes
          codes={recoveryCodes}
          open={showRecoveryCodes}
          onClose={handleCloseRecoveryCodes}
          onRegenerate={handleOpenRegenerate}
        />
      )}

      {/* Disable MFA Dialog */}
      <Dialog
        open={showDisableDialog}
        onClose={() => setShowDisableDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            background: '#111928',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>
          Disable Two-Factor Authentication
        </DialogTitle>
        <DialogContent>
          <Alert 
            severity="warning"
            sx={{ 
              mb: 3,
              background: 'rgba(245, 158, 11, 0.1)',
              color: '#fcd34d',
              border: '1px solid rgba(245, 158, 11, 0.2)',
            }}
          >
            This will make your account less secure. Are you sure?
          </Alert>
          
          <TextField
            fullWidth
            type="password"
            label="Current Password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
            }}
          />
          
          <TextField
            fullWidth
            label="MFA Code"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
            }}
            inputProps={{
              style: { textAlign: 'center', letterSpacing: 4, fontSize: '1.2rem' }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setShowDisableDialog(false)}
            sx={{ color: '#94a3b8' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDisableMFA}
            disabled={!disablePassword || disableCode.length !== 6 || loading}
            sx={{
              background: '#ef4444',
              '&:hover': { background: '#dc2626' },
            }}
          >
            {loading ? 'Processing...' : 'Disable MFA'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Regenerate Codes Dialog */}
      <Dialog
        open={showRegenerateDialog}
        onClose={() => setShowRegenerateDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            background: '#111928',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>
          Generate New Recovery Codes
        </DialogTitle>
        <DialogContent>
          <Alert 
            severity="info"
            sx={{ 
              mb: 3,
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#93c5fd',
              border: '1px solid rgba(59, 130, 246, 0.2)',
            }}
          >
            Enter your current MFA code to generate new recovery codes. Your old codes will no longer work.
          </Alert>
          
          <TextField
            fullWidth
            label="Current MFA Code"
            value={regenerateCode}
            onChange={(e) => setRegenerateCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
            }}
            inputProps={{
              style: { textAlign: 'center', letterSpacing: 4, fontSize: '1.2rem' }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setShowRegenerateDialog(false)}
            sx={{ color: '#94a3b8' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRegenerateCodes}
            disabled={regenerateCode.length !== 6 || loading}
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
            }}
          >
            {loading ? 'Generating...' : 'Generate New Codes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main MFA Status Card */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 3,
          borderRadius: 3,
          background: mfaStatus?.enabled 
            ? 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.1) 100%)'
            : 'linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(59,130,246,0.05) 100%)',
          border: `1px solid ${mfaStatus?.enabled ? 'rgba(16,185,129,0.3)' : 'rgba(139,92,246,0.2)'}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: mfaStatus?.enabled
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              }}
            >
              {mfaStatus?.enabled ? <Shield sx={{ color: '#fff', fontSize: 28 }} /> : <Security sx={{ color: '#fff', fontSize: 28 }} />}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600} color="#fff">
                Two-Factor Authentication
              </Typography>
              <Chip
                size="small"
                icon={mfaStatus?.enabled ? <CheckCircle /> : <ErrorIcon />}
                label={mfaStatus?.enabled ? 'Enabled' : 'Disabled'}
                color={mfaStatus?.enabled ? 'success' : 'default'}
                sx={{
                  mt: 0.5,
                  background: mfaStatus?.enabled ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)',
                  color: mfaStatus?.enabled ? '#6ee7b7' : '#94a3b8',
                  '& .MuiChip-icon': { color: mfaStatus?.enabled ? '#10b981' : '#94a3b8' },
                }}
              />
            </Box>
          </Box>
          
          <Switch
            checked={mfaStatus?.enabled || false}
            onChange={() => mfaStatus?.enabled ? handleOpenDisable() : handleEnableMFA()}
            disabled={loading}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#10b981',
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: '#10b981',
              },
            }}
          />
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

        {mfaStatus?.enabled ? (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Your account is protected with TOTP-based two-factor authentication.
            </Typography>
            
            <List sx={{ mt: 2 }}>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle sx={{ color: '#10b981' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Type: TOTP (Time-based One-Time Password)"
                  secondary="Compatible with Google Authenticator, Authy, Microsoft Authenticator"
                  primaryTypographyProps={{ color: '#fff' }}
                  secondaryTypographyProps={{ color: 'text.secondary' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle sx={{ color: '#10b981' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={`Backup Codes: ${mfaStatus?.backupCodesCount || 0} remaining`}
                  secondary="Use these if you lose access to your authenticator app"
                  primaryTypographyProps={{ color: '#fff' }}
                  secondaryTypographyProps={{ color: 'text.secondary' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle sx={{ color: '#10b981' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={`Enabled: ${mfaStatus?.verifiedAt ? new Date(mfaStatus.verifiedAt).toLocaleDateString() : 'N/A'}`}
                  primaryTypographyProps={{ color: '#fff' }}
                />
              </ListItem>
            </List>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleOpenRegenerate}
                disabled={loading}
                sx={{
                  borderColor: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  '&:hover': { borderColor: '#8b5cf6', background: 'rgba(139,92,246,0.1)' },
                }}
              >
                New Recovery Codes
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={handleOpenDisable}
                disabled={loading}
                sx={{
                  borderColor: 'rgba(239,68,68,0.3)',
                  color: '#ef4444',
                  '&:hover': { borderColor: '#ef4444', background: 'rgba(239,68,68,0.1)' },
                }}
              >
                Disable MFA
              </Button>
            </Box>
          </Box>
        ) : (
          <Box>
            <Alert 
              severity="info"
              icon={<Info />}
              sx={{ 
                mb: 3,
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#93c5fd',
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              Enable two-factor authentication to add an extra layer of security to your account.
            </Alert>

            <List sx={{ mb: 3 }}>
              <ListItem>
                <ListItemIcon>
                  <Security sx={{ color: '#8b5cf6' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Secure your account"
                  secondary="Even if your password is compromised, your account stays protected"
                  primaryTypographyProps={{ color: '#fff' }}
                  secondaryTypographyProps={{ color: 'text.secondary' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneAndroid sx={{ color: '#8b5cf6' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Use authenticator apps"
                  secondary="Works with Google Authenticator, Authy, Microsoft Authenticator"
                  primaryTypographyProps={{ color: '#fff' }}
                  secondaryTypographyProps={{ color: 'text.secondary' }}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <VpnKey sx={{ color: '#8b5cf6' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Backup recovery codes"
                  secondary="Get 10 single-use codes for account recovery"
                  primaryTypographyProps={{ color: '#fff' }}
                  secondaryTypographyProps={{ color: 'text.secondary' }}
                />
              </ListItem>
            </List>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleEnableMFA}
              disabled={loading}
              startIcon={<Security />}
              sx={{
                py: 1.5,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                fontWeight: 600,
                '&:hover': { background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)' },
              }}
            >
              {loading ? 'Loading...' : 'Enable Two-Factor Authentication'}
            </Button>
          </Box>
        )}
      </Paper>

      {/* Security Tips */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <Typography variant="h6" fontWeight={600} color="#fff" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning sx={{ color: '#f59e0b', fontSize: 24 }} />
          Security Tips
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText 
              primary="Store recovery codes in a safe place (password manager or physical safe)"
              primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Never share your MFA codes or recovery codes with anyone"
              primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="If you lose access to your authenticator app, use a recovery code to login"
              primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Consider using a password manager that supports TOTP for convenience"
              primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default MFASettings;
