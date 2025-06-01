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
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Verified as VerifiedIcon,
  Security as BlockchainIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api.service';

const ProfessionalRecords = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [records, setRecords] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [recordForm, setRecordForm] = useState({
    title: '',
    organization: '',
    description: '',
    issuedDate: '',
    expiryDate: '',
    documentHash: ''
  });
  const [submitting, setSubmitting] = useState(false);

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

  const handleOpenDialog = () => {
    setRecordForm({
      title: '',
      organization: '',
      description: '',
      issuedDate: '',
      expiryDate: '',
      documentHash: ''
    });
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

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    
    try {
      // Validate form
      if (!recordForm.title || !recordForm.organization || !recordForm.issuedDate) {
        throw new Error('Please fill in all required fields');
      }
      
      // Submit record
      await userAPI.addProfessionalRecord(recordForm);
      
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

  // Simulate document hash generation
  const generateDocumentHash = () => {
    // In a real app, this would hash the actual document
    const randomHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    setRecordForm({
      ...recordForm,
      documentHash: randomHash
    });
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
                  <TableCell>Title</TableCell>
                  <TableCell>Organization</TableCell>
                  <TableCell>Issued Date</TableCell>
                  <TableCell>Expiry Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Blockchain</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Typography variant="body1">
                        {record.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {record.description}
                      </Typography>
                    </TableCell>
                    <TableCell>{record.organization}</TableCell>
                    <TableCell>{formatDate(record.issued_date)}</TableCell>
                    <TableCell>{formatDate(record.expiry_date)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={record.is_verified ? "Verified" : "Pending"} 
                        color={record.is_verified ? "success" : "warning"} 
                        size="small" 
                        icon={record.is_verified ? <VerifiedIcon /> : null}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={record.on_blockchain ? "On Blockchain" : "Not on Blockchain"} 
                        color={record.on_blockchain ? "primary" : "default"} 
                        size="small" 
                        icon={record.on_blockchain ? <BlockchainIcon /> : null}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      
      {/* Add Record Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
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
                placeholder="e.g., Bachelor's Degree, Professional Certification"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Organization"
                name="organization"
                value={recordForm.organization}
                onChange={handleFormChange}
                placeholder="e.g., University, Company, Institution"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                name="description"
                value={recordForm.description}
                onChange={handleFormChange}
                placeholder="Describe your qualification or achievement"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Issued Date"
                name="issuedDate"
                type="date"
                value={recordForm.issuedDate}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expiry Date (if applicable)"
                name="expiryDate"
                type="date"
                value={recordForm.expiryDate}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Document Hash (for blockchain verification)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                  fullWidth
                  name="documentHash"
                  value={recordForm.documentHash}
                  onChange={handleFormChange}
                  placeholder="Document hash will be generated automatically"
                  InputProps={{
                    readOnly: true,
                    sx: { fontFamily: 'monospace' }
                  }}
                />
                <Button 
                  variant="outlined" 
                  sx={{ ml: 1, whiteSpace: 'nowrap' }}
                  onClick={generateDocumentHash}
                >
                  Generate Hash
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary">
                This hash will be used to verify your document on the blockchain.
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
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
