// Mock Admin Canister Declaration
export const admin = {
  getSystemStats: async () => {
    console.log('Mock: Getting system stats');
    return {
      totalUsers: 1247,
      activeUsers: 1156,
      verifiedIdentities: 892,
      pendingVerifications: 23
    };
  },
  
  getPendingVerifications: async () => {
    console.log('Mock: Getting pending verifications');
    return [
      {
        id: 1,
        userId: 'user-1',
        type: 'identity',
        status: 'pending',
        submittedAt: Date.now() - 86400000
      }
    ];
  },
  
  approveVerification: async (verificationId) => {
    console.log('Mock: Approving verification');
    return { success: true };
  },
  
  rejectVerification: async (verificationId, reason) => {
    console.log('Mock: Rejecting verification');
    return { success: true };
  },
  
  getSystemHealth: async () => {
    console.log('Mock: Getting system health');
    return {
      status: 'healthy',
      uptime: 99.9,
      cyclesBalance: '2.5T'
    };
  }
};

export const canisterId = 'mock-admin-canister-id';

// Mock IDL Factory for Candid interface
export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'getSystemStats': IDL.Func([], [IDL.Record({
      'totalUsers': IDL.Nat,
      'activeUsers': IDL.Nat,
      'verifiedIdentities': IDL.Nat,
      'pendingVerifications': IDL.Nat
    })], ['query']),
    'getPendingVerifications': IDL.Func([], [IDL.Vec(IDL.Record({
      'id': IDL.Nat,
      'userId': IDL.Text,
      'type': IDL.Text,
      'status': IDL.Text
    }))], ['query']),
    'approveVerification': IDL.Func([IDL.Nat], [IDL.Bool], []),
    'rejectVerification': IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], [])
  });
};
