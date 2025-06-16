const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const FormData = require('form-data');

// Configuration
const API_URL = 'http://localhost:5000/api';
const TEST_USER = {
  username: `testuser_${Date.now()}`,
  password: 'Test@123',
  email: `test${Date.now()}@example.com`,
  name: 'Test User',
  phone: '9112345678',
  governmentId: `TEST${Date.now()}`,
  avaxAddress: '0x' + '1'.repeat(40)
};

// Utility functions
const calculateFileHash = async (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', error => reject(error));
  });
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// API wrapper
class APIClient {
  constructor(baseURL) {
    this.api = axios.create({ baseURL });
    this.token = null;
  }

  setAuthToken(token) {
    this.token = token;
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Auth endpoints
  async register(userData) {
    const response = await this.api.post('/user/register', userData);
    return response.data;
  }

  async login(credentials) {
    const response = await this.api.post('/user/login', credentials);
    return response.data;
  }

  // Professional record endpoints
  async createProfessionalRecord(data) {
    const response = await this.api.post('/users/professional-record', {
      ...data,
      verification_status: 'PENDING',
      record_type: 'EMPLOYMENT'
    });
    return response.data;
  }

  async uploadDocument(filePath, professionalRecordId) {
    const formData = new FormData();
    formData.append('document', fs.createReadStream(filePath));
    if (professionalRecordId) {
      formData.append('professionalRecordId', professionalRecordId);
    }
    
    const response = await this.api.post('/documents/upload', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${this.token}`
      }
    });

    return response.data;
  }

  async verifyDocument(documentId) {
    const response = await this.api.get(`/documents/${documentId}`);
    return response.data;
  }
}

// Main flow
async function runDocumentFlow() {
  try {
    console.log('Starting document verification flow test...\n');
    
    const api = new APIClient(API_URL);

    // 1. Register new user
    console.log('1. Registering new user...');
    const registrationResult = await api.register(TEST_USER);
    console.log('✓ User registered successfully\n');

    // 2. Login
    console.log('2. Logging in...');
    const loginResult = await api.login({
      username: TEST_USER.username,
      password: TEST_USER.password
    });
    api.setAuthToken(loginResult.tokens.accessToken);
    console.log('✓ Logged in successfully\n');

    // 3. Create professional record
    console.log('3. Creating professional record...');
    const professionalRecord = await api.createProfessionalRecord({
      recordType: 'EMPLOYMENT',
      institution: 'Test Company',
      title: 'Software Engineer',
      description: 'Development and testing',
      startDate: '2023-01-01',
      endDate: '2024-01-01',
      isCurrent: false
    });
    console.log('✓ Professional record created successfully\n');

    // 4. Upload document
    console.log('4. Uploading test document...');
    // Create a test PDF file
    const testFilePath = path.join(__dirname, 'test-document.pdf');
    const testContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog
   /Pages 2 0 R
>>
endobj

2 0 obj
<< /Type /Pages
   /Kids [3 0 R]
   /Count 1
>>
endobj

3 0 obj
<< /Type /Page
   /Parent 2 0 R
   /Resources << /Font << /F1 4 0 R >> >>
   /MediaBox [0 0 612 792]
   /Contents 5 0 R
>>
endobj

4 0 obj
<< /Type /Font
   /Subtype /Type1
   /BaseFont /Helvetica
>>
endobj

5 0 obj
<< /Length 68 >>
stream
BT
/F1 12 Tf
72 720 Td
(This is a test document for verification flow.) Tj
ET
endstream
endobj

xref
0 6
0000000000 65535 f
0000000010 00000 n
0000000070 00000 n
0000000140 00000 n
0000000290 00000 n
0000000380 00000 n

trailer
<< /Size 6
   /Root 1 0 R
>>
startxref
500
%%EOF`;
    fs.writeFileSync(testFilePath, testContent);

    // Calculate original hash
    const originalHash = await calculateFileHash(testFilePath);
    console.log('Original document hash:', originalHash);

    // Upload the document
    const uploadResult = await api.uploadDocument(testFilePath, professionalRecord.id);
    console.log('✓ Document uploaded successfully\n');

    // 5. Verify document hash
    console.log('5. Verifying document hash...');
    const verificationResult = await api.verifyDocument(uploadResult.documentId);
    
    // Compare hashes
    const uploadedHash = verificationResult.document.fileHash;
    console.log('Uploaded document hash:', uploadedHash);
    
    if (originalHash === uploadedHash) {
      console.log('✓ Document hash verification successful!\n');
    } else {
      console.log('✗ Document hash verification failed!\n');
      console.log('Original hash:', originalHash);
      console.log('Uploaded hash:', uploadedHash);
    }

    // Cleanup
    fs.unlinkSync(testFilePath);
    console.log('Test completed successfully!');

  } catch (error) {
    console.error('Error in document flow:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the flow
runDocumentFlow().catch(console.error); 