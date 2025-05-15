import React, { useState, useEffect } from 'react';
import { 
  Typography,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Button,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import InfoIcon from '@mui/icons-material/Info';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CancelIcon from '@mui/icons-material/Cancel';
import UpdateIcon from '@mui/icons-material/Update';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import LinkIcon from '@mui/icons-material/Link';

const AuditTrail = () => {
  // State for audit logs and pagination
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Load mock data on component mount
  useEffect(() => {
    const mockLogs = [
      { 
        id: 1, 
        action: 'Login', 
        adminName: 'Suresh Rajan', 
        affectedUserId: 'N/A', 
        timestamp: '2025-05-15T10:30:00', 
        details: 'Admin user logged in', 
        txHash: null 
      },
      { 
        id: 2, 
        action: 'User Created', 
        adminName: 'Suresh Rajan', 
        affectedUserId: 'USR001', 
        timestamp: '2025-05-15T11:15:00', 
        details: 'Created user Rajesh Kumar', 
        txHash: '0x123abc456def789ghi' 
      },
      { 
        id: 3, 
        action: 'Identity Verified', 
        adminName: 'Suresh Rajan', 
        affectedUserId: 'USR001', 
        timestamp: '2025-05-16T11:45:00', 
        details: 'Updated biometric data for Priya Sharma', 
        txHash: '0xghi123abc456def789' 
      },
      { 
        id: 4, 
        action: 'Facemesh Updated', 
        adminName: 'Suresh Rajan', 
        affectedUserId: 'USR001', 
        timestamp: '2025-05-15T12:45:00', 
        details: 'Updated biometric data for Priya Sharma', 
        txHash: '0x789ghi123abc456def' 
      },
      { 
        id: 5, 
        action: 'Login', 
        adminName: 'Anjali Deshmukh', 
        affectedUserId: 'N/A', 
        timestamp: '2025-05-15T14:20:00', 
        details: 'Government official logged in', 
        txHash: null 
      },
      { 
        id: 6, 
        action: 'Identity Rejected', 
        adminName: 'Anjali Deshmukh', 
        affectedUserId: 'USR003', 
        timestamp: '2025-05-15T14:45:00', 
        details: 'Rejected identity for Amit Patel', 
        txHash: '0xabc456def789ghi123' 
      },
      { 
        id: 7, 
        action: 'Logout', 
        adminName: 'Anjali Deshmukh', 
        affectedUserId: 'N/A', 
        timestamp: '2025-05-15T15:30:00', 
        details: 'Government official logged out', 
        txHash: null 
      },
      { 
        id: 8, 
        action: 'Login', 
        adminName: 'Suresh Rajan', 
        affectedUserId: 'N/A', 
        timestamp: '2025-05-16T09:15:00', 
        details: 'Admin user logged in', 
        txHash: null 
      },
      { 
        id: 9, 
        action: 'Identity Verified', 
        adminName: 'Suresh Rajan', 
        affectedUserId: 'USR004', 
        timestamp: '2025-05-16T10:30:00', 
        details: 'Verified identity for Deepika Singh', 
        txHash: '0xdef789ghi123abc456' 
      },
      { 
        id: 10, 
        action: 'Facemesh Updated', 
        adminName: 'Suresh Rajan', 
        affectedUserId: 'USR002', 
        timestamp: '2025-05-16T11:45:00', 
        details: 'Updated biometric data for Priya Sharma', 
        txHash: '0xghi123abc456def789' 
      },
      { 
        id: 11, 
        action: 'System Update', 
        adminName: 'System', 
        affectedUserId: 'N/A', 
        timestamp: '2025-05-16T23:00:00', 
        details: 'Scheduled system maintenance', 
        txHash: null 
      },
      { 
        id: 12, 
        action: 'Login', 
        adminName: 'Anjali Deshmukh', 
        affectedUserId: 'N/A', 
        timestamp: '2025-05-17T08:30:00', 
        details: 'Government official logged in', 
        txHash: null 
      }
    ];
    
    setLogs(mockLogs);
  }, []);
  
  // Handle search
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0); // Reset to first page when searching
  };
  
  // Handle filter change
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    if (name === 'actionFilter') {
      setActionFilter(value);
    } else if (name === 'dateFilter') {
      setDateFilter(value);
    } else if (name === 'startDate' || name === 'endDate') {
      setDateRange(prev => ({ ...prev, [name]: value }));
    }
    setPage(0); // Reset to first page when filtering
  };
  
  // Handle clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setActionFilter('all');
    setDateFilter('all');
    setDateRange({ startDate: '', endDate: '' });
    setPage(0);
  };
  
  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Filter logs based on search query and filters
  const filteredLogs = logs.filter(log => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      log.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.affectedUserId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Action filter
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    // Date filter - simplified for demo
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const logDate = new Date(log.timestamp);
      const today = new Date();
      
      if (dateFilter === 'today') {
        const isToday = logDate.getDate() === today.getDate() &&
                        logDate.getMonth() === today.getMonth() &&
                        logDate.getFullYear() === today.getFullYear();
        matchesDate = isToday;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        matchesDate = logDate >= weekAgo;
      } else if (dateFilter === 'custom') {
        if (dateRange.startDate) {
          const startDate = new Date(dateRange.startDate);
          matchesDate = logDate >= startDate;
        }
        if (dateRange.endDate && matchesDate) {
          const endDate = new Date(dateRange.endDate);
          endDate.setHours(23, 59, 59, 999); // End of the day
          matchesDate = logDate <= endDate;
        }
      }
    }
    
    return matchesSearch && matchesAction && matchesDate;
  });
  
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
  
  // Get icon for action type
  const getActionIcon = (action) => {
    switch (action) {
      case 'Login':
        return <LoginIcon />;
      case 'Logout':
        return <LogoutIcon />;
      case 'User Created':
        return <AddCircleIcon />;
      case 'Identity Verified':
        return <VerifiedUserIcon />;
      case 'Identity Rejected':
        return <CancelIcon />;
      case 'Facemesh Updated':
        return <UpdateIcon />;
      case 'System Update':
        return <SettingsIcon />;
      default:
        return <InfoIcon />;
    }
  };
  
  // Get color for action type
  const getActionColor = (action) => {
    switch (action) {
      case 'Identity Verified':
        return 'success';
      case 'Identity Rejected':
        return 'error';
      case 'User Created':
        return 'primary';
      case 'Facemesh Updated':
        return 'warning';
      case 'System Update':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // Available actions for filter
  const actionOptions = [
    { value: 'all', label: 'All Actions' },
    { value: 'Login', label: 'Login' },
    { value: 'Logout', label: 'Logout' },
    { value: 'User Created', label: 'User Created' },
    { value: 'Identity Verified', label: 'Identity Verified' },
    { value: 'Identity Rejected', label: 'Identity Rejected' },
    { value: 'Facemesh Updated', label: 'Facemesh Updated' },
    { value: 'System Update', label: 'System Update' }
  ];

  // Date filter options
  const dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];

  return (
    <div>
      <Typography variant="h4" component="h1" gutterBottom>
        Activity Log
      </Typography>
      
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            {/* Search */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search"
                variant="outlined"
                value={searchQuery}
                onChange={handleSearchChange}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                placeholder="Search by admin, user ID, or details"
              />
            </Grid>
            
            {/* Action Filter */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Action</InputLabel>
                <Select
                  name="actionFilter"
                  value={actionFilter}
                  onChange={handleFilterChange}
                  label="Action"
                >
                  {actionOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Date Filter */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  name="dateFilter"
                  value={dateFilter}
                  onChange={handleFilterChange}
                  label="Date Range"
                >
                  {dateOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Custom Date Range */}
            {dateFilter === 'custom' && (
              <>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    name="startDate"
                    type="date"
                    value={dateRange.startDate}
                    onChange={handleFilterChange}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    label="End Date"
                    name="endDate"
                    type="date"
                    value={dateRange.endDate}
                    onChange={handleFilterChange}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
            
            {/* Clear Filters */}
            <Grid item xs={12} md={2}>
              <Button 
                variant="outlined" 
                onClick={handleClearFilters}
                fullWidth
                startIcon={<FilterListIcon />}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Box>
        
        {/* Activity Log Table */}
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="activity log table">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Admin</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Affected User</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>TX Hash</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No activity logs found matching the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{formatDate(log.timestamp)}</TableCell>
                      <TableCell>{log.adminName}</TableCell>
                      <TableCell>
                        <Chip 
                          icon={getActionIcon(log.action)} 
                          label={log.action} 
                          color={getActionColor(log.action)} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        {log.affectedUserId !== 'N/A' ? (
                          <Chip 
                            icon={<PersonIcon />} 
                            label={log.affectedUserId} 
                            size="small" 
                            variant="outlined"
                          />
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>{log.details}</TableCell>
                      <TableCell>
                        {log.txHash ? (
                          <Tooltip title="View on Blockchain Explorer">
                            <Chip 
                              icon={<LinkIcon />}
                              label={truncateHash(log.txHash)} 
                              size="small" 
                              color="info"
                              clickable
                              onClick={() => console.log(`View TX: ${log.txHash}`)}
                            />
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.secondary">N/A</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredLogs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Activity Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Activity Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Activities:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {logs.length}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Identity Verifications:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {logs.filter(log => log.action === 'Identity Verified').length}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Facemesh Updates:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {logs.filter(log => log.action === 'Facemesh Updated').length}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Blockchain Transactions:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {logs.filter(log => log.txHash !== null).length}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {logs
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 5)
                .map(log => (
                  <Box key={log.id} sx={{ mb: 1.5 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                      {getActionIcon(log.action)}
                      <Box component="span" sx={{ ml: 1 }}>
                        <strong>{log.adminName}</strong> {log.action.toLowerCase()} 
                        {log.affectedUserId !== 'N/A' ? ` for ${log.affectedUserId}` : ''}
                      </Box>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(log.timestamp)}
                    </Typography>
                  </Box>
                ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default AuditTrail;
