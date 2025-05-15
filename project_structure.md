# Decentralized Biometric Identity System (DBIS)

## Project Structure

```
/DBIS
├── android-app/                 # Android mobile application
│   ├── app/
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── java/        # Kotlin/Java code
│   │   │   │   │   └── com/dbis/
│   │   │   │   │       ├── auth/       # Authentication components
│   │   │   │   │       ├── blockchain/ # Blockchain integration
│   │   │   │   │       ├── facemesh/   # Facemesh recognition
│   │   │   │   │       ├── models/     # Data models
│   │   │   │   │       └── ui/         # UI components
│   │   │   │   └── res/         # Android resources
│   │   │   └── test/            # Unit tests
│   │   └── build.gradle         # Android build configuration
│   └── gradle/                  # Gradle wrapper
├── backend/                     # Node.js backend
│   ├── src/
│   │   ├── controllers/         # API controllers
│   │   ├── middleware/          # Express middleware
│   │   ├── models/              # Database models
│   │   ├── routes/              # API routes
│   │   ├── services/            # Business logic
│   │   ├── blockchain/          # Blockchain integration
│   │   │   ├── contracts/       # Solidity smart contracts
│   │   │   └── web3/            # Web3.js integration
│   │   └── utils/               # Utility functions
│   ├── .env                     # Environment variables
│   ├── package.json             # Node.js dependencies
│   └── server.js                # Entry point
├── c-client/                    # C API client
│   ├── bin/                     # Compiled binaries
│   ├── src/                     # Source code
│   └── Makefile                 # Build configuration
├── database/                    # Database scripts
│   ├── migrations/              # Database migrations
│   └── seeds/                   # Database seed data
├── government-portal/           # Government web portal
│   ├── public/                  # Static assets
│   ├── src/                     # React components
│   │   ├── components/          # UI components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API services
│   │   └── utils/               # Utility functions
│   ├── package.json             # Node.js dependencies
│   └── index.js                 # Entry point
├── python-auth/                 # Python face authentication
│   ├── src/                     # Source code
│   │   ├── face_auth.py         # Face authentication implementation
│   │   ├── database.py          # Database integration
│   │   ├── main.py              # Main application
│   │   └── utils/               # Utility functions
│   └── requirements.txt         # Python dependencies
├── python-client/               # Python API client
│   ├── dbis_api_client.py       # API client implementation
│   └── README.md                # Documentation
├── python-server/               # Python face auth server
│   ├── server.py                # TCP server implementation
│   └── requirements.txt         # Python dependencies
├── Makefile                     # Main build configuration
└── README.md                    # Project documentation
```

## System Components

### 1. Android Mobile App
- **Technology**: Kotlin with Jetpack Compose
- **Features**:
  - User registration and profile management
  - Facemesh biometric authentication
  - Professional identity management
  - Blockchain wallet integration
  - Secure data storage

### 2. Backend Server
- **Technology**: Node.js with Express.js
- **Features**:
  - RESTful API endpoints
  - Authentication and authorization
  - Blockchain integration
  - Database operations
  - Biometric data processing and hashing

### 3. Blockchain Layer
- **Technology**: Solidity smart contracts on Polygon
- **Features**:
  - Identity verification contracts
  - Professional history tracking
  - Audit trail management
  - Access control

### 4. Database
- **Technology**: PostgreSQL
- **Features**:
  - User profile storage
  - Professional history records
  - Hashed biometric data
  - Access logs

### 5. Government Portal
- **Technology**: React.js
- **Features**:
  - Role-based access control
  - Identity verification
  - User record management
  - Audit trail viewing
