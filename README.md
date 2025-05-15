# Decentralized Biometric Identity System (DBIS)

A secure, blockchain-based identity management system that enables users to register, authenticate, and manage their professional and biometric identity using facemesh recognition technology. DBIS provides a tamper-proof solution for digital identity verification with enhanced privacy and security features.

## System Overview

DBIS combines blockchain technology with biometric authentication to create a tamper-proof identity management system. The system consists of the following components:

### 1. Android Mobile App
- User registration and profile management
- Facemesh biometric authentication using MediaPipe/ML Kit
- Professional identity management with version history
- Blockchain wallet integration for transaction verification
- Secure data storage with encryption
- Offline authentication capabilities
- QR code generation for identity verification

### 2. Backend Server
- RESTful API endpoints using Node.js and Express.js
- Authentication and authorization with JWT/OAuth2
- Blockchain integration using Web3.js/Ethers.js
- Database operations with PostgreSQL
- Biometric data processing and hashing (SHA-256)
- Rate limiting and request validation
- Webhook support for event notifications

### 3. Blockchain Layer
- Solidity smart contracts on EVM-compatible chains (Polygon/Ethereum testnet)
- Identity verification contracts with multi-signature support
- Professional history tracking with immutable records
- Audit trail management with timestamp verification
- Access control with delegated permissions
- Gas optimization for cost-effective transactions

### 4. Government Portal
- Modern React.js web dashboard for government officials
- Role-based access control with administrative hierarchy
- Identity verification and management with detailed user profiles
- User record management with search and filtering capabilities
- Comprehensive audit trail viewing and reporting
- Real-time statistics and data visualization
- Enhanced UI with responsive design and accessibility features
- Developer mode for testing and debugging

## Security Features

- Biometric data is never stored directly; only hashed representations are saved
- SHA-256 hashing for facemesh data with salting for enhanced security
- JWT/OAuth2 authentication for API security with token refresh mechanisms
- Comprehensive role-based access control with fine-grained permissions
- Tamper-proof audit trails on blockchain with timestamp verification
- Decentralized identity verification with multi-factor authentication options
- End-to-end encryption for sensitive data transmission
- Rate limiting and brute force protection
- Regular security audits and vulnerability assessments
- Compliance with data protection regulations

## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL (v13+)
- Android Studio (for mobile app development)
- Python 3.8+ (for face authentication components)
- Metamask or similar Web3 wallet
- Polygon/Ethereum testnet access

### Project Structure

```
DBIS/
├── android-app/         # Mobile application for user identity management
├── backend/             # Node.js Express server with API endpoints
├── blockchain/          # Solidity smart contracts and deployment scripts
├── database/            # Database schemas and migration scripts
├── government-portal/   # React.js admin dashboard for government officials
├── python-auth/         # Python-based face authentication system
└── docs/                # Documentation and API specifications
```

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/DBIS.git
   cd DBIS
   ```

2. Install backend dependencies
   ```bash
   cd backend
   npm install
   ```

3. Set up the database
   ```bash
   cd database
   npm run migrate
   npm run seed  # Optional: adds test data
   ```

4. Install Python dependencies
   ```bash
   cd python-auth
   pip install -r requirements.txt
   ```

5. Build the Android app
   ```bash
   cd android-app
   ./gradlew build
   ```

6. Set up the government portal
   ```bash
   cd government-portal
   npm install
   ```

7. Deploy smart contracts (optional during development)
   ```bash
   cd blockchain
   npx hardhat compile
   npx hardhat deploy --network polygon_testnet
   ```

### Configuration

Copy the example environment files and update with your settings:

```bash
cp backend/.env.example backend/.env
cp government-portal/.env.example government-portal/.env
cp blockchain/.env.example blockchain/.env
```

### Running the System

1. Start the backend server
   ```bash
   cd backend
   npm start
   ```

2. Start the government portal
   ```bash
   cd government-portal
   npm start
   ```

3. Run the Python face authentication server
   ```bash
   cd python-auth
   python src/main.py
   ```

4. Deploy the Android app to a device or emulator

5. For development mode with mock data (useful for UI development)
   ```bash
   cd government-portal
   npm run dev:mock
   ```

## Architecture

The system uses a hybrid architecture that combines:

- On-chain storage for identity verification and audit trails
- Off-chain storage for user profiles and encrypted biometric data hashes
- Secure API communication between components
- Role-based access control for different user types
- Event-driven design for real-time updates
- Microservices approach for scalability

## Key Features

### Biometric Authentication
- Facemesh recognition using MediaPipe/ML Kit
- Liveness detection to prevent spoofing
- Secure hash generation and verification
- Privacy-preserving biometric processing

### Blockchain Integration
- Smart contract-based identity verification
- Immutable audit trails
- Decentralized storage of verification records
- Multi-signature approval workflows

### Government Portal
- Modern, responsive dashboard interface
- Real-time statistics and data visualization
- Comprehensive user management
- Advanced search and filtering
- Detailed activity logging
- Developer mode for testing and debugging
- Mock data support for development

### Mobile Application
- User-friendly registration process
- Secure biometric capture
- Profile management
- Verification status tracking
- QR code-based identity sharing

## Deployment Options

- Local development environment
- Testnet deployment for staging
- Production deployment on mainnet
- Docker containerization support
- CI/CD pipeline integration

## License

This project is licensed under the MIT License - see the LICENSE file for details.
