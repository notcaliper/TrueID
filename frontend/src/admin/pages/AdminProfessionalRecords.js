import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  TablePagination,
  Link,
  Tooltip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  Fingerprint as FingerprintIcon,
  Link as LinkIcon,
  Close as CloseIcon,
  WorkspacePremiumRounded,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import ApiService from '../services/adminApi.service';
import { debounce } from 'lodash';
import { useColorMode } from '../../context/ThemeContext';
import { getAdminThemeTokens, getCardStyle, getBannerStyle, getInputStyle } from '../utils/adminTheme';

const AdminProfessionalRecords = () => {
  const { isLight } = useColorMode();
  const t = getAdminThemeTokens(isLight);

  // Helper for date formatting
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return dayjs(date).isValid() ? dayjs(date).format('YYYY-MM-DD') : 'N/A';
  };

  // State management
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const [linkedDocuments, setLinkedDocuments] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [previewDocUrl, setPreviewDocUrl] = useState(null);
  const [previewDocType, setPreviewDocType] = useState(null);
  const [previewDocError, setPreviewDocError] = useState(false);
  const [hashDetails, setHashDetails] = useState(null);

  const getFullDocUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const backendBase = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
    return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Custom TabPanel component
  function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`tabpanel-${index}`}
        aria-labelledby={`tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 2.5 }}>
            {children}
          </Box>
        )}
      </div>
    );
  }

  // Calculate record hash using Web Crypto API
  const calculateRecordHash = async (record) => {
    const dataToHash = {
      userId: record.user_id || record.userId,
      title: record.title,
      organization: record.organization || record.institution,
      startDate: record.start_date || record.startDate,
      endDate: record.end_date || record.endDate,
      description: record.description,
      jobTitle: record.job_title || record.jobTitle,
      companyName: record.company_name || record.companyName,
      employmentType: record.employment_type || record.employmentType
    };
    
    const sortedData = Object.keys(dataToHash)
      .sort()
      .reduce((obj, key) => {
        if (dataToHash[key] !== undefined && dataToHash[key] !== null) {
          obj[key] = dataToHash[key];
        }
        return obj;
      }, {});

    try {
      const jsonString = JSON.stringify(sortedData);
      const encoder = new TextEncoder();
      const data = encoder.encode(jsonString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      setHashDetails({
        hash: hashHex,
        sourceData: sortedData
      });

      return hashHex;
    } catch (err) {
      console.error('Error calculating hash:', err);
      return null;
    }
  };

  // Fetch records with debouncing for search
  const debouncedFetch = useMemo(
    () => debounce(async (searchTerm, pageNum, limit) => {
      setLoading(true);
      try {
        const response = await ApiService.getAllProfessionalRecords(pageNum + 1, limit, searchTerm);
        if (response && response.records) {
          const withUsers = response.records.map((rec) => ({
            ...rec,
            user: rec.user || {
              name: rec.user_name || 'N/A',
              email: rec.user_email || 'N/A',
              government_id: rec.user_government_id || rec.government_id || 'N/A'
            }
          }));
          setRecords(withUsers);
          setTotalRecords(response.total || withUsers.length);
        }
      } catch (err) {
        setError('Failed to fetch records: ' + err.message);
      } finally {
        setLoading(false);
      }
    }, 300),
    [rowsPerPage]
  );

  // Effect for fetching records
  useEffect(() => {
    debouncedFetch(searchQuery, page, rowsPerPage);
    return () => debouncedFetch.cancel();
  }, [searchQuery, page, rowsPerPage, debouncedFetch]);

  // Fetch linked documents for a professional record
  const fetchLinkedDocuments = useCallback(async (recordId) => {
    try {
      const docs = await ApiService.listProfessionalRecordDocuments(recordId);
      setLinkedDocuments(Array.isArray(docs) ? docs : (docs.documents || []));
    } catch (err) {
      setError('Failed to fetch linked documents: ' + err.message);
    }
  }, []);

  // Handle record selection
  const handleViewRecord = useCallback(async (record) => {
    try {
      setSelectedRecord(record);
      setOpenModal(true);
      await fetchLinkedDocuments(record.id);
      await calculateRecordHash(record);
      setTabValue(0);
    } catch (err) {
      console.error('Error viewing record:', err);
      setError('Failed to load record details');
    }
  }, [fetchLinkedDocuments]);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setOpenModal(false);
    setAdminNotes('');
    setSelectedRecord(null);
    setHashDetails(null);
  }, []);

  // Handle blockchain verification
  const handleBlockchainVerify = async (recordId) => {
    setBlockchainLoading(true);
    try {
      const result = await ApiService.verifyOnBlockchain(recordId);
      if (result) {
        setSuccess('Record anchored on Sepolia & credential token minted successfully!');
        const updatedRecord = await ApiService.getProfessionalRecord(recordId);
        if (updatedRecord && updatedRecord.record) {
          setSelectedRecord(updatedRecord.record);
        }
        debouncedFetch(searchQuery, page, rowsPerPage);
      } else {
        setError('Blockchain verification failed');
      }
    } catch (err) {
      setError(`Blockchain verification failed: ${err.message}`);
    } finally {
      setBlockchainLoading(false);
    }
  };

  // Add handler for admin actions
  const handleAdminVerify = async (recordId, status) => {
    setActionLoading(true);
    try {
      const response = await ApiService.updateProfessionalRecordStatus(recordId, {
        status,
        notes: adminNotes
      });
      
      const bc = response?.blockchain;
      if (status === 'VERIFIED') {
        const tokenMsg = bc?.tokenId ? ` (Soulbound Token #${bc.tokenId} Minted)` : '';
        const txMsg = bc?.primaryTxHash ? ` [Tx: ${bc.primaryTxHash.substring(0, 10)}...]` : '';
        setSuccess(`Record verified & anchored on Sepolia!${tokenMsg}${txMsg}`);
      } else {
        setSuccess('Record status updated successfully');
      }

      // Re-fetch record details so the modal displays on-chain status and Etherscan link!
      try {
        const refreshed = await ApiService.getProfessionalRecord(recordId);
        if (refreshed && refreshed.record) {
          setSelectedRecord(refreshed.record);
        }
      } catch (e) {}

      debouncedFetch(searchQuery, page, rowsPerPage);
      setAdminNotes('');
    } catch (err) {
      setError(`Failed to update record status: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Render status chip
  const StatusChip = ({ status }) => {
    const s = (status || 'PENDING').toUpperCase();
    if (s === 'VERIFIED') {
      return (
        <Chip
          label="VERIFIED"
          size="small"
          icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: `${t.success} !important` }} />}
          sx={{
            bgcolor: t.successBg,
            color: t.successText,
            border: `1px solid ${t.successBorder}`,
            fontWeight: 700,
            fontSize: '0.68rem'
          }}
        />
      );
    }
    if (s === 'REJECTED') {
      return (
        <Chip
          label="REJECTED"
          size="small"
          icon={<ErrorIcon sx={{ fontSize: '14px !important', color: `${t.error} !important` }} />}
          sx={{
            bgcolor: t.errorBg,
            color: t.errorText,
            border: `1px solid ${t.errorBorder}`,
            fontWeight: 700,
            fontSize: '0.68rem'
          }}
        />
      );
    }
    return (
      <Chip
        label="PENDING"
        size="small"
        sx={{
          bgcolor: t.warningBg,
          color: t.warningText,
          border: `1px solid ${t.warningBorder}`,
          fontWeight: 700,
          fontSize: '0.68rem'
        }}
      />
    );
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Top Banner */}
      <Card sx={getBannerStyle(isLight)}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Chip
                icon={<WorkspacePremiumRounded sx={{ fontSize: '14px !important', color: `${t.primary} !important` }} />}
                label="ACADEMIC & PROFESSIONAL VERIFICATION"
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
                label={`${totalRecords} CREDENTIALS`}
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
              Professional Records Registry
            </Typography>
            <Typography variant="body2" sx={{ color: t.textMuted, maxWidth: 640 }}>
              Audit academic diplomas, corporate employment proofs, and cryptographic certificate hashes.
            </Typography>
          </Box>

          <Button
            startIcon={<RefreshIcon />}
            onClick={() => debouncedFetch(searchQuery, page, rowsPerPage)}
            variant="outlined"
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
            Sync Registry
          </Button>
        </Box>
      </Card>
      
      {/* Search Bar */}
      <Card sx={getCardStyle(isLight, { mb: 3, p: 2.5 })}>
        <TextField
          placeholder="Search by title, organization, or citizen name..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <SearchIcon sx={{ color: t.textMuted, mr: 1 }} />
            ),
            sx: getInputStyle(isLight)
          }}
        />
      </Card>
      
      {/* Records Table */}
      <Card sx={getCardStyle(isLight, { overflow: 'hidden' })}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: isLight ? '#f8fafc' : '#141518' }}>
              <TableRow>
                <TableCell sx={{ color: t.textMuted, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${t.border}` }}>Citizen</TableCell>
                <TableCell sx={{ color: t.textMuted, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${t.border}` }}>Title</TableCell>
                <TableCell sx={{ color: t.textMuted, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${t.border}` }}>Organization</TableCell>
                <TableCell sx={{ color: t.textMuted, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${t.border}` }}>Date Range</TableCell>
                <TableCell sx={{ color: t.textMuted, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${t.border}` }}>Status</TableCell>
                <TableCell sx={{ color: t.textMuted, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${t.border}` }}>Hash Status</TableCell>
                <TableCell align="right" sx={{ color: t.textMuted, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${t.border}` }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, borderBottom: 'none' }}>
                    <CircularProgress size={32} sx={{ color: t.primary }} />
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, borderBottom: 'none' }}>
                    <Typography variant="body1" sx={{ color: t.textSecondary, fontWeight: 600 }}>
                      No verified records registered yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow
                    key={record.id}
                    hover
                    sx={{
                      '&:hover': { bgcolor: isLight ? '#f8fafc !important' : 'rgba(255, 255, 255, 0.03) !important' },
                      borderBottom: `1px solid ${t.border}`
                    }}
                  >
                    <TableCell sx={{ borderBottom: `1px solid ${t.border}` }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: t.textPrimary }}>{record.user?.name || 'N/A'}</Typography>
                      <Typography variant="caption" sx={{ color: t.textMuted, fontFamily: 'monospace' }}>
                        {record.user?.government_id}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: t.textPrimary, fontWeight: 600, borderBottom: `1px solid ${t.border}` }}>{record.title}</TableCell>
                    <TableCell sx={{ color: t.primary, fontWeight: 600, borderBottom: `1px solid ${t.border}` }}>{record.organization || record.institution}</TableCell>
                    <TableCell sx={{ color: t.textMuted, fontSize: '0.8rem', borderBottom: `1px solid ${t.border}` }}>
                      {formatDate(record.start_date || record.startDate)} —{' '}
                      {record.end_date || record.endDate ? formatDate(record.end_date || record.endDate) : 'Present'}
                    </TableCell>
                    <TableCell sx={{ borderBottom: `1px solid ${t.border}` }}>
                      <StatusChip status={record.verification_status || record.verificationStatus} />
                    </TableCell>
                    <TableCell sx={{ borderBottom: `1px solid ${t.border}` }}>
                      <Tooltip title={record.data_hash || 'No hash available'}>
                        <Chip
                          icon={<FingerprintIcon sx={{ fontSize: '14px !important', color: record.data_hash ? `${t.success} !important` : `${t.textMuted} !important` }} />}
                          label={record.data_hash ? 'Hashed' : 'Not Hashed'}
                          size="small"
                          sx={{
                            bgcolor: record.data_hash ? t.successBg : t.surfaceSubtle,
                            color: record.data_hash ? t.successText : t.textMuted,
                            border: `1px solid ${record.data_hash ? t.successBorder : t.border}`,
                            fontWeight: 700,
                            fontSize: '0.68rem'
                          }}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right" sx={{ borderBottom: `1px solid ${t.border}` }}>
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewRecord(record)}
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
                        Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalRecords}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{
            color: t.textMuted,
            borderTop: `1px solid ${t.border}`,
            '& .MuiSelect-icon': { color: t.textMuted },
            '& .MuiTablePagination-select': { color: t.textPrimary },
            '& .MuiIconButton-root': { color: t.textSecondary }
          }}
        />
      </Card>
      
      {/* Record Detail Modal */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: t.paper,
            backgroundImage: 'none',
            borderRadius: 3,
            border: `1px solid ${t.border}`,
            boxShadow: isLight ? '0 20px 25px -5px rgba(0, 0, 0, 0.1)' : '0 24px 48px rgba(0, 0, 0, 0.7)'
          }
        }}
      >
        {selectedRecord && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5, borderBottom: `1px solid ${t.border}` }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: t.textPrimary }}>
                Professional Record Details
              </Typography>
              <IconButton
                onClick={handleCloseModal}
                sx={{ color: t.textMuted, '&:hover': { color: t.textPrimary } }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: t.border, p: 0 }}>
              <Box sx={{ borderBottom: `1px solid ${t.border}`, px: 2 }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange}
                  sx={{
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontWeight: 600,
                      color: t.textMuted,
                      '&.Mui-selected': { color: t.primary }
                    },
                    '& .MuiTabs-indicator': { backgroundColor: t.primary }
                  }}
                >
                  <Tab label="Details" />
                  <Tab label="Hash Information" />
                  <Tab label="Documents" />
                  <Tab label="Verification" />
                </Tabs>
              </Box>
              
              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12}>
                    <Card sx={getCardStyle(isLight, { bgcolor: t.surfaceSubtle })}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ color: t.textMuted, mb: 1, textTransform: 'uppercase' }}>User Information</Typography>
                        <Typography sx={{ color: t.textPrimary, fontWeight: 600 }}>Name: {selectedRecord.user?.name}</Typography>
                        <Typography sx={{ color: t.primary, fontFamily: 'monospace' }}>Government ID: {selectedRecord.user?.government_id}</Typography>
                        <Typography sx={{ color: t.textSecondary }}>Email: {selectedRecord.user?.email}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <Card sx={getCardStyle(isLight, { bgcolor: t.surfaceSubtle })}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ color: t.textMuted, mb: 1, textTransform: 'uppercase' }}>Record Details</Typography>
                        <Typography variant="h6" sx={{ color: t.textPrimary, fontWeight: 700 }}>{selectedRecord.title}</Typography>
                        <Typography sx={{ color: t.primary, fontWeight: 600 }}>Organization: {selectedRecord.organization || selectedRecord.institution}</Typography>
                        <Typography sx={{ color: t.textSecondary, mt: 1 }}>{selectedRecord.description}</Typography>
                        <Typography sx={{ color: t.textMuted, mt: 1, fontSize: '0.85rem' }}>Period: {formatDate(selectedRecord.start_date)} - {selectedRecord.end_date ? formatDate(selectedRecord.end_date) : 'Present'}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Card sx={getCardStyle(isLight, { bgcolor: t.surfaceSubtle })}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: t.textPrimary, fontWeight: 700 }}>Hash Information</Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: t.textMuted }}>Current Data Hash</Typography>
                      <Typography
                        sx={{
                          bgcolor: t.paper,
                          border: `1px solid ${t.border}`,
                          color: t.primary,
                          p: 2,
                          borderRadius: 1.5,
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          wordBreak: 'break-all',
                          mt: 0.5
                        }}
                      >
                        {selectedRecord.data_hash || 'Not available'}
                      </Typography>
                    </Box>

                    {hashDetails && (
                      <>
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="subtitle2" sx={{ color: t.textMuted }}>Calculated SHA-256 Hash</Typography>
                          <Typography
                            sx={{
                              bgcolor: t.paper,
                              border: `1px solid ${t.border}`,
                              color: t.successText,
                              p: 2,
                              borderRadius: 1.5,
                              fontFamily: 'monospace',
                              fontSize: '0.85rem',
                              wordBreak: 'break-all',
                              mt: 0.5
                            }}
                          >
                            {hashDetails.hash}
                          </Typography>
                        </Box>

                        <Box sx={{ mt: 3 }}>
                          <Typography variant="subtitle2" sx={{ color: t.textMuted }}>Source Data for Hash</Typography>
                          <pre
                            style={{
                              backgroundColor: isLight ? '#f1f5f9' : '#111214',
                              color: t.textPrimary,
                              border: `1px solid ${t.border}`,
                              padding: '14px',
                              borderRadius: '8px',
                              overflow: 'auto',
                              fontSize: '0.8rem',
                              fontFamily: 'monospace',
                              marginTop: '4px'
                            }}
                          >
                            {JSON.stringify(hashDetails.sourceData, null, 2)}
                          </pre>
                        </Box>
                      </>
                    )}

                    {selectedRecord.blockchain_tx_hash && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" sx={{ color: t.textMuted }}>Blockchain Transaction</Typography>
                        <Link
                          href={`https://sepolia.etherscan.io/tx/${selectedRecord.blockchain_tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ display: 'flex', alignItems: 'center', gap: 1, color: t.primary, mt: 0.5, fontWeight: 600 }}
                        >
                          <LinkIcon />
                          View on Sepolia Etherscan
                        </Link>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Typography variant="h6" sx={{ color: t.textPrimary, fontWeight: 700, mb: 2 }}>Linked Documents</Typography>
                {linkedDocuments.length > 0 ? (
                  <List>
                    {linkedDocuments.map((doc) => {
                      const fileName = doc.original_name || doc.fileName || (doc.file_url ? doc.file_url.split('/').pop() : 'Attached Document');
                      const rawUrl = doc.file_url || doc.fileUrl;
                      const fullUrl = getFullDocUrl(rawUrl);
                      const isPdf = (doc.mime_type || doc.mimeType || '').includes('pdf') || (fullUrl && fullUrl.toLowerCase().endsWith('.pdf'));

                      return (
                        <ListItem key={doc.id} sx={{ bgcolor: t.surfaceSubtle, border: `1px solid ${t.border}`, borderRadius: 2, mb: 1.5, p: 2 }}>
                          <ListItemText
                            primary={
                              <Typography sx={{ color: t.textPrimary, fontWeight: 700, fontSize: '0.95rem' }}>
                                {fileName}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ mt: 0.8 }}>
                                <Typography variant="body2" sx={{ color: t.textSecondary }}>
                                  Status: <StatusChip status={doc.verification_status || doc.verificationStatus || 'PENDING'} />
                                </Typography>
                                <Typography variant="caption" sx={{ color: t.textMuted, fontFamily: 'monospace', display: 'block', mt: 0.5 }}>
                                  Hash: {doc.file_hash || doc.fileHash || 'Not available'}
                                </Typography>
                                {doc.blockchain_tx_hash && (
                                  <Typography variant="caption" sx={{ color: t.primary, fontFamily: 'monospace', display: 'block' }}>
                                    TX: {doc.blockchain_tx_hash}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {fullUrl && (
                              <>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<VisibilityIcon sx={{ fontSize: '15px !important' }} />}
                                  onClick={() => {
                                    setPreviewDocError(false);
                                    setPreviewDocUrl(fullUrl);
                                    setPreviewDocType(isPdf ? 'pdf' : 'image');
                                  }}
                                  sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', borderColor: t.primaryBorder, color: t.primary, bgcolor: t.primaryBg }}
                                >
                                  Preview
                                </Button>
                                <Tooltip title="Open in New Tab">
                                  <IconButton component="a" href={fullUrl} target="_blank" rel="noopener noreferrer" sx={{ color: t.primary }}>
                                    <LinkIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Download">
                                  <IconButton component="a" href={fullUrl} download sx={{ color: t.primary }}>
                                    <DownloadIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </ListItemSecondaryAction>
                        </ListItem>
                      );
                    })}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4, color: t.textMuted }}>
                    <Typography>No attached documents found.</Typography>
                  </Box>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={3}>
                <Card sx={getCardStyle(isLight, { bgcolor: t.surfaceSubtle })}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: t.textPrimary, fontWeight: 700 }}>Verification Action</Typography>
                    <Box sx={{ mt: 1.5 }}>
                      <StatusChip status={selectedRecord.verification_status} />
                    </Box>
                    
                    {selectedRecord.verification_status !== 'VERIFIED' && (
                      <Box sx={{ mt: 3 }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Admin Audit Notes"
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          variant="outlined"
                          InputProps={{ sx: getInputStyle(isLight) }}
                        />
                        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                          <LoadingButton
                            variant="contained"
                            loading={actionLoading}
                            onClick={() => handleAdminVerify(selectedRecord.id, 'VERIFIED')}
                            startIcon={<CheckCircleIcon />}
                            sx={{
                              bgcolor: t.success,
                              color: '#fff',
                              '&:hover': { bgcolor: '#059669' }
                            }}
                          >
                            Verify Record
                          </LoadingButton>
                          <LoadingButton
                            variant="contained"
                            loading={actionLoading}
                            onClick={() => handleAdminVerify(selectedRecord.id, 'REJECTED')}
                            startIcon={<ErrorIcon />}
                            sx={{
                              bgcolor: t.error,
                              color: '#fff',
                              '&:hover': { bgcolor: '#b91c1c' }
                            }}
                          >
                            Reject Record
                          </LoadingButton>
                        </Box>
                      </Box>
                    )}

                    {selectedRecord.verification_status === 'VERIFIED' && selectedRecord.blockchain_tx_hash && (
                      <Box sx={{ mt: 3, p: 2.5, borderRadius: 2, bgcolor: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.08)', border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(16, 185, 129, 0.25)'}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                          <CheckCircleIcon sx={{ color: '#10b981', fontSize: 24 }} />
                          <Box>
                            <Typography sx={{ fontWeight: 700, color: t.textPrimary, fontSize: '0.95rem' }}>
                              On-Chain Verifiable Credential Anchored
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
                              Ethereum Sepolia • ERC-5192 Soulbound Token Minted
                            </Typography>
                          </Box>
                        </Box>

                        {selectedRecord.credential_id && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" sx={{ color: t.textMuted, display: 'block' }}>W3C Credential URN:</Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: t.textPrimary, wordBreak: 'break-all' }}>
                              {selectedRecord.credential_id}
                            </Typography>
                          </Box>
                        )}

                        <Box sx={{ mt: 1.5 }}>
                          <Typography variant="caption" sx={{ color: t.textMuted, display: 'block' }}>Attestation Transaction:</Typography>
                          <Link
                            href={`https://sepolia.etherscan.io/tx/${selectedRecord.blockchain_tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: t.primary, fontWeight: 700, fontSize: '0.82rem', mt: 0.3 }}
                          >
                            <LinkIcon sx={{ fontSize: 16 }} />
                            View on Sepolia Etherscan ↗
                          </Link>
                        </Box>
                      </Box>
                    )}

                    {selectedRecord.verification_status === 'VERIFIED' && !selectedRecord.blockchain_tx_hash && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="body2" sx={{ color: t.textSecondary, mb: 1.5 }}>
                          This record is verified in the database but has not been anchored on the Ethereum Sepolia ledger yet.
                        </Typography>
                        <LoadingButton
                          variant="contained"
                          loading={blockchainLoading}
                          onClick={() => handleBlockchainVerify(selectedRecord.id)}
                          startIcon={<CloudUploadIcon />}
                          sx={{
                            bgcolor: t.primary,
                            color: '#fff',
                            '&:hover': { bgcolor: t.primaryDark }
                          }}
                        >
                          Anchor on Sepolia & Mint Token
                        </LoadingButton>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </TabPanel>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: `1px solid ${t.border}` }}>
              <Button onClick={handleCloseModal} sx={{ color: t.textSecondary, textTransform: 'none', fontWeight: 600 }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog
        open={Boolean(previewDocUrl)}
        onClose={() => {
          setPreviewDocUrl(null);
          setPreviewDocType(null);
          setPreviewDocError(false);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: isLight ? '#ffffff' : '#181a1c',
            border: `1px solid ${t.border}`,
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, px: 3, pt: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon sx={{ color: t.primary, fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: t.textPrimary, fontSize: '1.05rem' }}>
              Credential Supporting Document Preview
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {previewDocUrl && (
              <Button
                component="a"
                href={previewDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                startIcon={<LinkIcon sx={{ fontSize: 15 }} />}
                sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, color: t.primary }}
              >
                Open in New Tab
              </Button>
            )}
            <IconButton size="small" onClick={() => { setPreviewDocUrl(null); setPreviewDocType(null); setPreviewDocError(false); }} sx={{ color: t.textMuted }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: isLight ? '#f8fafc' : '#141618', minHeight: 400 }}>
          {previewDocError ? (
            <Box sx={{ textAlign: 'center', py: 4, px: 2, maxWidth: 500 }}>
              <Box sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                border: `1px solid ${isLight ? '#fecaca' : 'rgba(239, 68, 68, 0.25)'}`
              }}>
                <DescriptionIcon sx={{ fontSize: 32, color: '#ef4444' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: t.textPrimary, mb: 1, fontSize: '1rem' }}>
                Inline Preview Unavailable
              </Typography>
              <Typography variant="body2" sx={{ color: t.textSecondary, mb: 3, lineHeight: 1.6, fontSize: '0.85rem' }}>
                The document could not be rendered inline directly (file may be in an external format, not physically stored on this server, or restricted by cross-origin security). You can still access the file directly.
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Button
                  component="a"
                  href={previewDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  size="small"
                  startIcon={<LinkIcon />}
                  sx={{ textTransform: 'none', fontWeight: 600, color: t.primary, borderColor: t.primaryBorder }}
                >
                  Open in New Tab
                </Button>
                <Button
                  component="a"
                  href={previewDocUrl}
                  download
                  variant="contained"
                  size="small"
                  startIcon={<DownloadIcon />}
                  sx={{ bgcolor: t.primary, textTransform: 'none', fontWeight: 700 }}
                >
                  Download File
                </Button>
              </Box>
            </Box>
          ) : previewDocType === 'pdf' ? (
            <Box
              component="iframe"
              src={previewDocUrl}
              title="Document Preview"
              onError={() => setPreviewDocError(true)}
              sx={{ width: '100%', height: '70vh', border: 'none', borderRadius: 1.5 }}
            />
          ) : (
            <Box
              component="img"
              src={previewDocUrl}
              alt="Document Preview"
              onError={() => setPreviewDocError(true)}
              sx={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 1.5, boxShadow: isLight ? '0 4px 12px rgba(0,0,0,0.08)' : '0 4px 16px rgba(0,0,0,0.4)' }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => { setPreviewDocUrl(null); setPreviewDocType(null); setPreviewDocError(false); }} sx={{ color: t.textMuted, textTransform: 'none' }}>
            Close Preview
          </Button>
          {previewDocUrl && (
            <Button
              component="a"
              href={previewDocUrl}
              download
              variant="contained"
              startIcon={<DownloadIcon />}
              sx={{ bgcolor: t.primary, textTransform: 'none', fontWeight: 700 }}
            >
              Download File
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for messages */}
      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={() => {
          setError(null);
          setSuccess(null);
        }}
      >
        <Alert
          severity={error ? 'error' : 'success'}
          onClose={() => {
            setError(null);
            setSuccess(null);
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

export default AdminProfessionalRecords;
