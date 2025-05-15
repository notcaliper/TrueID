import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Paper, 
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';

const IdentityVerification = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    // In a real application, you would fetch this data from your API
    // This is just mock data for demonstration
    const mockVerifications = [
      { 
        id: 1, 
        userId: 101, 
        username: 'johndoe', 
        fullName: 'John Doe', 
        submittedAt: '2025-05-10T10:30:45', 
        status: 'pending', 
        documentType: 'National ID',
        documentNumber: 'ID12345678',
        biometricHash: '0xabcd1234efgh5678ijkl9012mnop3456qrst7890',
        blockchainTxHash: null
      },
      { 
        id: 2, 
        userId: 102, 
        username: 'janedoe', 
        fullName: 'Jane Doe', 
        submittedAt: '2025-05-09T14:22:10', 
        status: 'pending', 
        documentType: 'Passport',
        documentNumber: 'P87654321',
        biometricHash: '0x1234abcd5678efgh9012ijkl3456mnop7890qrst',
        blockchainTxHash: null
      },
      { 
        id: 3, 
        userId: 103, 
        username: 'bobsmith', 
        fullName: 'Bob Smith', 
        submittedAt: '2025-05-08T09:15:33', 
        status: 'approved', 
        documentType: 'Driver License',
        documentNumber: 'DL98765432',
        biometricHash: '0xefgh1234abcd5678ijkl9012mnop3456qrst7890',
        blockchainTxHash: '0x123abc456def789ghi'
      },
      { 
        id: 4, 
        userId: 104, 
        username: 'alicejones', 
        fullName: 'Alice Jones', 
        submittedAt: '2025-05-07T16:40:22', 
        status: 'rejected', 
        documentType: 'National ID',
        documentNumber: 'ID87654321',
        biometricHash: '0x5678abcd1234efgh9012ijkl3456mnop7890qrst',
        blockchainTxHash: null,
        rejectionReason: 'Document appears to be altered'
      },
    ];
    
    setVerifications(mockVerifications);
    setLoading(false);
  }, []);

  const handleOpenDialog = (verification) => {
    setSelectedVerification(verification);
    setVerificationStatus(verification.status);
    setVerificationNotes(verification.rejectionReason || '');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleVerificationAction = () => {
    // In a real application, you would send this data to your API
    // This is just a mock implementation for demonstration
    const updatedVerifications = verifications.map(v => {
      if (v.id === selectedVerification.id) {
        return {
          ...v,
          status: verificationStatus,
          rejectionReason: verificationStatus === 'rejected' ? verificationNotes : null,
          blockchainTxHash: verificationStatus === 'approved' ? '0x' + Math.random().toString(16).substr(2, 16) : null
        };
      }
      return v;
    });
    
    setVerifications(updatedVerifications);
    setOpenDialog(false);
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const filteredVerifications = filter === 'all' 
    ? verifications 
    : verifications.filter(v => v.status === filter);

  const getStatusChip = (status) => {
    switch(status) {
      case 'approved':
        return <Chip icon={<CheckCircleIcon />} label="Approved" color="success" size="small" />;
      case 'rejected':
        return <Chip icon={<CancelIcon />} label="Rejected" color="error" size="small" />;
      case 'pending':
      default:
        return <Chip icon={<AccessTimeIcon />} label="Pending" color="warning" size="small" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div>
      <Typography variant="h4" component="h1" className="page-header">
        Identity Verification
      </Typography>
      
      <Box mb={3}>
        <Paper elevation={1} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Verification Requests
              </Typography>
              <Typography variant="body1">
                Review and verify user identity documents and biometric data.
              </Typography>
            </Box>
            
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="filter-label">Filter Status</InputLabel>
              <Select
                labelId="filter-label"
                value={filter}
                label="Filter Status"
                onChange={handleFilterChange}
                size="small"
              >
                <MenuItem value="all">All Requests</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Grid container spacing={3}>
            {loading ? (
              <Grid item xs={12}>
                <Typography>Loading verification requests...</Typography>
              </Grid>
            ) : filteredVerifications.length === 0 ? (
              <Grid item xs={12}>
                <Typography>No verification requests found.</Typography>
              </Grid>
            ) : (
              filteredVerifications.map(verification => (
                <Grid item xs={12} md={6} key={verification.id}>
                  <Card className="verification-card">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">
                          {verification.fullName}
                        </Typography>
                        {getStatusChip(verification.status)}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Username: {verification.username}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Submitted: {formatDate(verification.submittedAt)}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Document: {verification.documentType} ({verification.documentNumber})
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Biometric Hash: {verification.biometricHash.substring(0, 10)}...
                      </Typography>
                      
                      {verification.status === 'approved' && verification.blockchainTxHash && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Blockchain TX: {verification.blockchainTxHash}
                        </Typography>
                      )}
                      
                      {verification.status === 'rejected' && verification.rejectionReason && (
                        <Typography variant="body2" color="error" gutterBottom>
                          Reason: {verification.rejectionReason}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={() => handleOpenDialog(verification)}
                        disabled={verification.status !== 'pending'}
                      >
                        Review
                      </Button>
                      <Button size="small">View Details</Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </Paper>
      </Box>
      
      {/* Verification Review Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Review Identity Verification</DialogTitle>
        <DialogContent>
          {selectedVerification && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedVerification.fullName} ({selectedVerification.username})
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Document Type</Typography>
                  <Typography variant="body1" gutterBottom>{selectedVerification.documentType}</Typography>
                  
                  <Typography variant="subtitle2">Document Number</Typography>
                  <Typography variant="body1" gutterBottom>{selectedVerification.documentNumber}</Typography>
                  
                  <Typography variant="subtitle2">Submitted At</Typography>
                  <Typography variant="body1" gutterBottom>{formatDate(selectedVerification.submittedAt)}</Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Biometric Hash</Typography>
                  <Typography variant="body1" gutterBottom>{selectedVerification.biometricHash}</Typography>
                  
                  <Typography variant="subtitle2">User ID</Typography>
                  <Typography variant="body1" gutterBottom>{selectedVerification.userId}</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Document Image</Typography>
                  <Box 
                    sx={{ 
                      height: 200, 
                      bgcolor: '#f0f0f0', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      mb: 2
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Document image would be displayed here
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="verification-status-label">Verification Status</InputLabel>
                    <Select
                      labelId="verification-status-label"
                      value={verificationStatus}
                      label="Verification Status"
                      onChange={(e) => setVerificationStatus(e.target.value)}
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {verificationStatus === 'rejected' && (
                    <TextField
                      margin="normal"
                      fullWidth
                      label="Rejection Reason"
                      multiline
                      rows={3}
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                    />
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleVerificationAction} 
            variant="contained" 
            color={verificationStatus === 'approved' ? 'success' : verificationStatus === 'rejected' ? 'error' : 'primary'}
          >
            {verificationStatus === 'approved' ? 'Approve' : verificationStatus === 'rejected' ? 'Reject' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default IdentityVerification;
