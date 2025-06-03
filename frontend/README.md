# TrueID Frontend

TrueID is a decentralized identity verification platform built on the Avalanche blockchain. This frontend application provides a user interface for managing digital identities, wallet operations, and verification status.

## Features

- **User Authentication**: Secure login and registration system
- **Dashboard**: Overview of identity status and wallet information
- **Wallet Management**: View balance and transaction history
- **Identity Verification**: Track verification status in real-time
- **Professional Records**: Manage and view professional credentials
- **Blockchain Integration**: Interact with Avalanche C-Chain for identity management
- **Real-time Updates**: Automatic refresh of data every 15 seconds

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later) or yarn
- Backend server running (default: http://localhost:5000)
- MetaMask or other Web3 wallet (for blockchain interactions)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later) or yarn
- Backend server running (default: http://localhost:5000)
- MetaMask or other Web3 wallet (for blockchain interactions)

### Installation

```bash
# Install dependencies
npm install
# or
yarn install

# Create .env file
echo 'REACT_APP_API_URL=http://localhost:5000
REACT_APP_AVALANCHE_CONTRACT_ADDRESS=0x266B577380aE3De838A66DEf28fffD5e75c5816E
REACT_APP_AVALANCHE_NETWORK=fuji' > .env
```

## Available Scripts

### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

Ejects the app from create-react-app configuration. Use with caution.

## API Integration

The frontend communicates with the backend through a centralized API service. Here's how the API integration works:

### API Service Architecture

1. **Axios Instance**
   - Base URL: `http://localhost:5000/api`
   - Default timeout: 10 seconds
   - Automatic JWT token handling
   - Request/response interceptors for error handling

2. **Authentication Flow**
   ```javascript
   // Request interceptor adds JWT token to headers
   API.interceptors.request.use(config => {
     const token = localStorage.getItem('accessToken');
     if (token) config.headers['Authorization'] = `Bearer ${token}`;
     return config;
   });
   
   // Response interceptor handles token refresh
   API.interceptors.response.use(
     response => response,
     async error => {
       if (error.response.status === 401) {
         // Handle token refresh logic
       }
       return Promise.reject(error);
     }
   );
   ```

### Available API Endpoints

#### Authentication (`/api/auth`)
- `POST /register` - Register a new user
- `POST /login` - User login
- `POST /refresh-token` - Refresh access token
- `POST /verify-biometric` - Verify biometric data

#### User Profile (`/api/users`)
- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile
- `GET /verification-status` - Get verification status
- `POST /professional-records` - Add professional record
- `GET /professional-records` - Get professional records

#### Blockchain (`/api/blockchain`)
- `GET /transactions` - Get user transactions
- `GET /status` - Get blockchain status
- `POST /record-identity` - Record identity on blockchain
- `GET /transaction/:txHash` - Get transaction status
- `POST /verify-document` - Verify document hash

#### Wallet (`/api/wallet`)
- `GET /balance/:address` - Get wallet balance
- `POST /transfer` - Transfer tokens

### Error Handling
- 401 Unauthorized: Invalid or expired token
- 403 Forbidden: Insufficient permissions
- 404 Not Found: Resource not found
- 422 Validation Error: Invalid request data
- 500 Internal Server Error: Server-side error

### Example API Usage

```javascript
// In a React component
import { userAPI, authAPI } from '../services/api.service';

// Login user
const handleLogin = async (email, password) => {
  try {
    const response = await authAPI.login({ email, password });
    const { accessToken, refreshToken, user } = response.data;
    // Store tokens and user data
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(user);
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Get user profile
const fetchProfile = async () => {
  try {
    const response = await userAPI.getProfile();
    setProfile(response.data.user);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }
};
```

### Real-time Updates

The application implements a polling mechanism to keep data in sync:

```javascript
// Example of polling verification status
useEffect(() => {
  const interval = setInterval(async () => {
    try {
      const response = await userAPI.getVerificationStatus();
      setVerificationStatus(response.data.status);
    } catch (error) {
      console.error('Error fetching verification status:', error);
    }
  }, 15000); // Poll every 15 seconds

  return () => clearInterval(interval);
}, []);
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components
│   ├── Dashboard/
│   ├── WalletPage/
│   ├── VerificationStatus/
│   ├── ProfessionalRecords/
│   └── BlockchainStatus/
├── services/      # API and blockchain services
├── styles/        # Global styles and themes
└── utils/         # Utility functions and constants
```

## Configuration

The application is configured to work with the following services:

### Environment Variables

Create a `.env` file in the frontend directory with the following variables:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_AVALANCHE_CONTRACT_ADDRESS=0x266B577380aE3De838A66DEf28fffD5e75c5816E
REACT_APP_AVALANCHE_NETWORK=fuji
REACT_APP_AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
```

### CORS Configuration

The backend is configured to allow requests from multiple frontend origins:
- Main frontend: http://localhost:3000
- Government portal: http://localhost:8000

### Blockchain Configuration

- **Network**: Avalanche Fuji Testnet
- **Contract Address**: 0x266B577380aE3De838A66DEf28fffD5e75c5816E
- **RPC URL**: https://api.avax-test.network/ext/bc/C/rpc
- **Chain ID**: 43113 (Fuji Testnet)

### Security

- JWT authentication with access and refresh tokens
- Token auto-refresh mechanism
- Secure storage of sensitive data
- CSRF protection
- Rate limiting on sensitive endpoints

## Real-time Updates

The dashboard features real-time updates with:
- 15-second polling interval for status updates
- Visual indicators during data refresh
- Automatic wallet balance updates
