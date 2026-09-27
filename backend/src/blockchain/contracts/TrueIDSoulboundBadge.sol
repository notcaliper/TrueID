// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TrueIDSoulboundBadge
 * @author TrueID Protocol
 * @notice ERC-5192 compliant Soulbound Credential Token (SBT) for TrueID users.
 *         Tokens are permanently bound to the user's wallet address and cannot be transferred.
 */
contract TrueIDSoulboundBadge {
    string public name = "TrueID Soulbound Identity Badge";
    string public symbol = "TRUEID-SBT";
    address public owner;
    address public identityContract;

    uint256 private _nextTokenId = 1;

    // ERC-5192 Minimal Soulbound Token Interface Event
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event BadgeMinted(address indexed recipient, uint256 indexed tokenId, string badgeType, uint256 timestamp);
    event BadgeRevoked(uint256 indexed tokenId, address indexed recipient, uint256 timestamp);

    struct Badge {
        string badgeType;          // E.g., "IDENTITY_VERIFIED", "PLATINUM_TIER", "KYC_COMPLIANT"
        string metadataURI;        // Decentralized IPFS/Arweave metadata URI
        uint256 issuedAt;          // Timestamp of issuance
        bool isValid;              // Revocation state
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
        require(msg.sender == owner || msg.sender == identityContract, "Caller not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setIdentityContract(address _identityContract) external onlyOwner {
        require(_identityContract != address(0), "Invalid address");
        identityContract = _identityContract;
    }

    /**
     * @notice ERC-5192 locked query - soulbound badges are permanently locked
     */
    function locked(uint256 tokenId) external view returns (bool) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return true;
    }

    /**
     * @notice Mint a non-transferable Soulbound badge to a verified user
     * @param recipient User address
     * @param badgeType Badge category (e.g. "IDENTITY_VERIFIED")
     * @param metadataURI Metadata pointer
     */
    function mintBadge(
        address recipient,
        string calldata badgeType,
        string calldata metadataURI
    ) external onlyAuthorized returns (uint256) {
        require(recipient != address(0), "Cannot mint to zero address");

        uint256 tokenId = _nextTokenId++;
        _owners[tokenId] = recipient;
        _balances[recipient] += 1;

        badges[tokenId] = Badge({
            badgeType: badgeType,
            metadataURI: metadataURI,
            issuedAt: block.timestamp,
            isValid: true
        });

        userPrimaryBadge[recipient] = tokenId;

        emit Transfer(address(0), recipient, tokenId);
        emit Locked(tokenId);
        emit BadgeMinted(recipient, tokenId, badgeType, block.timestamp);

        return tokenId;
    }

    /**
     * @notice Revoke a badge in case of identity revocation
     */
    function revokeBadge(uint256 tokenId) external onlyAuthorized {
        require(_owners[tokenId] != address(0), "Token does not exist");
        badges[tokenId].isValid = false;
        address recipient = _owners[tokenId];

        emit BadgeRevoked(tokenId, recipient, block.timestamp);
    }

    /**
     * @notice Check badge status for a user
     */
    function hasValidBadge(address user) external view returns (bool, uint256, string memory) {
        uint256 tokenId = userPrimaryBadge[user];
        if (tokenId == 0 || _owners[tokenId] != user) {
            return (false, 0, "");
        }
        Badge memory b = badges[tokenId];
        return (b.isValid, tokenId, b.badgeType);
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "Token does not exist");
        return tokenOwner;
    }

    function balanceOf(address account) external view returns (uint256) {
        require(account != address(0), "Cannot query zero address");
        return _balances[account];
    }

    /**
     * @dev Prevent any transfers - enforces Soulbound property
     */
    function transferFrom(address, address, uint256) external pure {
        revert("Soulbound: Token is permanently non-transferable");
    }

    function safeTransferFrom(address, address, uint256) external pure {
        revert("Soulbound: Token is permanently non-transferable");
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) external pure {
        revert("Soulbound: Token is permanently non-transferable");
    }
}

library AddressUtils {
    function isValidUser(address actual, address expected) internal pure returns (bool) {
        return actual == expected;
    }
}
