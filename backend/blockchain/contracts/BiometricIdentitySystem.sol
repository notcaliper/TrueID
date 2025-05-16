// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title BiometricIdentitySystem
 * @dev Smart contract for decentralized biometric identity management
 * Supports user registration, government verification, and credential management
 * Compatible with Hardhat and deployable to Polygon Mumbai
 */
contract BiometricIdentitySystem {
    // ========== STATE VARIABLES ==========
    
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");
    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT");
    bytes32 public constant USER_ROLE = keccak256("USER");
    
    // Identity struct to store user identity information
    struct Identity {
        bytes32 userId;               // Unique identifier for the user (hashed)
        bytes32 biometricHash;        // SHA-256 hash of facemesh data
        bytes32 credentialsHash;      // Optional hash of user metadata or certificates
        uint256 createdAt;            // Timestamp when identity was created
        uint256 lastUpdated;          // Timestamp when identity was last updated
        address updatedBy;            // Address that performed the last update
        bool isVerified;              // Government verification status
        bool isRevoked;               // Whether the identity has been revoked
    }
    
    // Mappings
    mapping(address => Identity) private identities;        // User address to identity
    mapping(bytes32 => address) private userIdToAddress;    // User ID to user address
    mapping(address => bool) private hasIdentity;           // Track if address has identity
    mapping(address => mapping(bytes32 => bool)) private roles; // Role-based access control
    
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
    
    event CredentialsHashUpdated(
        address indexed userAddress,
        bytes32 indexed userId,
        bytes32 newCredentialsHash,
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
        require(roles[msg.sender][role], "BiometricIdentitySystem: caller does not have required role");
        _;
    }
    
    /**
     * @dev Modifier to check if an identity exists for a given address
     * @param user The address to check
     */
    modifier identityExists(address user) {
        require(hasIdentity[user], "BiometricIdentitySystem: identity does not exist");
        _;
    }
    
    /**
     * @dev Modifier to check if an identity exists for a given userId
     * @param userId The userId to check
     */
    modifier userIdExists(bytes32 userId) {
        address userAddress = userIdToAddress[userId];
        require(userAddress != address(0), "BiometricIdentitySystem: userId does not exist");
        _;
    }
    
    /**
     * @dev Modifier to restrict function to admin or government roles
     */
    modifier onlyAdminOrGovernment() {
        require(
            roles[msg.sender][ADMIN_ROLE] || roles[msg.sender][GOVERNMENT_ROLE],
            "BiometricIdentitySystem: caller must be admin or government"
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
     * @param credentialsHash Optional hash of user metadata or certificates
     */
    function registerIdentity(
        bytes32 userId,
        bytes32 biometricHash,
        bytes32 credentialsHash
    ) external {
        // Ensure user doesn't already have an identity
        require(!hasIdentity[msg.sender], "BiometricIdentitySystem: identity already exists for this address");
        
        // Ensure userId isn't already taken
        require(userIdToAddress[userId] == address(0), "BiometricIdentitySystem: userId already taken");
        
        // Create new identity
        Identity storage identity = identities[msg.sender];
        identity.userId = userId;
        identity.biometricHash = biometricHash;
        identity.credentialsHash = credentialsHash;
        identity.createdAt = block.timestamp;
        identity.lastUpdated = block.timestamp;
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
        require(!identity.isVerified, "BiometricIdentitySystem: identity already verified");
        
        // Ensure identity is not revoked
        require(!identity.isRevoked, "BiometricIdentitySystem: cannot verify revoked identity");
        
        // Update identity
        identity.isVerified = true;
        identity.lastUpdated = block.timestamp;
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
        require(!identity.isRevoked, "BiometricIdentitySystem: identity already revoked");
        
        // Update identity
        identity.isVerified = false;
        identity.isRevoked = true;
        identity.lastUpdated = block.timestamp;
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
        require(!identity.isRevoked, "BiometricIdentitySystem: cannot update revoked identity");
        
        // Update identity
        identity.biometricHash = newBiometricHash;
        identity.lastUpdated = block.timestamp;
        identity.updatedBy = msg.sender;
        
        // Emit event
        emit BiometricHashUpdated(userAddress, identity.userId, newBiometricHash, block.timestamp);
        emit UserUpdated(userAddress, identity.userId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Update a user's credentials hash (admin/government only)
     * @param userAddress Address of the user
     * @param newCredentialsHash New hash of user metadata or certificates
     */
    function updateCredentialsHash(
        address userAddress,
        bytes32 newCredentialsHash
    ) 
        external 
        onlyAdminOrGovernment
        identityExists(userAddress)
    {
        Identity storage identity = identities[userAddress];
        
        // Ensure identity is not revoked
        require(!identity.isRevoked, "BiometricIdentitySystem: cannot update revoked identity");
        
        // Update identity
        identity.credentialsHash = newCredentialsHash;
        identity.lastUpdated = block.timestamp;
        identity.updatedBy = msg.sender;
        
        // Emit event
        emit CredentialsHashUpdated(userAddress, identity.userId, newCredentialsHash, block.timestamp);
        emit UserUpdated(userAddress, identity.userId, msg.sender, block.timestamp);
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
            revert("BiometricIdentitySystem: cannot revoke admin role from original admin");
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
     * @return credentialsHash Hash of user metadata or certificates
     * @return isVerified Whether the identity is verified
     * @return isRevoked Whether the identity is revoked
     * @return lastUpdated Timestamp when identity was last updated
     */
    function getIdentity(address userAddress) 
        external 
        view 
        identityExists(userAddress)
        returns (
            bytes32 userId,
            bytes32 biometricHash,
            bytes32 credentialsHash,
            bool isVerified,
            bool isRevoked,
            uint256 lastUpdated
        ) 
    {
        Identity storage identity = identities[userAddress];
        return (
            identity.userId,
            identity.biometricHash,
            identity.credentialsHash,
            identity.isVerified,
            identity.isRevoked,
            identity.lastUpdated
        );
    }
    
    /**
     * @dev Get identity information for a userId
     * @param userId Unique identifier for the user
     * @return userAddress Address of the user
     * @return biometricHash SHA-256 hash of the user's facemesh data
     * @return credentialsHash Hash of user metadata or certificates
     * @return isVerified Whether the identity is verified
     * @return isRevoked Whether the identity is revoked
     * @return lastUpdated Timestamp when identity was last updated
     */
    function getIdentityByUserId(bytes32 userId) 
        external 
        view 
        userIdExists(userId)
        returns (
            address userAddress,
            bytes32 biometricHash,
            bytes32 credentialsHash,
            bool isVerified,
            bool isRevoked,
            uint256 lastUpdated
        ) 
    {
        address user = userIdToAddress[userId];
        Identity storage identity = identities[user];
        return (
            user,
            identity.biometricHash,
            identity.credentialsHash,
            identity.isVerified,
            identity.isRevoked,
            identity.lastUpdated
        );
    }
    
    /**
     * @dev Check if an address has a specific role
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
     * @return bool True if the identity is verified
     */
    function isIdentityVerified(address userAddress) 
        external 
        view 
        identityExists(userAddress)
        returns (bool) 
    {
        return identities[userAddress].isVerified && !identities[userAddress].isRevoked;
    }
    
    /**
     * @dev Check if a user's identity exists
     * @param userAddress Address of the user
     * @return bool True if the identity exists
     */
    function identityExistsForAddress(address userAddress) 
        external 
        view 
        returns (bool) 
    {
        return hasIdentity[userAddress];
    }
    
    /**
     * @dev Check if a userId is registered
     * @param userId Unique identifier for the user
     * @return bool True if the userId is registered
     */
    function userIdIsRegistered(bytes32 userId) 
        external 
        view 
        returns (bool) 
    {
        return userIdToAddress[userId] != address(0);
    }
    
    /**
     * @dev Get the address associated with a userId
     * @param userId Unique identifier for the user
     * @return address Address of the user
     */
    function getAddressByUserId(bytes32 userId) 
        external 
        view 
        returns (address) 
    {
        return userIdToAddress[userId];
    }
    
    /**
     * @dev Verify a document hash against a user's credentials
     * @param userAddress Address of the user
     * @param documentHash Hash of the document to verify
     * @return bool True if the document hash matches the user's credentials hash
     */
    function verifyDocument(address userAddress, bytes32 documentHash) 
        external 
        view 
        identityExists(userAddress)
        returns (bool) 
    {
        Identity storage identity = identities[userAddress];
        return identity.isVerified && 
               !identity.isRevoked && 
               identity.credentialsHash == documentHash;
    }
}
