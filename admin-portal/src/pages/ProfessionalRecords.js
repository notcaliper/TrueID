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
  Paper,
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
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Divider,
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
  Preview as PreviewIcon,
  Info as InfoIcon,
  Fingerprint as FingerprintIcon,
  Link as LinkIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import ApiService from '../services/ApiService';
import { debounce } from 'lodash';

const ProfessionalRecords = () => {
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
  const [totalPages, setTotalPages] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(60000);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [linkedDocuments, setLinkedDocuments] = useState([]);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [previewDocUrl, setPreviewDocUrl] = useState(null);
  const [previewDocType, setPreviewDocType] = useState(null);
  const [hashDetails, setHashDetails] = useState(null);

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
          <Box sx={{ p: 3 }}>
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
      // Convert the data to a string
      const jsonString = JSON.stringify(sortedData);
      // Convert string to Uint8Array
      const encoder = new TextEncoder();
      const data = encoder.encode(jsonString);
      
      // Calculate SHA-256 hash using Web Crypto API
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      
      // Convert buffer to hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      setHashDetails({
        hash: hashHex,
        sourceData: sortedData
      });

      return hashHex;
    } catch (error) {
      console.error('Error calculating hash:', error);
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
          const withUsers = await Promise.all(response.records.map(async (rec) => {
            if (!rec.user && (rec.userId || rec.user_id)) {
              try {
                const user = await ApiService.getUserById(rec.userId || rec.user_id);
                return { ...rec, user };
              } catch (err) {
                console.error('Failed to fetch user:', err);
                return rec;
              }
            }
            return rec;
          }));
          setRecords(withUsers);
          setTotalRecords(response.total || withUsers.length);
          setTotalPages(response.totalPages || Math.ceil(response.records.length / rowsPerPage));
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
  
  // Auto-refresh effect
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        debouncedFetch(searchQuery, page, rowsPerPage);
      }, refreshInterval);
    }
    return () => interval && clearInterval(interval);
  }, [autoRefresh, refreshInterval, searchQuery, page, rowsPerPage, debouncedFetch]);

  // Preview document handler
  const handlePreviewDocument = async (doc) => {
    try {
      const response = await ApiService.getDocument(doc.id);
      if (response.document) {
        const { mimeType, fileUrl, isPreviewable } = response.document;
        
        if (!isPreviewable) {
          setError('This document type cannot be previewed. You can download it instead.');
          return;
        }
        
        setPreviewDocType(mimeType);
        setPreviewDocUrl(`${process.env.REACT_APP_API_URL}${fileUrl}`);
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      setError('Failed to load document preview');
    }
  };

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
    } catch (error) {
      console.error('Error viewing record:', error);
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

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size exceeds 10MB limit');
      return;
    }
    
    const formData = new FormData();
    formData.append('document', file);
    formData.append('professionalRecordId', selectedRecord.id);

    try {
      setUploadProgress(0);
      const response = await ApiService.uploadDocument(formData, (progress) => {
        setUploadProgress(progress);
      });
      setSuccess('Document uploaded successfully');
      fetchLinkedDocuments(selectedRecord.id);
      setUploadFile(null);
      setUploadProgress(0);
    } catch (err) {
      setError(`Failed to upload document: ${err.message}`);
    }
  };

  // Handle document verification
  const handleVerifyDocument = async (documentId) => {
    try {
      await ApiService.verifyDocument(documentId, {
        status: verificationStatus,
        notes: verificationNotes
      });
      setSuccess('Document verified successfully');
      fetchLinkedDocuments(selectedRecord.id);
      setVerificationStatus('');
      setVerificationNotes('');
    } catch (err) {
      setError(`Failed to verify document: ${err.message}`);
    }
  };

  // Handle blockchain verification
  const handleBlockchainVerify = async (recordId) => {
    setBlockchainLoading(true);
    try {
      const result = await ApiService.verifyOnBlockchain(recordId);
      if (result.success) {
        setSuccess('Record verified on blockchain successfully');
        const updatedRecord = await ApiService.getProfessionalRecord(recordId);
        setSelectedRecord(updatedRecord);
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
      await ApiService.updateProfessionalRecordStatus(recordId, {
        status,
        notes: adminNotes
      });
      setSuccess('Record status updated successfully');
      debouncedFetch(searchQuery, page, rowsPerPage);
      setOpenModal(false);
      setAdminNotes('');
    } catch (err) {
      setError(`Failed to update record status: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Render status chip
  const StatusChip = ({ status }) => {
    const getColor = () => {
      switch (status?.toUpperCase()) {
        case 'VERIFIED':
          return 'success';
        case 'REJECTED':
          return 'error';
        case 'PENDING':
          return 'warning';
        default:
          return 'default';
      }
    };

    return (
      <Chip
        label={status || 'PENDING'}
        color={getColor()}
        icon={status === 'VERIFIED' ? <CheckCircleIcon /> : status === 'REJECTED' ? <ErrorIcon /> : null}
      />
    );
  };

  // Document Preview Modal
  const DocumentPreviewModal = ({ open, onClose }) => {
    if (!open) return null;

    const handleDownload = () => {
      if (previewDocUrl) {
        window.open(previewDocUrl, '_blank');
      }
    };

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          style: {
            height: '80vh',
            maxHeight: '80vh',
          },
        }}
      >
        <DialogTitle>
          Document Preview
          <Box sx={{ position: 'absolute', right: 8, top: 8, display: 'flex', gap: 1 }}>
            <IconButton
              aria-label="download"
              onClick={handleDownload}
              sx={{ color: 'primary.main' }}
            >
              <DownloadIcon />
            </IconButton>
            <IconButton
              aria-label="close"
              onClick={onClose}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {previewDocType?.startsWith('image/') ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 'calc(80vh - 100px)',
              }}
            >
              <img
                src={previewDocUrl}
                alt="Document Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
                onError={() => setError('Failed to load image')}
              />
            </Box>
          ) : previewDocType === 'application/pdf' ? (
            <Box
              sx={{
                height: 'calc(80vh - 100px)',
                '& iframe': {
                  border: 'none',
                  width: '100%',
                  height: '100%',
                }
              }}
            >
              <iframe
                src={previewDocUrl}
                title="PDF Preview"
                onError={() => setError('Failed to load PDF')}
              />
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 'calc(80vh - 100px)',
                gap: 2,
              }}
            >
              <Typography variant="body1" color="text.secondary" align="center">
                Preview not available for this file type.
              </Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
              >
                Download File
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Professional Records Management
      </Typography>
      
      {/* Search and Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1 }} />
          }}
          sx={{ width: 300 }}
        />
        
        <Button
          startIcon={<RefreshIcon />}
          onClick={() => debouncedFetch(searchQuery, page, rowsPerPage)}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>
      
      {/* Records Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Organization</TableCell>
              <TableCell>Date Range</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Hash Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{record.user?.name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {record.user?.government_id}
                    </Typography>
                  </TableCell>
                  <TableCell>{record.title}</TableCell>
                  <TableCell>{record.organization || record.institution}</TableCell>
                  <TableCell>
                    {formatDate(record.start_date || record.startDate)} -{' '}
                    {record.end_date || record.endDate ? formatDate(record.end_date || record.endDate) : 'Present'}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={record.verification_status || record.verificationStatus} />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={record.data_hash || 'No hash available'}>
                      <Chip
                        icon={<FingerprintIcon />}
                        label={record.data_hash ? 'Hashed' : 'Not Hashed'}
                        color={record.data_hash ? 'success' : 'default'}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      onClick={() => handleViewRecord(record)} 
                      color="primary"
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
        />
      </TableContainer>
      
      {/* Record Detail Modal */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        {selectedRecord && (
          <>
            <DialogTitle>
              Professional Record Details
              <IconButton
                onClick={handleCloseModal}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                &times;
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab label="Details" />
                  <Tab label="Hash Information" />
                  <Tab label="Documents" />
                  <Tab label="Verification" />
                </Tabs>
              </Box>
              
              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">User Information</Typography>
                        <Typography>Name: {selectedRecord.user?.name}</Typography>
                        <Typography>Government ID: {selectedRecord.user?.government_id}</Typography>
                        <Typography>Email: {selectedRecord.user?.email}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Record Details</Typography>
                        <Typography>Title: {selectedRecord.title}</Typography>
                        <Typography>Organization: {selectedRecord.organization || selectedRecord.institution}</Typography>
                        <Typography>Description: {selectedRecord.description}</Typography>
                        <Typography>Period: {formatDate(selectedRecord.start_date)} - {selectedRecord.end_date ? formatDate(selectedRecord.end_date) : 'Present'}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Hash Information</Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1">Current Data Hash</Typography>
                      <Typography
                        sx={{
                          bgcolor: 'grey.100',
                          p: 2,
                          borderRadius: 1,
                          fontFamily: 'monospace',
                          wordBreak: 'break-all'
                        }}
                      >
                        {selectedRecord.data_hash || 'Not available'}
                      </Typography>
                    </Box>

                    {hashDetails && (
                      <>
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="subtitle1">Calculated Hash</Typography>
                          <Typography
                            sx={{
                              bgcolor: 'grey.100',
                              p: 2,
                              borderRadius: 1,
                              fontFamily: 'monospace',
                              wordBreak: 'break-all'
                            }}
                          >
                            {hashDetails.hash}
                          </Typography>
                        </Box>

                        <Box sx={{ mt: 3 }}>
                          <Typography variant="subtitle1">Source Data for Hash</Typography>
                          <pre
                            style={{
                              backgroundColor: '#f5f5f5',
                              padding: '16px',
                              borderRadius: '4px',
                              overflow: 'auto'
                            }}
                          >
                            {JSON.stringify(hashDetails.sourceData, null, 2)}
                          </pre>
                        </Box>
                      </>
                    )}

                    {selectedRecord.blockchain_tx_hash && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1">Blockchain Transaction</Typography>
                        <Link
                          href={`https://testnet.snowtrace.io/tx/${selectedRecord.blockchain_tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <LinkIcon />
                          View on Explorer
                        </Link>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Typography variant="h6" gutterBottom>Linked Documents</Typography>
                {linkedDocuments.length > 0 ? (
                  <List>
                    {linkedDocuments.map((doc) => (
                      <ListItem key={doc.id}>
                        <ListItemText
                          primary={doc.original_name}
                          secondary={
                            <>
                              <Typography variant="body2">
                                Status: <StatusChip status={doc.verification_status} />
                              </Typography>
                              <Typography variant="body2">
                                Hash: {doc.file_hash || 'Not available'}
                              </Typography>
                              {doc.blockchain_tx_hash && (
                                <Typography variant="body2">
                                  Blockchain TX: {doc.blockchain_tx_hash}
                                </Typography>
                              )}
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Download">
                            <IconButton edge="end" href={doc.file_url} download>
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography>No documents found</Typography>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={3}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">Verification Status</Typography>
                        <Box sx={{ mt: 2 }}>
                          <StatusChip status={selectedRecord.verification_status} />
                        </Box>
                        
                        {selectedRecord.verification_status !== 'VERIFIED' && (
                          <Box sx={{ mt: 3 }}>
                            <TextField
                              fullWidth
                              multiline
                              rows={4}
                              label="Admin Notes"
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              variant="outlined"
                            />
                            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                              <LoadingButton
                                variant="contained"
                                color="success"
                                loading={actionLoading}
                                onClick={() => handleAdminVerify(selectedRecord.id, 'VERIFIED')}
                                startIcon={<CheckCircleIcon />}
                              >
                                Verify
                              </LoadingButton>
                              <LoadingButton
                                variant="contained"
                                color="error"
                                loading={actionLoading}
                                onClick={() => handleAdminVerify(selectedRecord.id, 'REJECTED')}
                                startIcon={<ErrorIcon />}
                              >
                                Reject
                              </LoadingButton>
                            </Box>
                          </Box>
                        )}

                        {selectedRecord.verification_status === 'VERIFIED' && !selectedRecord.blockchain_tx_hash && (
                          <Box sx={{ mt: 3 }}>
                            <LoadingButton
                              variant="contained"
                              color="primary"
                              loading={blockchainLoading}
                              onClick={() => handleBlockchainVerify(selectedRecord.id)}
                              startIcon={<CloudUploadIcon />}
                            >
                              Verify on Blockchain
                            </LoadingButton>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </TabPanel>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseModal}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add the DocumentPreviewModal component */}
      <DocumentPreviewModal
        open={Boolean(previewDocUrl)}
        onClose={() => {
          setPreviewDocUrl(null);
          setPreviewDocType(null);
        }}
      />

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
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfessionalRecords;
