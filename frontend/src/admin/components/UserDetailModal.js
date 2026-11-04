import React, { useState, useEffect } from 'react';
import ApiService from '../services/adminApi.service';
import BlockchainService from '../services/adminBlockchain.service';
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
  Divider,
  Grid,
  Tooltip
} from '@mui/material';
import {
  CloseRounded,
  VerifiedUserRounded,
  CancelRounded,
  FingerprintRounded,
  HistoryRounded,
  DescriptionRounded,
  ContentCopyRounded,
  OpenInNewRounded,
  SecurityRounded,
  EditRounded,
  CheckCircleOutlineRounded
} from '@mui/icons-material';

const UserDetailModal = ({ user, onClose, onUserUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userData, setUserData] = useState(user);
  const [activeTab, setActiveTab] = useState(0);
  const [newFacemeshHash, setNewFacemeshHash] = useState('');
  const [versionHistory, setVersionHistory] = useState([]);
  const [isEdit, setIsEdit] = useState(user.isEdit || false);
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const [blockchainError, setBlockchainError] = useState(null);
  const [blockchainSuccess, setBlockchainSuccess] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

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

        setUserData(u);

        if (response.professionalRecords && Array.isArray(response.professionalRecords) && response.professionalRecords.length > 0) {
          const normalizedRecords = response.professionalRecords.map(record => {
            if (record.biometricHash && !record.facemesh_hash) {
              record.facemesh_hash = record.biometricHash;
            }
            return record;
          });
          setVersionHistory(normalizedRecords);
        } else if (biometricDataForHistory && biometricDataForHistory.facemesh_hash) {
          const initialVersion = {
            id: 1,
            facemesh_hash: biometricDataForHistory.facemesh_hash,
            updated_by: 'System Enclave',
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
    if (!userData || !userData.id) return;
    setLoading(true);
    setBlockchainError(null);
    setBlockchainSuccess(null);

    try {
      let txHash = null;
      try {
        if (!BlockchainService.initialized) {
          await BlockchainService.initialize();
        }
        const blockchainResult = await BlockchainService.verifyIdentity(userData.id);
        if (blockchainResult.success) {
          setBlockchainSuccess('On-chain attestation confirmed.');
          txHash = blockchainResult.txHash;
        }
      } catch (bcErr) {
        console.warn('Blockchain verification warning:', bcErr);
      }

      await ApiService.verifyIdentity(userData.id);

      const updatedUser = {
        ...userData,
        verification_status: 'VERIFIED',
        updated_at: new Date().toISOString()
      };
      if (txHash) updatedUser.txHash = txHash;

      setUserData(updatedUser);
      if (onUserUpdated) onUserUpdated(updatedUser);

      setSuccess('Identity attested and marked VERIFIED.');
    } catch (err) {
      setError('Verification failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectUser = async () => {
    if (!userData || !userData.id) return;
    setLoading(true);
    try {
      await ApiService.rejectIdentity(userData.id, 'Identity documentation insufficient or facial geometry mismatch');
      const updatedUser = {
        ...userData,
        verification_status: 'REJECTED',
        updated_at: new Date().toISOString()
      };
      setUserData(updatedUser);
      if (onUserUpdated) onUserUpdated(updatedUser);
      setSuccess('Identity claim has been marked REJECTED.');
    } catch (err) {
      setError('Failed to reject claim.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFacemesh = async () => {
    if (!newFacemeshHash.trim()) {
      setError('Facemesh hash cannot be empty');
      return;
    }
    setLoading(true);
    setBlockchainLoading(true);
    try {
      let txHash = null;
      if (userData.wallet_address) {
        try {
          if (!BlockchainService.initialized) await BlockchainService.initialize();
          const bcRes = await BlockchainService.updateBiometricHash(userData.wallet_address, newFacemeshHash);
          if (bcRes.success) txHash = bcRes.txHash;
        } catch (bcErr) {
          console.warn('Blockchain update warning:', bcErr);
        }
      }

      await ApiService.updateBiometricData(userData.id, newFacemeshHash);

      const updatedUser = {
        ...userData,
        facemesh_hash: newFacemeshHash,
        verification_status: 'PENDING',
        updated_at: new Date().toISOString()
      };
      if (txHash) updatedUser.blockchain_tx_hash = txHash;

      const newVersion = {
        id: versionHistory.length + 1,
        facemesh_hash: newFacemeshHash,
        updated_by: 'Authority Admin',
        created_at: new Date().toISOString(),
        blockchain_tx_hash: txHash
      };
      setVersionHistory([newVersion, ...versionHistory]);
      setUserData(updatedUser);
      setNewFacemeshHash('');
      setIsEdit(false);
      if (onUserUpdated) onUserUpdated(updatedUser);
      setSuccess('Biometric FaceMesh vector updated.');
    } catch (err) {
      setError('Failed to update facemesh hash.');
    } finally {
      setLoading(false);
      setBlockchainLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
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

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#0d121d',
          backgroundImage: 'none',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.7)'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SecurityRounded sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f8fafc', fontSize: '1.05rem' }}>
              Citizen Dossier: {userData.name || 'Citizen Profile'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>
              Gov ID: {userData.government_id || 'N/A'} • DB Ref #{userData.id}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#94a3b8' }}>
          <CloseRounded />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
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
              color: '#94a3b8',
              '&.Mui-selected': { color: '#818cf8' }
            },
            '& .MuiTabs-indicator': { backgroundColor: '#6366f1' }
          }}
        >
          <Tab label="Identity Metadata" />
          <Tab label="Biometric Enclave" />
          <Tab label="Verification Decision" />
          <Tab label="Audit History" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            {success}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#6366f1' }} />
          </Box>
        )}

        {/* Tab 0: Metadata */}
        {activeTab === 0 && !loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Full Legal Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#f8fafc', mt: 0.5 }}>
                    {userData.name || 'N/A'}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Email Address
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#f8fafc', mt: 0.5 }}>
                    {userData.email || 'N/A'}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Government Unique ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8', mt: 0.5 }}>
                    {userData.government_id || 'N/A'}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Current Attestation State
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={userData.verification_status || 'PENDING'}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        bgcolor: userData.verification_status === 'VERIFIED' ? 'rgba(16, 185, 129, 0.15)' : userData.verification_status === 'REJECTED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: userData.verification_status === 'VERIFIED' ? '#34d399' : userData.verification_status === 'REJECTED' ? '#f87171' : '#fbbf24',
                        border: `1px solid ${userData.verification_status === 'VERIFIED' ? 'rgba(16, 185, 129, 0.3)' : userData.verification_status === 'REJECTED' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                      }}
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Enrollment Date
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
                    {formatDate(userData.created_at)}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Last Audit Sync
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
                    {formatDate(userData.updated_at)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 1: Biometrics */}
        {activeTab === 1 && !loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FingerprintRounded sx={{ color: '#818cf8', fontSize: 20 }} />
                  <Typography variant="caption" sx={{ color: '#818cf8', fontWeight: 700, letterSpacing: '0.06em' }}>
                    ACTIVE FACEMESH 68-NODE SHA-256 HASH
                  </Typography>
                </Box>
                <Tooltip title={copiedHash ? 'Copied!' : 'Copy Hash'}>
                  <IconButton size="small" onClick={() => copyToClipboard(userData.facemesh_hash)} sx={{ color: copiedHash ? '#10b981' : '#94a3b8' }}>
                    <ContentCopyRounded sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#f8fafc', wordBreak: 'break-all', fontSize: '0.85rem' }}>
                {userData.facemesh_hash || 'No biometric vector registered for this citizen.'}
              </Typography>
            </Box>

            {userData.blockchain_tx_hash && (
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Anchor Transaction Receipt
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#818cf8', wordBreak: 'break-all' }}>
                    {userData.blockchain_tx_hash}
                  </Typography>
                  <Tooltip title="View on Sepolia Etherscan">
                    <IconButton size="small" onClick={() => window.open(`https://sepolia.etherscan.io/tx/${userData.blockchain_tx_hash}`, '_blank')} sx={{ color: '#6366f1' }}>
                      <OpenInNewRounded sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            )}

            {/* Edit / Force Update Vector */}
            <Box sx={{ mt: 1, p: 2, borderRadius: 2, bgcolor: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc', mb: 1 }}>
                Override Biometric FaceMesh Vector
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Enter 64-hex SHA-256 hash or paste verified sensor payload"
                value={newFacemeshHash}
                onChange={(e) => setNewFacemeshHash(e.target.value)}
                InputProps={{
                  sx: {
                    bgcolor: 'rgba(13, 18, 29, 0.8)',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    color: '#f8fafc',
                    borderRadius: 1.5,
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' }
                  }
                }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleUpdateFacemesh}
                disabled={!newFacemeshHash.trim() || blockchainLoading}
                sx={{
                  mt: 1.5,
                  borderColor: 'rgba(99, 102, 241, 0.3)',
                  color: '#a5b4fc',
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                {blockchainLoading ? 'Attesting on Chain...' : 'Commit New Biometric Vector'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Tab 2: Verification Decision */}
        {activeTab === 2 && !loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f8fafc', mb: 1 }}>
                Authority Attestation Decision
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                Executing this decision issues a cryptographically signed credential from your authority node. Approving will broadcast an on-chain verification attestation.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<VerifiedUserRounded />}
                  onClick={handleVerifyUser}
                  disabled={loading || userData.verification_status === 'VERIFIED'}
                  sx={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    borderRadius: 2
                  }}
                >
                  Approve & Issue Soulbound Token
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<CancelRounded />}
                  onClick={handleRejectUser}
                  disabled={loading || userData.verification_status === 'REJECTED'}
                  sx={{
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    fontWeight: 700,
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: 'rgba(239, 68, 68, 0.1)',
                      borderColor: '#ef4444'
                    }
                  }}
                >
                  Reject & Flag Submission
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* Tab 3: Audit History */}
        {activeTab === 3 && !loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {versionHistory.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                <Typography variant="body2">No prior biometric updates found.</Typography>
              </Box>
            ) : (
              versionHistory.map((v, i) => (
                <Box
                  key={v.id || i}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                      {v.record_type || 'Biometric State Modification'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {formatDate(v.created_at)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#94a3b8', display: 'block', wordBreak: 'break-all' }}>
                    Hash: {v.facemesh_hash || 'N/A'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', mt: 0.5, display: 'block' }}>
                    Authorized by: {v.updated_by || 'System'}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Button onClick={onClose} sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 600 }}>
          Close Dossier
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDetailModal;
