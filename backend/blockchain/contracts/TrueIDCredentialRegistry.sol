// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TrueIDCredentialRegistry
 * @author TrueID Protocol
 * @notice Smart contract registry for W3C Verifiable Credentials and Professional Records (/professional-records).
 *         Supports degrees, employment histories, certifications, government licenses, and on-chain revocation checks.
 */
contract TrueIDCredentialRegistry {
    string public constant VERSION = "2.0.0";
    address public contractOwner;

    enum RecordType {
        EDUCATION,      // Academic degrees, diplomas, transcripts
        EMPLOYMENT,     // Work histories, employment verification
        CERTIFICATION,  // Professional licenses, cloud/security certificates
        GOVERNMENT,     // National citizen attestation, drivers licenses
        LICENSE         // Regulatory and industry practice licenses
    }

    struct CredentialRecord {
        bytes32 credentialHash;    // SHA-256 / Poseidon hash of the W3C JSON-LD credential
        string credentialURI;     // Decentralized IPFS CID storing the signed JSON-LD payload
        RecordType recordType;    // Classification category
        string institution;       // Issuing organization (e.g. "Stanford University")
        address issuer;           // Ethereum address of the issuing authority
        address subject;          // Citizen wallet address owning this credential
        uint256 issuedAt;         // Timestamp when credential was issued
        uint256 expiresAt;        // Timestamp when credential expires (0 = never)
        bool isRevoked;           // Revocation status
    }

    // Mapping: credentialId (UUID or URN) => CredentialRecord
    mapping(bytes32 => CredentialRecord) public credentials;

    // Mapping: citizen address => array of credentialIds
    mapping(address => bytes32[]) private _userCredentials;

    // Mapping: accredited issuers whitelist
    mapping(address => bool) public accreditedIssuers;

    // Events matching W3C & EIP specifications
    event CredentialRegistered(
        bytes32 indexed credentialId,
        address indexed issuer,
        address indexed subject,
        RecordType recordType,
        string institution,
        bytes32 credentialHash,
        uint256 issuedAt
    );

    event CredentialRevoked(
        bytes32 indexed credentialId,
        address indexed revoker,
        uint256 timestamp,
        string reason
    );

    event IssuerAccredited(address indexed issuer, string name);
    event IssuerRevoked(address indexed issuer);

    modifier onlyOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier onlyIssuerOrOwner(bytes32 credentialId) {
        require(
            msg.sender == credentials[credentialId].issuer || msg.sender == contractOwner,
            "Caller not authorized to manage this credential"
        );
        _;
    }

    constructor() {
        contractOwner = msg.sender;
        accreditedIssuers[msg.sender] = true;
    }

    /**
     * @notice Authorize or revoke an accredited issuer (e.g. University or Authority)
     */
    function setIssuerAccreditation(address issuer, bool isAccredited, string calldata name) external onlyOwner {
        require(issuer != address(0), "Invalid issuer address");
        accreditedIssuers[issuer] = isAccredited;
        if (isAccredited) {
            emit IssuerAccredited(issuer, name);
        } else {
            emit IssuerRevoked(issuer);
        }
    }

    /**
     * @notice Register and anchor a W3C Verifiable Credential on-chain
     * @param credentialId Unique URN/UUID hash (e.g. keccak256("urn:uuid:..."))
     * @param subject Citizen wallet address
     * @param recordType Credential category
     * @param institution Name of school, company, or agency
     * @param credentialHash Cryptographic hash of canonical JSON-LD credential
     * @param credentialURI IPFS/Arweave URI pointing to verifiable presentation
     * @param validityDuration Validity period in seconds (0 = permanent)
     */
    function registerCredential(
        bytes32 credentialId,
        address subject,
        RecordType recordType,
        string calldata institution,
        bytes32 credentialHash,
        string calldata credentialURI,
        uint256 validityDuration
    ) external returns (bool) {
        require(accreditedIssuers[msg.sender] || msg.sender == contractOwner, "Issuer not accredited");
        require(subject != address(0), "Cannot issue to zero address");
        require(credentials[credentialId].subject == address(0), "Credential ID already exists");

        uint256 expiresAt = validityDuration > 0 ? block.timestamp + validityDuration : 0;

        credentials[credentialId] = CredentialRecord({
            credentialHash: credentialHash,
            credentialURI: credentialURI,
            recordType: recordType,
            institution: institution,
            issuer: msg.sender,
            subject: subject,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            isRevoked: false
        });

        _userCredentials[subject].push(credentialId);

        emit CredentialRegistered(
            credentialId,
            msg.sender,
            subject,
            recordType,
            institution,
            credentialHash,
            block.timestamp
        );

        return true;
    }

    /**
     * @notice Revoke a credential on-chain in case of graduation dispute, fraud, or expiry
     */
    function revokeCredential(bytes32 credentialId, string calldata reason) external onlyIssuerOrOwner(credentialId) {
        require(credentials[credentialId].subject != address(0), "Credential does not exist");
        require(!credentials[credentialId].isRevoked, "Credential already revoked");

        credentials[credentialId].isRevoked = true;

        emit CredentialRevoked(credentialId, msg.sender, block.timestamp, reason);
    }

    /**
     * @notice Check whether a W3C credential is currently valid, unrevoked, and unexpired
     */
    function isCredentialValid(bytes32 credentialId) external view returns (bool) {
        CredentialRecord memory rec = credentials[credentialId];
        if (rec.subject == address(0)) return false;
        if (rec.isRevoked) return false;
        if (rec.expiresAt > 0 && block.timestamp > rec.expiresAt) return false;
        return true;
    }

    /**
     * @notice Get all credential IDs owned by a citizen
     */
    function getUserCredentialIds(address subject) external view returns (bytes32[] memory) {
        return _userCredentials[subject];
    }

    /**
     * @notice Get count of credentials owned by citizen
     */
    function getUserCredentialCount(address subject) external view returns (uint256) {
        return _userCredentials[subject].length;
    }
}
