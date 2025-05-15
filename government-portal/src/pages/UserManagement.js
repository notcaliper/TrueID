import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Paper, 
  Box,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // In a real application, you would fetch this data from your API
    // This is just mock data for demonstration
    const mockUsers = [
      { id: 1, username: 'johndoe', email: 'john.doe@example.com', fullName: 'John Doe', walletAddress: '0x1234...5678', status: 'Active', role: 'User' },
      { id: 2, username: 'janedoe', email: 'jane.doe@example.com', fullName: 'Jane Doe', walletAddress: '0x2345...6789', status: 'Active', role: 'User' },
      { id: 3, username: 'admin1', email: 'admin1@gov.org', fullName: 'Admin User', walletAddress: '0x3456...7890', status: 'Active', role: 'Admin' },
      { id: 4, username: 'govuser', email: 'gov.user@gov.org', fullName: 'Government User', walletAddress: '0x4567...8901', status: 'Active', role: 'Government' },
      { id: 5, username: 'inactive', email: 'inactive@example.com', fullName: 'Inactive User', walletAddress: '0x5678...9012', status: 'Inactive', role: 'User' },
    ];
    
    setUsers(mockUsers);
    setLoading(false);
  }, []);

  const handleOpenDialog = (user) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'username', headerName: 'Username', width: 130 },
    { field: 'fullName', headerName: 'Full Name', width: 180 },
    { field: 'email', headerName: 'Email', width: 220 },
    { field: 'walletAddress', headerName: 'Wallet Address', width: 180 },
    { field: 'role', headerName: 'Role', width: 120 },
    { field: 'status', headerName: 'Status', width: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => handleOpenDialog(params.row)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Typography variant="h4" component="h1" className="page-header">
        User Management
      </Typography>
      
      <Box mb={3}>
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Manage System Users
          </Typography>
          <Typography variant="body1" paragraph>
            View and manage all users registered in the DBIS system. You can verify identities, assign roles, and update user information.
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <TextField
              label="Search Users"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={handleSearch}
              sx={{ width: 300 }}
            />
          </Box>
          
          <div className="data-grid-container">
            <DataGrid
              rows={filteredUsers}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              loading={loading}
            />
          </div>
        </Paper>
      </Box>
      
      {/* User Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedUser.fullName} ({selectedUser.username})
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="subtitle2">Email</Typography>
                  <Typography variant="body1" gutterBottom>{selectedUser.email}</Typography>
                  
                  <Typography variant="subtitle2">Role</Typography>
                  <Typography variant="body1" gutterBottom>{selectedUser.role}</Typography>
                  
                  <Typography variant="subtitle2">Status</Typography>
                  <Typography variant="body1" gutterBottom>{selectedUser.status}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2">Wallet Address</Typography>
                  <Typography variant="body1" gutterBottom>{selectedUser.walletAddress}</Typography>
                  
                  <Typography variant="subtitle2">Registration Date</Typography>
                  <Typography variant="body1" gutterBottom>2025-01-15</Typography>
                  
                  <Typography variant="subtitle2">Last Login</Typography>
                  <Typography variant="body1" gutterBottom>2025-05-10 14:32:45</Typography>
                </Box>
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" color="primary">
                  Edit User
                </Button>
                <Button variant="outlined" color="warning">
                  Reset Password
                </Button>
                {selectedUser.status === 'Active' ? (
                  <Button variant="outlined" color="error">
                    Deactivate User
                  </Button>
                ) : (
                  <Button variant="outlined" color="success">
                    Activate User
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default UserManagement;
