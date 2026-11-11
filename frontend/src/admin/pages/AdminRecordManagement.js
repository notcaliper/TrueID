import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ApiService from '../services/adminApi.service';
import UserDetailModal from '../components/UserDetailModal';
import OnboardUserModal from '../components/OnboardUserModal';
import { useColorMode } from '../../context/ThemeContext';
import { getAdminThemeTokens, getCardStyle, getBannerStyle, getInputStyle } from '../utils/adminTheme';
import {
  Box,
  Typography,
  Card,
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
  TablePagination,
  Checkbox,
  Avatar,
  Snackbar,
  Grid
} from '@mui/material';
import {
  SearchRounded,
  RefreshRounded,
  VisibilityRounded,
  FolderSharedRounded,
  VerifiedUserRounded,
  HourglassEmptyRounded,
  CancelRounded,
  PersonAddRounded,
  FileDownloadRounded,
  CheckCircleRounded,
  BlockRounded,
  FingerprintRounded,
  ContentCopyRounded,
  OpenInNewRounded,
  FilterListRounded,
  LockResetRounded
} from '@mui/icons-material';

const AdminRecordManagement = () => {
  const { isLight } = useColorMode();
  const t = getAdminThemeTokens(isLight);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [biometricFilter, setBiometricFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Pagination
  const [currentPage, setCurrentPage] = useState(0); // MUI 0-indexed
  const [totalUsers, setTotalUsers] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Selection for Batch Actions
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // Modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0,
    active: 0,
    suspended: 0,
    biometricCount: 0
  });

  // Copied indicator
  const [copiedId, setCopiedId] = useState(null);

  const fetchUsers = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const data = await ApiService.getUsers(
        currentPage + 1,
        rowsPerPage,
        searchQuery,
        statusFilter,
        biometricFilter,
        sortBy,
        sortOrder
      );

      setUsers(data.users || []);
      setTotalUsers(data.total || 0);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load user records from directory.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, rowsPerPage, searchQuery, statusFilter, biometricFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(0);
    fetchUsers();
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = users.map(u => u.id);
      setSelectedUserIds(allIds);
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleToggleSelectRow = (id) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Batch actions
  const handleBatchAction = async (action) => {
    if (selectedUserIds.length === 0) return;
    setBatchLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await ApiService.batchUserAction(action, selectedUserIds);
      setSuccess(res.message || `Batch ${action} executed successfully.`);
      setSelectedUserIds([]);
      fetchUsers(true);
    } catch (err) {
      console.error('Batch action error:', err);
      setError(err.response?.data?.message || `Failed to execute batch ${action}.`);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleExportCSV = (exportSelected = false) => {
    const listToExport = exportSelected
      ? users.filter(u => selectedUserIds.includes(u.id))
      : users;

    if (listToExport.length === 0) {
      setError('No citizen records available for export.');
      return;
    }

    const headers = ['ID', 'Name', 'Government ID', 'Email', 'Phone', 'Verification Status', 'Active State', 'Has Biometric', 'DID Address', 'Created At'];
    const rows = listToExport.map(u => [
      u.id,
      `"${u.name || ''}"`,
      `"${u.government_id || ''}"`,
      `"${u.email || ''}"`,
      `"${u.phone || ''}"`,
      u.verification_status || 'PENDING',
      u.is_active === false ? 'SUSPENDED' : 'ACTIVE',
      u.has_biometric ? 'YES' : 'NO',
      `"${u.did || u.wallet_address || ''}"`,
      `"${u.created_at || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trueid-citizen-directory-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleOpenDossier = (u) => {
    setSelectedUser(u);
    setIsDossierOpen(true);
  };

  const handleUserUpdated = (updatedUser) => {
    setUsers(users.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
    fetchUsers(true);
  };

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
          icon={<VerifiedUserRounded sx={{ fontSize: '13px !important', color: `${t.success} !important` }} />}
          label="VERIFIED"
          size="small"
          sx={{
            bgcolor: t.successBg,
            color: t.successText,
            border: `1px solid ${t.successBorder}`,
            fontWeight: 700,
            fontSize: '0.65rem'
          }}
        />
      );
    }
    if (s === 'REJECTED') {
      return (
        <Chip
          icon={<CancelRounded sx={{ fontSize: '13px !important', color: `${t.error} !important` }} />}
          label="REJECTED"
          size="small"
          sx={{
            bgcolor: t.errorBg,
            color: t.errorText,
            border: `1px solid ${t.errorBorder}`,
            fontWeight: 700,
            fontSize: '0.65rem'
          }}
        />
      );
    }
    return (
      <Chip
        icon={<HourglassEmptyRounded sx={{ fontSize: '13px !important', color: `${t.warning} !important` }} />}
        label="PENDING"
        size="small"
        sx={{
          bgcolor: t.warningBg,
          color: t.warningText,
          border: `1px solid ${t.warningBorder}`,
          fontWeight: 700,
          fontSize: '0.65rem'
        }}
      />
    );
  };

  const isAllSelected = users.length > 0 && selectedUserIds.length === users.length;
  const isSomeSelected = selectedUserIds.length > 0 && selectedUserIds.length < users.length;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Top Banner */}
      <Card sx={getBannerStyle(isLight)}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Chip
                icon={<FolderSharedRounded sx={{ fontSize: '14px !important', color: `${t.primary} !important` }} />}
                label="CITIZEN ENROLLMENT DIRECTORY"
                size="small"
                sx={{
                  bgcolor: t.primaryBg,
                  color: t.primary,
                  border: `1px solid ${t.primaryBorder}`,
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  letterSpacing: '0.06em'
                }}
              />
              <Chip
                label={`${totalUsers} RECORDS INDEXED`}
                size="small"
                sx={{
                  bgcolor: t.surfaceHover,
                  color: t.textSecondary,
                  border: `1px solid ${t.border}`,
                  fontWeight: 700,
                  fontSize: '0.68rem'
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: t.textPrimary, letterSpacing: '-0.02em', mb: 0.5 }}>
              Citizen Identity Records
            </Typography>
            <Typography variant="body2" sx={{ color: t.textMuted, maxWidth: 640 }}>
              Search, inspect dossiers, audit invariant biometric vectors, and manage cryptographic attestations.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<PersonAddRounded />}
              onClick={() => setIsOnboardOpen(true)}
              sx={{
                bgcolor: t.primary,
                color: '#ffffff',
                fontWeight: 700,
                px: 2.5,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: isLight ? '0 4px 12px rgba(37, 99, 235, 0.25)' : '0 4px 14px rgba(59, 130, 246, 0.3)',
                '&:hover': {
                  bgcolor: t.primaryDark
                }
              }}
            >
              Onboard Citizen
            </Button>

            <Button
              variant="outlined"
              startIcon={<FileDownloadRounded />}
              onClick={() => handleExportCSV(false)}
              sx={{
                borderColor: t.border,
                color: t.textSecondary,
                fontWeight: 600,
                px: 2,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  borderColor: t.primary,
                  bgcolor: t.primaryBg,
                  color: t.primary
                }
              }}
            >
              Export All
            </Button>

            <Button
              variant="outlined"
              startIcon={refreshing ? <CircularProgress size={16} sx={{ color: t.primary }} /> : <RefreshRounded />}
              onClick={() => fetchUsers(false)}
              disabled={loading || refreshing}
              sx={{
                borderColor: t.primaryBorder,
                color: t.primary,
                fontWeight: 600,
                px: 2,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                bgcolor: t.primaryBg,
                '&:hover': {
                  bgcolor: isLight ? 'rgba(37, 99, 235, 0.14)' : 'rgba(59, 130, 246, 0.2)',
                  borderColor: t.primary
                }
              }}
            >
              {refreshing ? 'Updating...' : 'Sync'}
            </Button>
          </Box>
        </Box>
      </Card>

      {/* KPI Stats Ribbon */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={getCardStyle(isLight, { p: 2 })}>
            <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Total Registered</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: t.textPrimary, mt: 0.5 }}>{stats.total}</Typography>
            <Typography variant="caption" sx={{ color: t.textMuted }}>In authority directory</Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={getCardStyle(isLight, { p: 2 })}>
            <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Verified DIDs</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: t.successText, mt: 0.5 }}>{stats.verified}</Typography>
            <Typography variant="caption" sx={{ color: t.textMuted }}>Issued attestations</Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={getCardStyle(isLight, { p: 2 })}>
            <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Pending Review</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: t.warningText, mt: 0.5 }}>{stats.pending}</Typography>
            <Typography variant="caption" sx={{ color: t.textMuted }}>Awaiting audit</Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={getCardStyle(isLight, { p: 2 })}>
            <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>FaceMesh Enrolled</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: t.primary, mt: 0.5 }}>{stats.biometricCount}</Typography>
            <Typography variant="caption" sx={{ color: t.textMuted }}>68-point vectors</Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card sx={getCardStyle(isLight, { p: 2 })}>
            <Typography variant="caption" sx={{ color: t.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Suspended Accounts</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: t.errorText, mt: 0.5 }}>{stats.suspended}</Typography>
            <Typography variant="caption" sx={{ color: t.textMuted }}>Locked out</Typography>
          </Card>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: t.errorBg, color: t.errorText, border: `1px solid ${t.errorBorder}` }}>
          {error}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <Card sx={getCardStyle(isLight, { mb: 3, p: 2.5 })}>
        <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by Name, Gov ID, Email, Phone, or DID address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ flexGrow: 1, minWidth: { xs: '100%', md: 320 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded sx={{ color: t.textMuted }} />
                </InputAdornment>
              ),
              sx: getInputStyle(isLight)
            }}
          />

          <TextField
            select
            label="Attestation Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(0);
            }}
            size="small"
            sx={{ minWidth: 160, ...getInputStyle(isLight) }}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="VERIFIED">Verified Only</MenuItem>
            <MenuItem value="PENDING">Pending Review</MenuItem>
            <MenuItem value="REJECTED">Rejected Claims</MenuItem>
            <MenuItem value="ACTIVE">Active Accounts</MenuItem>
            <MenuItem value="SUSPENDED">Suspended Accounts</MenuItem>
          </TextField>

          <TextField
            select
            label="Biometrics"
            value={biometricFilter}
            onChange={(e) => {
              setBiometricFilter(e.target.value);
              setCurrentPage(0);
            }}
            size="small"
            sx={{ minWidth: 160, ...getInputStyle(isLight) }}
          >
            <MenuItem value="ALL">All Biometrics</MenuItem>
            <MenuItem value="ENROLLED">FaceMesh Enrolled</MenuItem>
            <MenuItem value="MISSING">Missing FaceMesh</MenuItem>
          </TextField>

          <TextField
            select
            label="Sort By"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(0);
            }}
            size="small"
            sx={{ minWidth: 150, ...getInputStyle(isLight) }}
          >
            <MenuItem value="created_at">Registration Date</MenuItem>
            <MenuItem value="name">Citizen Name</MenuItem>
            <MenuItem value="government_id">Government ID</MenuItem>
            <MenuItem value="verification_status">Attestation Status</MenuItem>
          </TextField>

          <Button
            type="submit"
            variant="contained"
            sx={{
              bgcolor: t.primary,
              color: '#ffffff',
              fontWeight: 600,
              px: 3,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { bgcolor: t.primaryDark }
            }}
          >
            Filter
          </Button>
        </Box>
      </Card>

      {/* Floating Batch Actions Bar */}
      {selectedUserIds.length > 0 && (
        <Card
          sx={{
            mb: 2.5,
            p: 1.8,
            borderRadius: 2.5,
            bgcolor: isLight ? '#ffffff' : '#1e2124',
            border: `1.5px solid ${t.primary}`,
            boxShadow: isLight ? '0 8px 20px rgba(37, 99, 235, 0.15)' : '0 8px 24px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip
              label={`${selectedUserIds.length} Selected`}
              size="small"
              sx={{ bgcolor: t.primary, color: '#fff', fontWeight: 700 }}
            />
            <Typography variant="body2" sx={{ fontWeight: 600, color: t.textPrimary }}>
              Batch Operations Toolbar
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="contained"
              startIcon={<VerifiedUserRounded />}
              onClick={() => handleBatchAction('VERIFY')}
              disabled={batchLoading}
              sx={{
                bgcolor: t.success,
                color: '#fff',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { bgcolor: '#059669' }
              }}
            >
              Batch Verify
            </Button>

            <Button
              size="small"
              variant="outlined"
              startIcon={<BlockRounded />}
              onClick={() => handleBatchAction('DEACTIVATE')}
              disabled={batchLoading}
              sx={{
                borderColor: t.errorBorder,
                color: t.errorText,
                bgcolor: t.errorBg,
                fontWeight: 700,
                textTransform: 'none'
              }}
            >
              Batch Suspend
            </Button>

            <Button
              size="small"
              variant="outlined"
              startIcon={<CheckCircleRounded />}
              onClick={() => handleBatchAction('REACTIVATE')}
              disabled={batchLoading}
              sx={{
                borderColor: t.border,
                color: t.textSecondary,
                fontWeight: 600,
                textTransform: 'none'
              }}
            >
              Batch Reactivate
            </Button>

            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownloadRounded />}
              onClick={() => handleExportCSV(true)}
              sx={{
                borderColor: t.border,
                color: t.textSecondary,
                fontWeight: 600,
                textTransform: 'none'
              }}
            >
              Export Selected
            </Button>

            <Button
              size="small"
              onClick={() => setSelectedUserIds([])}
              sx={{ color: t.textMuted, textTransform: 'none' }}
            >
              Deselect All
            </Button>
          </Box>
        </Card>
      )}

      {/* Records Table */}
      <Card sx={getCardStyle(isLight, { overflow: 'hidden' })}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: isLight ? '#f8fafc' : '#141518' }}>
              <TableRow>
                <TableCell padding="checkbox" sx={{ borderBottom: `1px solid ${t.border}` }}>
                  <Checkbox
                    indeterminate={isSomeSelected}
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    size="small"
                    sx={{ color: t.textMuted, '&.Mui-checked': { color: t.primary } }}
                  />
                </TableCell>
                <TableCell sx={{ color: t.textMuted, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${t.border}` }}>
                  Citizen Identity
                </TableCell>
                <TableCell sx={{ color: t.textMuted, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${t.border}` }}>
                  Government ID
                </TableCell>
                <TableCell sx={{ color: t.textMuted, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${t.border}` }}>
                  DID / Sepolia Address
                </TableCell>
                <TableCell sx={{ color: t.textMuted, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${t.border}` }}>
                  Biometrics
                </TableCell>
                <TableCell sx={{ color: t.textMuted, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${t.border}` }}>
                  Attestation
                </TableCell>
                <TableCell sx={{ color: t.textMuted, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${t.border}` }}>
                  Account
                </TableCell>
                <TableCell align="right" sx={{ color: t.textMuted, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${t.border}` }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6, borderBottom: 'none' }}>
                    <CircularProgress size={32} sx={{ color: t.primary, mb: 1.5 }} />
                    <Typography variant="body2" sx={{ color: t.textMuted }}>
                      Querying authority identity registry...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6, borderBottom: 'none' }}>
                    <Typography variant="body1" sx={{ color: t.textSecondary, fontWeight: 600 }}>
                      No matching citizen records found.
                    </Typography>
                    <Typography variant="caption" sx={{ color: t.textMuted }}>
                      Adjust your search keyword or clear active filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const isSelected = selectedUserIds.includes(u.id);
                  const isUserActive = u.is_active !== false;

                  return (
                    <TableRow
                      key={u.id}
                      hover
                      selected={isSelected}
                      sx={{
                        transition: 'background-color 0.15s',
                        '&:hover': { bgcolor: isLight ? '#f8fafc !important' : 'rgba(255, 255, 255, 0.03) !important' },
                        borderBottom: `1px solid ${t.border}`,
                        bgcolor: isSelected ? t.primaryBg : 'inherit'
                      }}
                    >
                      <TableCell padding="checkbox" sx={{ borderBottom: `1px solid ${t.border}` }}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(u.id)}
                          size="small"
                          sx={{ color: t.textMuted, '&.Mui-checked': { color: t.primary } }}
                        />
                      </TableCell>

                      <TableCell sx={{ borderBottom: `1px solid ${t.border}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 34,
                              height: 34,
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              bgcolor: t.primaryBg,
                              color: t.primary,
                              border: `1px solid ${t.primaryBorder}`
                            }}
                          >
                            {(u.name || 'C')[0].toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: t.textPrimary }}>
                              {u.name || 'Anonymous Citizen'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: t.textMuted }}>
                              {u.email || 'No email attached'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ borderBottom: `1px solid ${t.border}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: t.primary, fontWeight: 700, fontSize: '0.82rem' }}>
                            {u.government_id || 'NOT_ASSIGNED'}
                          </Typography>
                          {u.government_id && (
                            <Tooltip title={copiedId === `gov-${u.id}` ? 'Copied!' : 'Copy ID'}>
                              <IconButton size="small" onClick={() => copyToClipboard(u.government_id, `gov-${u.id}`)} sx={{ p: 0.3, color: copiedId === `gov-${u.id}` ? t.success : t.textMuted }}>
                                <ContentCopyRounded sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell sx={{ borderBottom: `1px solid ${t.border}` }}>
                        {u.wallet_address || u.did ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: t.textSecondary, fontWeight: 600 }}>
                              {(u.did || u.wallet_address).slice(0, 10)}...{(u.did || u.wallet_address).slice(-6)}
                            </Typography>
                            <Tooltip title={copiedId === `did-${u.id}` ? 'Copied!' : 'Copy DID'}>
                              <IconButton size="small" onClick={() => copyToClipboard(u.did || u.wallet_address, `did-${u.id}`)} sx={{ p: 0.3, color: copiedId === `did-${u.id}` ? t.success : t.textMuted }}>
                                <ContentCopyRounded sx={{ fontSize: 13 }} />
                              </IconButton>
                            </Tooltip>
                            {u.wallet_address && (
                              <Tooltip title="View on Sepolia Etherscan">
                                <IconButton size="small" onClick={() => window.open(`https://sepolia.etherscan.io/address/${u.wallet_address}`, '_blank')} sx={{ p: 0.3, color: t.primary }}>
                                  <OpenInNewRounded sx={{ fontSize: 13 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: t.textMuted }}>Unprovisioned</Typography>
                        )}
                      </TableCell>

                      <TableCell sx={{ borderBottom: `1px solid ${t.border}` }}>
                        {u.has_biometric ? (
                          <Chip
                            icon={<FingerprintRounded sx={{ fontSize: '13px !important', color: `${t.success} !important` }} />}
                            label="Enrolled"
                            size="small"
                            sx={{
                              bgcolor: t.successBg,
                              color: t.successText,
                              border: `1px solid ${t.successBorder}`,
                              fontWeight: 700,
                              fontSize: '0.65rem'
                            }}
                          />
                        ) : (
                          <Chip
                            label="Missing"
                            size="small"
                            sx={{
                              bgcolor: t.surfaceSubtle,
                              color: t.textMuted,
                              border: `1px solid ${t.border}`,
                              fontWeight: 600,
                              fontSize: '0.65rem'
                            }}
                          />
                        )}
                      </TableCell>

                      <TableCell sx={{ borderBottom: `1px solid ${t.border}` }}>
                        {getStatusChip(u.verification_status)}
                      </TableCell>

                      <TableCell sx={{ borderBottom: `1px solid ${t.border}` }}>
                        <Chip
                          label={isUserActive ? 'ACTIVE' : 'SUSPENDED'}
                          size="small"
                          sx={{
                            bgcolor: isUserActive ? t.successBg : t.errorBg,
                            color: isUserActive ? t.successText : t.errorText,
                            border: `1px solid ${isUserActive ? t.successBorder : t.errorBorder}`,
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            height: 20
                          }}
                        />
                      </TableCell>

                      <TableCell align="right" sx={{ borderBottom: `1px solid ${t.border}` }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Button
                            size="small"
                            startIcon={<VisibilityRounded />}
                            onClick={() => handleOpenDossier(u)}
                            sx={{
                              color: t.primary,
                              bgcolor: t.primaryBg,
                              border: `1px solid ${t.primaryBorder}`,
                              borderRadius: 1.5,
                              textTransform: 'none',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              px: 1.5,
                              '&:hover': {
                                bgcolor: t.primary,
                                color: '#ffffff'
                              }
                            }}
                          >
                            Dossier
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
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
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{
            color: t.textMuted,
            borderTop: `1px solid ${t.border}`,
            '& .MuiSelect-icon': { color: t.textMuted },
            '& .MuiTablePagination-select': { color: t.textPrimary },
            '& .MuiIconButton-root': { color: t.textSecondary }
          }}
        />
      </Card>

      {/* Dossier Modal */}
      {isDossierOpen && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => {
            setIsDossierOpen(false);
            setSelectedUser(null);
          }}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {/* Onboard Citizen Modal */}
      <OnboardUserModal
        open={isOnboardOpen}
        onClose={() => setIsOnboardOpen(false)}
        onUserCreated={(newUser) => {
          setSuccess(`Citizen ${newUser.name} successfully registered with ID ${newUser.government_id}.`);
          fetchUsers(true);
        }}
      />

      {/* Notifications */}
      <Snackbar
        open={!!success || !!error}
        autoHideDuration={5000}
        onClose={() => {
          setSuccess(null);
          setError(null);
        }}
      >
        <Alert
          severity={error ? 'error' : 'success'}
          onClose={() => {
            setSuccess(null);
            setError(null);
          }}
          sx={{
            bgcolor: error ? t.errorBg : t.successBg,
            color: error ? t.errorText : t.successText,
            border: `1px solid ${error ? t.errorBorder : t.successBorder}`
          }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminRecordManagement;
