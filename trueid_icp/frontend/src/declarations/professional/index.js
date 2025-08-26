// Mock Professional Canister Declaration
export const professional = {
  addProfessionalRecord: async (record) => {
    console.log('Mock: Adding professional record');
    return { success: true, id: `record-${Date.now()}` };
  },
  
  getProfessionalRecords: async (identityId) => {
    console.log('Mock: Getting professional records');
    return [
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
    ];
  },
  
  updateProfessionalRecord: async (recordId, updates) => {
    console.log('Mock: Updating professional record');
    return { success: true };
  },
  
  deleteProfessionalRecord: async (recordId) => {
    console.log('Mock: Deleting professional record');
    return { success: true };
  },
  
  verifyProfessionalRecord: async (recordId) => {
    console.log('Mock: Verifying professional record');
    return { success: true, verified: true };
  }
};

export const canisterId = 'mock-professional-canister-id';

// Mock IDL Factory for Candid interface
export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'addProfessionalRecord': IDL.Func([IDL.Record({
      'type': IDL.Text,
      'title': IDL.Text,
      'organization': IDL.Text,
      'startDate': IDL.Text,
      'endDate': IDL.Opt(IDL.Text)
    })], [IDL.Text], []),
    'getProfessionalRecords': IDL.Func([IDL.Text], [IDL.Vec(IDL.Record({
      'id': IDL.Nat,
      'type': IDL.Text,
      'title': IDL.Text,
      'organization': IDL.Text,
      'verified': IDL.Bool
    }))], ['query']),
    'updateProfessionalRecord': IDL.Func([IDL.Nat, IDL.Record({})], [IDL.Bool], []),
    'deleteProfessionalRecord': IDL.Func([IDL.Nat], [IDL.Bool], [])
  });
};
