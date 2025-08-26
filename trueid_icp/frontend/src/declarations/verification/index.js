// Mock Verification Canister Declaration
export const verification = {
  requestVerification: async (verificationData) => {
    console.log('Mock: Requesting verification');
    return { 
      success: true, 
      verificationId: `verification-${Date.now()}`,
      status: 'pending'
    };
  },
  
  getVerifications: async (identityId) => {
    console.log('Mock: Getting verifications');
    return [
      {
        id: 1,
        type: 'identity',
        title: 'Identity Verification',
        status: 'verified',
        date: '2024-01-15',
        verifier: 'Government Authority'
      },
      {
        id: 2,
        type: 'employment',
        title: 'Employment at Tech Corp',
        status: 'pending',
        date: '2024-01-20',
        verifier: 'HR Department'
      },
      {
        id: 3,
        type: 'document',
        title: 'University Diploma',
        status: 'verified',
        date: '2024-01-10',
        verifier: 'University Registrar'
      }
    ];
  },
  
  getVerificationStatus: async (verificationId) => {
    console.log('Mock: Getting verification status');
    return {
      id: verificationId,
      status: 'verified',
      verifiedAt: Date.now(),
      verifier: 'Mock Verifier'
    };
  },
  
  submitVerificationProof: async (verificationId, proof) => {
    console.log('Mock: Submitting verification proof');
    return { success: true };
  },
  
  getVerificationStats: async () => {
    console.log('Mock: Getting verification stats');
    return {
      total: 156,
      verified: 98,
      pending: 45,
      rejected: 13
    };
  }
};

export const canisterId = 'mock-verification-canister-id';

// Mock IDL Factory for Candid interface
export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'requestVerification': IDL.Func([IDL.Record({
      'type': IDL.Text,
      'title': IDL.Text,
      'data': IDL.Text
    })], [IDL.Record({
      'success': IDL.Bool,
      'verificationId': IDL.Text,
      'status': IDL.Text
    })], []),
    'getVerifications': IDL.Func([IDL.Text], [IDL.Vec(IDL.Record({
      'id': IDL.Nat,
      'type': IDL.Text,
      'title': IDL.Text,
      'status': IDL.Text,
      'verifier': IDL.Text
    }))], ['query']),
    'getVerificationStatus': IDL.Func([IDL.Text], [IDL.Record({
      'status': IDL.Text,
      'verifiedAt': IDL.Opt(IDL.Nat64)
    })], ['query'])
  });
};
