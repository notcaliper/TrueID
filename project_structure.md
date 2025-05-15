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
│   │   │   ├── MainLayout.js    # Main layout wrapper
│   │   │   ├── Sidebar.js       # Navigation sidebar
│   │   │   ├── UserDetailModal.js # User details modal
│   │   │   └── Charts/          # Data visualization components
│   │   ├── pages/               # Page components
│   │   │   ├── Dashboard.js     # Dashboard with statistics
│   │   │   ├── Login.js         # Authentication page
│   │   │   ├── RecordManagement.js # User records management
│   │   │   └── ActivityLogs.js  # Audit trail viewing
│   │   ├── services/            # API services
│   │   │   ├── ApiService.js    # API integration
│   │   │   ├── MockDataService.js # Mock data for development
│   │   │   └── BlockchainService.js # Blockchain integration
│   │   └── utils/               # Utility functions
│   │       ├── AuthContext.js   # Authentication context
│   │       └── formatters.js    # Data formatting utilities
│   ├── package.json             # Node.js dependencies
│   ├── index.js                 # Entry point
│   └── .env                     # Environment configuration
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
- **Technology**: Kotlin/Java with Jetpack Compose/XML layouts
- **Features**:
  - User registration and profile management
  - Facemesh biometric authentication using MediaPipe/ML Kit
  - Professional identity management with version history
  - Blockchain wallet integration for transaction verification
  - Secure data storage with encryption
  - Offline authentication capabilities
  - QR code generation for identity verification

### 2. Backend Server
- **Technology**: Node.js with Express.js
- **Features**:
  - RESTful API endpoints with comprehensive documentation
  - Authentication and authorization with JWT/OAuth2
  - Blockchain integration using Web3.js/Ethers.js
  - Database operations with ORM
  - Biometric data processing and hashing (SHA-256)
  - Rate limiting and request validation
  - Webhook support for event notifications

### 3. Blockchain Layer
- **Technology**: Solidity smart contracts on Polygon/Ethereum testnet
- **Features**:
  - Identity verification contracts with multi-signature support
  - Professional history tracking with immutable records
  - Audit trail management with timestamp verification
  - Access control with delegated permissions
  - Gas optimization for cost-effective transactions
  - Event emission for real-time updates

### 4. Database
- **Technology**: PostgreSQL
- **Features**:
  - User profile storage with encryption for sensitive fields
  - Professional history records with versioning
  - Hashed biometric data with salting
  - Access logs with IP tracking
  - Indexing for performance optimization
  - Backup and recovery procedures

### 5. Government Portal
- **Technology**: React.js with modern UI libraries
- **Features**:
  - Role-based access control with administrative hierarchy
  - Identity verification and management with detailed user profiles
  - User record management with search and filtering capabilities
  - Comprehensive audit trail viewing and reporting
  - Real-time statistics and data visualization
  - Enhanced UI with responsive design and accessibility features
  - Developer mode for testing and debugging
  - Mock data support for development without backend dependency
