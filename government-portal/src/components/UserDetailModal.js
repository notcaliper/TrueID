import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  TextField,
  Chip,
  Divider,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HistoryIcon from '@mui/icons-material/History';

const UserDetailModal = ({ open, onClose, user }) => {
  const [newFacemeshHash, setNewFacemeshHash] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock version history data
  const versionHistory = [
    { 
      id: 1, 
      facemeshHash: '0x7890abcd1234efgh9012ijkl3456mnop5678qrst', 
      updatedBy: 'Admin User', 
      timestamp: '2025-05-01T10:30:00', 
      txHash: '0xdef789ghi123abc456' 
    },
    { 
      id: 2, 
      facemeshHash: '0x5678abcd1234efgh9012ijkl3456mnop7890qrst', 
      updatedBy: 'System', 
      timestamp: '2025-04-15T14:45:00', 
      txHash: '0x789ghi123abc456def' 
    },
    { 
      id: 3, 
      facemeshHash: '0x1234abcd5678efgh9012ijkl3456mnop7890qrst', 
      updatedBy: 'Initial Registration', 
      timestamp: '2025-04-01T09:20:00', 
      txHash: '0x456def789ghi123abc' 
    }
  ];

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Truncate hash for display
  const truncateHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  // Handle verify user
  const handleVerifyUser = async () => {
    setLoading(true);
    // In a real app, this would call your API to trigger the smart contract
    console.log(`Verifying user ${user.uniqueId}`);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onClose();
      // You would update the user list here
    }, 1500);
  };

  // Handle reject user
  const handleRejectUser = async () => {
    setLoading(true);
    // In a real app, this would call your API
    console.log(`Rejecting user ${user.uniqueId}`);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onClose();
      // You would update the user list here
    }, 1500);
  };

  // Handle update facemesh hash
  const handleUpdateFacemeshHash = async () => {
    if (!newFacemeshHash) return;
    
    setLoading(true);
    // In a real app, this would call your API to update the hash
    console.log(`Updating facemesh hash for user ${user.uniqueId} to ${newFacemeshHash}`);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setNewFacemeshHash('');
      onClose();
      // You would update the user list here
    }, 1500);
  };

  if (!user) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      aria-labelledby="user-detail-dialog-title"
    >
      <DialogTitle id="user-detail-dialog-title">
        User Details
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* User Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              User Information
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Full Name:</strong> {user.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>User ID:</strong> {user.uniqueId}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Email:</strong> {user.email || `${user.name.toLowerCase().replace(' ', '.')}@example.com`}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Contact:</strong> {user.contact || '+1 (555) 123-4567'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Verification Status:</strong>{' '}
                {user.verified ? (
                  <Chip 
                    icon={<CheckCircleIcon />} 
                    label="Verified" 
                    color="success" 
                    size="small" 
                  />
                ) : (
                  <Chip 
                    icon={<CancelIcon />} 
                    label="Unverified" 
                    color="error" 
                    size="small" 
                  />
                )}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Last Updated:</strong> {formatDate(user.lastUpdated)}
              </Typography>
            </Box>
          </Grid>

          {/* Blockchain Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Blockchain Information
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Current Facemesh Hash:</strong>
                <Box component="span" sx={{ display: 'block', fontFamily: 'monospace', bgcolor: '#f5f5f5', p: 1, borderRadius: 1, mt: 1, overflowX: 'auto' }}>
                  {truncateHash(user.facemeshHash)}
                </Box>
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Blockchain Transaction Hash:</strong>
                <Box component="span" sx={{ display: 'block', fontFamily: 'monospace', bgcolor: '#f5f5f5', p: 1, borderRadius: 1, mt: 1, overflowX: 'auto' }}>
                  {user.blockchainTxHash ? truncateHash(user.blockchainTxHash) : 'Not yet on blockchain'}
                </Box>
              </Typography>
            </Box>

            {/* Update Facemesh Hash */}
            <Typography variant="h6" gutterBottom>
              Update Facemesh Hash
            </Typography>
            <TextField
              label="New Facemesh Hash"
              variant="outlined"
              fullWidth
              value={newFacemeshHash}
              onChange={(e) => setNewFacemeshHash(e.target.value)}
              margin="normal"
              disabled={loading}
              placeholder="Enter new facemesh hash"
              helperText="Enter the new facemesh hash to update the user's biometric data"
            />
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleUpdateFacemeshHash}
              disabled={!newFacemeshHash || loading}
              sx={{ mt: 1 }}
            >
              Update Hash
            </Button>
          </Grid>

          {/* Version History */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <HistoryIcon sx={{ mr: 1 }} />
              Version History
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Version</TableCell>
                    <TableCell>Facemesh Hash</TableCell>
                    <TableCell>Updated By</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Transaction Hash</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {versionHistory.map((version, index) => (
                    <TableRow key={version.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{truncateHash(version.facemeshHash)}</TableCell>
                      <TableCell>{version.updatedBy}</TableCell>
                      <TableCell>{formatDate(version.timestamp)}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{truncateHash(version.txHash)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        {!user.verified && (
          <Button 
            onClick={handleVerifyUser} 
            color="success" 
            variant="contained"
            disabled={loading}
          >
            Verify User
          </Button>
        )}
        {user.verified && (
          <Button 
            onClick={handleRejectUser} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            Reject User
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UserDetailModal;
