# DBIS Government Portal

The Government Portal for the Decentralized Biometric Identity System (DBIS) provides a web interface for government officials to verify identities, manage professional records, and monitor system activities.

## Features

- **User Management**: View and manage system users with search and filtering capabilities
- **Identity Verification**: Review and approve/reject identity verification requests
- **Biometric Data Management**: Update and verify facemesh hash data
- **Record Management**: Verify professional records submitted by users
- **Audit Trail**: Comprehensive tracking of all system activities with filtering and search
- **Blockchain Integration**: View and verify blockchain transaction hashes for all identity operations
- **Development Mode**: Special development login for easier testing and development

## Technology Stack

- React 18
- Material UI for consistent UI components
- React Router for navigation
- Axios for API communication
- JWT authentication with development bypass option
- Context API for state management
- Responsive design for all device sizes

## Project Structure

```
/government-portal
├── public/                 # Static assets
│   ├── index.html          # HTML template
│   └── manifest.json       # Web app manifest
├── src/                    # Source code
│   ├── components/         # Reusable UI components
│   │   └── layouts/        # Layout components
│   ├── pages/              # Page components
│   │   ├── Dashboard.js    # Dashboard page
│   │   ├── Login.js        # Login page
│   │   ├── UserManagement.js # User management page
│   │   ├── IdentityVerification.js # Identity verification page
│   │   ├── RecordManagement.js # Record management page
│   │   ├── AuditTrail.js   # Audit trail page
│   │   └── NotFound.js     # 404 page
│   ├── services/           # API services
│   ├── utils/              # Utility functions
│   │   └── AuthContext.js  # Authentication context
│   ├── App.js              # Main application component
│   ├── index.js            # Application entry point
│   └── index.css           # Global styles
└── package.json            # Dependencies and scripts
```

## Setup and Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   REACT_APP_API_URL=http://localhost:3000
   ```

3. Start the development server with OpenSSL legacy provider (for Node.js v23+):
   ```
   ./start.sh
   ```
   Or manually with:
   ```
   NODE_OPTIONS=--openssl-legacy-provider npm start
   ```

4. Build for production:
   ```
   NODE_OPTIONS=--openssl-legacy-provider npm run build
   ```

## Development Mode

For easier development and testing, the portal includes a development bypass login feature:

1. Navigate to the login page
2. Click the "Quick Dev Login" button at the bottom of the form
3. Or enter "dev" as both username and password

This will log you in with admin privileges for testing purposes. **Disable this feature in production.**

## Authentication

The portal uses JWT authentication to secure access. Only authorized government officials with appropriate roles can access the system. The authentication flow includes:

1. Login with email and password (or development bypass)
2. JWT token stored in localStorage
3. Token included in all API requests via Authorization header
4. Automatic logout on token expiration
5. Protected routes that redirect to login if not authenticated

## API Integration

The portal connects to the DBIS backend API for all operations. The API endpoints include:

- `/api/auth/*` - Authentication endpoints
  - `POST /login` - User login
  - `POST /logout` - User logout
  - `GET /profile` - Get current user profile

- `/api/users/*` - User management endpoints
  - `GET /users` - List all users
  - `GET /users/:id` - Get user details
  - `PUT /users/:id` - Update user

- `/api/identity/*` - Identity verification endpoints
  - `GET /identity/pending` - Get pending verifications
  - `POST /identity/verify/:id` - Verify identity
  - `POST /identity/reject/:id` - Reject identity
  - `PUT /identity/facemesh/:id` - Update facemesh hash

- `/api/records/*` - Professional record endpoints
  - `GET /records` - List all records
  - `GET /records/:id` - Get record details
  - `POST /records/verify/:id` - Verify record

- `/api/audit/*` - Audit trail endpoints
  - `GET /audit` - Get audit logs
  - `GET /audit/filter` - Filter audit logs

## Blockchain Integration

The portal integrates with the blockchain for identity and record verification. All identity verification and facemesh updates are recorded on the blockchain for immutability and transparency. Key features include:

- Transaction hash display for all blockchain operations
- Verification of identity data using blockchain records
- Immutable audit trail of all identity changes
- Secure storage of facemesh hash data

## User Interface

The government portal features a modern, responsive user interface designed for ease of use:

### Dashboard / User Management
- User list with search and filtering
- Status indicators for verification status
- Quick access to user details
- Statistics overview cards

### User Detail View
- Comprehensive user information display
- Facemesh hash management
- Verification action buttons
- Version history of biometric data changes

### Activity Log
- Detailed audit trail of all system activities
- Advanced filtering by action type, date, and user
- Transaction hash links to blockchain explorer
- Activity summary statistics

## Role-Based Access Control

The portal implements role-based access control to ensure that only authorized users can perform specific actions:

- **Admin**: Full access to all features including user management
- **Government Official**: Access to verification features and record management
- **Auditor**: Read-only access to audit trail and records for compliance monitoring
