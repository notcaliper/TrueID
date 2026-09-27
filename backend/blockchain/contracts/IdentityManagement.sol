// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IERC165
 * @dev Interface of the ERC-165 standard for contract interface detection.
 */
interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

/**
 * @title IERC721Metadata
 * @dev Minimal ERC-721 Metadata interface for Soulbound Identity presentation.
 */
interface IERC721Metadata is IERC165 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

/**
 * @title IERC5192
 * @dev Minimal Soulbound NFT interface according to EIP-5192.
 */
interface IERC5192 is IERC165 {
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);

    function locked(uint256 tokenId) external view returns (bool);
}

/**
 * @title TrueIDIdentityRegistry (IdentityManagement)
 * @author TrueID Protocol Architecture Team
 * @notice Enterprise-grade decentralized sovereign identity registry and soulbound credential attestation protocol.
 *         Features:
 *         - Self-sovereign cryptographic identity vaults
 *         - Sybil-resistant biometric facemesh hash attestations
 *         - EIP-5192 compliant non-transferable Soulbound Badges (SBT)
 *         - Tamper-proof biometric proof-of-liveness audit ledger
 *         - Multi-tiered professional and educational credential verifications
 *         - Granular Role-Based Access Control (RBAC) with emergency circuit breaker
 */
contract IdentityManagement is IERC165, IERC721Metadata, IERC5192 {
    // =========================================================================
    // Protocol Constants & Roles
    // =========================================================================

    string public constant PROTOCOL_VERSION = "2.0.0";
    string public constant SYSTEM_NAME = "TrueID Sovereign Identity & Credential Registry";

    // ERC-721 Metadata
    string private constant _name = "TrueID Soulbound Identity";
    string private constant _symbol = "TRUEID";

    // Roles (keccak256 hashed identifiers)
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");
    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER");
    bytes32 public constant USER_ROLE = keccak256("USER");

    // =========================================================================
    // Custom Errors (Optimized Gas Architecture)
    // =========================================================================

    error IdentityAlreadyExists(address account);
    error IdentityDoesNotExist(address account);
    error BiometricHashAlreadyClaimed(bytes32 biometricHash, address existingOwner);
    error InvalidBiometricHash();
    error UnauthorizedRole(bytes32 roleRequired, address caller);
    error UnauthorizedAction(address caller);
    error ProtocolIsPaused();
    error RecordIndexOutOfBounds(uint256 index, uint256 totalRecords);
    error InvalidDateRange(uint256 startDate, uint256 endDate);
    error SoulboundTransferDisabled();
    error TokenDoesNotExist(uint256 tokenId);
    error ZeroAddressProhibited();

    // =========================================================================
    // Data Structures
    // =========================================================================

    struct Identity {
        bytes32 biometricHash;            // SHA-256 hash of facemesh biometric landmarks
        bytes32 professionalDataHash;      // SHA-256 hash of user's off-chain credential store
        uint256 createdAt;                // Timestamp when sovereign identity was initialized
        uint256 updatedAt;                // Timestamp of last state update
        address updatedBy;                // Address of identity modifier
        bool isVerified;                  // Official verification status
        uint8 verificationLevel;          // Tier: 0 = Unverified, 1 = Verified Citizen, 2 = Platinum/Institutional
        uint256 lastBiometricCheck;       // Timestamp of latest live biometric liveness check
        uint256 soulboundTokenId;         // Bound EIP-5192 NFT token ID (0 if not yet minted)
    }

    struct ProfessionalRecord {
        bytes32 dataHash;                 // Hash of credential payload (employment/degree/license)
        uint256 startDate;                // Start timestamp
        uint256 endDate;                  // Completion timestamp (0 if currently active)
        address verifier;                 // Authorized verifier / institution address
        bool isVerified;                  // Attestation state
        uint256 createdAt;                // Timestamp record was stored
        string recordType;                // E.g. "EMPLOYMENT", "DEGREE", "LICENSE", "CREDENTIAL"
        string metadataURI;               // Optional IPFS/Arweave metadata URI
    }

    struct SoulboundBadge {
        address recipient;                // Owner of the badge
        string badgeType;                 // Category e.g. "CITIZEN_KYC", "GOVERNMENT_VERIFIED"
        string tokenURI;                  // Decentralized metadata locator
        uint256 issuedAt;                 // Issuance timestamp
        bool isValid;                     // Validity status
    }

    // =========================================================================
    // State Variables & Storage Mappings
    // =========================================================================

    address public contractOwner;
    bool public paused;
    uint256 private _nextTokenId = 1;

    // Core Identity mappings
    mapping(address => Identity) private identities;
    mapping(address => bool) private hasIdentity;
    mapping(bytes32 => address) private biometricToUser; // 1-to-1 Sybil resistance mapping
    mapping(address => ProfessionalRecord[]) private professionalHistory;
    mapping(address => mapping(bytes32 => bool)) private roles;

    // Soulbound NFT mappings (EIP-5192 / ERC-721 subset)
    mapping(uint256 => SoulboundBadge) private _soulboundBadges;
    mapping(address => uint256) private _userToTokenId;
    mapping(uint256 => address) private _tokenOwners;
    mapping(address => uint256) private _balances;

    // Total counts
    uint256 public totalIdentitiesRegistered;
    uint256 public totalIdentitiesVerified;
    uint256 public totalBiometricChecksLogged;

    // =========================================================================
    // Events
    // =========================================================================

    event IdentityCreated(address indexed user, bytes32 biometricHash, uint256 timestamp);
    event IdentityUpdated(address indexed user, address indexed updatedBy, uint256 timestamp);
    event IdentityVerified(address indexed user, address indexed verifier, uint256 timestamp);
    event IdentityRevoked(address indexed user, address indexed authority, string reason, uint256 timestamp);
    event VerificationLevelUpdated(address indexed user, uint8 oldLevel, uint8 newLevel, address indexed authority);
    
    event BiometricVerificationLogged(address indexed user, bytes32 sessionProofHash, uint256 timestamp);
    
    event ProfessionalRecordAdded(address indexed user, bytes32 dataHash, uint256 timestamp);
    event ProfessionalRecordVerified(address indexed user, uint256 recordIndex, address indexed verifier, uint256 timestamp);
    event ProfessionalRecordRevoked(address indexed user, uint256 recordIndex, address indexed authority, string reason, uint256 timestamp);
    
    event SoulboundBadgeIssued(address indexed recipient, uint256 indexed tokenId, string badgeType, uint256 timestamp);
    event SoulboundBadgeRevoked(address indexed recipient, uint256 indexed tokenId, uint256 timestamp);
    
    event RoleGranted(address indexed account, bytes32 indexed role, address indexed grantor);
    event RoleRevoked(address indexed account, bytes32 indexed role, address indexed revoker);
    
    event SystemPaused(address indexed admin, uint256 timestamp);
    event SystemUnpaused(address indexed admin, uint256 timestamp);

    // ERC-721 and EIP-5192 standard events
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    // =========================================================================
    // Modifiers
    // =========================================================================

    modifier onlyOwner() {
        if (msg.sender != contractOwner) revert UnauthorizedAction(msg.sender);
        _;
    }

    modifier onlyRole(bytes32 role) {
        if (!roles[msg.sender][role] && !roles[msg.sender][ADMIN_ROLE] && msg.sender != contractOwner) {
            revert UnauthorizedRole(role, msg.sender);
        }
        _;
    }

    modifier identityExists(address user) {
        if (!hasIdentity[user]) revert IdentityDoesNotExist(user);
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ProtocolIsPaused();
        _;
    }

    // =========================================================================
    // Constructor
    // =========================================================================

    constructor() {
        contractOwner = msg.sender;

        // Provision initial admin and authority roles
        roles[msg.sender][ADMIN_ROLE] = true;
        roles[msg.sender][GOVERNMENT_ROLE] = true;
        roles[msg.sender][VERIFIER_ROLE] = true;
        roles[msg.sender][ISSUER_ROLE] = true;

        emit RoleGranted(msg.sender, ADMIN_ROLE, msg.sender);
        emit RoleGranted(msg.sender, GOVERNMENT_ROLE, msg.sender);
        emit RoleGranted(msg.sender, VERIFIER_ROLE, msg.sender);
        emit RoleGranted(msg.sender, ISSUER_ROLE, msg.sender);
    }

    // =========================================================================
    // Core Identity Functions
    // =========================================================================

    /**
     * @notice Register a sovereign identity with biometric facial attestation
     * @param biometricHash SHA-256 hash of facemesh biometric landmark dataset
     * @param professionalDataHash Hash of initial encrypted credential payload
     */
    function createIdentity(bytes32 biometricHash, bytes32 professionalDataHash) 
        external 
        whenNotPaused 
    {
        if (hasIdentity[msg.sender]) revert IdentityAlreadyExists(msg.sender);
        if (biometricHash == bytes32(0)) revert InvalidBiometricHash();

        address existingOwner = biometricToUser[biometricHash];
        if (existingOwner != address(0) && existingOwner != msg.sender) {
            revert BiometricHashAlreadyClaimed(biometricHash, existingOwner);
        }

        Identity storage id = identities[msg.sender];
        id.biometricHash = biometricHash;
        id.professionalDataHash = professionalDataHash;
        id.createdAt = block.timestamp;
        id.updatedAt = block.timestamp;
        id.updatedBy = msg.sender;
        id.isVerified = false;
        id.verificationLevel = 0;
        id.lastBiometricCheck = block.timestamp;

        hasIdentity[msg.sender] = true;
        biometricToUser[biometricHash] = msg.sender;
        roles[msg.sender][USER_ROLE] = true;
        totalIdentitiesRegistered += 1;

        emit IdentityCreated(msg.sender, biometricHash, block.timestamp);
        emit RoleGranted(msg.sender, USER_ROLE, msg.sender);
    }

    /**
     * @notice Update biometric landmark hash of an identity with Sybil checks
     * @param user Target user address
     * @param newBiometricHash Updated biometric hash
     */
    function updateBiometricHash(address user, bytes32 newBiometricHash) 
        external 
        whenNotPaused
        identityExists(user) 
    {
        if (user != msg.sender && !roles[msg.sender][GOVERNMENT_ROLE] && !roles[msg.sender][ADMIN_ROLE]) {
            revert UnauthorizedAction(msg.sender);
        }
        if (newBiometricHash == bytes32(0)) revert InvalidBiometricHash();

        address existingOwner = biometricToUser[newBiometricHash];
        if (existingOwner != address(0) && existingOwner != user) {
            revert BiometricHashAlreadyClaimed(newBiometricHash, existingOwner);
        }

        Identity storage id = identities[user];
        bytes32 oldBiometric = id.biometricHash;
        if (oldBiometric != bytes32(0)) {
            delete biometricToUser[oldBiometric];
        }

        id.biometricHash = newBiometricHash;
        id.updatedAt = block.timestamp;
        id.updatedBy = msg.sender;
        id.lastBiometricCheck = block.timestamp;
        biometricToUser[newBiometricHash] = user;

        emit IdentityUpdated(user, msg.sender, block.timestamp);
    }

    /**
     * @notice Update user's encrypted professional payload hash
     * @param newProfessionalDataHash Updated hash of off-chain professional vault
     */
    function updateProfessionalData(bytes32 newProfessionalDataHash) 
        external 
        whenNotPaused
        identityExists(msg.sender) 
    {
        Identity storage id = identities[msg.sender];
        id.professionalDataHash = newProfessionalDataHash;
        id.updatedAt = block.timestamp;
        id.updatedBy = msg.sender;

        emit IdentityUpdated(msg.sender, msg.sender, block.timestamp);
    }

    /**
     * @notice Officially verify a citizen identity and issue Soulbound SBT
     * @param user Citizen wallet address
     */
    function verifyIdentity(address user) 
        external 
        whenNotPaused
        onlyRole(GOVERNMENT_ROLE) 
        identityExists(user) 
    {
        Identity storage id = identities[user];
        if (!id.isVerified) {
            totalIdentitiesVerified += 1;
        }

        id.isVerified = true;
        id.verificationLevel = 1; // Standard citizen verification
        id.updatedAt = block.timestamp;
        id.updatedBy = msg.sender;

        // Auto-mint Soulbound Identity Badge if not yet minted
        if (id.soulboundTokenId == 0) {
            _issueSoulboundBadge(user, "STANDARD_CITIZEN", "");
        }

        emit IdentityVerified(user, msg.sender, block.timestamp);
    }

    /**
     * @notice Upgrade or set custom verification tier
     * @param user Target address
     * @param level Tier (1 = Verified Citizen, 2 = Institutional / Platinum)
     */
    function setVerificationLevel(address user, uint8 level) 
        external 
        whenNotPaused
        onlyRole(GOVERNMENT_ROLE) 
        identityExists(user) 
    {
        Identity storage id = identities[user];
        uint8 oldLevel = id.verificationLevel;

        id.verificationLevel = level;
        id.isVerified = (level > 0);
        id.updatedAt = block.timestamp;
        id.updatedBy = msg.sender;

        if (id.soulboundTokenId == 0 && level > 0) {
            _issueSoulboundBadge(user, level == 2 ? "PLATINUM_CITIZEN" : "STANDARD_CITIZEN", "");
        }

        emit VerificationLevelUpdated(user, oldLevel, level, msg.sender);
    }

    /**
     * @notice Revoke or suspend a user's verification status and Soulbound badge
     * @param user Target user address
     * @param reason Documented explanation of revocation
     */
    function revokeIdentity(address user, string calldata reason)
        external
        onlyRole(GOVERNMENT_ROLE)
        identityExists(user)
    {
        Identity storage id = identities[user];
        if (id.isVerified && totalIdentitiesVerified > 0) {
            totalIdentitiesVerified -= 1;
        }

        id.isVerified = false;
        id.verificationLevel = 0;
        id.updatedAt = block.timestamp;
        id.updatedBy = msg.sender;

        if (id.soulboundTokenId != 0) {
            _soulboundBadges[id.soulboundTokenId].isValid = false;
            emit SoulboundBadgeRevoked(user, id.soulboundTokenId, block.timestamp);
        }

        emit IdentityRevoked(user, msg.sender, reason, block.timestamp);
    }

    /**
     * @notice Log live biometric face authentication session proof
     * @param user Authenticated user address
     * @param sessionProofHash Cryptographic match hash
     */
    function logBiometricVerification(address user, bytes32 sessionProofHash)
        external
        whenNotPaused
        identityExists(user)
    {
        if (user != msg.sender && !roles[msg.sender][VERIFIER_ROLE] && !roles[msg.sender][ADMIN_ROLE]) {
            revert UnauthorizedAction(msg.sender);
        }

        identities[user].lastBiometricCheck = block.timestamp;
        totalBiometricChecksLogged += 1;

        emit BiometricVerificationLogged(user, sessionProofHash, block.timestamp);
    }

    // =========================================================================
    // Professional Credential Vault
    // =========================================================================

    /**
     * @notice Add a professional record to caller's identity vault
     * @param dataHash Cryptographic hash of document
     * @param startDate Commencement timestamp
     * @param endDate Completion timestamp (0 if current)
     */
    function addProfessionalRecord(bytes32 dataHash, uint256 startDate, uint256 endDate) 
        external 
        whenNotPaused
        identityExists(msg.sender) 
    {
        _addRecord(msg.sender, dataHash, startDate, endDate, "CREDENTIAL", "");
    }

    /**
     * @notice Add a typed professional record with metadata
     * @param dataHash Cryptographic hash of credential
     * @param startDate Commencement timestamp
     * @param endDate Completion timestamp (0 if current)
     * @param recordType Type descriptor ("EMPLOYMENT", "DEGREE", "LICENSE")
     */
    function addTypedProfessionalRecord(
        bytes32 dataHash,
        uint256 startDate,
        uint256 endDate,
        string calldata recordType
    ) external whenNotPaused identityExists(msg.sender) {
        _addRecord(msg.sender, dataHash, startDate, endDate, recordType, "");
    }

    /**
     * @notice Add a typed professional record with URI pointer
     */
    function addTypedProfessionalRecordWithURI(
        bytes32 dataHash,
        uint256 startDate,
        uint256 endDate,
        string calldata recordType,
        string calldata metadataURI
    ) external whenNotPaused identityExists(msg.sender) {
        _addRecord(msg.sender, dataHash, startDate, endDate, recordType, metadataURI);
    }

    function _addRecord(
        address user,
        bytes32 dataHash,
        uint256 startDate,
        uint256 endDate,
        string memory recordType,
        string memory metadataURI
    ) internal {
        if (startDate > block.timestamp) revert InvalidDateRange(startDate, endDate);
        if (endDate != 0 && endDate < startDate) revert InvalidDateRange(startDate, endDate);

        professionalHistory[user].push(ProfessionalRecord({
            dataHash: dataHash,
            startDate: startDate,
            endDate: endDate,
            verifier: address(0),
            isVerified: false,
            createdAt: block.timestamp,
            recordType: recordType,
            metadataURI: metadataURI
        }));

        emit ProfessionalRecordAdded(user, dataHash, block.timestamp);
    }

    /**
     * @notice Verify a professional record by authorized verifier / employer
     * @param user Citizen wallet address
     * @param recordIndex Index of record in citizen history
     */
    function verifyProfessionalRecord(address user, uint256 recordIndex) 
        external 
        whenNotPaused
        onlyRole(VERIFIER_ROLE) 
        identityExists(user) 
    {
        if (recordIndex >= professionalHistory[user].length) {
            revert RecordIndexOutOfBounds(recordIndex, professionalHistory[user].length);
        }

        ProfessionalRecord storage rec = professionalHistory[user][recordIndex];
        rec.isVerified = true;
        rec.verifier = msg.sender;

        emit ProfessionalRecordVerified(user, recordIndex, msg.sender, block.timestamp);
    }

    /**
     * @notice Revoke a professional record
     */
    function revokeProfessionalRecord(address user, uint256 recordIndex, string calldata reason)
        external
        onlyRole(VERIFIER_ROLE)
        identityExists(user)
    {
        if (recordIndex >= professionalHistory[user].length) {
            revert RecordIndexOutOfBounds(recordIndex, professionalHistory[user].length);
        }

        ProfessionalRecord storage rec = professionalHistory[user][recordIndex];
        rec.isVerified = false;

        emit ProfessionalRecordRevoked(user, recordIndex, msg.sender, reason, block.timestamp);
    }

    // =========================================================================
    // EIP-5192 / Soulbound Token Mechanics
    // =========================================================================

    /**
     * @notice Query soulbound locked status - always true for TrueID identity badges
     */
    function locked(uint256 tokenId) external view override returns (bool) {
        if (_tokenOwners[tokenId] == address(0)) revert TokenDoesNotExist(tokenId);
        return true;
    }

    /**
     * @notice Internal function to issue a Soulbound identity badge
     */
    function _issueSoulboundBadge(
        address recipient,
        string memory badgeType,
        string memory uri
    ) internal returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        
        _tokenOwners[tokenId] = recipient;
        _balances[recipient] += 1;
        _userToTokenId[recipient] = tokenId;
        identities[recipient].soulboundTokenId = tokenId;

        _soulboundBadges[tokenId] = SoulboundBadge({
            recipient: recipient,
            badgeType: badgeType,
            tokenURI: uri,
            issuedAt: block.timestamp,
            isValid: true
        });

        emit Transfer(address(0), recipient, tokenId);
        emit Locked(tokenId);
        emit SoulboundBadgeIssued(recipient, tokenId, badgeType, block.timestamp);

        return tokenId;
    }

    /**
     * @notice Explicitly mint a specialized soulbound credential badge
     */
    function mintSoulboundBadge(
        address recipient,
        string calldata badgeType,
        string calldata uri
    ) external onlyRole(GOVERNMENT_ROLE) identityExists(recipient) returns (uint256) {
        return _issueSoulboundBadge(recipient, badgeType, uri);
    }

    /**
     * @dev Reverts on any transfer attempt (Soulbound tokens cannot be transferred)
     */
    function transferFrom(address, address, uint256) external pure {
        revert SoulboundTransferDisabled();
    }

    function safeTransferFrom(address, address, uint256) external pure {
        revert SoulboundTransferDisabled();
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) external pure {
        revert SoulboundTransferDisabled();
    }

    function approve(address, uint256) external pure {
        revert SoulboundTransferDisabled();
    }

    function setApprovalForAll(address, bool) external pure {
        revert SoulboundTransferDisabled();
    }

    function getApproved(uint256) external pure returns (address) {
        return address(0);
    }

    function isApprovedForAll(address, address) external pure returns (bool) {
        return false;
    }

    // =========================================================================
    // View Functions
    // =========================================================================

    function name() external pure override returns (string memory) {
        return _name;
    }

    function symbol() external pure override returns (string memory) {
        return _symbol;
    }

    function tokenURI(uint256 tokenId) external view override returns (string memory) {
        if (_tokenOwners[tokenId] == address(0)) revert TokenDoesNotExist(tokenId);
        SoulboundBadge storage badge = _soulboundBadges[tokenId];
        if (bytes(badge.tokenURI).length > 0) {
            return badge.tokenURI;
        }
        return string(abi.encodePacked("https://api.trueid.io/nft/badge/", _toString(tokenId)));
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address owner = _tokenOwners[tokenId];
        if (owner == address(0)) revert TokenDoesNotExist(tokenId);
        return owner;
    }

    function balanceOf(address owner) external view returns (uint256) {
        if (owner == address(0)) revert ZeroAddressProhibited();
        return _balances[owner];
    }

    function getBiometricHash(address user) external view identityExists(user) returns (bytes32) {
        return identities[user].biometricHash;
    }

    function isIdentityVerified(address user) external view identityExists(user) returns (bool) {
        return identities[user].isVerified;
    }

    function hasRegisteredIdentity(address user) external view returns (bool) {
        return hasIdentity[user];
    }

    function getIdentitySummary(address user) 
        external 
        view 
        identityExists(user) 
        returns (
            bytes32 biometricHash,
            bytes32 professionalDataHash,
            uint256 createdAt,
            uint256 updatedAt,
            bool isVerified,
            uint8 verificationLevel,
            uint256 lastBiometricCheck
        ) 
    {
        Identity storage id = identities[user];
        return (
            id.biometricHash,
            id.professionalDataHash,
            id.createdAt,
            id.updatedAt,
            id.isVerified,
            id.verificationLevel,
            id.lastBiometricCheck
        );
    }

    function getIdentityFull(address user)
        external
        view
        identityExists(user)
        returns (
            bytes32 biometricHash,
            bytes32 professionalDataHash,
            uint256 createdAt,
            uint256 updatedAt,
            address updatedBy,
            bool isVerified,
            uint8 verificationLevel,
            uint256 lastBiometricCheck,
            uint256 soulboundTokenId
        )
    {
        Identity storage id = identities[user];
        return (
            id.biometricHash,
            id.professionalDataHash,
            id.createdAt,
            id.updatedAt,
            id.updatedBy,
            id.isVerified,
            id.verificationLevel,
            id.lastBiometricCheck,
            id.soulboundTokenId
        );
    }

    function getProfessionalRecordCount(address user) external view returns (uint256) {
        return professionalHistory[user].length;
    }

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
        if (recordIndex >= professionalHistory[user].length) {
            revert RecordIndexOutOfBounds(recordIndex, professionalHistory[user].length);
        }
        ProfessionalRecord storage rec = professionalHistory[user][recordIndex];
        return (
            rec.dataHash,
            rec.startDate,
            rec.endDate,
            rec.verifier,
            rec.isVerified,
            rec.createdAt
        );
    }

    function getProfessionalRecordExtended(address user, uint256 recordIndex)
        external
        view
        identityExists(user)
        returns (
            bytes32 dataHash,
            uint256 startDate,
            uint256 endDate,
            address verifier,
            bool isVerified,
            uint256 createdAt,
            string memory recordType,
            string memory metadataURI
        )
    {
        if (recordIndex >= professionalHistory[user].length) {
            revert RecordIndexOutOfBounds(recordIndex, professionalHistory[user].length);
        }
        ProfessionalRecord storage rec = professionalHistory[user][recordIndex];
        return (
            rec.dataHash,
            rec.startDate,
            rec.endDate,
            rec.verifier,
            rec.isVerified,
            rec.createdAt,
            rec.recordType,
            rec.metadataURI
        );
    }

    function getUserPrimaryBadge(address user) external view returns (uint256) {
        return _userToTokenId[user];
    }

    function getSoulboundBadge(uint256 tokenId) 
        external 
        view 
        returns (
            address recipient,
            string memory badgeType,
            string memory badgeURI,
            uint256 issuedAt,
            bool isValid
        ) 
    {
        if (_tokenOwners[tokenId] == address(0)) revert TokenDoesNotExist(tokenId);
        SoulboundBadge storage badge = _soulboundBadges[tokenId];
        return (badge.recipient, badge.badgeType, badge.tokenURI, badge.issuedAt, badge.isValid);
    }

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return
            interfaceId == type(IERC165).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            interfaceId == type(IERC5192).interfaceId;
    }

    // =========================================================================
    // Access Control & Role Management
    // =========================================================================

    function grantRole(address account, bytes32 role) external onlyRole(ADMIN_ROLE) {
        if (account == address(0)) revert ZeroAddressProhibited();
        roles[account][role] = true;
        emit RoleGranted(account, role, msg.sender);
    }

    function revokeRole(address account, bytes32 role) external onlyRole(ADMIN_ROLE) {
        roles[account][role] = false;
        emit RoleRevoked(account, role, msg.sender);
    }

    function hasRole(address account, bytes32 role) external view returns (bool) {
        return roles[account][role];
    }

    // =========================================================================
    // Emergency Administration
    // =========================================================================

    function pause() external onlyRole(ADMIN_ROLE) {
        paused = true;
        emit SystemPaused(msg.sender, block.timestamp);
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        paused = false;
        emit SystemUnpaused(msg.sender, block.timestamp);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddressProhibited();
        contractOwner = newOwner;
        roles[newOwner][ADMIN_ROLE] = true;
        emit RoleGranted(newOwner, ADMIN_ROLE, msg.sender);
    }

    // =========================================================================
    // Internal Utilities
    // =========================================================================

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
