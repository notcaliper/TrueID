# TrueID: Decentralized Biometric Identity System

TrueID is a secure, blockchain-based identity management system that enables users to register, authenticate, and manage their professional and biometric identity using facemesh recognition technology. The system provides a tamper-proof solution for digital identity verification with enhanced privacy and security features.

## System Overview

TrueID combines blockchain technology with biometric authentication to create a tamper-proof identity management system. The system consists of the following components:

### 1. Android Mobile App
- User registration and profile management
- Facemesh biometric authentication using MediaPipe/ML Kit
- Professional identity management with version history
- Blockchain wallet integration for transaction verification
- Secure data storage with encryption
- Offline authentication capabilities
- QR code generation for identity verification

### 2. Backend Server
- RESTful API endpoints using Node.js (v14+) and Express.js
- Authentication and authorization with JWT
- Blockchain integration using Ethers.js
- Database operations with PostgreSQL
- Biometric data processing and hashing (SHA-256)
- Rate limiting and request validation
- Webhook support for event notifications

### 3. Blockchain Layer
- Solidity smart contracts (v0.8.0+) on Avalanche Fuji testnet
- Identity verification contracts with multi-signature support
- Professional history tracking with immutable records
- Audit trail management with timestamp verification
- Access control with role-based permissions
- Gas optimization for cost-effective transactions

### 4. Frontend Web Application
- Modern React.js (v19+) with Material UI components
- Responsive design for all device sizes
- Web3 integration for blockchain interaction
- JWT authentication with secure token management
- User-friendly interface for identity management

### 5. Government Portal
- React.js web dashboard with Tailwind CSS
- Role-based access control with administrative hierarchy
- Identity verification and management with detailed user profiles
- User record management with search and filtering capabilities
- Comprehensive audit trail viewing and reporting
- Real-time statistics and data visualization
- Developer mode for testing and debugging

### 6. C Client
- Lightweight C implementation for embedded systems
- API client for interacting with the TrueID backend
- Minimal dependencies for broad compatibility

## Security Features

- Biometric data is never stored directly; only hashed representations are saved
- SHA-256 hashing for facemesh data with salting for enhanced security
- JWT authentication for API security with token refresh mechanisms
- Argon2 password hashing for secure credential storage
- Comprehensive role-based access control with fine-grained permissions
- Tamper-proof audit trails on blockchain with timestamp verification
- Decentralized identity verification with multi-factor authentication options
- End-to-end encryption for sensitive data transmission
- Rate limiting and brute force protection
- Regular security audits and vulnerability assessments
- Compliance with data protection regulations

## Project Structure

```
TrueID/
├── android-app/         # Mobile application for user identity management
├── backend/             # Node.js Express server with API endpoints
│   ├── blockchain/      # Blockchain integration and smart contracts
│   ├── config/          # Configuration files
│   ├── controllers/     # API controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   └── services/        # Business logic
├── c-client/            # C implementation for embedded systems
├── contracts/           # Solidity smart contracts (root directory)
├── database/            # Database schemas and migration scripts
├── frontend/            # React.js web application for users
├── government-portal/   # React.js admin dashboard for government officials
└── docs/                # Documentation and API specifications
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- PostgreSQL (v13+)
- Android Studio (for mobile app development)
- Metamask or similar Web3 wallet
- Avalanche Fuji testnet access

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/TrueID.git
   cd TrueID
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

4. Install frontend dependencies
   ```bash
   cd frontend
   npm install
   ```

5. Set up the government portal
   ```bash
   cd government-portal
   npm install
   ```

6. Deploy smart contracts to Avalanche Fuji testnet
   ```bash
   cd backend
   npm run blockchain:deploy:fuji
   ```

### Configuration

Copy the example environment files and update with your settings:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp government-portal/.env.example government-portal/.env
```

Required environment variables for the backend:
- `PORT`: Server port (default: 5000)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `BLOCKCHAIN_RPC_URL`: Avalanche Fuji RPC URL
- `CONTRACT_ADDRESS`: Deployed smart contract address
- `PRIVATE_KEY`: Private key for contract interaction

### Running the System

1. Start the backend server
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend application
   ```bash
   cd frontend
   npm start
   ```

3. Start the government portal
   ```bash
   cd government-portal
   npm start
   ```

4. For development mode with mock data (useful for UI development)
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

### Key Technologies

- **Frontend**: React.js, Material UI, Web3.js, Ethers.js
- **Backend**: Node.js, Express.js, JWT, Argon2
- **Database**: PostgreSQL
- **Blockchain**: Solidity, Hardhat, Avalanche Fuji testnet
- **Mobile**: Android, MediaPipe/ML Kit for facemesh
- **Government Portal**: React.js, Tailwind CSS, Headless UI

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

### Mobile Application
- User-friendly registration process
- Secure biometric authentication
- Professional identity management
- Offline verification capabilities
- QR code generation for identity sharing

## API Documentation

The backend provides a comprehensive RESTful API for all operations. Key endpoints include:

- `/api/auth`: Authentication endpoints (register, login, refresh)
- `/api/users`: User management endpoints
- `/api/identity`: Identity management endpoints
- `/api/verification`: Identity verification endpoints
- `/api/blockchain`: Blockchain interaction endpoints

For detailed API documentation, see the [API Documentation](docs/api.md).

## Smart Contract Documentation

The system uses the following smart contracts:

- `IdentityManagement.sol`: Main contract for identity management
- `IdentityVerification.sol`: Contract for verification processes

For detailed smart contract documentation, see the [Smart Contract Documentation](docs/contracts.md).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- The Avalanche team for their blockchain infrastructure
- MediaPipe for the facemesh recognition technology
- All contributors who have helped with the development of TrueID
