import React, { useState, useEffect, useCallback } from 'react';
import ApiService from '../services/adminApi.service';
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
  TablePagination
} from '@mui/material';
import {
  HistoryRounded,
  FileDownloadRounded,
  SearchRounded,
  OpenInNewRounded,
  AdminPanelSettingsRounded
} from '@mui/icons-material';

const AdminActivityLogs = () => {
  const { isLight } = useColorMode();
  const t = getAdminThemeTokens(isLight);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0); // MUI 0-indexed
  const [totalLogs, setTotalLogs] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRange] = useState({
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
    if (!action) return { color: t.textMuted, bg: t.surfaceHover, border: t.border };
    const act = action.toUpperCase();
    if (act.includes('VERIF') || act.includes('SUCCESS')) {
      return { color: t.successText, bg: t.successBg, border: t.successBorder };
    }
    if (act.includes('REJECT') || act.includes('FAIL') || act.includes('ERROR')) {
      return { color: t.errorText, bg: t.errorBg, border: t.errorBorder };
    }
    if (act.includes('UPDATE') || act.includes('BIOMETRIC')) {
      return { color: t.primary, bg: t.primaryBg, border: t.primaryBorder };
    }
    return { color: t.warningText, bg: t.warningBg, border: t.warningBorder };
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Header Banner */}
      <Card sx={getBannerStyle(isLight)}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Chip
                icon={<HistoryRounded sx={{ fontSize: '14px !important', color: `${t.primary} !important` }} />}
                label="IMMUTABLE AUDIT TRAIL"
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
                label={`${totalLogs} EVENTS LOGGED`}
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
              Authority Activity Logs
            </Typography>
            <Typography variant="body2" sx={{ color: t.textMuted, maxWidth: 640 }}>
              Chronological cryptographic log of identity audits, biometric enrollments, and operator actions.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={exporting ? <CircularProgress size={16} sx={{ color: t.primary }} /> : <FileDownloadRounded />}
            onClick={handleExportLogs}
            disabled={exporting}
            sx={{
              borderColor: t.primaryBorder,
              color: t.primary,
              fontWeight: 600,
              px: 2.5,
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
            {exporting ? 'Generating CSV...' : 'Export Audit Logs (CSV)'}
          </Button>
        </Box>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: t.errorBg, color: t.errorText, border: `1px solid ${t.errorBorder}` }}>
          {error}
        </Alert>
      )}

      {/* Filter and Search Card */}
      <Card sx={getCardStyle(isLight, { mb: 3, p: 2.5 })}>
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
              ...getInputStyle(isLight)
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
                  <SearchRounded sx={{ color: t.textMuted }} />
                </InputAdornment>
              ),
              sx: getInputStyle(isLight)
            }}
          />

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
              flexShrink: 0,
              '&:hover': {
                bgcolor: t.primaryDark,
                boxShadow: 'none'
              }
            }}
          >
            Filter Logs
          </Button>
        </Box>
      </Card>

      {/* Logs Table */}
      <Card sx={getCardStyle(isLight, { overflow: 'hidden' })}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: isLight ? '#f8fafc' : '#141518' }}>
              <TableRow>
                <TableCell sx={{ color: t.textMuted, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${t.border}` }}>
                  Action / Event
                </TableCell>
                <TableCell sx={{ color: t.textMuted, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${t.border}` }}>
                  Target Citizen
                </TableCell>
                <TableCell sx={{ color: t.textMuted, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${t.border}` }}>
                  Authorized By
                </TableCell>
                <TableCell sx={{ color: t.textMuted, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${t.border}` }}>
                  Timestamp
                </TableCell>
                <TableCell align="right" sx={{ color: t.textMuted, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${t.border}` }}>
                  Details / Tx
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, borderBottom: 'none' }}>
                    <CircularProgress size={32} sx={{ color: t.primary, mb: 1.5 }} />
                    <Typography variant="body2" sx={{ color: t.textMuted }}>
                      Retrieving audit records...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, borderBottom: 'none' }}>
                    <Typography variant="body1" sx={{ color: t.textSecondary, fontWeight: 600 }}>
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
                        '&:hover': { bgcolor: isLight ? '#f8fafc !important' : 'rgba(255, 255, 255, 0.03) !important' },
                        borderBottom: `1px solid ${t.border}`
                      }}
                    >
                      <TableCell sx={{ borderBottom: `1px solid ${t.border}` }}>
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

                      <TableCell sx={{ borderBottom: `1px solid ${t.border}` }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: t.textPrimary }}>
                          {log.user_name || log.userName || 'N/A'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: t.textMuted, fontFamily: 'monospace' }}>
                          {log.government_id || log.userId ? `ID: ${log.government_id || log.userId}` : ''}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ borderBottom: `1px solid ${t.border}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AdminPanelSettingsRounded sx={{ color: t.primary, fontSize: 16 }} />
                          <Typography variant="body2" sx={{ color: t.textSecondary }}>
                            {log.admin_username || log.adminName || 'System'}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ color: t.textMuted, fontSize: '0.8rem', borderBottom: `1px solid ${t.border}` }}>
                        {formatDate(log.created_at || log.timestamp)}
                      </TableCell>

                      <TableCell align="right" sx={{ borderBottom: `1px solid ${t.border}` }}>
                        {log.details?.transactionHash || log.txHash ? (
                          <Tooltip title="View Transaction on Etherscan">
                            <IconButton
                              size="small"
                              onClick={() => window.open(`https://sepolia.etherscan.io/tx/${log.details?.transactionHash || log.txHash}`, '_blank')}
                              sx={{ color: t.primary }}
                            >
                              <OpenInNewRounded sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" sx={{ color: t.textMuted }}>
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
            color: t.textMuted,
            borderTop: `1px solid ${t.border}`,
            '& .MuiSelect-icon': { color: t.textMuted },
            '& .MuiTablePagination-select': { color: t.textPrimary },
            '& .MuiIconButton-root': { color: t.textSecondary }
          }}
        />
      </Card>
    </Box>
  );
};

export default AdminActivityLogs;
