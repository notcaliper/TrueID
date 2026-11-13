import React, { useState, useEffect } from 'react';
import ApiService from '../services/adminApi.service';
import BiometricVerificationAdmin from './BiometricVerificationAdmin';
import { useColorMode } from '../../context/ThemeContext';
import { getAdminThemeTokens, getInputStyle } from '../utils/adminTheme';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Tabs,
  Tab,
  TextField,
  CircularProgress,
  Alert,
  Grid,
  Tooltip,
  Divider
} from '@mui/material';
import {
  CloseRounded,
  VerifiedUserRounded,
  CancelRounded,
  FingerprintRounded,
  ContentCopyRounded,
  OpenInNewRounded,
  SecurityRounded,
  BlockRounded,
  LockResetRounded,
  CheckCircleRounded,
  AccountBalanceWalletRounded,
  WorkspacePremiumRounded,
  HistoryRounded,
  VisibilityRounded,
  DownloadRounded,
  DescriptionRounded
} from '@mui/icons-material';

const UserDetailModal = ({ user, onClose, onUserUpdated }) => {
  const { isLight } = useColorMode();
  const t = getAdminThemeTokens(isLight);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userData, setUserData] = useState(user);
  const [activeTab, setActiveTab] = useState(0);
  const [newFacemeshHash, setNewFacemeshHash] = useState('');
  const [versionHistory, setVersionHistory] = useState([]);
  const [professionalRecords, setProfessionalRecords] = useState([]);
  const [userActivityLogs, setUserActivityLogs] = useState([]);
  const [copiedField, setCopiedField] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewDocError, setPreviewDocError] = useState(false);

  const getFullDocUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const backendBase = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
    return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    fetchUserDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.getUserById(user.id);
      if (response && response.user) {
        const u = response.user;
        let biometricDataForHistory = null;

        if (response.biometricData && response.biometricData.length > 0) {
          const latestBiometricData = response.biometricData[0];
          biometricDataForHistory = latestBiometricData;

          if (latestBiometricData?.facemesh_hash) {
            u.facemesh_hash = latestBiometricData.facemesh_hash;
          } else if (latestBiometricData?.biometricHash) {
            u.facemesh_hash = latestBiometricData.biometricHash;
          } else if (latestBiometricData?.facemeshHash) {
            u.facemesh_hash = latestBiometricData.facemeshHash;
          }

          if (latestBiometricData?.blockchain_tx_hash) {
            u.blockchain_tx_hash = latestBiometricData.blockchain_tx_hash;
          }

          u.biometricHash = u.facemesh_hash;
          u.facemeshHash = u.facemesh_hash;
        }

        if (u.biometricHash && !u.facemesh_hash) {
          u.facemesh_hash = u.biometricHash;
        }

        u.on_chain = response.onChain || response.user?.on_chain || null;
        setUserData(u);

        if (response.professionalRecords && Array.isArray(response.professionalRecords)) {
          setProfessionalRecords(response.professionalRecords);
        }

        if (response.recentActivity && Array.isArray(response.recentActivity)) {
          setUserActivityLogs(response.recentActivity);
        }

        if (biometricDataForHistory && biometricDataForHistory.facemesh_hash) {
          const initialVersion = {
            id: 1,
            facemesh_hash: biometricDataForHistory.facemesh_hash,
            updated_by: 'Authority Sensor Enclave',
            created_at: biometricDataForHistory.created_at,
            blockchain_tx_hash: biometricDataForHistory.blockchain_tx_hash || null,
            record_type: 'Initial Biometric Enrolment',
            description: 'SHA-256 FaceMesh landmark vector commitment'
          };
          setVersionHistory([initialVersion]);
        }
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Failed to load user details.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUser = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await ApiService.verifyUser(userData.id);
      if (response && (response.user || response.success)) {
        const updated = { ...userData, ...(response.user || {}), verification_status: 'VERIFIED', is_verified: true };
        setUserData(updated);
        setSuccess('Citizen identity verified and attestation status updated successfully.');
        if (onUserUpdated) onUserUpdated(updated);
      }
    } catch (err) {
      console.error('Error verifying user:', err);
      setError(err.response?.data?.message || 'Failed to verify citizen identity.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectUser = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await ApiService.rejectUser(userData.id, actionReason || 'Identity submission rejected by authority audit.');
      if (response && (response.user || response.success)) {
        const updated = { ...userData, ...(response.user || {}), verification_status: 'REJECTED', is_verified: false };
        setUserData(updated);
        setSuccess('Citizen identity has been marked as REJECTED.');
        if (onUserUpdated) onUserUpdated(updated);
      }
    } catch (err) {
      console.error('Error rejecting user:', err);
      setError(err.response?.data?.message || 'Failed to reject citizen identity.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDeactivate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const willDeactivate = userData.is_active !== false;

    try {
      if (willDeactivate) {
        await ApiService.deactivateUser(userData.id, actionReason || 'Account suspended by authority admin.');
        const updated = { ...userData, is_active: false };
        setUserData(updated);
        setSuccess('Citizen account has been SUSPENDED. All active sessions invalidated.');
        if (onUserUpdated) onUserUpdated(updated);
      } else {
        await ApiService.reactivateUser(userData.id);
        const updated = { ...userData, is_active: true };
        setUserData(updated);
        setSuccess('Citizen account has been REACTIVATED successfully.');
        if (onUserUpdated) onUserUpdated(updated);
      }
    } catch (err) {
      console.error('Error changing account active state:', err);
      setError(err.response?.data?.message || 'Failed to update account state.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetMfa = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await ApiService.resetUserMfa(userData.id);
      const updated = { ...userData, mfa_enabled: false };
      setUserData(updated);
      setSuccess('User MFA credentials have been cleared. Citizen can now re-enroll authenticator.');
      if (onUserUpdated) onUserUpdated(updated);
    } catch (err) {
      console.error('Error resetting MFA:', err);
      setError(err.response?.data?.message || 'Failed to reset MFA.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFacemesh = async () => {
    if (!newFacemeshHash.trim()) {
      setError('FaceMesh hash cannot be empty.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await ApiService.updateFacemesh(userData.id, newFacemeshHash.trim());
      if (response && (response.user || response.success)) {
        const updated = { ...userData, facemesh_hash: newFacemeshHash.trim() };
        setUserData(updated);
        setNewFacemeshHash('');
        setSuccess('FaceMesh biometric vector updated successfully.');
        if (onUserUpdated) onUserUpdated(updated);
      }
    } catch (err) {
      console.error('Error updating FaceMesh hash:', err);
      setError(err.response?.data?.message || 'Failed to update FaceMesh hash.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  const isSuspended = userData.is_active === false;

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: t.paper,
          backgroundImage: 'none',
          borderRadius: 3,
          border: `1px solid ${t.border}`,
          boxShadow: isLight ? '0 20px 25px -5px rgba(0, 0, 0, 0.1)' : '0 24px 48px rgba(0, 0, 0, 0.7)'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5, borderBottom: `1px solid ${t.border}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: t.primaryBg, color: t.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SecurityRounded sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: t.textPrimary, fontSize: '1.1rem' }}>
                {userData.name || 'Citizen Profile'}
              </Typography>
              <Chip
                label={isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                size="small"
                sx={{
                  bgcolor: isSuspended ? t.errorBg : t.successBg,
                  color: isSuspended ? t.errorText : t.successText,
                  border: `1px solid ${isSuspended ? t.errorBorder : t.successBorder}`,
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  height: 20
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: t.textMuted, fontFamily: 'monospace' }}>
              Gov ID: {userData.government_id || 'N/A'} • DB Ref #{userData.id}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: t.textMuted, '&:hover': { color: t.textPrimary } }}>
          <CloseRounded />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: 3, borderBottom: `1px solid ${t.border}` }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{
            minHeight: 44,
            '& .MuiTab-root': {
              minHeight: 44,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: t.textMuted,
              '&.Mui-selected': { color: t.primary }
            },
            '& .MuiTabs-indicator': { backgroundColor: t.primary }
          }}
        >
          <Tab label="Identity Dossier" />
          <Tab label="Biometric Enclave" />
          <Tab label="DID & Blockchain" />
          <Tab label="Credentials & Audit" />
          <Tab label="Authority Actions" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, bgcolor: t.errorBg, color: t.errorText, border: `1px solid ${t.errorBorder}` }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2, bgcolor: t.successBg, color: t.successText, border: `1px solid ${t.successBorder}` }}>
            {success}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: t.primary }} />
          </Box>
        )}

        {/* Tab 0: Metadata */}
        {activeTab === 0 && !loading && (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}` }}>
                <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                  Full Legal Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: t.textPrimary, mt: 0.5 }}>
                  {userData.name || 'N/A'}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}` }}>
                <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                  Official Email Address
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: t.textPrimary, mt: 0.5 }}>
                  {userData.email || 'N/A'}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}` }}>
                <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                  Government Serial ID
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 700, color: t.primary, mt: 0.5 }}>
                  {userData.government_id || 'N/A'}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}` }}>
                <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                  Phone / Contact
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: t.textPrimary, mt: 0.5 }}>
                  {userData.phone || 'None registered'}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}` }}>
                <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                  Attestation State
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={userData.verification_status || 'PENDING'}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      bgcolor: userData.verification_status === 'VERIFIED' ? t.successBg : userData.verification_status === 'REJECTED' ? t.errorBg : t.warningBg,
                      color: userData.verification_status === 'VERIFIED' ? t.successText : userData.verification_status === 'REJECTED' ? t.errorText : t.warningText,
                      border: `1px solid ${userData.verification_status === 'VERIFIED' ? t.successBorder : userData.verification_status === 'REJECTED' ? t.errorBorder : t.warningBorder}`
                    }}
                  />
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}` }}>
                <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                  Two-Factor Authentication (MFA)
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: userData.mfa_enabled ? t.successText : t.textMuted, mt: 0.5 }}>
                  {userData.mfa_enabled ? 'Active (Authenticator TOTP)' : 'Not Enabled'}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}` }}>
                <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                  Registration Timestamp
                </Typography>
                <Typography variant="body2" sx={{ color: t.textSecondary, mt: 0.5 }}>
                  {formatDate(userData.created_at)}
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}` }}>
                <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>
                  Last Attestation Modification
                </Typography>
                <Typography variant="body2" sx={{ color: t.textSecondary, mt: 0.5 }}>
                  {formatDate(userData.updated_at)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}

        {/* Tab 1: Biometrics */}
        {activeTab === 1 && !loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: t.primaryBg, border: `1px solid ${t.primaryBorder}` }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FingerprintRounded sx={{ color: t.primary, fontSize: 20 }} />
                  <Typography variant="caption" sx={{ color: t.primary, fontWeight: 700, letterSpacing: '0.06em' }}>
                    ACTIVE FACEMESH 68-NODE SHA-256 VECTOR
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={userData.facemesh_hash ? 'ENCLAVE VECTOR ACTIVE' : 'NO VECTOR REGISTERED'}
                    size="small"
                    sx={{
                      bgcolor: userData.facemesh_hash ? t.successBg : t.surfaceSubtle,
                      color: userData.facemesh_hash ? t.successText : t.textMuted,
                      border: `1px solid ${userData.facemesh_hash ? t.successBorder : t.border}`,
                      fontWeight: 700,
                      fontSize: '0.65rem'
                    }}
                  />
                  {userData.facemesh_hash && (
                    <Tooltip title={copiedField === 'facemesh' ? 'Copied!' : 'Copy Hash'}>
                      <IconButton size="small" onClick={() => copyToClipboard(userData.facemesh_hash, 'facemesh')} sx={{ color: copiedField === 'facemesh' ? t.success : t.textMuted }}>
                        <ContentCopyRounded sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', color: t.textPrimary, wordBreak: 'break-all', fontSize: '0.85rem' }}>
                {userData.facemesh_hash || 'No biometric vector registered for this citizen.'}
              </Typography>
            </Box>

            {/* Live Face Scanning & 1-to-1 Match Section */}
            <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}` }}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <FingerprintRounded sx={{ color: t.primary, fontSize: 22 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: t.textPrimary }}>
                    Live Face Scan & Enclave 1-to-1 Match
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: t.textMuted }}>
                  Scan the citizen in real-time to verify physical biological presence against their registered enclave vector.
                </Typography>
              </Box>

              <BiometricVerificationAdmin
                targetUserId={userData.id}
                targetUserName={userData.name}
                onVerificationComplete={(matchedUser) => {
                  setSuccess(`Biometric identity verified: ${matchedUser.name || userData.name}`);
                }}
              />
            </Box>

            {/* Override Vector */}
            <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}` }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: t.textPrimary, mb: 1 }}>
                Update / Override Biometric Vector
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Enter 64-hex SHA-256 hash or verified FaceMesh landmark payload"
                value={newFacemeshHash}
                onChange={(e) => setNewFacemeshHash(e.target.value)}
                InputProps={{
                  sx: {
                    ...getInputStyle(isLight),
                    fontFamily: 'monospace',
                    fontSize: '0.8rem'
                  }
                }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleUpdateFacemesh}
                disabled={!newFacemeshHash.trim()}
                sx={{
                  mt: 1.5,
                  borderColor: t.primaryBorder,
                  color: t.primary,
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: t.primaryBg,
                  '&:hover': { bgcolor: t.primary, color: '#ffffff' }
                }}
              >
                Commit New Biometric Vector
              </Button>
            </Box>
          </Box>
        )}

        {/* Tab 2: DID & Blockchain */}
        {activeTab === 2 && !loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Live Smart Contract Verification Status */}
            <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: userData.on_chain?.isVerifiedOnChain ? t.successBg : t.surfaceSubtle, border: `1px solid ${userData.on_chain?.isVerifiedOnChain ? t.successBorder : t.border}` }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VerifiedUserRounded sx={{ fontSize: 20, color: userData.on_chain?.isVerifiedOnChain ? t.success : t.textMuted }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: t.textPrimary }}>
                    Smart Contract Attestation Status
                  </Typography>
                </Box>
                <Chip
                  label={userData.on_chain?.isVerifiedOnChain ? 'ON-CHAIN VERIFIED • SEPOLIA' : (userData.on_chain?.isRegisteredOnChain ? 'REGISTERED ON-CHAIN' : 'NOT YET SYNCED ON-CHAIN')}
                  size="small"
                  sx={{
                    bgcolor: userData.on_chain?.isVerifiedOnChain ? t.success : (isLight ? '#f1f5f9' : '#1e293b'),
                    color: userData.on_chain?.isVerifiedOnChain ? '#ffffff' : t.textMuted,
                    fontWeight: 700,
                    fontSize: '0.72rem'
                  }}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>
                    Soulbound Token (SBT) Badge
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: t.textPrimary, mt: 0.5 }}>
                    {userData.on_chain?.soulboundTokenId ? (
                      <span style={{ color: t.primary }}>Token #{userData.on_chain.soulboundTokenId} (EIP-5192 Soulbound)</span>
                    ) : (
                      <span style={{ color: t.textMuted }}>No Soulbound Token Minted</span>
                    )}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>
                    Token Transferability
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: userData.on_chain?.isBadgeValid ? t.success : t.textMuted, mt: 0.5 }}>
                    {userData.on_chain?.isBadgeValid ? 'LOCKED & BOUND TO WALLET' : 'UNLOCKED / INACTIVE'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}` }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>
                  Decentralized Identifier (DID)
                </Typography>
                <Tooltip title={copiedField === 'did' ? 'Copied!' : 'Copy DID'}>
                  <IconButton size="small" onClick={() => copyToClipboard(userData.did || (userData.wallet_address ? `did:trueid:${userData.wallet_address.toLowerCase()}` : ''), 'did')} sx={{ color: copiedField === 'did' ? t.success : t.textMuted }}>
                    <ContentCopyRounded sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', color: t.primary, fontWeight: 700, wordBreak: 'break-all' }}>
                {userData.did || (userData.wallet_address ? `did:trueid:${userData.wallet_address.toLowerCase()}` : 'No DID provisioned')}
              </Typography>
            </Box>

            <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}` }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>
                  Ethereum Sepolia Authority Wallet Address
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title={copiedField === 'wallet' ? 'Copied!' : 'Copy Address'}>
                    <IconButton size="small" onClick={() => copyToClipboard(userData.wallet_address, 'wallet')} sx={{ color: copiedField === 'wallet' ? t.success : t.textMuted }}>
                      <ContentCopyRounded sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  {userData.wallet_address && (
                    <Tooltip title="View on Sepolia Etherscan">
                      <IconButton size="small" onClick={() => window.open(`https://sepolia.etherscan.io/address/${userData.wallet_address}`, '_blank')} sx={{ color: t.primary }}>
                        <OpenInNewRounded sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', color: t.textPrimary, wordBreak: 'break-all' }}>
                {userData.wallet_address || 'No wallet address provisioned'}
              </Typography>
            </Box>

            {userData.blockchain_tx_hash && (
              <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>
                    Attestation Transaction Hash
                  </Typography>
                  <Tooltip title="View Transaction on Sepolia Etherscan">
                    <IconButton size="small" onClick={() => window.open(`https://sepolia.etherscan.io/tx/${userData.blockchain_tx_hash}`, '_blank')} sx={{ color: t.primary }}>
                      <OpenInNewRounded sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: t.primary, wordBreak: 'break-all' }}>
                  {userData.blockchain_tx_hash}
                </Typography>
              </Box>
            )}

            {/* Smart Contract Deployments Info */}
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: isLight ? '#f8fafc' : '#0b1120', border: `1px solid ${t.border}` }}>
              <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 1 }}>
                Authority Smart Contract Ecosystem (Sepolia)
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: t.textSecondary, fontWeight: 600 }}>TrueIDSoulboundBadge (ERC-5192):</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: t.primary }}>
                    <a href="https://sepolia.etherscan.io/address/0x6f4d27d80f84ce44eFecF9A1eAd6A5e6489ae9Bf" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                      0x6f4d...e9Bf ↗
                    </a>
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: t.textSecondary, fontWeight: 600 }}>Identity Registry Contract:</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: t.primary }}>
                    <a href="https://sepolia.etherscan.io/address/0xDAA6c4D8fc7B4AAc7B6f7724939b6dB548dF1F02" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                      0xDAA6...1F02 ↗
                    </a>
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: t.textSecondary, fontWeight: 600 }}>TrueIDDIDRegistry (ERC-1056):</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: t.primary }}>
                    <a href="https://sepolia.etherscan.io/address/0x6877d0edD489fdCa49Cb9086684E6868e1153985" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                      0x6877...3985 ↗
                    </a>
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Tab 3: Credentials & Audit */}
        {activeTab === 3 && !loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: t.textPrimary, mb: 1.5 }}>
                Professional Records ({professionalRecords.length})
              </Typography>
              {professionalRecords.length === 0 ? (
                <Typography variant="body2" sx={{ color: t.textMuted }}>No professional records registered.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {professionalRecords.map((r, i) => {
                    const docUrl = r.document_url ? getFullDocUrl(r.document_url) : '';
                    const isPdf = docUrl && docUrl.toLowerCase().endsWith('.pdf');
                    const isVerifiedRec = r.verification_status === 'VERIFIED' || r.is_verified;

                    return (
                      <Box key={r.id || i} sx={{ p: 2, borderRadius: 2, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}` }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: t.textPrimary, fontSize: '0.92rem' }}>{r.title}</Typography>
                            <Typography variant="caption" sx={{ color: t.primary, fontWeight: 600 }}>
                              {r.institution || r.organization} • {r.record_type || 'Credential'}
                            </Typography>
                          </Box>
                          <Chip
                            label={r.verification_status || (isVerifiedRec ? 'VERIFIED' : 'PENDING')}
                            size="small"
                            sx={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              bgcolor: isVerifiedRec ? t.successBg : t.warningBg,
                              color: isVerifiedRec ? t.successText : t.warningText,
                              border: `1px solid ${isVerifiedRec ? t.successBorder : t.warningBorder}`
                            }}
                          />
                        </Box>

                        {r.description && (
                          <Typography variant="caption" sx={{ color: t.textSecondary, mt: 0.8, display: 'block' }}>
                            {r.description}
                          </Typography>
                        )}

                        {/* Document & Hash Action Bar */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5, pt: 1.2, borderTop: `1px solid ${t.border}`, flexWrap: 'wrap', gap: 1 }}>
                          {docUrl ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<VisibilityRounded sx={{ fontSize: '15px !important' }} />}
                                onClick={() => {
                                  setPreviewDocError(false);
                                  setPreviewDoc({ url: docUrl, title: r.title, type: isPdf ? 'pdf' : 'image' });
                                }}
                                sx={{
                                  fontSize: '0.74rem',
                                  textTransform: 'none',
                                  fontWeight: 700,
                                  borderColor: t.primaryBorder,
                                  color: t.primary,
                                  bgcolor: t.primaryBg,
                                  py: 0.3,
                                  px: 1.2
                                }}
                              >
                                View Document
                              </Button>
                              <Button
                                size="small"
                                component="a"
                                href={docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                startIcon={<OpenInNewRounded sx={{ fontSize: '14px !important' }} />}
                                sx={{
                                  fontSize: '0.74rem',
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  color: t.textSecondary,
                                  py: 0.3
                                }}
                              >
                                Open Tab ↗
                              </Button>
                              <IconButton
                                component="a"
                                href={docUrl}
                                download
                                size="small"
                                sx={{ color: t.textSecondary, p: 0.4 }}
                              >
                                <DownloadRounded sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Box>
                          ) : (
                            <Typography variant="caption" sx={{ color: t.textMuted, fontStyle: 'italic' }}>
                              No document uploaded
                            </Typography>
                          )}

                          {r.data_hash && (
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: t.textMuted, fontSize: '0.7rem' }}>
                              SHA: {r.data_hash.slice(0, 10)}...{r.data_hash.slice(-6)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>

            <Divider sx={{ borderColor: t.border }} />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: t.textPrimary, mb: 1.5 }}>
                Recent Security Audit Logs ({userActivityLogs.length})
              </Typography>
              {userActivityLogs.length === 0 ? (
                <Typography variant="body2" sx={{ color: t.textMuted }}>No audit records found.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {userActivityLogs.slice(0, 5).map((log, i) => (
                    <Box key={log.id || i} sx={{ p: 1.5, borderRadius: 1.5, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: t.primary, display: 'block' }}>{log.action}</Typography>
                        <Typography variant="caption" sx={{ color: t.textMuted }}>{log.details?.message || log.entity_type}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: t.textMuted }}>{formatDate(log.created_at)}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Tab 4: Authority Actions */}
        {activeTab === 4 && !loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}` }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: t.textPrimary, mb: 1 }}>
                Attestation & Identity Decisions
              </Typography>
              <Typography variant="body2" sx={{ color: t.textMuted, mb: 2 }}>
                Issue cryptographic verification tokens or flag fraudulent claims.
              </Typography>

              <TextField
                fullWidth
                size="small"
                placeholder="Audit notes or justification reason (optional)"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                InputProps={{ sx: { ...getInputStyle(isLight), mb: 2 } }}
              />

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<VerifiedUserRounded />}
                  onClick={handleVerifyUser}
                  disabled={loading || userData.verification_status === 'VERIFIED'}
                  sx={{
                    bgcolor: t.success,
                    color: '#ffffff',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#059669' }
                  }}
                >
                  Approve & Issue Attestation
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<CancelRounded />}
                  onClick={handleRejectUser}
                  disabled={loading || userData.verification_status === 'REJECTED'}
                  sx={{
                    borderColor: t.errorBorder,
                    color: t.errorText,
                    bgcolor: t.errorBg,
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { bgcolor: t.error, color: '#fff' }
                  }}
                >
                  Reject Submission
                </Button>
              </Box>
            </Box>

            <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}` }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: t.textPrimary, mb: 1 }}>
                Account Security & Administrative Controls
              </Typography>

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={isSuspended ? <CheckCircleRounded /> : <BlockRounded />}
                  onClick={handleToggleDeactivate}
                  disabled={loading}
                  sx={{
                    borderColor: isSuspended ? t.successBorder : t.errorBorder,
                    color: isSuspended ? t.successText : t.errorText,
                    bgcolor: isSuspended ? t.successBg : t.errorBg,
                    fontWeight: 700,
                    textTransform: 'none'
                  }}
                >
                  {isSuspended ? 'Reactivate Account' : 'Suspend Account'}
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<LockResetRounded />}
                  onClick={handleResetMfa}
                  disabled={loading || !userData.mfa_enabled}
                  sx={{
                    borderColor: t.warningBorder,
                    color: t.warningText,
                    bgcolor: t.warningBg,
                    fontWeight: 700,
                    textTransform: 'none'
                  }}
                >
                  Reset MFA Lockout
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${t.border}` }}>
        <Button onClick={onClose} sx={{ color: t.textSecondary, textTransform: 'none', fontWeight: 600 }}>
          Close Dossier
        </Button>
      </DialogActions>

      {/* Document Preview Dialog */}
      <Dialog
        open={Boolean(previewDoc)}
        onClose={() => {
          setPreviewDoc(null);
          setPreviewDocError(false);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: isLight ? '#ffffff' : '#181a1c',
            border: `1px solid ${t.border}`,
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, px: 3, pt: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionRounded sx={{ color: t.primary }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: t.textPrimary, fontSize: '1.05rem' }}>
              {previewDoc?.title || 'Credential Supporting Document'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {previewDoc?.url && (
              <Button
                component="a"
                href={previewDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                startIcon={<OpenInNewRounded sx={{ fontSize: 14 }} />}
                sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, color: t.primary }}
              >
                Open in New Tab
              </Button>
            )}
            <IconButton size="small" onClick={() => { setPreviewDoc(null); setPreviewDocError(false); }} sx={{ color: t.textMuted }}>
              <CloseRounded />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: isLight ? '#f8fafc' : '#141618', minHeight: 400 }}>
          {previewDocError ? (
            <Box sx={{ textAlign: 'center', py: 4, px: 2, maxWidth: 500 }}>
              <Box sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                border: `1px solid ${isLight ? '#fecaca' : 'rgba(239, 68, 68, 0.25)'}`
              }}>
                <DescriptionRounded sx={{ fontSize: 32, color: '#ef4444' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: t.textPrimary, mb: 1, fontSize: '1rem' }}>
                Inline Preview Unavailable
              </Typography>
              <Typography variant="body2" sx={{ color: t.textSecondary, mb: 3, lineHeight: 1.6, fontSize: '0.85rem' }}>
                The document could not be rendered inline directly (file may be in an external format, not physically stored on this server, or restricted by cross-origin security). You can still access the file directly.
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Button
                  component="a"
                  href={previewDoc?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  size="small"
                  startIcon={<OpenInNewRounded />}
                  sx={{ textTransform: 'none', fontWeight: 600, color: t.primary, borderColor: t.primaryBorder }}
                >
                  Open in New Tab
                </Button>
                <Button
                  component="a"
                  href={previewDoc?.url}
                  download
                  variant="contained"
                  size="small"
                  startIcon={<DownloadRounded />}
                  sx={{ bgcolor: t.primary, textTransform: 'none', fontWeight: 700 }}
                >
                  Download File
                </Button>
              </Box>
            </Box>
          ) : previewDoc?.type === 'pdf' ? (
            <Box
              component="iframe"
              src={previewDoc.url}
              title={previewDoc.title || 'Document Preview'}
              onError={() => setPreviewDocError(true)}
              sx={{ width: '100%', height: '70vh', border: 'none', borderRadius: 1.5 }}
            />
          ) : (
            <Box
              component="img"
              src={previewDoc?.url}
              alt={previewDoc?.title || 'Document Preview'}
              onError={() => setPreviewDocError(true)}
              sx={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 1.5, boxShadow: isLight ? '0 4px 12px rgba(0,0,0,0.08)' : '0 4px 16px rgba(0,0,0,0.4)' }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => { setPreviewDoc(null); setPreviewDocError(false); }} sx={{ color: t.textMuted, textTransform: 'none' }}>
            Close
          </Button>
          {previewDoc?.url && (
            <Button
              component="a"
              href={previewDoc.url}
              download
              variant="contained"
              startIcon={<DownloadRounded />}
              sx={{ bgcolor: t.primary, textTransform: 'none', fontWeight: 700 }}
            >
              Download File
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default UserDetailModal;
