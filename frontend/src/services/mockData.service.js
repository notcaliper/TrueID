/**
 * TrueID Mock Data Service
 * Comprehensive mock data for standalone frontend development
 */

// User Profiles
export const mockUsers = [
  {
    id: 'usr_001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1990-05-15',
    nationality: 'United States',
    address: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    profileImage: 'https://i.pravatar.cc/150?img=11',
    isVerified: true,
    verificationLevel: 'gold',
    createdAt: '2024-01-15T10:30:00Z',
    lastLogin: '2024-06-06T14:22:00Z',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f8dEe3',
    blockchainStatus: 'active'
  },
  {
    id: 'usr_002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1 (555) 987-6543',
    dateOfBirth: '1985-08-22',
    nationality: 'Canada',
    address: {
      street: '456 Maple Avenue',
      city: 'Toronto',
      state: 'ON',
      zipCode: 'M5V 3A8',
      country: 'Canada'
    },
    profileImage: 'https://i.pravatar.cc/150?img=5',
    isVerified: true,
    verificationLevel: 'platinum',
    createdAt: '2024-02-20T09:15:00Z',
    lastLogin: '2024-06-06T16:45:00Z',
    walletAddress: '0x8Ba1f109551bD432803012645HaC136c82C3e5C',
    blockchainStatus: 'active'
  }
];

// Professional Records
export const mockProfessionalRecords = [
  {
    id: 'rec_001',
    userId: 'usr_001',
    title: 'Senior Software Engineer',
    organization: 'TechCorp International',
    department: 'Engineering',
    startDate: '2020-03-01',
    endDate: null,
    isCurrent: true,
    description: 'Leading blockchain development team',
    achievements: [
      'Implemented zero-knowledge proof system',
      'Reduced transaction costs by 40%',
      'Led team of 12 engineers'
    ],
    skills: ['Solidity', 'React', 'Node.js', 'PostgreSQL'],
    verificationStatus: 'verified',
    verifiedBy: 'TechCorp HR',
    verifiedAt: '2024-03-15T10:00:00Z',
    salary: '$150,000 - $180,000',
    location: 'New York, NY (Remote)',
    employmentType: 'Full-time'
  },
  {
    id: 'rec_002',
    userId: 'usr_001',
    title: 'Software Developer',
    organization: 'StartupXYZ',
    department: 'Product',
    startDate: '2018-06-01',
    endDate: '2020-02-28',
    isCurrent: false,
    description: 'Full-stack development for fintech platform',
    achievements: [
      'Built payment processing system',
      'Achieved 99.9% uptime'
    ],
    skills: ['JavaScript', 'Python', 'AWS'],
    verificationStatus: 'verified',
    verifiedBy: 'StartupXYZ CTO',
    verifiedAt: '2024-01-10T14:30:00Z',
    salary: '$90,000 - $110,000',
    location: 'San Francisco, CA',
    employmentType: 'Full-time'
  },
  {
    id: 'rec_003',
    userId: 'usr_002',
    title: 'Product Manager',
    organization: 'Global Finance Bank',
    department: 'Digital Products',
    startDate: '2019-01-15',
    endDate: null,
    isCurrent: true,
    description: 'Managing digital identity verification products',
    achievements: [
      'Launched biometric verification system',
      'Increased user adoption by 300%',
      'Reduced fraud by 85%'
    ],
    skills: ['Product Strategy', 'Agile', 'Blockchain', 'UX Design'],
    verificationStatus: 'verified',
    verifiedBy: 'Global Finance Bank',
    verifiedAt: '2024-02-20T09:00:00Z',
    salary: '$130,000 - $160,000',
    location: 'Toronto, ON',
    employmentType: 'Full-time'
  }
];

// Blockchain Transactions
export const mockTransactions = [
  {
    id: 'tx_001',
    hash: '0x7f8c9d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
    type: 'identity_verification',
    status: 'confirmed',
    from: '0x742d35Cc6634C0532925a3b844Bc9e7595f8dEe3',
    to: '0xContractAddress',
    value: '0.001',
    gas: '21000',
    gasPrice: '20',
    timestamp: '2024-06-06T14:30:00Z',
    blockNumber: 12345678,
    confirmations: 24,
    network: 'Ethereum Sepolia'
  },
  {
    id: 'tx_002',
    hash: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    type: 'professional_record_update',
    status: 'confirmed',
    from: '0x742d35Cc6634C0532925a3b844Bc9e7595f8dEe3',
    to: '0xContractAddress',
    value: '0.002',
    gas: '35000',
    gasPrice: '22',
    timestamp: '2024-06-05T10:15:00Z',
    blockNumber: 12345650,
    confirmations: 150,
    network: 'Ethereum Sepolia'
  },
  {
    id: 'tx_003',
    hash: '0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
    type: 'verification_request',
    status: 'pending',
    from: '0x8Ba1f109551bD432803012645HaC136c82C3e5C',
    to: '0xContractAddress',
    value: '0.001',
    gas: '25000',
    gasPrice: '25',
    timestamp: '2024-06-06T18:00:00Z',
    blockNumber: null,
    confirmations: 0,
    network: 'Ethereum Sepolia'
  }
];

// Wallet Data
export const mockWalletData = {
  address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8dEe3',
  balance: {
    eth: '1.456',
    usd: '$3,824.50'
  },
  tokens: [
    {
      symbol: 'ETH',
      name: 'Ethereum (Sepolia)',
      balance: '1.456',
      value: '$3,824.50',
      icon: '⟠'
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      balance: '500.00',
      value: '$500.00',
      icon: '💵'
    },
    {
      symbol: 'TRUE',
      name: 'TrueID Token',
      balance: '1000.00',
      value: '$150.00',
      icon: '🆔'
    }
  ],
  nfts: [
    {
      id: 'nft_001',
      name: 'Verified Identity #001',
      image: 'https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=Verified',
      type: 'Identity NFT',
      verified: true
    },
    {
      id: 'nft_002',
      name: 'Professional Badge - Gold',
      image: 'https://via.placeholder.com/300x300/FFD700/000000?text=Gold',
      type: 'Achievement NFT',
      verified: true
    }
  ]
};

// Verification Status
export const mockVerificationStatus = {
  identity: {
    status: 'verified',
    level: 'gold',
    completedAt: '2024-01-20T10:30:00Z',
    expiresAt: '2025-01-20T10:30:00Z',
    provider: 'TrueID Biometric',
    checks: [
      { name: 'Document Verification', status: 'passed', date: '2024-01-15' },
      { name: 'Biometric Verification', status: 'passed', date: '2024-01-18' },
      { name: 'Liveness Check', status: 'passed', date: '2024-01-18' },
      { name: 'Address Verification', status: 'passed', date: '2024-01-20' }
    ]
  },
  professional: {
    status: 'verified',
    recordsCount: 2,
    lastVerification: '2024-03-15T10:00:00Z',
    pendingRequests: 0
  },
  blockchain: {
    status: 'active',
    network: 'Ethereum Sepolia',
    walletConnected: true,
    transactionsCount: 15
  }
};

// Activity Logs
export const mockActivityLogs = [
  {
    id: 'log_001',
    type: 'login',
    description: 'Successful login from Chrome on Windows',
    timestamp: '2024-06-06T14:22:00Z',
    ip: '192.168.1.100',
    location: 'New York, USA',
    status: 'success'
  },
  {
    id: 'log_002',
    type: 'profile_update',
    description: 'Updated phone number',
    timestamp: '2024-06-06T13:45:00Z',
    ip: '192.168.1.100',
    location: 'New York, USA',
    status: 'success'
  },
  {
    id: 'log_003',
    type: 'blockchain_transaction',
    description: 'Identity verification recorded on blockchain',
    timestamp: '2024-06-06T14:30:00Z',
    ip: '192.168.1.100',
    location: 'New York, USA',
    status: 'success'
  },
  {
    id: 'log_004',
    type: 'professional_record',
    description: 'Added new employment record at TechCorp',
    timestamp: '2024-06-05T09:15:00Z',
    ip: '192.168.1.100',
    location: 'New York, USA',
    status: 'success'
  },
  {
    id: 'log_005',
    type: 'verification',
    description: 'Biometric verification completed',
    timestamp: '2024-06-04T16:30:00Z',
    ip: '192.168.1.100',
    location: 'New York, USA',
    status: 'success'
  }
];

// Notifications
export const mockNotifications = [
  {
    id: 'notif_001',
    type: 'success',
    title: 'Identity Verified',
    message: 'Your identity has been successfully verified at Gold level.',
    timestamp: '2024-06-06T14:30:00Z',
    read: false,
    action: '/verification-status'
  },
  {
    id: 'notif_002',
    type: 'info',
    title: 'New Feature Available',
    message: 'Professional record sharing is now available. Try it out!',
    timestamp: '2024-06-05T10:00:00Z',
    read: true,
    action: '/professional-records'
  },
  {
    id: 'notif_003',
    type: 'warning',
    title: 'Verification Expiring',
    message: 'Your address verification expires in 30 days. Please update.',
    timestamp: '2024-06-04T08:00:00Z',
    read: false,
    action: '/verification-status'
  }
];

// Statistics
export const mockStatistics = {
  identity: {
    verificationRate: 98.5,
    avgVerificationTime: '2.3 minutes',
    totalVerifications: 1250
  },
  blockchain: {
    totalTransactions: 15420,
    avgGasCost: '$0.45',
    networkUptime: '99.9%'
  },
  users: {
    total: 5000,
    active: 3200,
    newThisMonth: 450
  }
};

// Design System Colors
export const designSystem = {
  colors: {
    primary: {
      50: '#EEF2FF',
      100: '#E0E7FF',
      200: '#C7D2FE',
      300: '#A5B4FC',
      400: '#818CF8',
      500: '#6366F1',
      600: '#4F46E5',
      700: '#4338CA',
      800: '#3730A3',
      900: '#312E81'
    },
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  },
  gradients: {
    primary: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
    success: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    dark: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)'
  }
};

// API Mock Functions
export const mockApi = {
  // Auth
  login: (usernameOrEmail, password) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Accept either username (from form) or email
        const user = mockUsers.find(u => 
          u.email === usernameOrEmail || 
          u.email.split('@')[0] === usernameOrEmail
        ) || mockUsers[0];
        
        resolve({
          success: true,
          token: 'mock_jwt_token_' + Date.now(),
          user
        });
      }, 800);
    });
  },

  register: (userData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Registration successful',
          user: { ...mockUsers[0], ...userData, id: 'usr_new_' + Date.now() }
        });
      }, 1000);
    });
  },

  // User
  getProfile: () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockUsers[0]), 500);
    });
  },

  updateProfile: (data) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...mockUsers[0], ...data }), 600);
    });
  },

  // Professional Records
  getProfessionalRecords: () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockProfessionalRecords.filter(r => r.userId === 'usr_001')), 700);
    });
  },

  addProfessionalRecord: (record) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newRecord = {
          ...record,
          id: 'rec_' + Date.now(),
          userId: 'usr_001',
          verificationStatus: 'pending'
        };
        resolve(newRecord);
      }, 800);
    });
  },

  // Wallet
  getWalletData: () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockWalletData), 600);
    });
  },

  // Transactions
  getTransactions: () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockTransactions), 700);
    });
  },

  // Verification
  getVerificationStatus: () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockVerificationStatus), 500);
    });
  },

  // Activity
  getActivityLogs: () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockActivityLogs), 600);
    });
  },

  // Notifications
  getNotifications: () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockNotifications), 400);
    });
  },

  markNotificationRead: (id) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ success: true }), 300);
    });
  },

  // Statistics
  getStatistics: () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockStatistics), 500);
    });
  },

  // Biometric
  verifyBiometric: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          matchScore: 98.5,
          verified: true
        });
      }, 2000);
    });
  },

  // MFA
  setupMFA: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          secret: 'JBSWY3DPEHPK3PXP',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
          otpauthUrl: 'otpauth://totp/TrueID:MockUser?secret=JBSWY3DPEHPK3PXP&issuer=TrueID'
        });
      }, 800);
    });
  },

  verifyMFASetup: (token) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (token === '123456' || token.length === 6) {
          resolve({
            success: true,
            recoveryCodes: [
              'A1B2C3D4', 'E5F6G7H8', 'I9J0K1L2', 'M3N4O5P6',
              'Q7R8S9T0', 'U1V2W3X4', 'Y5Z6A7B8', 'C9D0E1F2',
              'G3H4I5J6', 'K7L8M9N0'
            ]
          });
        } else {
          reject(new Error('Invalid verification code'));
        }
      }, 800);
    });
  },

  getMFAStatus: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          enabled: false,
          type: 'TOTP',
          verifiedAt: null,
          setupPending: false,
          backupCodesCount: 0
        });
      }, 300);
    });
  },

  disableMFA: (password, token) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (token === '123456' || token.length === 6) {
          resolve({ success: true, message: 'MFA disabled' });
        } else {
          reject(new Error('Invalid MFA code'));
        }
      }, 800);
    });
  },

  regenerateRecoveryCodes: (token) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (token === '123456' || token.length === 6) {
          resolve({
            success: true,
            recoveryCodes: [
              'A1B2C3D4', 'E5F6G7H8', 'I9J0K1L2', 'M3N4O5P6',
              'Q7R8S9T0', 'U1V2W3X4', 'Y5Z6A7B8', 'C9D0E1F2',
              'G3H4I5J6', 'K7L8M9N0'
            ]
          });
        } else {
          reject(new Error('Invalid MFA code'));
        }
      }, 800);
    });
  }
};

export default mockApi;
