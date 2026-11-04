// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev ERC-1056 Lightweight Decentralized Identifier (DID) Registry Interface
 * https://github.com/decentralized-identity/ethr-did-resolver/blob/master/contracts/EthereumDIDRegistry.sol
 */
interface IERC1056 {
    event DIDOwnerChanged(address indexed identity, address newOwner, uint256 previousChange);
    event DIDAttributeChanged(address indexed identity, bytes32 name, bytes value, uint256 validTo, uint256 previousChange);
    event DIDDelegateChanged(address indexed identity, bytes32 delegateType, address delegate, uint256 validTo, uint256 previousChange);

    function identityOwner(address identity) external view returns (address);
    function changeOwner(address identity, address newOwner) external;
    function setAttribute(address identity, bytes32 name, bytes calldata value, uint256 validity) external;
    function revokeAttribute(address identity, bytes32 name, bytes calldata value) external;
}

/**
 * @title TrueIDDIDRegistry
 * @author TrueID Protocol
 * @notice Production W3C & ERC-1056 compliant Decentralized Identifier (DID) Registry.
 *         Resolves `did:trueid:<address>` to public keys, service endpoints, and cryptographic commitments.
 */
contract TrueIDDIDRegistry is IERC1056 {
    string public constant METHOD_NAME = "trueid";
    address public contractOwner;

    // Mapping from identity address to its current controller/owner
    mapping(address => address) private _owners;

    // Mapping from identity to attribute name to attribute hash to validTo timestamp
    // identity => keccak256(name, value) => validTo
    mapping(address => mapping(bytes32 => uint256)) public attributes;

    // Mapping tracking last block change for graph indexers
    mapping(address => uint256) public changed;

    // Mapping from identity to active biometric Poseidon commitment hash
    mapping(address => bytes32) public biometricCommitments;

    // Mapping from identity to primary Soulbound Token ID
    mapping(address => uint256) public soulboundTokens;

    modifier onlyController(address identity) {
        require(msg.sender == getController(identity), "DID: Caller not authorized controller");
        _;
    }

    constructor() {
        contractOwner = msg.sender;
    }

    /**
     * @notice Get the active controller/owner of a DID
     * @param identity Citizen wallet address (e.g. 0xc628...)
     */
    function identityOwner(address identity) external view override returns (address) {
        return getController(identity);
    }

    function getController(address identity) public view returns (address) {
        address currentOwner = _owners[identity];
        if (currentOwner == address(0)) {
            return identity; // By default each address controls its own DID
        }
        return currentOwner;
    }

    /**
     * @notice Change the owner/controller of a DID
     */
    function changeOwner(address identity, address newOwner) public override onlyController(identity) {
        require(newOwner != address(0), "DID: New owner cannot be zero address");
        _owners[identity] = newOwner;
        emit DIDOwnerChanged(identity, newOwner, changed[identity]);
        changed[identity] = block.number;
    }

    /**
     * @notice Set a public attribute on a DID document (e.g. public key, service endpoint, W3C claim)
     * @param identity The DID address being updated
     * @param name Attribute key (e.g. bytes32("did/pub/Ed25519/veriKey"))
     * @param value Raw attribute bytes or IPFS CID
     * @param validity Duration in seconds for which attribute is valid
     */
    function setAttribute(
        address identity,
        bytes32 name,
        bytes calldata value,
        uint256 validity
    ) external override onlyController(identity) {
        uint256 validTo = block.timestamp + validity;
        bytes32 attrHash = keccak256(abi.encodePacked(name, value));
        attributes[identity][attrHash] = validTo;

        emit DIDAttributeChanged(identity, name, value, validTo, changed[identity]);
        changed[identity] = block.number;
    }

    /**
     * @notice Revoke a previously registered attribute
     */
    function revokeAttribute(
        address identity,
        bytes32 name,
        bytes calldata value
    ) external override onlyController(identity) {
        bytes32 attrHash = keccak256(abi.encodePacked(name, value));
        attributes[identity][attrHash] = 0;

        emit DIDAttributeChanged(identity, name, value, 0, changed[identity]);
        changed[identity] = block.number;
    }

    /**
     * @notice Anchor citizen 68-landmark FaceMesh biometric commitment to their DID
     * @param identity Citizen address
     * @param commitment Poseidon hash of facial landmarks
     */
    function setBiometricCommitment(address identity, bytes32 commitment) external onlyController(identity) {
        biometricCommitments[identity] = commitment;
        changed[identity] = block.number;
    }

    /**
     * @notice Link Soulbound Token ID to citizen DID
     */
    function linkSoulboundToken(address identity, uint256 tokenId) external onlyController(identity) {
        soulboundTokens[identity] = tokenId;
        changed[identity] = block.number;
    }

    /**
     * @notice Check if a specific DID attribute is currently active and not expired
     */
    function isAttributeValid(address identity, bytes32 name, bytes calldata value) external view returns (bool) {
        bytes32 attrHash = keccak256(abi.encodePacked(name, value));
        return attributes[identity][attrHash] > block.timestamp;
    }
}
