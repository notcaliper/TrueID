import React, { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Add as AddIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const ProfessionalRecords = () => {
  const [records, setRecords] = useState([
    {
      id: 1,
      type: 'employment',
      title: 'Software Engineer',
      organization: 'Tech Corp',
      startDate: '2022-01-01',
      endDate: null,
      verified: true
    },
    {
      id: 2,
      type: 'education',
      title: 'Computer Science Degree',
      organization: 'University of Technology',
      startDate: '2018-09-01',
      endDate: '2022-05-01',
      verified: true
    }
  ]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const handleAddRecord = () => {
    setEditingRecord(null);
    setOpenDialog(true);
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setOpenDialog(true);
  };

  const handleDeleteRecord = (id) => {
    setRecords(records.filter(record => record.id !== id));
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRecord(null);
  };

  const getRecordIcon = (type) => {
    return type === 'employment' ? <WorkIcon /> : <SchoolIcon />;
  };

  const getRecordColor = (type) => {
    return type === 'employment' ? 'primary' : 'secondary';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Professional Records
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddRecord}
        >
          Add Record
        </Button>
      </Box>

      <Grid container spacing={3}>
        {records.map((record) => (
          <Grid item xs={12} md={6} key={record.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {getRecordIcon(record.type)}
                  <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
                    {record.title}
                  </Typography>
                  <Box>
                    <IconButton onClick={() => handleEditRecord(record)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteRecord(record.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                
                <Typography variant="body1" gutterBottom>
                  {record.organization}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {record.startDate} - {record.endDate || 'Present'}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Chip
                    label={record.type === 'employment' ? 'Employment' : 'Education'}
                    color={getRecordColor(record.type)}
                    size="small"
                  />
                  <Chip
                    label={record.verified ? 'Verified' : 'Pending'}
                    color={record.verified ? 'success' : 'warning'}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRecord ? 'Edit Record' : 'Add New Record'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Title"
              fullWidth
              defaultValue={editingRecord?.title || ''}
            />
            <TextField
              label="Organization"
              fullWidth
              defaultValue={editingRecord?.organization || ''}
            />
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              defaultValue={editingRecord?.startDate || ''}
            />
            <TextField
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              defaultValue={editingRecord?.endDate || ''}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCloseDialog}>
            {editingRecord ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfessionalRecords;
