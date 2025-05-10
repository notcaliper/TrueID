// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IdentityManagement
 * @dev Smart contract for decentralized identity management
 */
contract IdentityManagement {
    // Role definitions
    bytes32 public constant USER_ROLE = keccak256("USER");
    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");

    // Identity struct to store user identity information
    struct Identity {
        bytes32 biometricHash;        // SHA-256 hash of facemesh data
        bytes32 professionalDataHash;  // Hash of professional data stored off-chain
        uint256 createdAt;            // Timestamp when identity was created
        uint256 updatedAt;            // Timestamp when identity was last updated
        address updatedBy;            // Address that performed the last update
        bool isVerified;              // Government verification status
        mapping(bytes32 => bool) attributes; // Additional attributes
    }

    // Professional history record
    struct ProfessionalRecord {
        bytes32 dataHash;             // Hash of professional record data
        uint256 startDate;            // Start date of employment/education
        uint256 endDate;              // End date of employment/education (0 if current)
        address verifier;             // Address that verified this record
        bool isVerified;              // Verification status
        uint256 createdAt;            // Timestamp when record was created
    }

    // Mapping from user address to their identity
    mapping(address => Identity) private identities;
    
    // Mapping from user address to their professional history
    mapping(address => ProfessionalRecord[]) private professionalHistory;
    
    // Mapping for role-based access control
    mapping(address => mapping(bytes32 => bool)) private roles;
    
    // Mapping to track if an address has an identity
    mapping(address => bool) private hasIdentity;

    // Events
    event IdentityCreated(address indexed user, bytes32 biometricHash, uint256 timestamp);
    event IdentityUpdated(address indexed user, address indexed updatedBy, uint256 timestamp);
    event IdentityVerified(address indexed user, address indexed verifier, uint256 timestamp);
    event ProfessionalRecordAdded(address indexed user, bytes32 dataHash, uint256 timestamp);
    event ProfessionalRecordVerified(address indexed user, uint256 recordIndex, address verifier, uint256 timestamp);
    event RoleGranted(address indexed account, bytes32 indexed role, address indexed grantor);
    event RoleRevoked(address indexed account, bytes32 indexed role, address indexed revoker);

    // Modifiers
    modifier onlyRole(bytes32 role) {
        require(roles[msg.sender][role], "Caller does not have the required role");
        _;
    }

    modifier identityExists(address user) {
        require(hasIdentity[user], "Identity does not exist");
        _;
    }

    // Constructor
    constructor() {
        // Grant admin role to contract deployer
        roles[msg.sender][ADMIN_ROLE] = true;
        emit RoleGranted(msg.sender, ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Create a new identity
     * @param biometricHash SHA-256 hash of the user's facemesh data
     * @param professionalDataHash Hash of the user's professional data
     */
    function createIdentity(bytes32 biometricHash, bytes32 professionalDataHash) external {
        require(!hasIdentity[msg.sender], "Identity already exists");
        
        Identity storage identity = identities[msg.sender];
        identity.biometricHash = biometricHash;
        identity.professionalDataHash = professionalDataHash;
        identity.createdAt = block.timestamp;
        identity.updatedAt = block.timestamp;
        identity.updatedBy = msg.sender;
        identity.isVerified = false;
        
        hasIdentity[msg.sender] = true;
        
        // Grant user role
        roles[msg.sender][USER_ROLE] = true;
        
        emit IdentityCreated(msg.sender, biometricHash, block.timestamp);
        emit RoleGranted(msg.sender, USER_ROLE, msg.sender);
    }

    /**
     * @dev Update biometric hash
     * @param user Address of the user
     * @param newBiometricHash New SHA-256 hash of the user's facemesh data
     */
    function updateBiometricHash(address user, bytes32 newBiometricHash) 
        external 
        identityExists(user)
    {
        require(user == msg.sender || roles[msg.sender][GOVERNMENT_ROLE] || roles[msg.sender][ADMIN_ROLE], 
                "Not authorized to update");
        
        Identity storage identity = identities[user];
        identity.biometricHash = newBiometricHash;
        identity.updatedAt = block.timestamp;
        identity.updatedBy = msg.sender;
        
        emit IdentityUpdated(user, msg.sender, block.timestamp);
    }

    /**
     * @dev Update professional data hash
     * @param newProfessionalDataHash New hash of the user's professional data
     */
    function updateProfessionalData(bytes32 newProfessionalDataHash) 
        external 
        identityExists(msg.sender)
    {
        Identity storage identity = identities[msg.sender];
        identity.professionalDataHash = newProfessionalDataHash;
        identity.updatedAt = block.timestamp;
        identity.updatedBy = msg.sender;
        
        emit IdentityUpdated(msg.sender, msg.sender, block.timestamp);
    }

    /**
     * @dev Verify a user's identity (government only)
     * @param user Address of the user to verify
     */
    function verifyIdentity(address user) 
        external 
        onlyRole(GOVERNMENT_ROLE) 
        identityExists(user)
    {
        Identity storage identity = identities[user];
        identity.isVerified = true;
        identity.updatedAt = block.timestamp;
        identity.updatedBy = msg.sender;
        
        emit IdentityVerified(user, msg.sender, block.timestamp);
    }

    /**
     * @dev Add a professional record to a user's history
     * @param dataHash Hash of the professional record data
     * @param startDate Start date of employment/education
     * @param endDate End date of employment/education (0 if current)
     */
    function addProfessionalRecord(bytes32 dataHash, uint256 startDate, uint256 endDate) 
        external 
        identityExists(msg.sender)
    {
        require(startDate <= block.timestamp, "Start date cannot be in the future");
        require(endDate == 0 || endDate >= startDate, "End date must be after start date");
        
        ProfessionalRecord memory record = ProfessionalRecord({
            dataHash: dataHash,
            startDate: startDate,
            endDate: endDate,
            verifier: address(0),
            isVerified: false,
            createdAt: block.timestamp
        });
        
        professionalHistory[msg.sender].push(record);
        
        emit ProfessionalRecordAdded(msg.sender, dataHash, block.timestamp);
    }

    /**
     * @dev Verify a professional record (government only)
     * @param user Address of the user
     * @param recordIndex Index of the record in the user's professional history
     */
    function verifyProfessionalRecord(address user, uint256 recordIndex) 
        external 
        onlyRole(GOVERNMENT_ROLE) 
        identityExists(user)
    {
        require(recordIndex < professionalHistory[user].length, "Record does not exist");
        
        ProfessionalRecord storage record = professionalHistory[user][recordIndex];
        record.isVerified = true;
        record.verifier = msg.sender;
        
        emit ProfessionalRecordVerified(user, recordIndex, msg.sender, block.timestamp);
    }

    /**
     * @dev Grant a role to an account (admin only)
     * @param account Address to grant the role to
     * @param role Role to grant
     */
    function grantRole(address account, bytes32 role) 
        external 
        onlyRole(ADMIN_ROLE)
    {
        roles[account][role] = true;
        emit RoleGranted(account, role, msg.sender);
    }

    /**
     * @dev Revoke a role from an account (admin only)
     * @param account Address to revoke the role from
     * @param role Role to revoke
     */
    function revokeRole(address account, bytes32 role) 
        external 
        onlyRole(ADMIN_ROLE)
    {
        roles[account][role] = false;
        emit RoleRevoked(account, role, msg.sender);
    }

    /**
     * @dev Check if an account has a specific role
     * @param account Address to check
     * @param role Role to check
     * @return bool True if the account has the role
     */
    function hasRole(address account, bytes32 role) external view returns (bool) {
        return roles[account][role];
    }

    /**
     * @dev Get biometric hash for a user
     * @param user Address of the user
     * @return bytes32 Biometric hash
     */
    function getBiometricHash(address user) 
        external 
        view 
        identityExists(user) 
        returns (bytes32) 
    {
        return identities[user].biometricHash;
    }

    /**
     * @dev Check if a user's identity is verified
     * @param user Address of the user
     * @return bool True if the identity is verified
     */
    function isIdentityVerified(address user) 
        external 
        view 
        identityExists(user) 
        returns (bool) 
    {
        return identities[user].isVerified;
    }

    /**
     * @dev Get the number of professional records for a user
     * @param user Address of the user
     * @return uint256 Number of professional records
     */
    function getProfessionalRecordCount(address user) 
        external 
        view 
        returns (uint256) 
    {
        return professionalHistory[user].length;
    }

    /**
     * @dev Get a professional record for a user
     * @param user Address of the user
     * @param recordIndex Index of the record
     * @return dataHash Hash of the record data
     * @return startDate Start date
     * @return endDate End date
     * @return verifier Address of the verifier
     * @return isVerified Verification status
     * @return createdAt Creation timestamp
     */
    function getProfessionalRecord(address user, uint256 recordIndex) 
        external 
        view 
        identityExists(user) 
        returns (
            bytes32 dataHash,
            uint256 startDate,
            uint256 endDate,
            address verifier,
            bool isVerified,
            uint256 createdAt
        ) 
    {
        require(recordIndex < professionalHistory[user].length, "Record does not exist");
        
        ProfessionalRecord storage record = professionalHistory[user][recordIndex];
        return (
            record.dataHash,
            record.startDate,
            record.endDate,
            record.verifier,
            record.isVerified,
            record.createdAt
        );
    }
}
