# Decentralized Biometric Identity System (DBIS)

A comprehensive decentralized identity management system that enables users to register, authenticate, and manage their professional and biometric identity using secure facemesh recognition. The system supports lifelong corporate identity tracking and allows authorized government officials to verify and update user information.

## Project Overview

The DBIS project has been restructured for better organization and maintainability. The new structure separates the components into clear, modular directories:

```
/DBIS
├── backend/            # Node.js backend server with API endpoints
├── c-client/           # C client for the DBIS API
├── government-portal/  # React.js web dashboard for officials
└── database/           # PostgreSQL database scripts
```

This organization ensures that each component has its own dedicated directory, making the codebase easier to navigate, maintain, and extend.

## System Architecture

The DBIS consists of the following components, now organized in a clean, modular structure:

1. **`/backend`**: Node.js backend server with Express.js
   - API endpoints for all system functionality
   - Blockchain integration via Ethers.js
   - Database operations and business logic
   - Authentication and authorization handling

2. **`/c-client`**: C client for interacting with the DBIS API
   - Lightweight implementation for resource-constrained environments
   - Core authentication functionality

3. **`/government-portal`**: React.js web dashboard for government officials
   - User management and identity verification
   - Professional record verification
   - Audit trail and system monitoring
   - Blockchain transaction viewing

4. **`/database`**: PostgreSQL database scripts and migrations
   - Schema definitions
   - Migration scripts
   - Seed data for testing

5. **Android Mobile App**: For user registration, biometric authentication, and professional identity management (in separate repository)

## Technologies Used

- **Frontend (Android App)**: Kotlin with Jetpack Compose, MediaPipe for facemesh recognition
- **Backend**: Node.js with Express.js for API endpoints and business logic
- **Database**: PostgreSQL for off-chain structured user data storage
- **Blockchain**: EVM-compatible chain (Polygon) using Solidity smart contracts
- **Web3 Integration**: Ethers.js to connect backend to blockchain
- **Hashing Algorithm**: SHA-256 for secure biometric data hashing
- **Government Portal**: React.js with Material UI
- **Security & Authentication**: JWT for API security, role-based access control
- **C Client**: Lightweight client for resource-constrained environments

## Requirements

- Node.js 14.x or higher
- PostgreSQL 12.x or higher
- Android Studio 4.2+ (for Android app development)
- Metamask or other Ethereum wallet
- Polygon Mumbai testnet access
- GCC compiler (for C client)

## Installation & Setup

### 1. Database Setup

```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE dbis;"

# Run database migrations
psql -U postgres -d dbis -f database/migrations/001_initial_schema.sql
```

### 2. Backend Server Setup

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

### 3. C Client Setup

```bash
# Navigate to c-client directory
cd c-client

# Compile the client
make

# Configure settings
# Edit config.h with your API URL

# Run the client
./dbis-client
```

### 4. Government Portal Setup

```bash
# Navigate to government-portal directory
cd government-portal

# Install dependencies
npm install

# Configure environment variables
# Edit .env file with your backend API URL

# Start the development server with OpenSSL legacy provider (for Node.js v23+)
./start.sh

# Or manually with:
# NODE_OPTIONS=--openssl-legacy-provider npm start
```

### 5. Android App Setup (External Repository)

```bash
# Clone the Android app repository
git clone https://github.com/your-org/dbis-android.git

# Open the project in Android Studio
# Configure the app/src/main/res/values/config.xml with your backend API URL
# Build and run the app on an Android device or emulator
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

## Conclusion

The Decentralized Biometric Identity System (DBIS) provides a secure, transparent, and decentralized approach to identity management. By combining biometric authentication, blockchain technology, and a comprehensive government verification portal, the system ensures:

- **Security**: Biometric data is never stored in raw form, only as secure hashes
- **Transparency**: All verifications are recorded on the blockchain
- **Accessibility**: Multiple client options (C client, Android app) for different use cases
- **Verifiability**: Government officials can verify and manage identities through a dedicated portal

The restructured project organization makes it easier for developers to understand, maintain, and extend the system, ensuring its long-term viability and success.

## License

This project is open source and available under the MIT License.