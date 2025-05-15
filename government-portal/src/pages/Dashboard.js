import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  Pagination
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '../utils/AuthContext';
import UserDetailModal from '../components/UserDetailModal';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingVerifications: 0,
    verifiedIdentities: 0,
    totalRecords: 0
  });
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // In a real application, you would fetch this data from your API
    // This is just mock data for demonstration
    setStats({
      totalUsers: 1248,
      pendingVerifications: 37,
      verifiedIdentities: 892,
      totalRecords: 3156
    });
    
    // Mock user data with Indian names
    const mockUsers = [
      { id: 1, name: 'Rajesh Kumar', uniqueId: 'USR001', verified: true, lastUpdated: '2025-05-10T14:30:00', facemeshHash: '0xabcd1234efgh5678ijkl9012mnop3456qrst7890', blockchainTxHash: '0x123abc456def789ghi' },
      { id: 2, name: 'Priya Sharma', uniqueId: 'USR002', verified: true, lastUpdated: '2025-05-09T11:20:00', facemeshHash: '0x1234abcd5678efgh9012ijkl3456mnop7890qrst', blockchainTxHash: '0x456def789ghi123abc' },
      { id: 3, name: 'Amit Patel', uniqueId: 'USR003', verified: false, lastUpdated: '2025-05-08T09:15:00', facemeshHash: '0xefgh1234abcd5678ijkl9012mnop3456qrst7890', blockchainTxHash: null },
      { id: 4, name: 'Deepika Singh', uniqueId: 'USR004', verified: true, lastUpdated: '2025-05-07T16:45:00', facemeshHash: '0x5678abcd1234efgh9012ijkl3456mnop7890qrst', blockchainTxHash: '0x789ghi123abc456def' },
      { id: 5, name: 'Vikram Malhotra', uniqueId: 'USR005', verified: false, lastUpdated: '2025-05-06T13:10:00', facemeshHash: '0x9012efgh1234abcd5678ijkl3456mnop7890qrst', blockchainTxHash: null },
      { id: 6, name: 'Neha Gupta', uniqueId: 'USR006', verified: true, lastUpdated: '2025-05-05T10:30:00', facemeshHash: '0x3456abcd1234efgh9012ijkl7890mnop5678qrst', blockchainTxHash: '0xabc456def789ghi123' },
      { id: 7, name: 'Arjun Reddy', uniqueId: 'USR007', verified: true, lastUpdated: '2025-05-04T15:20:00', facemeshHash: '0x7890abcd1234efgh9012ijkl3456mnop5678qrst', blockchainTxHash: '0xdef789ghi123abc456' },
      { id: 8, name: 'Ananya Desai', uniqueId: 'USR008', verified: false, lastUpdated: '2025-05-03T09:45:00', facemeshHash: '0x2345abcd1234efgh9012ijkl3456mnop7890qrst', blockchainTxHash: null },
      { id: 9, name: 'Rahul Verma', uniqueId: 'USR009', verified: true, lastUpdated: '2025-05-02T14:15:00', facemeshHash: '0x6789abcd1234efgh9012ijkl3456mnop7890qrst', blockchainTxHash: '0xghi123abc456def789' },
      { id: 10, name: 'Meera Joshi', uniqueId: 'USR010', verified: false, lastUpdated: '2025-05-01T11:30:00', facemeshHash: '0x0123abcd5678efgh9012ijkl3456mnop7890qrst', blockchainTxHash: null },
      { id: 11, name: 'Karthik Iyer', uniqueId: 'USR011', verified: true, lastUpdated: '2025-04-30T16:20:00', facemeshHash: '0x4567abcd1234efgh9012ijkl3456mnop7890qrst', blockchainTxHash: '0x123abc456def789ghi' },
      { id: 12, name: 'Pooja Mehta', uniqueId: 'USR012', verified: true, lastUpdated: '2025-04-29T10:10:00', facemeshHash: '0x8901abcd1234efgh9012ijkl3456mnop7890qrst', blockchainTxHash: '0x456def789ghi123abc' }
    ];
    
    setUsers(mockUsers);
  }, []);

  // Handle search
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0); // Reset to first page when searching
  };
  
  // Handle modal open/close
  const handleOpenModal = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setModalOpen(false);
  };
  
  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage - 1);
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.uniqueId.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div>
      <Typography variant="h4" component="h1" className="page-header">
        User Management
      </Typography>
      
      <Box mb={4}>
        <Paper elevation={1} sx={{ p: 3, bgcolor: '#f8f9fa' }}>
          <Typography variant="h6" gutterBottom>
            Welcome, {user?.fullName || user?.username || 'Government Official'}
          </Typography>
          <Typography variant="body1">
            Manage and verify user identities in the DBIS system.
          </Typography>
        </Paper>
      </Box>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Total Users</Typography>
              <Typography variant="h3" component="div" align="center">
                {stats.totalUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Pending Verifications</Typography>
              <Typography variant="h3" component="div" align="center" color="warning.main">
                {stats.pendingVerifications}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Verified Identities</Typography>
              <Typography variant="h3" component="div" align="center" color="success.main">
                {stats.verifiedIdentities}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card className="dashboard-card" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Total Records</Typography>
              <Typography variant="h3" component="div" align="center">
                {stats.totalRecords}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* User List Table */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            User List
          </Typography>
          <TextField
            label="Search Users"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ width: 300 }}
          />
        </Box>
        
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="user list table">
            <TableHead>
              <TableRow>
                <TableCell>Serial No.</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Unique ID</TableCell>
                <TableCell>Verification Status</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell>Facemesh Hash</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.uniqueId}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>{formatDate(user.lastUpdated)}</TableCell>
                    <TableCell>{truncateHash(user.facemeshHash)}</TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleOpenModal(user)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit User">
                        <IconButton 
                          size="small" 
                          color="secondary"
                          onClick={() => handleOpenModal(user)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {Math.min(filteredUsers.length, page * rowsPerPage + 1)} - {Math.min(filteredUsers.length, (page + 1) * rowsPerPage)} of {filteredUsers.length} users
          </Typography>
          <Pagination 
            count={Math.ceil(filteredUsers.length / rowsPerPage)} 
            page={page + 1} 
            onChange={handleChangePage} 
            color="primary" 
          />
        </Box>
      </Paper>
      
      {/* System Status */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          System Status
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" gutterBottom>
              <strong>Backend API:</strong> Online
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Database:</strong> Connected
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" gutterBottom>
              <strong>Blockchain Node:</strong> Synced
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Last Update:</strong> {new Date().toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {/* User Detail Modal */}
      <UserDetailModal 
        open={modalOpen} 
        onClose={handleCloseModal} 
        user={selectedUser} 
      />
    </div>
  );
};

export default Dashboard;
