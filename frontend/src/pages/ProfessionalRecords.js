import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Verified as VerifiedIcon,
  Security as BlockchainIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { userAPI, documentAPI } from '../services/api.service';

const ProfessionalRecords = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [records, setRecords] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [recordForm, setRecordForm] = useState({
    title: '',
    institution: '',
    record_type: '',
    description: '',
    start_date: '',
    end_date: '',
    data_hash: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await userAPI.getProfessionalRecords();
      setRecords(response.data.records || []);
    } catch (err) {
      console.error('Error fetching professional records:', err);
      setError('Failed to load professional records. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Utility to create a random 256-bit hex string (0x + 64 hex chars)
  const generateRandomHash = () =>
    '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  const handleOpenDialog = () => {
    setRecordForm({
      title: '',
      institution: '',
      record_type: '',
      description: '',
      start_date: '',
      end_date: '',
      data_hash: generateRandomHash()
    });
    setSelectedFile(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleFormChange = (e) => {
    setRecordForm({
      ...recordForm,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    
    try {
      // Validate form
      if (!recordForm.title || !recordForm.institution || !recordForm.record_type || !recordForm.start_date) {
        throw new Error('Please fill in all required fields');
      }
      if (!selectedFile) {
        throw new Error('Please upload a supporting document (PDF or image).');
      }
      
      // Submit record and capture created record id
      // Map form fields to backend expected camelCase keys
      const payload = {
        title: recordForm.title,
        institution: recordForm.institution,
        recordType: recordForm.record_type,
        description: recordForm.description,
        startDate: recordForm.start_date,
        endDate: recordForm.end_date || null,
        dataHash: recordForm.data_hash,
      };
      const addRes = await userAPI.addProfessionalRecord(payload);
      const newRecordId = addRes.data?.record?.id;

      // If user selected a file, upload it and link to the new record
      if (selectedFile) {
        try {
          await documentAPI.uploadDocument(selectedFile, newRecordId);
        } catch (uploadErr) {
          console.error('File upload failed:', uploadErr);
          setError('Record added but file upload failed.');
        }
      }
      
      // Close dialog and refresh records
      handleCloseDialog();
      fetchRecords();
      
      setSuccess('Professional record added successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error adding professional record:', err);
      setError(err.message || 'Failed to add professional record. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };



  if (loading && records.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Professional Records
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add Record
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      {records.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Professional Records
          </Typography>
          <Typography variant="body1" paragraph>
            You haven't added any professional records yet.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Add Your First Record
          </Button>
        </Paper>
      ) : (
        <Paper sx={{ p: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Institution</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>End Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Verification Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Blockchain Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {record.title || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={record.record_type || 'N/A'} 
                        size="small" 
                        color={
                          record.record_type === 'EMPLOYMENT' ? 'primary' :
                          record.record_type === 'CERTIFICATION' ? 'secondary' :
                          record.record_type === 'EDUCATION' ? 'info' :
                          'default'
                        }
                        sx={{ minWidth: '100px' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {record.institution || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(record.start_date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {record.end_date ? formatDate(record.end_date) : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={record.verification_status || 'PENDING'} 
                        color={
                          record.verification_status === 'VERIFIED' ? 'success' :
                          record.verification_status === 'REJECTED' ? 'error' :
                          'warning'
                        } 
                        size="small" 
                        icon={record.verification_status === 'VERIFIED' ? <VerifiedIcon /> : null}
                        sx={{ minWidth: '90px' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Chip 
                          label={record.on_blockchain ? 'On Blockchain' : 'Not on Blockchain'} 
                          color={record.on_blockchain ? 'primary' : 'default'} 
                          size="small" 
                          icon={record.on_blockchain ? <BlockchainIcon /> : null}
                          sx={{ minWidth: '130px' }}
                        />
                        {record.blockchain_tx_hash && (
                          <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'text.secondary' }}>
                            TX: {record.blockchain_tx_hash.substring(0, 10)}...
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      
      {/* Add Record Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Professional Record</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Title"
                name="title"
                value={recordForm.title}
                onChange={handleFormChange}
                placeholder="e.g., Software Engineer, Project Manager"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                required
                label="Record Type"
                name="record_type"
                value={recordForm.record_type}
                onChange={handleFormChange}
              >
                <MenuItem value="EMPLOYMENT">Employment</MenuItem>
                <MenuItem value="EDUCATION">Education</MenuItem>
                <MenuItem value="CERTIFICATION">Certification</MenuItem>

              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Institution"
                name="institution"
                value={recordForm.institution}
                onChange={handleFormChange}
                placeholder="e.g., Company Name, University, Organization"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Description"
                name="description"
                value={recordForm.description}
                onChange={handleFormChange}
                placeholder="Describe your role, qualification, or achievement"
                multiline
                minRows={4}
                maxRows={6}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Start Date"
                name="start_date"
                type="date"
                value={recordForm.start_date}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date (if applicable)"
                name="end_date"
                type="date"
                value={recordForm.end_date}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Document Hash (for blockchain verification)
              </Typography>
              <TextField
                  fullWidth
                  name="data_hash"
                  value={recordForm.data_hash}
                  onChange={handleFormChange}
                  placeholder="Document hash will be generated automatically"
                  InputProps={{
                    readOnly: true,
                    sx: { fontFamily: 'monospace' }
                  }}
                />
              <Typography variant="caption" color="text.secondary">
                This hash will be used to verify your document on the blockchain.
              </Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Upload Supporting Document *
              </Typography>
              <TextField
                fullWidth
                required
                type="file"
                inputProps={{ accept: 'application/pdf,image/*' }}
                onChange={handleFileChange}
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<AddIcon />}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Add Record'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfessionalRecords;
