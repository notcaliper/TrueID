import React, { useState, useEffect, useCallback, useRef } from 'react';
import ApiService from '../services/adminApi.service';
import UserDetailModal from '../components/UserDetailModal';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  InputAdornment,
  TablePagination
} from '@mui/material';
import {
  SearchRounded,
  RefreshRounded,
  VisibilityRounded,
  EditRounded,
  FolderSharedRounded,
  VerifiedUserRounded,
  HourglassEmptyRounded,
  CancelRounded,
  FingerprintRounded,
  SecurityRounded,
  FilterListRounded
} from '@mui/icons-material';

const AdminRecordManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0); // MUI 0-indexed
  const [totalUsers, setTotalUsers] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const data = await ApiService.getUsers(currentPage + 1, rowsPerPage, searchQuery, searchType);
      setUsers(data.users || []);
      setTotalUsers(data.total || 0);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load user records from directory.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, rowsPerPage, searchQuery, searchType]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(0);
    fetchUsers();
  };

  const handleViewUser = (u, isEditMode = false) => {
    setSelectedUser({ ...u, isEdit: isEditMode });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleUserUpdated = (updatedUser) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    handleCloseModal();
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

  const getStatusChip = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    if (s === 'VERIFIED') {
      return (
        <Chip
          icon={<VerifiedUserRounded sx={{ fontSize: '14px !important', color: '#10b981 !important' }} />}
          label="VERIFIED"
          size="small"
          sx={{
            bgcolor: 'rgba(16, 185, 129, 0.12)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontWeight: 700,
            fontSize: '0.68rem',
            letterSpacing: '0.04em'
          }}
        />
      );
    }
    if (s === 'REJECTED') {
      return (
        <Chip
          icon={<CancelRounded sx={{ fontSize: '14px !important', color: '#ef4444 !important' }} />}
          label="REJECTED"
          size="small"
          sx={{
            bgcolor: 'rgba(239, 68, 68, 0.12)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            fontWeight: 700,
            fontSize: '0.68rem',
            letterSpacing: '0.04em'
          }}
        />
      );
    }
    return (
      <Chip
        icon={<HourglassEmptyRounded sx={{ fontSize: '14px !important', color: '#f59e0b !important' }} />}
        label="PENDING"
        size="small"
        sx={{
          bgcolor: 'rgba(245, 158, 11, 0.12)',
          color: '#fbbf24',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          fontWeight: 700,
          fontSize: '0.68rem',
          letterSpacing: '0.04em'
        }}
      />
    );
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Top Banner */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(13, 18, 29, 0.95) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          p: { xs: 2.5, md: 3.5 }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Chip
                icon={<FolderSharedRounded sx={{ fontSize: '14px !important', color: '#818cf8 !important' }} />}
                label="CITIZEN ENROLLMENT DIRECTORY"
                size="small"
                sx={{
                  bgcolor: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  letterSpacing: '0.08em'
                }}
              />
              <Chip
                label={`${totalUsers} RECORDS INDEXED`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontWeight: 700,
                  fontSize: '0.68rem'
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', mb: 0.5 }}>
              Citizen Identity Records
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 640 }}>
              Search, inspect dossiers, audit invariant biometric vectors, and issue cryptographic attestations.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={16} sx={{ color: '#818cf8' }} /> : <RefreshRounded />}
            onClick={() => fetchUsers(false)}
            disabled={loading || refreshing}
            sx={{
              borderColor: 'rgba(99, 102, 241, 0.3)',
              color: '#a5b4fc',
              fontWeight: 600,
              px: 2.5,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              bgcolor: 'rgba(99, 102, 241, 0.05)',
              '&:hover': {
                bgcolor: 'rgba(99, 102, 241, 0.12)',
                borderColor: '#6366f1'
              }
            }}
          >
            {refreshing ? 'Updating...' : 'Sync Directory'}
          </Button>
        </Box>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          {error}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          bgcolor: 'rgba(13, 18, 29, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(14px)',
          p: 2.5
        }}
      >
        <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <TextField
            select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            size="small"
            sx={{
              minWidth: { xs: '100%', sm: 180 },
              bgcolor: 'rgba(15, 23, 42, 0.7)',
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            <MenuItem value="name">Search by Name</MenuItem>
            <MenuItem value="id">Search by Gov ID</MenuItem>
            <MenuItem value="facehash">Search by Face Hash</MenuItem>
          </TextField>

          <TextField
            placeholder={`Enter search query...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded sx={{ color: '#64748b' }} />
                </InputAdornment>
              ),
              sx: {
                bgcolor: 'rgba(15, 23, 42, 0.7)',
                borderRadius: 2,
                color: '#f8fafc',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(99, 102, 241, 0.4)' },
                '&.Mui-focused fieldset': { borderColor: '#6366f1' }
              }
            }}
          />

          <Button
            type="submit"
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              fontWeight: 600,
              px: 3,
              borderRadius: 2,
              textTransform: 'none',
              flexShrink: 0
            }}
          >
            Search
          </Button>
        </Box>
      </Card>

      {/* Records Table */}
      <Card
        sx={{
          borderRadius: 3,
          bgcolor: 'rgba(13, 18, 29, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(14px)',
          overflow: 'hidden'
        }}
      >
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(15, 23, 42, 0.8)' }}>
              <TableRow>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  #
                </TableCell>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  Citizen Name
                </TableCell>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  Government Serial ID
                </TableCell>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  Attestation State
                </TableCell>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  Last Modified
                </TableCell>
                <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, borderBottom: 'none' }}>
                    <CircularProgress size={32} sx={{ color: '#6366f1', mb: 1.5 }} />
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Querying encrypted user registry...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, borderBottom: 'none' }}>
                    <Typography variant="body1" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
                      No citizen records found.
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Try adjusting your search criteria or filter.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u, idx) => (
                  <TableRow
                    key={u.id || idx}
                    hover
                    sx={{
                      transition: 'background-color 0.15s',
                      '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.04) !important' },
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
                    }}
                  >
                    <TableCell sx={{ color: '#64748b', fontSize: '0.85rem', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      {currentPage * rowsPerPage + idx + 1}
                    </TableCell>

                    <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                          {u.name || 'Anonymous Citizen'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {u.email || 'No email attached'}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 600, fontSize: '0.82rem' }}>
                        {u.government_id || 'NOT_ASSIGNED'}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      {getStatusChip(u.verification_status)}
                    </TableCell>

                    <TableCell sx={{ color: '#94a3b8', fontSize: '0.8rem', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      {formatDate(u.updated_at || u.created_at)}
                    </TableCell>

                    <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<VisibilityRounded />}
                          onClick={() => handleViewUser(u, false)}
                          sx={{
                            color: '#a5b4fc',
                            bgcolor: 'rgba(99, 102, 241, 0.1)',
                            border: '1px solid rgba(99, 102, 241, 0.25)',
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            px: 1.5,
                            '&:hover': {
                              bgcolor: 'rgba(99, 102, 241, 0.2)',
                              color: '#ffffff'
                            }
                          }}
                        >
                          Dossier
                        </Button>

                        <Button
                          size="small"
                          startIcon={<EditRounded />}
                          onClick={() => handleViewUser(u, true)}
                          sx={{
                            color: '#cbd5e1',
                            bgcolor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            px: 1.5,
                            '&:hover': {
                              bgcolor: 'rgba(255, 255, 255, 0.1)',
                              color: '#ffffff'
                            }
                          }}
                        >
                          Audit
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalUsers}
          page={currentPage}
          onPageChange={(e, newPage) => setCurrentPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setCurrentPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
          sx={{
            color: '#94a3b8',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            '& .MuiSelect-icon': { color: '#94a3b8' }
          }}
        />
      </Card>

      {/* Dossier Modal */}
      {isModalOpen && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={handleCloseModal}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </Box>
  );
};

export default AdminRecordManagement;
