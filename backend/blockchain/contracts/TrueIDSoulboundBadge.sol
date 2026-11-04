// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Interface for the ERC-5192 standard: Minimal Soulbound NFTs
 * https://eips.ethereum.org/EIPS/eip-5192
 */
interface IERC5192 {
    /// @notice Emitted when the locking status of an NFT is set to locked.
    event Locked(uint256 tokenId);

    /// @notice Emitted when the locking status of an NFT is set to unlocked.
    event Unlocked(uint256 tokenId);

    /// @notice Returns the locking status of an Soulbound NFT.
    /// @dev All TrueID identity badges are non-transferable and permanently locked.
    function locked(uint256 tokenId) external view returns (bool);
}

/**
 * @title TrueIDSoulboundBadge
 * @author TrueID Protocol
 * @notice Production ERC-5192 compliant Soulbound Credential Token (SBT) for TrueID citizens.
 *         Tokens are permanently bound to citizen wallet addresses and cannot be sold, traded, or transferred.
 */
contract TrueIDSoulboundBadge is IERC5192 {
    string public name = "TrueID Digital Identity Badge";
    string public symbol = "TRUEID-SBT";
    address public owner;
    address public registryContract;

    uint256 private _nextTokenId = 1;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event BadgeMinted(address indexed recipient, uint256 indexed tokenId, string badgeType, uint256 timestamp);
    event BadgeRevoked(uint256 indexed tokenId, address indexed recipient, uint256 timestamp);

    struct Badge {
        string badgeType;          // E.g., "IDENTITY_VERIFIED", "KYC_COMPLIANT", "TIER_1_CITIZEN"
        string metadataURI;        // Decentralized IPFS metadata URI containing W3C credentials
        bytes32 identityCommitment; // Poseidon hash of citizen biometric face vector
        uint256 issuedAt;          // Timestamp of issuance
        bool isValid;              // Active/revoked state
    }

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => Badge) public badges;
    mapping(address => uint256) public userPrimaryBadge; // User address -> TokenId

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || msg.sender == registryContract, "Caller not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setRegistryContract(address _registryContract) external onlyOwner {
        require(_registryContract != address(0), "Invalid registry address");
        registryContract = _registryContract;
    }

    /**
     * @notice ERC-5192 locked status check.
     *         TrueID badges are non-transferable (soulbound) and permanently locked.
     */
    function locked(uint256 tokenId) external view override returns (bool) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return true;
    }

    /**
     * @notice Mint an ERC-5192 soulbound badge to a verified citizen
     */
    function mintBadge(
        address recipient,
        string calldata badgeType,
        string calldata metadataURI,
        bytes32 identityCommitment
    ) external onlyAuthorized returns (uint256) {
        require(recipient != address(0), "Cannot mint to zero address");

        uint256 tokenId = _nextTokenId++;
        _owners[tokenId] = recipient;
        _balances[recipient] += 1;

        badges[tokenId] = Badge({
            badgeType: badgeType,
            metadataURI: metadataURI,
            identityCommitment: identityCommitment,
            issuedAt: block.timestamp,
            isValid: true
        });

        if (userPrimaryBadge[recipient] == 0) {
            userPrimaryBadge[recipient] = tokenId;
        }

        // Emit ERC-721 mint event (from address 0)
        emit Transfer(address(0), recipient, tokenId);
        // Emit ERC-5192 Locked event signifying permanent soulbound attachment
        emit Locked(tokenId);
        emit BadgeMinted(recipient, tokenId, badgeType, block.timestamp);

        return tokenId;
    }

    /**
     * @notice Revoke a badge in case of verified fraud or user request
     */
    function revokeBadge(uint256 tokenId) external onlyAuthorized {
        require(_owners[tokenId] != address(0), "Token does not exist");
        require(badges[tokenId].isValid, "Badge is already revoked");

        badges[tokenId].isValid = false;
        address recipient = _owners[tokenId];

        emit BadgeRevoked(tokenId, recipient, block.timestamp);
    }

    /**
     * @notice Check badge status
     */
    function isBadgeValid(uint256 tokenId) external view returns (bool) {
        return _owners[tokenId] != address(0) && badges[tokenId].isValid;
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "Token does not exist");
        return tokenOwner;
    }

    function balanceOf(address account) external view returns (uint256) {
        require(account != address(0), "Zero address inquiry");
        return _balances[account];
    }

    /**
     * @notice Soulbound guarantee: Prevent any token transfer per ERC-5192
     */
    function transferFrom(address, address, uint256) external pure {
        revert("Soulbound: Token transfer is permanently forbidden by ERC-5192");
    }

    function safeTransferFrom(address, address, uint256) external pure {
        revert("Soulbound: Token transfer is permanently forbidden by ERC-5192");
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) external pure {
        revert("Soulbound: Token transfer is permanently forbidden by ERC-5192");
    }

    // ERC-165 interface detection
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == 0x01ffc9a7 || // ERC-165
            interfaceId == 0x80ac58cd || // ERC-721
            interfaceId == 0x5bced89b || // ERC-721Metadata
            interfaceId == 0xb45a3c0e;   // ERC-5192 (Locked)
    }
}
