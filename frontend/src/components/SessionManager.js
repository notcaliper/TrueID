import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Computer,
  PhoneIphone,
  Tablet,
  Public,
  LocationOn,
  AccessTime,
  Delete,
  DeleteSweep,
  CheckCircle,
  Error as ErrorIcon,
  Refresh
} from '@mui/icons-material';
import { userAPI } from '../services/api.service';

/**
 * Session Manager Component
 * Shows active sessions and allows revocation
 */
const SessionManager = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [revokeDialog, setRevokeDialog] = useState({ open: false, sessionId: null, sessionName: '' });
  const [revokeAllDialog, setRevokeAllDialog] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userAPI.getSessions();
      setSessions(response.data.sessions || []);
    } catch (err) {
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    try {
      setLoading(true);
      await userAPI.revokeSession(revokeDialog.sessionId);
      setSuccess('Session revoked successfully');
      setRevokeDialog({ open: false, sessionId: null, sessionName: '' });
      await fetchSessions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to revoke session');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAll = async () => {
    try {
      setLoading(true);
      const response = await userAPI.revokeOtherSessions();
      setSuccess(response.data.message || 'All other sessions revoked');
      setRevokeAllDialog(false);
      await fetchSessions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to revoke sessions');
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
      case 'phone':
        return <PhoneIphone sx={{ color: '#8b5cf6' }} />;
      case 'tablet':
        return <Tablet sx={{ color: '#8b5cf6' }} />;
      default:
        return <Computer sx={{ color: '#8b5cf6' }} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 hour
    if (diff < 60 * 60 * 1000) {
      const mins = Math.floor(diff / (60 * 1000));
      return mins < 1 ? 'Just now' : `${mins}m ago`;
    }
    // Less than 24 hours
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}h ago`;
    }
    
    return date.toLocaleDateString();
  };

  const otherSessionsCount = sessions.filter(s => !s.isCurrent).length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600} color="#fff">
          Active Sessions
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={fetchSessions}
            disabled={loading}
            sx={{
              borderColor: 'rgba(255,255,255,0.2)',
              color: '#fff',
              '&:hover': { borderColor: '#8b5cf6' }
            }}
          >
            Refresh
          </Button>
          {otherSessionsCount > 0 && (
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<DeleteSweep />}
              onClick={() => setRevokeAllDialog(true)}
              disabled={loading}
              sx={{
                borderColor: 'rgba(239,68,68,0.3)',
                color: '#ef4444',
                '&:hover': { borderColor: '#ef4444', background: 'rgba(239,68,68,0.1)' }
              }}
            >
              Log Out All Others
            </Button>
          )}
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert 
          severity="success"
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}

      {/* Sessions List */}
      <Paper
        elevation={0}
        sx={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 3,
          overflow: 'hidden'
        }}
      >
        {loading && sessions.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Loading sessions...</Typography>
          </Box>
        ) : sessions.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <ErrorIcon sx={{ color: '#94a3b8', fontSize: 48, mb: 2 }} />
            <Typography color="text.secondary">No active sessions found</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {sessions.map((session, index) => (
              <ListItem
                key={session.id}
                divider={index < sessions.length - 1}
                sx={{
                  py: 2,
                  px: 3,
                  borderColor: 'rgba(255,255,255,0.05)',
                  '&:hover': { background: 'rgba(255,255,255,0.02)' }
                }}
                secondaryAction={!session.isCurrent && (
                  <Tooltip title="Revoke this session">
                    <IconButton
                      edge="end"
                      onClick={() => setRevokeDialog({ 
                        open: true, 
                        sessionId: session.id,
                        sessionName: `${session.browser} on ${session.device}`
                      })}
                      sx={{ color: '#ef4444' }}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                )}
              >
                <ListItemIcon>
                  {getDeviceIcon(session.device)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography fontWeight={600} color="#fff">
                        {session.browser} on {session.device}
                      </Typography>
                      {session.isCurrent && (
                        <Chip
                          size="small"
                          icon={<CheckCircle fontSize="small" />}
                          label="Current"
                          color="success"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOn fontSize="inherit" />
                        {session.location?.city || 'Unknown location'} • {session.ipAddress || 'Unknown IP'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <AccessTime fontSize="inherit" />
                        Last active {formatDate(session.lastActivity)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Security Note */}
      <Alert
        severity="info"
        sx={{ 
          mt: 3, 
          borderRadius: 2,
          background: 'rgba(59, 130, 246, 0.1)',
          color: '#93c5fd',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}
      >
        If you see a session you don&apos;t recognize, revoke it immediately and change your password.
      </Alert>

      {/* Revoke Single Dialog */}
      <Dialog
        open={revokeDialog.open}
        onClose={() => setRevokeDialog({ open: false, sessionId: null, sessionName: '' })}
        PaperProps={{
          sx: {
            background: '#111928',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>
          Revoke Session
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            This will log out <strong>{revokeDialog.sessionName}</strong>. Are you sure?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setRevokeDialog({ open: false, sessionId: null, sessionName: '' })}
            sx={{ color: '#94a3b8' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRevoke}
            disabled={loading}
            sx={{ background: '#ef4444' }}
          >
            {loading ? 'Revoking...' : 'Revoke'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revoke All Dialog */}
      <Dialog
        open={revokeAllDialog}
        onClose={() => setRevokeAllDialog(false)}
        PaperProps={{
          sx: {
            background: '#111928',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>
          Log Out All Other Sessions
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            This will revoke all sessions except your current one ({otherSessionsCount} session{otherSessionsCount !== 1 ? 's' : ''}).
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setRevokeAllDialog(false)}
            sx={{ color: '#94a3b8' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRevokeAll}
            disabled={loading}
            sx={{ background: '#ef4444' }}
          >
            {loading ? 'Revoking...' : 'Log Out All'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionManager;
