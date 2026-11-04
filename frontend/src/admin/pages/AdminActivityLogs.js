import React, { useState, useEffect, useCallback } from 'react';
import ApiService from '../services/adminApi.service';
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
  TablePagination,
  Grid
} from '@mui/material';
import {
  HistoryRounded,
  FileDownloadRounded,
  SearchRounded,
  FilterListRounded,
  OpenInNewRounded,
  CheckCircleRounded,
  CancelRounded,
  EditRounded,
  HourglassEmptyRounded,
  AdminPanelSettingsRounded,
  CalendarTodayRounded
} from '@mui/icons-material';

const AdminActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0); // MUI 0-indexed
  const [totalLogs, setTotalLogs] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [exporting, setExporting] = useState(false);

  const fetchActivityLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        action: actionFilter !== 'all' ? actionFilter : undefined,
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
        search: searchQuery || undefined
      };

      const data = await ApiService.getActivityLogs(currentPage + 1, rowsPerPage, filters);
      setLogs(data.logs || []);
      setTotalLogs(data.total || (data.logs ? data.logs.length : 0));
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      setError('Failed to load system activity logs.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, searchQuery, actionFilter, dateRange]);

  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
    fetchActivityLogs();
  };

  const handleExportLogs = async () => {
    try {
      setExporting(true);
      const filters = {
        action: actionFilter !== 'all' ? actionFilter : undefined,
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
        search: searchQuery || undefined
      };

      const blob = await ApiService.exportActivityLogs(filters);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `trueid-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting logs:', err);
      setError('Failed to export activity logs.');
    } finally {
      setExporting(false);
    }
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

  const getActionColor = (action) => {
    if (!action) return { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.2)' };
    const act = action.toUpperCase();
    if (act.includes('VERIF') || act.includes('SUCCESS')) {
      return { color: '#34d399', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)' };
    }
    if (act.includes('REJECT') || act.includes('FAIL') || act.includes('ERROR')) {
      return { color: '#f87171', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)' };
    }
    if (act.includes('UPDATE') || act.includes('BIOMETRIC')) {
      return { color: '#818cf8', bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.25)' };
    }
    return { color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)' };
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Header Banner */}
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
                icon={<HistoryRounded sx={{ fontSize: '14px !important', color: '#818cf8 !important' }} />}
                label="IMMUTABLE AUDIT TRAIL"
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
                label={`${totalLogs} EVENTS LOGGED`}
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
              Authority Activity Logs
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 640 }}>
              Chronological cryptographic log of identity audits, biometric enrollments, and operator actions.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={exporting ? <CircularProgress size={16} sx={{ color: '#818cf8' }} /> : <FileDownloadRounded />}
            onClick={handleExportLogs}
            disabled={exporting}
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
            {exporting ? 'Generating CSV...' : 'Export Audit Logs (CSV)'}
          </Button>
        </Box>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          {error}
        </Alert>
      )}

      {/* Filter and Search Card */}
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
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center' }}>
          <TextField
            select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(0);
            }}
            size="small"
            sx={{
              minWidth: { xs: '100%', sm: 180 },
              bgcolor: 'rgba(15, 23, 42, 0.7)',
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            <MenuItem value="all">All Action Types</MenuItem>
            <MenuItem value="LOGIN_SUCCESS">Login Events</MenuItem>
            <MenuItem value="ADMIN_LOGIN_SUCCESS">Admin Access</MenuItem>
            <MenuItem value="IDENTITY_VERIFIED">Identities Verified</MenuItem>
            <MenuItem value="BIOMETRIC_DATA_UPDATED">Biometric Enrolments</MenuItem>
          </TextField>

          <TextField
            placeholder="Search by username, government ID, or operator..."
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
            Filter Logs
          </Button>
        </Box>
      </Card>

      {/* Logs Table */}
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
                  Action / Event
                </TableCell>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  Target Citizen
                </TableCell>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  Authorized By
                </TableCell>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  Timestamp
                </TableCell>
                <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  Details / Tx
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, borderBottom: 'none' }}>
                    <CircularProgress size={32} sx={{ color: '#6366f1', mb: 1.5 }} />
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Retrieving audit records...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, borderBottom: 'none' }}>
                    <Typography variant="body1" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
                      No matching audit logs found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, idx) => {
                  const meta = getActionColor(log.action);
                  return (
                    <TableRow
                      key={log.id || idx}
                      hover
                      sx={{
                        transition: 'background-color 0.15s',
                        '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.04) !important' },
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
                      }}
                    >
                      <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <Chip
                          label={log.action}
                          size="small"
                          sx={{
                            bgcolor: meta.bg,
                            color: meta.color,
                            border: `1px solid ${meta.border}`,
                            fontWeight: 700,
                            fontSize: '0.68rem',
                            letterSpacing: '0.04em'
                          }}
                        />
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#f8fafc' }}>
                          {log.user_name || log.userName || 'N/A'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace' }}>
                          {log.government_id || log.userId ? `ID: ${log.government_id || log.userId}` : ''}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AdminPanelSettingsRounded sx={{ color: '#818cf8', fontSize: 16 }} />
                          <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                            {log.admin_username || log.adminName || 'System'}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ color: '#94a3b8', fontSize: '0.8rem', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        {formatDate(log.created_at || log.timestamp)}
                      </TableCell>

                      <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        {log.details?.transactionHash || log.txHash ? (
                          <Tooltip title="View Transaction on Etherscan">
                            <IconButton
                              size="small"
                              onClick={() => window.open(`https://sepolia.etherscan.io/tx/${log.details?.transactionHash || log.txHash}`, '_blank')}
                              sx={{ color: '#6366f1' }}
                            >
                              <OpenInNewRounded sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Local Node
                          </Typography>
                        )}
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
          count={totalLogs}
          page={currentPage}
          onPageChange={(e, newPage) => setCurrentPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setCurrentPage(0);
          }}
          rowsPerPageOptions={[10, 15, 25, 50]}
          sx={{
            color: '#94a3b8',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            '& .MuiSelect-icon': { color: '#94a3b8' }
          }}
        />
      </Card>
    </Box>
  );
};

export default AdminActivityLogs;
