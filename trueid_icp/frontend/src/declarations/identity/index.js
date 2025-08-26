// Mock Identity Canister Declaration
export const identity = {
  createIdentity: async (biometricHash) => {
    console.log('Mock: Creating identity with biometric hash');
    return { success: true, id: 'mock-identity-id' };
  },
  
  verifyIdentity: async (identityId, biometricHash) => {
    console.log('Mock: Verifying identity');
    return { success: true, verified: true };
  },
  
  getIdentity: async (identityId) => {
    console.log('Mock: Getting identity');
    return {
      id: identityId,
      biometricHash: 'mock-hash',
      verified: true,
      createdAt: Date.now()
    };
  },
  
  updateBiometricHash: async (identityId, newHash) => {
    console.log('Mock: Updating biometric hash');
    return { success: true };
  }
};

export const canisterId = 'mock-identity-canister-id';

// Mock IDL Factory for Candid interface
export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'createIdentity': IDL.Func([IDL.Text], [IDL.Bool], []),
    'verifyIdentity': IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], ['query']),
    'getIdentity': IDL.Func([IDL.Text], [IDL.Opt(IDL.Record({
      'id': IDL.Text,
      'biometricHash': IDL.Text,
      'verified': IDL.Bool,
      'createdAt': IDL.Nat64
    }))], ['query'])
  });
};
