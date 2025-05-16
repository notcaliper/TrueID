// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title DBISIdentityContract
 * @dev Smart contract for the Decentralized Biometric Identity System (DBIS)
 * Combines identity verification with professional record management
 * Compatible with Hardhat and deployable to Polygon Mumbai
 */
contract DBISIdentityContract {
    // ========== STATE VARIABLES ==========
    
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");
    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT");
    bytes32 public constant USER_ROLE = keccak256("USER");
    
    // Identity struct to store user identity information
    struct Identity {
        bytes32 userId;               // Unique identifier for the user (hashed)
        bytes32 biometricHash;        // SHA-256 hash of facemesh data
        bytes32 professionalDataHash; // Hash of professional data stored off-chain
        uint256 createdAt;            // Timestamp when identity was created
        uint256 updatedAt;            // Timestamp when identity was last updated
        address updatedBy;            // Address that performed the last update
        bool isVerified;              // Government verification status
        bool isRevoked;               // Whether the identity has been revoked
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
    
    // Document record for verification
    struct Document {
        bytes32 hash;                 // Hash of the document
        address issuer;               // Address that issued the document
        uint256 timestamp;            // Timestamp when document was issued
        bool exists;                  // Whether the document exists
    }
    
    // Mappings
    mapping(address => Identity) private identities;                // User address to identity
    mapping(bytes32 => address) private userIdToAddress;            // User ID to user address
    mapping(address => bool) private hasIdentity;                   // Track if address has identity
    mapping(address => mapping(bytes32 => bool)) private roles;     // Role-based access control
    mapping(address => ProfessionalRecord[]) private professionalRecords; // Professional records
    mapping(bytes32 => Document) private documents;                 // Document verification
    
    // Admin address that deployed the contract
    address private immutable admin;
    
    // ========== EVENTS ==========
    
    event UserRegistered(
        address indexed userAddress,
        bytes32 indexed userId,
        bytes32 biometricHash,
        uint256 timestamp
    );
    
    event UserVerified(
        address indexed userAddress,
        bytes32 indexed userId,
        address indexed verifier,
        uint256 timestamp
    );
    
    event UserRevoked(
        address indexed userAddress,
        bytes32 indexed userId,
        address indexed revoker,
        uint256 timestamp
    );
    
    event UserUpdated(
        address indexed userAddress,
        bytes32 indexed userId,
        address indexed updater,
        uint256 timestamp
    );
    
    event BiometricHashUpdated(
        address indexed userAddress,
        bytes32 indexed userId,
        bytes32 newBiometricHash,
        uint256 timestamp
    );
    
    event ProfessionalDataUpdated(
        address indexed userAddress,
        bytes32 indexed userId,
        bytes32 newProfessionalDataHash,
        uint256 timestamp
    );
    
    event ProfessionalRecordAdded(
        address indexed userAddress,
        bytes32 dataHash,
        uint256 startDate,
        uint256 endDate,
        uint256 timestamp
    );
    
    event ProfessionalRecordVerified(
        address indexed userAddress,
        uint256 recordIndex,
        address indexed verifier,
        uint256 timestamp
    );
    
    event DocumentRegistered(
        bytes32 indexed documentHash,
        address indexed issuer,
        uint256 timestamp
    );
    
    event RoleGranted(
        address indexed account,
        bytes32 indexed role,
        address indexed grantor
    );
    
    event RoleRevoked(
        address indexed account,
        bytes32 indexed role,
        address indexed revoker
    );
    
    // ========== MODIFIERS ==========
    
    /**
     * @dev Modifier to restrict function access to addresses with specific role
     * @param role The role required to access the function
     */
    modifier onlyRole(bytes32 role) {
        require(roles[msg.sender][role], "DBIS: caller does not have required role");
        _;
    }
    
    /**
     * @dev Modifier to check if an identity exists for a given address
     * @param user The address to check
     */
    modifier identityExists(address user) {
        require(hasIdentity[user], "DBIS: identity does not exist");
        _;
    }
    
    /**
     * @dev Modifier to check if an identity exists for a given userId
     * @param userId The userId to check
     */
    modifier userIdExists(bytes32 userId) {
        address userAddress = userIdToAddress[userId];
        require(userAddress != address(0), "DBIS: userId does not exist");
        _;
    }
    
    /**
     * @dev Modifier to restrict function to admin or government roles
     */
    modifier onlyAdminOrGovernment() {
        require(
            roles[msg.sender][ADMIN_ROLE] || roles[msg.sender][GOVERNMENT_ROLE],
            "DBIS: caller must be admin or government"
        );
        _;
    }
    
    // ========== CONSTRUCTOR ==========
    
    /**
     * @dev Sets the contract deployer as the admin
     */
    constructor() {
        admin = msg.sender;
        roles[msg.sender][ADMIN_ROLE] = true;
        emit RoleGranted(msg.sender, ADMIN_ROLE, msg.sender);
    }
    
    // ========== EXTERNAL FUNCTIONS ==========
    
    /**
     * @dev Register a new identity
     * @param userId Unique identifier for the user (hashed)
     * @param biometricHash SHA-256 hash of the user's facemesh data
     * @param professionalDataHash Hash of professional data
     */
    function createIdentity(
        bytes32 userId,
        bytes32 biometricHash,
        bytes32 professionalDataHash
    ) external {
        // Ensure user doesn't already have an identity
        require(!hasIdentity[msg.sender], "DBIS: identity already exists for this address");
        
        // Ensure userId isn't already taken
        require(userIdToAddress[userId] == address(0), "DBIS: userId already taken");
        
        // Create new identity
        Identity storage identity = identities[msg.sender];
        identity.userId = userId;
        identity.biometricHash = biometricHash;
        identity.professionalDataHash = professionalDataHash;
        identity.createdAt = block.timestamp;
        identity.updatedAt = block.timestamp;
        identity.updatedBy = msg.sender;
        identity.isVerified = false;
        identity.isRevoked = false;
        
        // Update mappings
        hasIdentity[msg.sender] = true;
        userIdToAddress[userId] = msg.sender;
        
        // Grant user role
        roles[msg.sender][USER_ROLE] = true;
        
        // Emit event
        emit UserRegistered(msg.sender, userId, biometricHash, block.timestamp);
        emit RoleGranted(msg.sender, USER_ROLE, msg.sender);
    }
    
    /**
     * @dev Verify a user's identity (admin/government only)
     * @param userAddress Address of the user to verify
     */
    function verifyIdentity(address userAddress) 
        external 
        onlyAdminOrGovernment
        identityExists(userAddress)
    {
        Identity storage identity = identities[userAddress];
        
        // Ensure identity is not already verified
        require(!identity.isVerified, "DBIS: identity already verified");
        
        // Ensure identity is not revoked
        require(!identity.isRevoked, "DBIS: cannot verify revoked identity");
        
        // Update identity
        identity.isVerified = true;
        identity.updatedAt = block.timestamp;
        identity.updatedBy = msg.sender;
        
        // Emit event
        emit UserVerified(userAddress, identity.userId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Revoke a user's identity (admin/government only)
     * @param userAddress Address of the user to revoke
     */
    function revokeIdentity(address userAddress) 
        external 
        onlyAdminOrGovernment
        identityExists(userAddress)
    {
        Identity storage identity = identities[userAddress];
        
        // Ensure identity is not already revoked
        require(!identity.isRevoked, "DBIS: identity already revoked");
        
        // Update identity
        identity.isVerified = false;
        identity.isRevoked = true;
        identity.updatedAt = block.timestamp;
        identity.updatedBy = msg.sender;
        
        // Emit event
        emit UserRevoked(userAddress, identity.userId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Update a user's biometric hash (admin/government only)
     * @param userAddress Address of the user
     * @param newBiometricHash New SHA-256 hash of the user's facemesh data
     */
    function updateBiometricHash(
        address userAddress,
        bytes32 newBiometricHash
    ) 
        external 
        onlyAdminOrGovernment
        identityExists(userAddress)
    {
        Identity storage identity = identities[userAddress];
        
        // Ensure identity is not revoked
        require(!identity.isRevoked, "DBIS: cannot update revoked identity");
        
        // Update identity
        identity.biometricHash = newBiometricHash;
        identity.updatedAt = block.timestamp;
        identity.updatedBy = msg.sender;
        
        // Emit event
        emit BiometricHashUpdated(userAddress, identity.userId, newBiometricHash, block.timestamp);
        emit UserUpdated(userAddress, identity.userId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Update a user's professional data hash (admin/government only)
     * @param userAddress Address of the user
     * @param newProfessionalDataHash New hash of professional data
     */
    function updateProfessionalDataHash(
        address userAddress,
        bytes32 newProfessionalDataHash
    ) 
        external 
        onlyAdminOrGovernment
        identityExists(userAddress)
    {
        Identity storage identity = identities[userAddress];
        
        // Ensure identity is not revoked
        require(!identity.isRevoked, "DBIS: cannot update revoked identity");
        
        // Update identity
        identity.professionalDataHash = newProfessionalDataHash;
        identity.updatedAt = block.timestamp;
        identity.updatedBy = msg.sender;
        
        // Emit event
        emit ProfessionalDataUpdated(userAddress, identity.userId, newProfessionalDataHash, block.timestamp);
        emit UserUpdated(userAddress, identity.userId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Add a professional record
     * @param dataHash Hash of professional record data
     * @param startDate Start date of employment/education
     * @param endDate End date of employment/education (0 if current)
     */
    function addProfessionalRecord(
        bytes32 dataHash,
        uint256 startDate,
        uint256 endDate
    ) 
        external 
        identityExists(msg.sender)
    {
        Identity storage identity = identities[msg.sender];
        
        // Ensure identity is not revoked
        require(!identity.isRevoked, "DBIS: cannot add record for revoked identity");
        
        // Create new professional record
        ProfessionalRecord memory record = ProfessionalRecord({
            dataHash: dataHash,
            startDate: startDate,
            endDate: endDate,
            verifier: address(0),
            isVerified: false,
            createdAt: block.timestamp
        });
        
        // Add record to user's professional history
        professionalRecords[msg.sender].push(record);
        
        // Emit event
        emit ProfessionalRecordAdded(
            msg.sender,
            dataHash,
            startDate,
            endDate,
            block.timestamp
        );
    }
    
    /**
     * @dev Verify a professional record (government only)
     * @param userAddress Address of the user
     * @param recordIndex Index of the record in the user's professional history
     */
    function verifyProfessionalRecord(
        address userAddress,
        uint256 recordIndex
    ) 
        external 
        onlyRole(GOVERNMENT_ROLE) 
        identityExists(userAddress)
    {
        // Ensure record exists
        require(
            recordIndex < professionalRecords[userAddress].length,
            "DBIS: record does not exist"
        );
        
        // Get record
        ProfessionalRecord storage record = professionalRecords[userAddress][recordIndex];
        
        // Ensure record is not already verified
        require(!record.isVerified, "DBIS: record already verified");
        
        // Update record
        record.isVerified = true;
        record.verifier = msg.sender;
        
        // Emit event
        emit ProfessionalRecordVerified(
            userAddress,
            recordIndex,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @dev Register a document for verification
     * @param documentHash Hash of the document
     */
    function registerDocument(bytes32 documentHash) 
        external 
        onlyAdminOrGovernment
    {
        // Ensure document doesn't already exist
        require(!documents[documentHash].exists, "DBIS: document already registered");
        
        // Create new document
        Document storage document = documents[documentHash];
        document.hash = documentHash;
        document.issuer = msg.sender;
        document.timestamp = block.timestamp;
        document.exists = true;
        
        // Emit event
        emit DocumentRegistered(documentHash, msg.sender, block.timestamp);
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
        // Prevent revoking admin role from the original admin
        if (role == ADMIN_ROLE && account == admin) {
            revert("DBIS: cannot revoke admin role from original admin");
        }
        
        roles[account][role] = false;
        emit RoleRevoked(account, role, msg.sender);
    }
    
    // ========== VIEW FUNCTIONS ==========
    
    /**
     * @dev Get identity information for a user
     * @param userAddress Address of the user
     * @return userId Unique identifier for the user
     * @return biometricHash SHA-256 hash of the user's facemesh data
     * @return professionalDataHash Hash of professional data
     * @return isVerified Whether the identity is verified
     * @return isRevoked Whether the identity is revoked
     * @return timestamp Timestamp when identity was last updated
     */
    function getIdentity(address userAddress) 
        external 
        view 
        identityExists(userAddress)
        returns (
            bytes32 userId,
            bytes32 biometricHash,
            bytes32 professionalDataHash,
            bool isVerified,
            bool isRevoked,
            uint256 timestamp
        ) 
    {
        Identity storage identity = identities[userAddress];
        return (
            identity.userId,
            identity.biometricHash,
            identity.professionalDataHash,
            identity.isVerified,
            identity.isRevoked,
            identity.updatedAt
        );
    }
    
    /**
     * @dev Get identity information for a userId
     * @param userId Unique identifier for the user
     * @return userAddress Address of the user
     * @return biometricHash SHA-256 hash of the user's facemesh data
     * @return professionalDataHash Hash of professional data
     * @return isVerified Whether the identity is verified
     * @return isRevoked Whether the identity is revoked
     * @return timestamp Timestamp when identity was last updated
     */
    function getIdentityByUserId(bytes32 userId) 
        external 
        view 
        userIdExists(userId)
        returns (
            address userAddress,
            bytes32 biometricHash,
            bytes32 professionalDataHash,
            bool isVerified,
            bool isRevoked,
            uint256 timestamp
        ) 
    {
        address user = userIdToAddress[userId];
        Identity storage identity = identities[user];
        return (
            user,
            identity.biometricHash,
            identity.professionalDataHash,
            identity.isVerified,
            identity.isRevoked,
            identity.updatedAt
        );
    }
    
    /**
     * @dev Get a professional record for a user
     * @param userAddress Address of the user
     * @param recordIndex Index of the record
     * @return dataHash Hash of the record data
     * @return startDate Start date
     * @return endDate End date
     * @return verifier Address of the verifier
     * @return isVerified Verification status
     * @return createdAt Creation timestamp
     */
    function getProfessionalRecord(
        address userAddress,
        uint256 recordIndex
    ) 
        external 
        view 
        identityExists(userAddress)
        returns (
            bytes32 dataHash,
            uint256 startDate,
            uint256 endDate,
            address verifier,
            bool isVerified,
            uint256 createdAt
        ) 
    {
        require(
            recordIndex < professionalRecords[userAddress].length,
            "DBIS: record does not exist"
        );
        
        ProfessionalRecord storage record = professionalRecords[userAddress][recordIndex];
        return (
            record.dataHash,
            record.startDate,
            record.endDate,
            record.verifier,
            record.isVerified,
            record.createdAt
        );
    }
    
    /**
     * @dev Get the number of professional records for a user
     * @param userAddress Address of the user
     * @return uint256 Number of professional records
     */
    function getProfessionalRecordCount(address userAddress) 
        external 
        view 
        returns (uint256) 
    {
        return professionalRecords[userAddress].length;
    }
    
    /**
     * @dev Verify a document
     * @param documentHash Hash of the document to verify
     * @return exists Whether the document exists
     * @return issuer Address of the issuer
     * @return timestamp Timestamp when document was issued
     */
    function verifyDocument(bytes32 documentHash) 
        external 
        view 
        returns (
            bool exists,
            address issuer,
            uint256 timestamp
        ) 
    {
        Document storage document = documents[documentHash];
        return (
            document.exists,
            document.issuer,
            document.timestamp
        );
    }
    
    /**
     * @dev Check if an account has a specific role
     * @param account Address to check
     * @param role Role to check
     * @return bool True if the account has the role
     */
    function hasRole(address account, bytes32 role) 
        external 
        view 
        returns (bool) 
    {
        return roles[account][role];
    }
    
    /**
     * @dev Check if a user's identity is verified
     * @param userAddress Address of the user
     * @return bool True if the identity is verified and not revoked
     */
    function isIdentityVerified(address userAddress) 
        external 
        view 
        identityExists(userAddress)
        returns (bool) 
    {
        Identity storage identity = identities[userAddress];
        return identity.isVerified && !identity.isRevoked;
    }
    
    /**
     * @dev Get biometric hash for a user
     * @param userAddress Address of the user
     * @return bytes32 Biometric hash
     */
    function getBiometricHash(address userAddress) 
        external 
        view 
        identityExists(userAddress) 
        returns (bytes32) 
    {
        return identities[userAddress].biometricHash;
    }
}
