import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Divider,
  Stepper,
  Step,
  StepLabel,
  CircularProgress
} from '@mui/material';
import {
  Download,
  Delete,
  Archive,
  Warning,
  CheckCircle,
  History,
  FileDownload,
  Info
} from '@mui/icons-material';
import { userAPI } from '../services/api.service';

/**
 * GDPR Panel Component
 * Data export and account deletion (Right to Access, Right to be Forgotten)
 */
const GDPRPanel = () => {
  const [exports, setExports] = useState([]);
  const [deletionStatus, setDeletionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [exportDialog, setExportDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [exportResponse, deletionResponse] = await Promise.all([
        userAPI.getExportHistory(),
        userAPI.getDeletionStatus()
      ]);
      setExports(exportResponse.data.exports || []);
      setDeletionStatus(deletionResponse.data);
    } catch (err) {
      console.error('Failed to load GDPR data:', err);
    }
  };

  const handleExportRequest = async () => {
    try {
      setLoading(true);
      setError('');
      await userAPI.requestDataExport({ format: 'JSON' });
      setSuccess('Data export requested. Processing may take a few minutes.');
      setExportDialog(false);
      await fetchData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to request export');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (requestId) => {
    try {
      const response = await userAPI.downloadExport(requestId);
      // Trigger download
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trueid-export-${requestId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Failed to download export');
    }
  };

  const handleDeleteRequest = async () => {
    try {
      setLoading(true);
      setError('');
      await userAPI.requestAccountDeletion({
        reason: deleteReason,
        password: deletePassword
      });
      setSuccess('Account deletion requested. You have 30 days to cancel.');
      setDeleteDialog(false);
      setDeleteStep(0);
      setDeletePassword('');
      setDeleteReason('');
      await fetchData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to request deletion');
      setLoading(false);
    }
  };

  const handleCancelDeletion = async (requestId) => {
    try {
      setLoading(true);
      await userAPI.cancelAccountDeletion(requestId);
      setSuccess('Account deletion cancelled successfully');
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to cancel deletion');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getStatusChip = (status, isExpired) => {
    if (isExpired) {
      return <Chip size="small" label="Expired" sx={{ background: 'rgba(255,255,255,0.1)', color: '#94a3b8' }} />;
    }
    switch (status) {
      case 'COMPLETED':
        return <Chip size="small" icon={<CheckCircle />} label="Ready" color="success" />;
      case 'PROCESSING':
      case 'PENDING':
        return <Chip size="small" icon={<CircularProgress size={12} />} label="Processing" color="primary" />;
      case 'FAILED':
        return <Chip size="small" icon={<Warning />} label="Failed" color="error" />;
      default:
        return <Chip size="small" label={status} />;
    }
  };

  const deleteSteps = ['Confirm Password', 'Provide Reason', 'Review & Submit'];

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" fontWeight={700} color="#fff" gutterBottom>
        Your Data & Privacy
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your personal data and privacy settings in compliance with GDPR.
      </Typography>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Data Export Section */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(139,92,246,0.05) 100%)',
          border: '1px solid rgba(59,130,246,0.2)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
            }}
          >
            <Archive sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={600} color="#fff">
              Export Your Data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Download a copy of all your personal data (GDPR Right to Access)
            </Typography>
          </Box>
        </Box>

        <Alert
          severity="info"
          sx={{
            mb: 3,
            background: 'rgba(59, 130, 246, 0.1)',
            color: '#93c5fd',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}
        >
          You can request up to 3 exports per day. Exports include your profile, biometric data, professional records, documents, session history, and activity logs.
        </Alert>

        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={() => setExportDialog(true)}
          disabled={loading || exports.filter(e => e.status === 'PENDING' || e.status === 'PROCESSING').length > 0}
          sx={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            fontWeight: 600
          }}
        >
          Request Data Export
        </Button>

        {/* Export History */}
        {exports.length > 0 && (
          <>
            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
            <Typography variant="subtitle2" fontWeight={600} color="#fff" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <History fontSize="small" />
              Recent Exports
            </Typography>
            <List dense>
              {exports.slice(0, 5).map((exportItem) => (
                <ListItem
                  key={exportItem.id}
                  secondaryAction={
                    exportItem.status === 'COMPLETED' && !exportItem.isExpired && (
                      <Button
                        size="small"
                        startIcon={<FileDownload />}
                        onClick={() => handleDownload(exportItem.id)}
                        sx={{ color: '#60a5fa' }}
                      >
                        Download
                      </Button>
                    )
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusChip(exportItem.status, exportItem.isExpired)}
                        <Typography variant="body2" color="text.secondary">
                          {new Date(exportItem.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      exportItem.status === 'COMPLETED' && (
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(exportItem.fileSize)} • Expires {new Date(exportItem.expiresAt).toLocaleDateString()}
                        </Typography>
                      )
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Paper>

      {/* Account Deletion Section */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(239,68,68,0.05) 0%, rgba(245,158,11,0.05) 100%)',
          border: '1px solid rgba(239,68,68,0.2)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)'
            }}
          >
            <Delete sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={600} color="#fff">
              Delete Your Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Permanently delete your account and all associated data (GDPR Right to be Forgotten)
            </Typography>
          </Box>
        </Box>

        {deletionStatus?.hasPendingRequest ? (
          <Alert
            severity="warning"
            sx={{
              mb: 3,
              background: 'rgba(245, 158, 11, 0.1)',
              color: '#fcd34d',
              border: '1px solid rgba(245, 158, 11, 0.2)'
            }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => handleCancelDeletion(deletionStatus.request.id)}
                disabled={loading}
              >
                Cancel Request
              </Button>
            }
          >
            Account deletion scheduled for {new Date(deletionStatus.request.scheduledDeletion).toLocaleDateString()} ({deletionStatus.request.daysRemaining} days remaining)
          </Alert>
        ) : (
          <>
            <Alert
              severity="warning"
              sx={{
                mb: 3,
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}
            >
              <strong>Warning:</strong> This action cannot be undone. Your account, biometric data, professional records, and all associated data will be permanently deleted after a 30-day grace period.
            </Alert>

            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => setDeleteDialog(true)}
              disabled={loading}
              sx={{
                borderColor: 'rgba(239,68,68,0.5)',
                color: '#ef4444',
                '&:hover': { borderColor: '#ef4444', background: 'rgba(239,68,68,0.1)' }
              }}
            >
              Request Account Deletion
            </Button>
          </>
        )}
      </Paper>

      {/* Export Dialog */}
      <Dialog
        open={exportDialog}
        onClose={() => setExportDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: '#111928',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>
          Request Data Export
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Your data export will include:
          </Typography>
          <List dense>
            {['Profile information', 'Biometric data hashes', 'Professional records', 'Document metadata', 'Session history', 'Activity logs', 'Blockchain transactions'].map((item) => (
              <ListItem key={item}>
                <CheckCircle sx={{ color: '#10b981', mr: 1, fontSize: 20 }} />
                <ListItemText primary={item} primaryTypographyProps={{ color: '#fff' }} />
              </ListItem>
            ))}
          </List>
          <Alert
            severity="info"
            sx={{
              mt: 2,
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#93c5fd',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}
          >
            Processing may take a few minutes. You will be able to download the export once it&apos;s ready.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setExportDialog(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleExportRequest}
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
            }}
          >
            {loading ? 'Requesting...' : 'Request Export'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: '#111928',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>
          Delete Your Account
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={deleteStep} sx={{ mb: 3 }}>
            {deleteSteps.map((label) => (
              <Step key={label}>
                <StepLabel sx={{ '& .MuiStepLabel-label': { color: deleteStep === deleteSteps.indexOf(label) ? '#a78bfa' : 'text.secondary' } }}>
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {deleteStep === 0 && (
            <TextField
              fullWidth
              type="password"
              label="Confirm Password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' }
              }}
            />
          )}

          {deleteStep === 1 && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason for leaving (optional)"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Help us improve by telling us why you're leaving..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' }
              }}
            />
          )}

          {deleteStep === 2 && (
            <>
              <Alert
                severity="warning"
                sx={{
                  mb: 2,
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}
              >
                <strong>Final confirmation:</strong> Your account will be scheduled for deletion in 30 days. You can cancel this request anytime before then.
              </Alert>
              <Typography color="text.secondary">
                After 30 days, all your data including profile, biometric data, professional records, and documents will be permanently erased from our systems.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => {
            setDeleteDialog(false);
            setDeleteStep(0);
            setDeletePassword('');
            setDeleteReason('');
          }} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          {deleteStep > 0 && (
            <Button onClick={() => setDeleteStep(deleteStep - 1)} sx={{ color: '#94a3b8' }}>
              Back
            </Button>
          )}
          {deleteStep < 2 ? (
            <Button
              variant="contained"
              onClick={() => setDeleteStep(deleteStep + 1)}
              disabled={deleteStep === 0 && !deletePassword}
              sx={{
                background: deleteStep === 2 ? '#ef4444' : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)'
              }}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteRequest}
              disabled={loading}
              sx={{ background: '#ef4444' }}
            >
              {loading ? 'Processing...' : 'Confirm Deletion'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GDPRPanel;
