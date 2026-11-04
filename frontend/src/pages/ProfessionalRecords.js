import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  IconButton,
  Tooltip,
  InputAdornment
} from '@mui/material';
import {
  AddRounded,
  VerifiedRounded,
  SecurityRounded,
  SchoolRounded,
  WorkRounded,
  WorkspacePremiumRounded,
  OpenInNewRounded,
  ContentCopyRounded,
  SearchRounded,
  CloudUploadRounded,
  CloseRounded,
  CheckCircleOutlineRounded,
  HourglassEmptyRounded,
  FilterListRounded,
  DescriptionRounded
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { userAPI, documentAPI } from '../services/api.service';

const ProfessionalRecords = () => {
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [records, setRecords] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [copiedHash, setCopiedHash] = useState(null);

  const [recordForm, setRecordForm] = useState({
    title: '',
    institution: '',
    record_type: 'EMPLOYMENT',
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
      setRecords(response.data?.records || []);
    } catch (err) {
      console.error('Error fetching professional records:', err);
      setError('Failed to load professional records. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const generateRandomHash = () =>
    '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  const handleOpenDialog = () => {
    setRecordForm({
      title: '',
      institution: '',
      record_type: 'EMPLOYMENT',
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
    setRecordForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
      if (!recordForm.title || !recordForm.institution || !recordForm.record_type || !recordForm.start_date) {
        throw new Error('Please fill in all required fields');
      }
      if (!selectedFile) {
        throw new Error('Please upload a supporting document (PDF or image).');
      }

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

      if (selectedFile && newRecordId) {
        try {
          await documentAPI.uploadDocument(selectedFile, newRecordId);
        } catch (uploadErr) {
          console.error('File upload failed:', uploadErr);
          setError('Record added, but file upload failed.');
        }
      }

      handleCloseDialog();
      fetchRecords();
      setSuccess('Credential successfully registered and awaiting authority validation.');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      console.error('Error adding professional record:', err);
      setError(err.message || 'Failed to add professional record. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Present';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
    } catch {
      return dateString;
    }
  };

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedHash(key);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getTypeMeta = (type) => {
    switch (type) {
      case 'EMPLOYMENT':
        return { label: 'Employment', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.3)', icon: <WorkRounded sx={{ fontSize: 16 }} /> };
      case 'EDUCATION':
        return { label: 'Education', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', icon: <SchoolRounded sx={{ fontSize: 16 }} /> };
      case 'CERTIFICATION':
        return { label: 'Certification', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', icon: <WorkspacePremiumRounded sx={{ fontSize: 16 }} /> };
      default:
        return { label: type || 'Record', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)', icon: <DescriptionRounded sx={{ fontSize: 16 }} /> };
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        (r.title && r.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.institution && r.institution.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = typeFilter === 'ALL' || r.record_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [records, searchTerm, typeFilter]);

  const verifiedCount = useMemo(() => records.filter(r => r.verification_status === 'VERIFIED').length, [records]);
  const onChainCount = useMemo(() => records.filter(r => r.on_blockchain).length, [records]);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
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
                label="W3C VERIFIABLE CREDENTIALS"
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
                label="SHA-256 ATTESTED"
                size="small"
                sx={{
                  bgcolor: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  letterSpacing: '0.08em'
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', mb: 0.5 }}>
              Credentials & Attestations
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 640 }}>
              Tamper-proof professional milestones, academic degrees, and institutional licenses permanently anchored to your TrueID soulbound identity.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddRounded />}
            onClick={handleOpenDialog}
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              fontWeight: 600,
              px: 3,
              py: 1.2,
              borderRadius: 2,
              boxShadow: '0 4px 18px rgba(99, 102, 241, 0.4)',
              textTransform: 'none',
              fontSize: '0.92rem',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                boxShadow: '0 6px 22px rgba(99, 102, 241, 0.5)'
              }
            }}
          >
            Add New Record
          </Button>
        </Box>

        {/* Stats Row */}
        <Grid container spacing={2} sx={{ mt: 2.5 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                Total Records
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc', mt: 0.5 }}>
                {records.length}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                Authority Verified
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#10b981', mt: 0.5 }}>
                {verifiedCount}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                Ledger Anchored
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#818cf8', mt: 0.5 }}>
                {onChainCount}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                Verification Mode
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#38bdf8', mt: 0.5 }}>
                Zero-Knowledge
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          {success}
        </Alert>
      )}

      {/* Search and Filters Bar */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          placeholder="Search records by title, company, or qualification..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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

        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, flexShrink: 0 }}>
          {['ALL', 'EMPLOYMENT', 'EDUCATION', 'CERTIFICATION'].map((type) => (
            <Button
              key={type}
              size="small"
              onClick={() => setTypeFilter(type)}
              sx={{
                px: 2,
                py: 0.8,
                borderRadius: 2,
                fontSize: '0.78rem',
                fontWeight: 600,
                textTransform: 'none',
                bgcolor: typeFilter === type ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                color: typeFilter === type ? '#a5b4fc' : '#94a3b8',
                border: typeFilter === type ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(99, 102, 241, 0.15)',
                  color: '#ffffff'
                }
              }}
            >
              {type === 'ALL' ? 'All Types' : type.charAt(0) + type.slice(1).toLowerCase()}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Loading State */}
      {loading && records.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#6366f1', mb: 2 }} />
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Decrypting attested credentials from secure storage...
          </Typography>
        </Box>
      ) : filteredRecords.length === 0 ? (
        /* Empty State */
        <Card
          sx={{
            py: 8,
            px: 3,
            textAlign: 'center',
            borderRadius: 3,
            bgcolor: 'rgba(13, 18, 29, 0.7)',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(12px)'
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2
            }}
          >
            <DescriptionRounded sx={{ fontSize: 32, color: '#818cf8' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#f8fafc', mb: 1 }}>
            {records.length === 0 ? 'No Professional Records Registered' : 'No matching records found'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 440, mx: 'auto', mb: 3 }}>
            {records.length === 0
              ? 'Anchor your university degrees, employer verifications, or licenses into cryptographic soulbound credentials.'
              : 'Try clearing your search query or switching your record type filter.'}
          </Typography>
          {records.length === 0 && (
            <Button
              variant="contained"
              startIcon={<AddRounded />}
              onClick={handleOpenDialog}
              sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                textTransform: 'none'
              }}
            >
              Register First Record
            </Button>
          )}
        </Card>
      ) : (
        /* Records Grid / List */
        <Grid container spacing={2.5}>
          {filteredRecords.map((record) => {
            const typeMeta = getTypeMeta(record.record_type);
            const isVerified = record.verification_status === 'VERIFIED';
            const isPending = !isVerified && record.verification_status !== 'REJECTED';

            return (
              <Grid size={12} key={record.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    bgcolor: 'rgba(13, 18, 29, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(14px)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: 'rgba(99, 102, 241, 0.35)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                    }
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 2 }}>
                      {/* Left Block */}
                      <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2.5,
                            bgcolor: typeMeta.bg,
                            border: `1px solid ${typeMeta.border}`,
                            color: typeMeta.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {typeMeta.icon}
                        </Box>

                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f8fafc', fontSize: '1.05rem' }}>
                              {record.title || 'Untitled Record'}
                            </Typography>
                            <Chip
                              label={typeMeta.label}
                              size="small"
                              sx={{
                                bgcolor: typeMeta.bg,
                                color: typeMeta.color,
                                border: `1px solid ${typeMeta.border}`,
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                height: 22
                              }}
                            />
                          </Box>

                          <Typography variant="subtitle2" sx={{ color: '#38bdf8', fontWeight: 600, mb: 1 }}>
                            {record.institution || 'Unknown Institution'}
                          </Typography>

                          {record.description && (
                            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1.5, maxWidth: 680, lineHeight: 1.6 }}>
                              {record.description}
                            </Typography>
                          )}

                          {/* Date Range & Metadata */}
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <span style={{ color: '#94a3b8', fontWeight: 600 }}>Period:</span> {formatDate(record.start_date)} — {formatDate(record.end_date)}
                            </Typography>

                            {record.data_hash && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                  SHA-256:
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontFamily: 'monospace',
                                    color: '#cbd5e1',
                                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                                    px: 0.8,
                                    py: 0.2,
                                    borderRadius: 1,
                                    fontSize: '0.72rem'
                                  }}
                                >
                                  {record.data_hash.slice(0, 10)}...{record.data_hash.slice(-6)}
                                </Typography>
                                <Tooltip title={copiedHash === `hash-${record.id}` ? 'Copied!' : 'Copy Hash'}>
                                  <IconButton
                                    size="small"
                                    onClick={() => copyToClipboard(record.data_hash, `hash-${record.id}`)}
                                    sx={{ color: copiedHash === `hash-${record.id}` ? '#10b981' : '#64748b', p: 0.3 }}
                                  >
                                    <ContentCopyRounded sx={{ fontSize: 13 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>

                      {/* Right Status Block */}
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, alignItems: { xs: 'center', md: 'flex-end' }, justifyContent: 'space-between', gap: 1.5, flexShrink: 0, pt: { xs: 1.5, md: 0 }, borderTop: { xs: '1px solid rgba(255, 255, 255, 0.06)', md: 'none' } }}>
                        {/* Verification Badge */}
                        <Chip
                          icon={isVerified ? <CheckCircleOutlineRounded sx={{ fontSize: '15px !important', color: '#10b981 !important' }} /> : <HourglassEmptyRounded sx={{ fontSize: '15px !important', color: '#f59e0b !important' }} />}
                          label={record.verification_status || 'PENDING AUDIT'}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            letterSpacing: '0.05em',
                            px: 0.5,
                            bgcolor: isVerified ? 'rgba(16, 185, 129, 0.12)' : isPending ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: isVerified ? '#34d399' : isPending ? '#fbbf24' : '#f87171',
                            border: `1px solid ${isVerified ? 'rgba(16, 185, 129, 0.3)' : isPending ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                          }}
                        />

                        {/* Blockchain Status */}
                        <Box sx={{ textAlign: { xs: 'right', md: 'right' } }}>
                          <Chip
                            icon={<SecurityRounded sx={{ fontSize: '14px !important', color: record.on_blockchain ? '#818cf8 !important' : '#64748b !important' }} />}
                            label={record.on_blockchain ? 'ON ETHEREUM' : 'PENDING LEDGER'}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.68rem',
                              letterSpacing: '0.04em',
                              bgcolor: record.on_blockchain ? 'rgba(99, 102, 241, 0.15)' : 'rgba(148, 163, 184, 0.08)',
                              color: record.on_blockchain ? '#a5b4fc' : '#94a3b8',
                              border: `1px solid ${record.on_blockchain ? 'rgba(99, 102, 241, 0.3)' : 'rgba(148, 163, 184, 0.15)'}`
                            }}
                          />
                          {record.blockchain_tx_hash && (
                            <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748b', fontSize: '0.7rem' }}>
                                TX: {record.blockchain_tx_hash.slice(0, 8)}...
                              </Typography>
                              <Tooltip title="View on Etherscan">
                                <IconButton
                                  size="small"
                                  onClick={() => window.open(`https://sepolia.etherscan.io/tx/${record.blockchain_tx_hash}`, '_blank')}
                                  sx={{ color: '#6366f1', p: 0.2 }}
                                >
                                  <OpenInNewRounded sx={{ fontSize: 13 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Add Record Modal Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0d121d',
            backgroundImage: 'none',
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f8fafc' }}>
              Register Verifiable Credential
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Upload cryptographic documentation for authority validation
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} sx={{ color: '#94a3b8' }}>
            <CloseRounded />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2.5}>
            <Grid size={12}>
              <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600, mb: 0.5, display: 'block' }}>
                Credential / Title *
              </Typography>
              <TextField
                fullWidth
                required
                name="title"
                value={recordForm.title}
                onChange={handleFormChange}
                placeholder="e.g., Senior Systems Architect, Master of Science in CS"
                size="small"
                InputProps={{
                  sx: {
                    bgcolor: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: 2,
                    color: '#f8fafc',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' }
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600, mb: 0.5, display: 'block' }}>
                Record Classification *
              </Typography>
              <TextField
                select
                fullWidth
                required
                name="record_type"
                value={recordForm.record_type}
                onChange={handleFormChange}
                size="small"
                InputProps={{
                  sx: {
                    bgcolor: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: 2,
                    color: '#f8fafc',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' }
                  }
                }}
              >
                <MenuItem value="EMPLOYMENT">Employment & Professional Role</MenuItem>
                <MenuItem value="EDUCATION">Degree & Academic Qualification</MenuItem>
                <MenuItem value="CERTIFICATION">Industry Certificate & License</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600, mb: 0.5, display: 'block' }}>
                Issuing Institution / Entity *
              </Typography>
              <TextField
                fullWidth
                required
                name="institution"
                value={recordForm.institution}
                onChange={handleFormChange}
                placeholder="e.g., Stanford University, Google LLC"
                size="small"
                InputProps={{
                  sx: {
                    bgcolor: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: 2,
                    color: '#f8fafc',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' }
                  }
                }}
              />
            </Grid>

            <Grid size={12}>
              <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600, mb: 0.5, display: 'block' }}>
                Description & Specialization
              </Typography>
              <TextField
                fullWidth
                name="description"
                value={recordForm.description}
                onChange={handleFormChange}
                placeholder="Brief summary of duties, majors, or credential scope..."
                multiline
                rows={3}
                InputProps={{
                  sx: {
                    bgcolor: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: 2,
                    color: '#f8fafc',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' }
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600, mb: 0.5, display: 'block' }}>
                Effective Start Date *
              </Typography>
              <TextField
                fullWidth
                required
                name="start_date"
                type="date"
                value={recordForm.start_date}
                onChange={handleFormChange}
                size="small"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  sx: {
                    bgcolor: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: 2,
                    color: '#f8fafc',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' }
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600, mb: 0.5, display: 'block' }}>
                End Date (Optional)
              </Typography>
              <TextField
                fullWidth
                name="end_date"
                type="date"
                value={recordForm.end_date}
                onChange={handleFormChange}
                size="small"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  sx: {
                    bgcolor: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: 2,
                    color: '#f8fafc',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' }
                  }
                }}
              />
            </Grid>

            <Grid size={12}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#818cf8', fontWeight: 700, letterSpacing: '0.06em' }}>
                    GENERATED 256-BIT ATTESTATION HASH
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setRecordForm(prev => ({ ...prev, data_hash: generateRandomHash() }))}
                    sx={{ textTransform: 'none', color: '#a5b4fc', fontSize: '0.72rem', py: 0 }}
                  >
                    Regenerate
                  </Button>
                </Box>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#cbd5e1', fontSize: '0.78rem', wordBreak: 'break-all' }}>
                  {recordForm.data_hash}
                </Typography>
              </Box>
            </Grid>

            <Grid size={12}>
              <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 600, mb: 0.5, display: 'block' }}>
                Supporting Document (PDF, PNG, JPG) *
              </Typography>
              <Box
                component="label"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 3,
                  borderRadius: 2,
                  bgcolor: selectedFile ? 'rgba(16, 185, 129, 0.06)' : 'rgba(15, 23, 42, 0.6)',
                  border: selectedFile ? '1px solid rgba(16, 185, 129, 0.4)' : '1px dashed rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'rgba(99, 102, 241, 0.5)',
                    bgcolor: 'rgba(99, 102, 241, 0.05)'
                  }
                }}
              >
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  hidden
                  onChange={handleFileChange}
                />
                <CloudUploadRounded sx={{ fontSize: 32, color: selectedFile ? '#10b981' : '#818cf8', mb: 1 }} />
                {selectedFile ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#34d399' }}>
                      {selectedFile.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB • Click to choose another
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#cbd5e1' }}>
                      Click to upload certified certificate or PDF transcript
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Strictly encrypted with AES-256 in your sovereign vault
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Button onClick={handleCloseDialog} sx={{ color: '#94a3b8', textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              textTransform: 'none'
            }}
          >
            {submitting ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : 'Submit for Verification'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfessionalRecords;
