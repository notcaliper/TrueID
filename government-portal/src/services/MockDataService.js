/**
 * Mock Data Service
 * 
 * This service provides mock data for the DBIS Government Portal
 * to enable development and testing without backend connectivity.
 */

// Generate a random blockchain transaction hash
const generateTxHash = () => {
  return `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
};

// Generate a random user ID
const generateUserId = () => {
  return `ID-${Math.floor(10000000 + Math.random() * 90000000)}`;
};

// Generate a random date within the past n days
const randomDate = (daysAgo = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
};

// List of Indian names for mock data
const indianNames = [
  'Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Neha Verma', 'Vikram Mehta', 
  'Anjali Desai', 'Sanjay Patel', 'Meera Kapoor', 'Raj Singh', 'Ananya Gupta',
  'Arjun Malhotra', 'Deepika Reddy', 'Kiran Joshi', 'Pooja Agarwal', 'Vivek Choudhary',
  'Nisha Iyer', 'Rohit Bansal', 'Kavita Nair', 'Sunil Mehta', 'Divya Sharma'
];

// List of admin names
const adminNames = [
  'Admin Singh', 'Supervisor Gupta', 'Officer Patel', 'Director Sharma', 'Manager Reddy'
];

// List of possible actions
const actions = [
  'User Verified', 'User Rejected', 'Biometric Updated', 'Identity Verified', 
  'Registration Approved', 'Verification Pending', 'Document Updated'
];

// Generate a random user
const generateUser = (verified = null) => {
  const name = indianNames[Math.floor(Math.random() * indianNames.length)];
  const id = generateUserId();
  const verificationStatus = verified !== null ? verified : Math.random() > 0.3;
  const pendingStatus = !verificationStatus && Math.random() > 0.5;
  
  return {
    id,
    name,
    email: name.toLowerCase().replace(' ', '.') + '@example.com',
    phone: `+91${Math.floor(7000000000 + Math.random() * 2999999999)}`,
    walletAddress: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    facemeshHash: generateTxHash(),
    registrationDate: randomDate(90),
    verificationStatus: verificationStatus ? 'verified' : (pendingStatus ? 'pending' : 'rejected'),
    lastUpdated: randomDate(30),
    verifiedBy: verificationStatus ? adminNames[Math.floor(Math.random() * adminNames.length)] : null,
    verificationDate: verificationStatus ? randomDate(30) : null,
    verificationTxHash: verificationStatus ? generateTxHash() : null,
    notes: Math.random() > 0.7 ? 'Additional verification required' : ''
  };
};

// Generate an activity log
const generateActivity = (userId = null, userName = null, action = null) => {
  const randomUser = indianNames[Math.floor(Math.random() * indianNames.length)];
  const randomAction = actions[Math.floor(Math.random() * actions.length)];
  const randomAdmin = adminNames[Math.floor(Math.random() * adminNames.length)];
  
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    action: action || randomAction,
    timestamp: randomDate(7),
    userName: userName || randomUser,
    userId: userId || generateUserId(),
    adminName: randomAdmin,
    txHash: Math.random() > 0.3 ? generateTxHash() : null,
    details: Math.random() > 0.7 ? 'Additional verification steps taken' : ''
  };
};

// Dashboard stats
const dashboardStats = {
  totalUsers: 1248,
  verifiedUsers: 876,
  pendingUsers: 289,
  rejectedUsers: 83,
  lastUpdated: new Date(),
  trends: {
    totalChange: 42,
    verifiedChange: 28,
    pendingChange: -15,
    rejectedChange: -3
  },
  recentActivities: [
    {
      id: 1,
      action: 'User Verified',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      userName: 'Rahul Sharma',
      userId: 'ID-78945612',
      adminName: 'Admin Singh',
      txHash: generateTxHash()
    },
    {
      id: 2,
      action: 'Biometric Updated',
      timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      userName: 'Priya Patel',
      userId: 'ID-45678912',
      adminName: 'Admin Singh',
      txHash: generateTxHash()
    },
    {
      id: 3,
      action: 'User Rejected',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      userName: 'Amit Kumar',
      userId: 'ID-12345678',
      adminName: 'Supervisor Gupta',
      txHash: generateTxHash()
    },
    {
      id: 4,
      action: 'User Verified',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      userName: 'Neha Verma',
      userId: 'ID-98765432',
      adminName: 'Supervisor Gupta',
      txHash: generateTxHash()
    }
  ]
};

// Generate users list
const generateUsers = (count = 50) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push(generateUser());
  }
  return users;
};

// Pre-generate a set of users for consistent data
const mockUsers = generateUsers(50);

// Generate activity logs
const generateActivityLogs = (count = 100) => {
  const logs = [];
  for (let i = 0; i < count; i++) {
    const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
    logs.push(generateActivity(randomUser.id, randomUser.name));
  }
  
  // Sort by timestamp (newest first)
  return logs.sort((a, b) => b.timestamp - a.timestamp);
};

// Pre-generate activity logs
const mockActivityLogs = generateActivityLogs(100);

// Generate version history for a user
const generateVersionHistory = (userId, userName) => {
  const count = Math.floor(Math.random() * 5) + 1;
  const history = [];
  
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 30 + Math.floor(Math.random() * 15)));
    
    history.push({
      id: Date.now() + i,
      userId,
      userName,
      facemeshHash: generateTxHash(),
      updatedBy: adminNames[Math.floor(Math.random() * adminNames.length)],
      timestamp: date,
      txHash: generateTxHash(),
      reason: i === 0 ? 'Initial registration' : 'Biometric update required'
    });
  }
  
  return history.sort((a, b) => b.timestamp - a.timestamp);
};

// Mock API service methods
const MockDataService = {
  // Dashboard stats
  getDashboardStats: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update some values to simulate changes
    dashboardStats.totalUsers += Math.floor(Math.random() * 5);
    dashboardStats.verifiedUsers += Math.floor(Math.random() * 3);
    dashboardStats.pendingUsers = Math.max(0, dashboardStats.pendingUsers - Math.floor(Math.random() * 2));
    dashboardStats.lastUpdated = new Date();
    
    // Add a new activity occasionally
    if (Math.random() > 0.6) {
      const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
      const newActivity = generateActivity(randomUser.id, randomUser.name);
      dashboardStats.recentActivities.unshift(newActivity);
      dashboardStats.recentActivities = dashboardStats.recentActivities.slice(0, 5);
    }
    
    return { ...dashboardStats };
  },
  
  // Get users with pagination and search
  getUsers: async (page = 1, limit = 10, search = '', searchType = 'name') => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let filteredUsers = [...mockUsers];
    
    // Apply search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => {
        if (searchType === 'name') {
          return user.name.toLowerCase().includes(searchLower);
        } else if (searchType === 'id') {
          return user.id.toLowerCase().includes(searchLower);
        } else if (searchType === 'facehash') {
          return user.facemeshHash.toLowerCase().includes(searchLower);
        }
        return true;
      });
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    return {
      users: paginatedUsers,
      total: filteredUsers.length,
      page,
      limit
    };
  },
  
  // Get user by ID
  getUserById: async (userId) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = mockUsers.find(u => u.id === userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return { ...user };
  },
  
  // Get version history for a user
  getProfessionalRecords: async (userId) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const user = mockUsers.find(u => u.id === userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return generateVersionHistory(userId, user.name);
  },
  
  // Verify a user's identity
  verifyIdentity: async (userId, approve = true) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    // Update user status
    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      verificationStatus: approve ? 'verified' : 'rejected',
      verifiedBy: adminNames[Math.floor(Math.random() * adminNames.length)],
      verificationDate: new Date(),
      verificationTxHash: approve ? generateTxHash() : null
    };
    
    // Add to activity logs
    const newActivity = generateActivity(
      userId, 
      mockUsers[userIndex].name,
      approve ? 'User Verified' : 'User Rejected'
    );
    mockActivityLogs.unshift(newActivity);
    
    // If this was in the dashboard recent activities, update it
    const dashboardActivityIndex = dashboardStats.recentActivities.findIndex(a => a.userId === userId);
    if (dashboardActivityIndex !== -1) {
      dashboardStats.recentActivities[dashboardActivityIndex] = newActivity;
    }
    
    return {
      success: true,
      txHash: approve ? newActivity.txHash : null,
      user: mockUsers[userIndex]
    };
  },
  
  // Update user's biometric data
  updateBiometricData: async (userId, newFacemeshHash) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    const oldHash = mockUsers[userIndex].facemeshHash;
    
    // Update user data
    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      facemeshHash: newFacemeshHash || generateTxHash(),
      lastUpdated: new Date()
    };
    
    // Add to version history
    const history = generateVersionHistory(userId, mockUsers[userIndex].name);
    history.unshift({
      id: Date.now(),
      userId,
      userName: mockUsers[userIndex].name,
      facemeshHash: mockUsers[userIndex].facemeshHash,
      previousHash: oldHash,
      updatedBy: adminNames[Math.floor(Math.random() * adminNames.length)],
      timestamp: new Date(),
      txHash: generateTxHash(),
      reason: 'Biometric update required'
    });
    
    // Add to activity logs
    const newActivity = generateActivity(
      userId, 
      mockUsers[userIndex].name,
      'Biometric Updated'
    );
    mockActivityLogs.unshift(newActivity);
    
    return {
      success: true,
      txHash: newActivity.txHash,
      user: mockUsers[userIndex]
    };
  },
  
  // Get activity logs with pagination and filters
  getActivityLogs: async (page = 1, limit = 15, filters = {}) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 900));
    
    let filteredLogs = [...mockActivityLogs];
    
    // Apply action filter
    if (filters.action) {
      filteredLogs = filteredLogs.filter(log => 
        log.action.toLowerCase().includes(filters.action.toLowerCase())
      );
    }
    
    // Apply date range filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= startDate);
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= endDate);
    }
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.userName.toLowerCase().includes(searchLower) ||
        log.userId.toLowerCase().includes(searchLower) ||
        log.adminName.toLowerCase().includes(searchLower) ||
        (log.txHash && log.txHash.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
    
    return {
      logs: paginatedLogs,
      total: filteredLogs.length,
      page,
      limit
    };
  },
  
  // Export activity logs (returns a mock blob)
  exportActivityLogs: async (filters = {}) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // This would normally return a blob, but for mock purposes we'll just return a success message
    return new Blob(['Mock CSV data for activity logs export'], { type: 'text/csv' });
  }
};

export default MockDataService;
