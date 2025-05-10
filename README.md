# Decentralized Biometric Identity System (DBIS)

A comprehensive decentralized identity management system that enables users to register, authenticate, and manage their professional and biometric identity using secure facemesh recognition. The system supports lifelong corporate identity tracking and allows authorized government officials to verify and update user information.

## System Architecture

The DBIS consists of three main components:

1. **Android Mobile App**: For user registration, biometric authentication, and professional identity management
2. **Backend Server**: Node.js with Express.js for API endpoints, blockchain integration, and database operations
3. **Government Portal**: Web dashboard for government officials to verify and modify user records

## Technologies Used

- **Frontend (Android App)**: Kotlin with Jetpack Compose, MediaPipe for facemesh recognition
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL for off-chain structured user data storage
- **Blockchain**: EVM-compatible chain (Polygon) using Solidity smart contracts
- **Web3 Integration**: Ethers.js to connect backend to blockchain
- **Hashing Algorithm**: SHA-256 for secure biometric data hashing
- **Government Portal**: React.js
- **Security & Authentication**: JWT for API security, role-based access control

## Requirements

- Node.js 14.x or higher
- PostgreSQL 12.x or higher
- Android Studio 4.2+ (for Android app development)
- Metamask or other Ethereum wallet
- Polygon Mumbai testnet access

## Installation & Setup

### 1. Database Setup

```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE dbis;"

# Run database migrations
psql -U postgres -d dbis -f database/migrations/001_initial_schema.sql
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
# Edit .env file with your database credentials and blockchain settings

# Start the server
npm start
```

### 3. Smart Contract Deployment

```bash
# Deploy the smart contract to Polygon Mumbai testnet
# Update the CONTRACT_ADDRESS in .env with the deployed contract address
```

### 4. Android App Setup

```bash
# Open the android-app directory in Android Studio
# Configure the app/src/main/res/values/config.xml with your backend API URL
# Build and run the app on an Android device or emulator
```

### 5. Government Portal Setup

```bash
# Navigate to government-portal directory
cd government-portal

# Install dependencies
npm install

# Configure environment variables
# Edit .env file with your backend API URL

# Start the development server
npm start
```

## How It Works

### User Registration and Authentication Flow

1. A user registers through the Android app, providing personal information and capturing their face
2. The app processes the facial data using MediaPipe to generate a facemesh
3. The facemesh is hashed using SHA-256 and sent to the backend
4. The backend stores the hash in PostgreSQL and registers the identity on the blockchain
5. For subsequent logins, the user's face is captured, processed, and the hash is compared with the stored hash

### Professional Identity Management

1. Users add their professional history (education, employment, certifications) through the app
2. Each record is hashed and stored in PostgreSQL with a reference on the blockchain
3. Users can request verification of their records
4. Government officials review and verify records through the web portal
5. Verified records are marked on both the database and blockchain, creating an immutable record

### Blockchain Integration

1. Smart contracts manage identity verification and professional record verification
2. Each user's identity is represented by their wallet address on the blockchain
3. Biometric hashes and professional record hashes are stored on-chain
4. The blockchain provides a tamper-proof audit trail of all verifications

## Security Features

- Biometric data is never stored in its raw form, only as secure SHA-256 hashes
- Role-based access control ensures only authorized users can access sensitive functions
- JWT authentication secures all API endpoints
- Blockchain integration provides tamper-proof verification records
- All actions are logged in an audit trail

## License

This project is open source and available under the MIT License.