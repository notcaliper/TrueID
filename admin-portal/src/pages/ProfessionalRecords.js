import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Tooltip
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
  Info as InfoIcon
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import ApiService from '../services/ApiService';
import BlockchainService from '../services/BlockchainService';
import { debounce } from 'lodash';

const ProfessionalRecords = () => {
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

  // Fetch records with debouncing for search
  const debouncedFetch = useMemo(
    () => debounce(async (searchTerm, pageNum, limit) => {
    setLoading(true);
      try {
        const response = await ApiService.getAllProfessionalRecords(pageNum + 1, limit, searchTerm);
        if (response && response.records) {
          setRecords(response.records);
          setTotalRecords(response.total || response.records.length);
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

  // Fetch linked documents when a record is selected
  const fetchLinkedDocuments = useCallback(async (recordId) => {
    try {
      const response = await ApiService.getDocuments(recordId);
      setLinkedDocuments(response.documents || []);
    } catch (err) {
      setError(`Failed to fetch linked documents: ${err.message}`);
    }
  }, []);

  // Handle record selection and modal open
  const handleViewRecord = useCallback((record) => {
    setSelectedRecord(record);
    setOpenModal(true);
    fetchLinkedDocuments(record.id);
  }, [fetchLinkedDocuments]);

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
        // Refresh the record data to get updated blockchain status
        const updatedRecordResponse = await ApiService.getProfessionalRecord(recordId);
        setSelectedRecord(updatedRecordResponse.record || updatedRecordResponse);
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
  const handleAdminAction = async (recordId, status) => {
    setActionLoading(true);
    try {
      const currentUser = await ApiService.getCurrentUser();
      await ApiService.updateProfessionalRecordStatus(recordId, {
        status,
        notes: adminNotes,
        verifiedBy: currentUser.id
      });
      setSuccess('Record status updated successfully');
      // Refresh the records list
      debouncedFetch(searchQuery, page, rowsPerPage);
      // Close the modal if open
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

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Auto-refresh</InputLabel>
          <Select
            value={autoRefresh ? refreshInterval : ''}
            onChange={(e) => {
              setRefreshInterval(e.target.value);
              setAutoRefresh(!!e.target.value);
            }}
            label="Auto-refresh"
          >
            <MenuItem value="">Off</MenuItem>
            <MenuItem value={15000}>15 seconds</MenuItem>
            <MenuItem value={30000}>30 seconds</MenuItem>
            <MenuItem value={60000}>1 minute</MenuItem>
            <MenuItem value={300000}>5 minutes</MenuItem>
          </Select>
        </FormControl>

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
              <TableCell>Blockchain</TableCell>
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
                      {record.user?.governmentId}
                    </Typography>
                  </TableCell>
                  <TableCell>{record.title}</TableCell>
                  <TableCell>{record.organization}</TableCell>
                  <TableCell>
                    {new Date(record.startDate).toLocaleDateString()} -{' '}
                    {record.endDate ? new Date(record.endDate).toLocaleDateString() : 'Present'}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={record.verificationStatus} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={record.onBlockchain ? 'On Chain' : 'Not on Chain'}
                      color={record.onBlockchain ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleViewRecord(record)} color="primary">
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
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedRecord && (
          <>
            <DialogTitle>
              Professional Record Details
              <IconButton
                onClick={() => setOpenModal(false)}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                &times;
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
              {/* User Information */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        User Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Name
                          </Typography>
                          <Typography>{selectedRecord.user?.name}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Government ID
                          </Typography>
                          <Typography>{selectedRecord.user?.governmentId}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              
              {/* Record Information */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Record Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Title
                          </Typography>
                          <Typography>{selectedRecord.title}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Organization
                          </Typography>
                          <Typography>{selectedRecord.organization}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Description
                          </Typography>
                          <Typography>{selectedRecord.description}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Admin Actions Section - Add this before Blockchain Status */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6">
                          Verification Status
                        </Typography>
                        <Chip
                          label={selectedRecord.verificationStatus || 'PENDING'}
                          color={
                            selectedRecord.verificationStatus === 'VERIFIED' ? 'success' :
                            selectedRecord.verificationStatus === 'REJECTED' ? 'error' :
                            selectedRecord.verificationStatus === 'DEACTIVATED' ? 'warning' : 
                            'default'
                          }
                          icon={
                            selectedRecord.verificationStatus === 'VERIFIED' ? <CheckCircleIcon /> :
                            selectedRecord.verificationStatus === 'REJECTED' ? <ErrorIcon /> :
                            null
                          }
                        />
                      </Box>

                      <TextField
                        label="Admin Notes"
                        multiline
                        rows={3}
                        fullWidth
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes about your verification decision..."
                        sx={{ mb: 2 }}
                      />

                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <LoadingButton
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleAdminAction(selectedRecord.id, 'VERIFIED')}
                          loading={actionLoading}
                          disabled={selectedRecord.verificationStatus === 'VERIFIED'}
                        >
                          Verify
                        </LoadingButton>

                        <LoadingButton
                          variant="contained"
                          color="error"
                          startIcon={<ErrorIcon />}
                          onClick={() => handleAdminAction(selectedRecord.id, 'REJECTED')}
                          loading={actionLoading}
                          disabled={selectedRecord.verificationStatus === 'REJECTED'}
                        >
                          Reject
                        </LoadingButton>

                        <LoadingButton
                          variant="contained"
                          color="warning"
                          onClick={() => handleAdminAction(selectedRecord.id, 'DEACTIVATED')}
                          loading={actionLoading}
                          disabled={selectedRecord.verificationStatus === 'DEACTIVATED'}
                        >
                          Deactivate
                        </LoadingButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              
              {/* Blockchain Status */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Blockchain Status
                      </Typography>
                  {selectedRecord.onBlockchain ? (
                        <>
                          <Chip
                            label="Verified on Blockchain"
                            color="success"
                            icon={<CheckCircleIcon />}
                          />
                      {selectedRecord.blockchainTxHash && (
                            <Box mt={1}>
                              <Link
                            href={`https://testnet.snowtrace.io/tx/${selectedRecord.blockchainTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                              >
                                View Transaction
                              </Link>
                            </Box>
                          )}
                              </>
                            ) : (
                        <LoadingButton
                          loading={blockchainLoading}
                          onClick={() => handleBlockchainVerify(selectedRecord.id)}
                          variant="contained"
                          disabled={selectedRecord.verificationStatus !== 'VERIFIED'}
                        >
                          Verify on Blockchain
                        </LoadingButton>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Document Section */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6">
                          Uploaded Documents
                        </Typography>
                        {linkedDocuments.length > 0 && (
                          <Chip
                            label={`${linkedDocuments.length} document${linkedDocuments.length !== 1 ? 's' : ''}`}
                            color="primary"
                            size="small"
                          />
                        )}
                      </Box>

                      {linkedDocuments.length === 0 ? (
                        <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                          <Typography>No documents uploaded yet</Typography>
                        </Box>
                      ) : (
                        <Box sx={{ mt: 2 }}>
                          {linkedDocuments.map((doc) => (
                            <Box 
                              key={doc.id} 
                              sx={{ 
                                mb: 2, 
                                p: 2, 
                                border: 1, 
                                borderColor: 'divider', 
                                borderRadius: 1,
                                '&:hover': {
                                  bgcolor: 'action.hover'
                                }
                              }}
                            >
                              <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm={4}>
                                  <Typography variant="subtitle2" sx={{ wordBreak: 'break-word' }}>
                                    {doc.fileName}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary" display="block">
                                    Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                                  </Typography>
                                  {doc.verifiedBy && (
                                    <Typography variant="caption" color="textSecondary" display="block">
                                      Verified by: {doc.verifiedBy}
                                    </Typography>
                                  )}
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <StatusChip status={doc.verificationStatus} />
                                    {doc.verificationNotes && (
                                      <Tooltip title={doc.verificationNotes}>
                                        <IconButton size="small">
                                          <InfoIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                    <Tooltip title="Preview Document">
                                      <IconButton
                                        size="small"
                                        onClick={() => window.open(doc.fileUrl, '_blank')}
                                      >
                                        <PreviewIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Download Document">
                                      <IconButton
                                        size="small"
                                        href={doc.fileUrl}
                                        download
                                      >
                                        <DownloadIcon />
                                      </IconButton>
                                    </Tooltip>
                                    {doc.verificationStatus === 'PENDING' && (
                                      <LoadingButton
                                        size="small"
                                        variant="outlined"
                                        onClick={() => handleVerifyDocument(doc.id)}
                                        loading={actionLoading}
                                      >
                                        Verify
                                      </LoadingButton>
                                    )}
                                  </Box>
                                </Grid>
                              </Grid>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setOpenModal(false);
                setAdminNotes('');
              }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
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
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfessionalRecords;
