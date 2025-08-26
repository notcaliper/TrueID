// Mock Storage Canister Declaration
export const storage = {
  uploadDocument: async (documentData, metadata) => {
    console.log('Mock: Uploading document');
    return { 
      success: true, 
      documentId: `doc-${Date.now()}`,
      hash: 'mock-document-hash'
    };
  },
  
  getDocument: async (documentId) => {
    console.log('Mock: Getting document');
    return {
      id: documentId,
      name: 'sample-document.pdf',
      size: '2.5 MB',
      uploadDate: '2024-01-15',
      encrypted: true,
      hash: 'mock-document-hash'
    };
  },
  
  getDocuments: async (identityId) => {
    console.log('Mock: Getting documents list');
    return [
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
      }
    ];
  },
  
  deleteDocument: async (documentId) => {
    console.log('Mock: Deleting document');
    return { success: true };
  },
  
  shareDocument: async (documentId, recipientId, permissions) => {
    console.log('Mock: Sharing document');
    return { success: true, shareId: `share-${Date.now()}` };
  },
  
  getStorageStats: async (identityId) => {
    console.log('Mock: Getting storage stats');
    return {
      totalDocuments: 3,
      storageUsed: '8.2 MB',
      storageLimit: '100 MB',
      encryptedDocuments: 3
    };
  }
};

export const canisterId = 'mock-storage-canister-id';

// Mock IDL Factory for Candid interface
export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'uploadDocument': IDL.Func([IDL.Vec(IDL.Nat8), IDL.Record({
      'name': IDL.Text,
      'contentType': IDL.Text
    })], [IDL.Record({
      'success': IDL.Bool,
      'documentId': IDL.Text,
      'hash': IDL.Text
    })], []),
    'getDocuments': IDL.Func([IDL.Text], [IDL.Vec(IDL.Record({
      'id': IDL.Nat,
      'name': IDL.Text,
      'type': IDL.Text,
      'size': IDL.Text,
      'encrypted': IDL.Bool
    }))], ['query']),
    'deleteDocument': IDL.Func([IDL.Nat], [IDL.Bool], []),
    'shareDocument': IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], [])
  });
};
