# Security Policy

## Overview

TrueID (Decentralized Biometric Identity System) takes the security and privacy of user identities, biometric templates, and smart contracts very seriously. We appreciate the contributions of security researchers and the community in helping us maintain the highest security standards.

---

## Supported Versions

The following versions of TrueID components are currently supported with security updates:

| Component | Version / Branch | Supported | Notes |
| :--- | :--- | :---: | :--- |
| TrueID Core Backend | `v1.0.x` / `main` | :white_check_mark: | Primary REST API & Authentication |
| Government Portal | `v1.0.x` / `main` | :white_check_mark: | Administrative Dashboard |
| Android Mobile Client | `v1.0.x` / `main` | :white_check_mark: | Biometric Mesh & Wallet App |
| Smart Contracts | `v1.0.x` | :white_check_mark: | Avalanche Fuji & Polygon Testnet |
| Legacy Releases | `< 1.0.0` | :x: | Unsupported |

---

## Reporting a Vulnerability

> [!IMPORTANT]
> **Please do NOT report security vulnerabilities through public GitHub issues or public pull requests.**

If you discover a security vulnerability in TrueID, please follow our Responsible Disclosure policy:

1. **Email Disclosure**: Send an email to **akshaymanbhaw27@gmail.com** (or contact the repository maintainers directly).
2. **Details to Include**:
   - Component affected (Backend, Smart Contracts, Mobile App, Government Portal).
   - Description of the vulnerability and potential impact.
   - Proof of Concept (PoC) code or step-by-step reproduction instructions.
   - Any remediation suggestions if available.

### Response SLA & Expectations

- **Initial Acknowledgment**: Within **24–48 hours** of report receipt.
- **Triage & Assessment**: Vulnerability status and severity rating (CVSS v3.1) provided within **5 business days**.
- **Fix & Patch Delivery**: Target remediation within **14–30 days** depending on severity.
- **Public Disclosure**: Coordinated release after fixes are deployed to main components and smart contracts.

---

## Security Architecture & Scope

TrueID encompasses several security-critical subsystems. Key areas of security focus include:

### 1. Biometric Template Privacy
- Raw biometric images or face mesh coordinates must **never** be transmitted or stored in plaintext.
- Biometric signatures are salted and hashed (SHA-256 / Argon2) prior to verification.

### 2. Smart Contract Security
- Reentrancy protection (`ReentrancyGuard`) on state-changing contract functions.
- Multi-signature administrative governance and strict Role-Based Access Control (`AccessControl`).
- Gas optimization and protection against front-running / timestamp dependence.

### 3. API & Portal Security
- Strict JWT authentication and short-lived session tokens.
- Parameter validation (`express-validator`), CORS origin locking, and security headers via `helmet`.
- Database encryption at rest for sensitive user profile records in PostgreSQL.

---

## Responsible Disclosure & Safe Harbor

When conducting security research on TrueID, we ask that you adhere to the following rules:

- **Do Not Disrupt Operations**: Avoid Denial of Service (DoS/DDoS) attacks, brute-force spams, or degrading live testnet networks.
- **Privacy First**: Do not access, modify, or leak data belonging to other users.
- **No Unauthorized Transactions**: Do not drain or manipulate real testnet funds or user identities outside your own test accounts.
- **Good Faith**: If you report a vulnerability in good faith and follow these guidelines, we will not pursue legal action against you.

---

## Security Best Practices for Developers

- **Secrets Management**: Never commit `.env` files, private keys, or API credentials into git repositories.
- **Dependency Auditing**: Regularly run `npm audit` or `cargo audit` to update vulnerable packages.
- **Smart Contract Compilation**: Compile contracts with strict compiler warnings enabled and verify deployed bytecodes.
