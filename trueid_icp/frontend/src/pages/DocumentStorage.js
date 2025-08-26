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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Share as ShareIcon
} from '@mui/icons-material';

const DocumentStorage = () => {
  const [documents, setDocuments] = useState([
    {
      id: 1,
      name: 'passport.pdf',
      type: 'pdf',
      size: '2.5 MB',
      uploadDate: '2024-01-15',
      encrypted: true
    },
    {
      id: 2,
      name: 'diploma.jpg',
      type: 'image',
      size: '1.8 MB',
      uploadDate: '2024-01-10',
      encrypted: true
    },
    {
      id: 3,
      name: 'employment_contract.pdf',
      type: 'pdf',
      size: '890 KB',
      uploadDate: '2024-01-05',
      encrypted: true
    }
  ]);

  const handleUpload = () => {
    // Simulate file upload
    console.log('Upload file');
  };

  const handleDownload = (doc) => {
    console.log('Download:', doc.name);
  };

  const handleDelete = (id) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  const handleShare = (doc) => {
    console.log('Share:', doc.name);
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <PdfIcon color="error" />;
      case 'image':
        return <ImageIcon color="primary" />;
      default:
        return <DocumentIcon />;
    }
  };

  const formatFileSize = (size) => {
    return size;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Document Storage
        </Typography>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={handleUpload}
        >
          Upload Document
        </Button>
      </Box>

      {/* Storage Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {documents.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Documents
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="secondary">
                8.2 MB
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Storage Used
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                100%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Encrypted
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Documents List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Documents
          </Typography>
          {documents.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No documents uploaded yet. Start by uploading your first document.
              </Typography>
            </Box>
          ) : (
            <List>
              {documents.map((doc) => (
                <ListItem key={doc.id} divider>
                  <ListItemIcon>
                    {getFileIcon(doc.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={doc.name}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                        <Typography variant="caption">
                          {formatFileSize(doc.size)} • Uploaded {doc.uploadDate}
                        </Typography>
                        <Chip
                          label="Encrypted"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        edge="end"
                        onClick={() => handleDownload(doc)}
                        title="Download"
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleShare(doc)}
                        title="Share"
                      >
                        <ShareIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleDelete(doc.id)}
                        title="Delete"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default DocumentStorage;
