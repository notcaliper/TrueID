import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Paper, 
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

const RecordManagement = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [filter, setFilter] = useState('pending');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    // In a real application, you would fetch this data from your API
    // This is just mock data for demonstration
    const mockRecords = [
      { 
        id: 1, 
        userId: 101, 
        username: 'johndoe', 
        fullName: 'John Doe', 
        title: 'Software Engineer',
        organization: 'Tech Solutions Inc.',
        type: 'employment',
        startDate: '2022-06-01',
        endDate: null,
        description: 'Full-stack development using React and Node.js',
        submittedAt: '2025-05-10T10:30:45', 
        status: 'pending', 
        blockchainTxHash: null
      },
      { 
        id: 2, 
        userId: 102, 
        username: 'janedoe', 
        fullName: 'Jane Doe', 
        title: 'Master of Computer Science',
        organization: 'University of Technology',
        type: 'education',
        startDate: '2020-09-01',
        endDate: '2022-05-30',
        description: 'Specialized in Artificial Intelligence and Machine Learning',
        submittedAt: '2025-05-09T14:22:10', 
        status: 'pending', 
        blockchainTxHash: null
      },
      { 
        id: 3, 
        userId: 103, 
        username: 'bobsmith', 
        fullName: 'Bob Smith', 
        title: 'Certified Blockchain Developer',
        organization: 'Blockchain Certification Board',
        type: 'certification',
        startDate: '2024-03-15',
        endDate: '2027-03-15',
        description: 'Professional certification in blockchain development',
        submittedAt: '2025-05-08T09:15:33', 
        status: 'approved', 
        blockchainTxHash: '0x123abc456def789ghi'
      },
      { 
        id: 4, 
        userId: 104, 
        username: 'alicejones', 
        fullName: 'Alice Jones', 
        title: 'Project Manager',
        organization: 'Global Projects Ltd',
        type: 'employment',
        startDate: '2021-02-01',
        endDate: '2024-12-31',
        description: 'Managed international software development projects',
        submittedAt: '2025-05-07T16:40:22', 
        status: 'rejected', 
        blockchainTxHash: null,
        rejectionReason: 'Unable to verify employment with the organization'
      },
    ];
    
    setRecords(mockRecords);
    setLoading(false);
  }, []);

  const handleOpenDialog = (record) => {
    setSelectedRecord(record);
    setVerificationStatus(record.status);
    setVerificationNotes(record.rejectionReason || '');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleVerificationAction = () => {
    // In a real application, you would send this data to your API
    // This is just a mock implementation for demonstration
    const updatedRecords = records.map(r => {
      if (r.id === selectedRecord.id) {
        return {
          ...r,
          status: verificationStatus,
          rejectionReason: verificationStatus === 'rejected' ? verificationNotes : null,
          blockchainTxHash: verificationStatus === 'approved' ? '0x' + Math.random().toString(16).substr(2, 16) : null
        };
      }
      return r;
    });
    
    setRecords(updatedRecords);
    setOpenDialog(false);
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Filter by status
  let filteredRecords = filter === 'all' 
    ? records 
    : records.filter(r => r.status === filter);
  
  // Filter by type based on selected tab
  if (tabValue === 1) {
    filteredRecords = filteredRecords.filter(r => r.type === 'education');
  } else if (tabValue === 2) {
    filteredRecords = filteredRecords.filter(r => r.type === 'employment');
  } else if (tabValue === 3) {
    filteredRecords = filteredRecords.filter(r => r.type === 'certification');
  }

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

  const getTypeIcon = (type) => {
    switch(type) {
      case 'education':
        return <SchoolIcon />;
      case 'employment':
        return <WorkIcon />;
      case 'certification':
        return <AssignmentIcon />;
      default:
        return <AssignmentIcon />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div>
      <Typography variant="h4" component="h1" className="page-header">
        Professional Record Management
      </Typography>
      
      <Box mb={3}>
        <Paper elevation={1} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Record Verification Requests
              </Typography>
              <Typography variant="body1">
                Review and verify professional records submitted by users.
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
                <MenuItem value="all">All Records</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="record type tabs">
              <Tab label="All Types" />
              <Tab label="Education" />
              <Tab label="Employment" />
              <Tab label="Certification" />
            </Tabs>
          </Box>
          
          <Grid container spacing={3}>
            {loading ? (
              <Grid item xs={12}>
                <Typography>Loading records...</Typography>
              </Grid>
            ) : filteredRecords.length === 0 ? (
              <Grid item xs={12}>
                <Typography>No records found matching the current filters.</Typography>
              </Grid>
            ) : (
              filteredRecords.map(record => (
                <Grid item xs={12} md={6} key={record.id}>
                  <Card className="verification-card">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getTypeIcon(record.type)}
                          <Typography variant="h6" sx={{ ml: 1 }}>
                            {record.title}
                          </Typography>
                        </Box>
                        {getStatusChip(record.status)}
                      </Box>
                      
                      <Typography variant="body1" gutterBottom>
                        {record.organization}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {formatDate(record.startDate)} - {formatDate(record.endDate)}
                      </Typography>
                      
                      <Typography variant="body2" gutterBottom>
                        {record.description}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Submitted by: {record.fullName} ({record.username})
                      </Typography>
                      
                      {record.status === 'approved' && record.blockchainTxHash && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Blockchain TX: {record.blockchainTxHash}
                        </Typography>
                      )}
                      
                      {record.status === 'rejected' && record.rejectionReason && (
                        <Typography variant="body2" color="error" gutterBottom>
                          Reason: {record.rejectionReason}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={() => handleOpenDialog(record)}
                        disabled={record.status !== 'pending'}
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
      
      {/* Record Verification Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Review Professional Record</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedRecord.title}
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Organization</Typography>
                  <Typography variant="body1" gutterBottom>{selectedRecord.organization}</Typography>
                  
                  <Typography variant="subtitle2">Type</Typography>
                  <Typography variant="body1" gutterBottom sx={{ textTransform: 'capitalize' }}>
                    {selectedRecord.type}
                  </Typography>
                  
                  <Typography variant="subtitle2">Duration</Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(selectedRecord.startDate)} - {formatDate(selectedRecord.endDate)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Submitted By</Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedRecord.fullName} ({selectedRecord.username})
                  </Typography>
                  
                  <Typography variant="subtitle2">User ID</Typography>
                  <Typography variant="body1" gutterBottom>{selectedRecord.userId}</Typography>
                  
                  <Typography variant="subtitle2">Submitted At</Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(selectedRecord.submittedAt).toLocaleString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Description</Typography>
                  <Typography variant="body1" paragraph>{selectedRecord.description}</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Supporting Documents</Typography>
                  <Box 
                    sx={{ 
                      height: 150, 
                      bgcolor: '#f0f0f0', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      mb: 2
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Supporting documents would be displayed here
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

export default RecordManagement;
