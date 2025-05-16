# DBIS Backend

## Decentralized Biometric Identity System

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A secure, blockchain-based identity management system with biometric authentication.

---

## 📋 Overview

The DBIS Backend is the server-side engine for a decentralized identity platform that combines biometric facemesh verification, government/admin workflows, and blockchain-based audit trails.

---

## 📁 Directory Structure

```
backend/
├── blockchain/           # Blockchain contracts, deployment, and scripts
│   ├── contracts/
│   ├── deploy.js
│   ├── scripts/
│   └── test/
├── config/               # Database schema and configuration files
│   └── database.sql
├── controllers/          # Express controllers (admin, auth, user, blockchain, network)
├── middleware/           # Auth, validation, and other Express middleware
├── models/               # ORM/database models
├── routes/               # Express route definitions (admin, auth, user, blockchain, network)
├── services/             # Service logic (e.g., blockchain.service.js)
├── utils/                # Utility/helper functions
├── public/               # Static assets (if any)
├── scripts/              # Startup and utility scripts
├── .env                  # Environment variables (never commit secrets)
├── .env.example          # Example environment config
├── package.json
├── package-lock.json
├── server.js             # Main Express app entry point
├── start.sh              # Startup script
├── README.md             # Project documentation
├── combined.log          # Combined logs
├── error.log             # Error logs
```

---

## 🛠️ Technology Stack

- Node.js 16+, Express.js
- PostgreSQL
- Solidity, Hardhat, Ethers.js
- JWT, Argon2, SHA-256, Helmet.js

---

## ⚙️ Setup & Usage

### 1. Clone the repository
```bash
git clone <repo-url>
cd DBIS/backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
- Copy `.env.example` to `.env` and fill in your values (DB, JWT, blockchain, etc.)

### 4. Initialize the database
```bash
# Make sure PostgreSQL is running and credentials match .env
psql -U <DB_USER> -d <DB_NAME> -f config/database.sql
```

### 5. Run the backend server
```bash
npm start
# or for development
yarn dev
```

---

## 🚦 API Endpoints (Overview)

- `POST   /api/user/register`         – User registration (biometric)
- `POST   /api/user/login`            – User login (biometric)
- `POST   /api/admin/login`           – Admin login
- `GET    /api/admin/users`           – List all users
- `GET    /api/admin/users/:id`       – Get user by ID
- `POST   /api/admin/users/:id/verify`– Verify user
- `PUT    /api/admin/users/:id/update`– Update user
- `POST   /api/blockchain/record`     – Record identity on-chain
- `GET    /api/blockchain/fetch/:userId` – Fetch blockchain record
- `GET    /api/admin/logs`            – View audit logs

> See `/routes/` and `/controllers/` for full details.

---

## 🛡️ Security

- JWT for authentication
- Argon2 for password hashing
- SHA-256 for biometric hashes
- Helmet.js for HTTP headers

---

## 🧪 Testing

```bash
npm test
```

---

## 📄 License

MIT

---

**For detailed API documentation, see inline comments in `/routes/` and `/controllers/`.**
      </ul>
    </td>
  </tr>
</table>

## 💼 Project Structure

```bash
/backend
├── blockchain/          # Blockchain integration
│   ├── contracts/       # Smart contracts (.sol files)
│   ├── deployments/     # Deployment artifacts
│   ├── scripts/         # Deployment scripts
│   └── test/            # Contract tests
├── config/              # Configuration files
│   └── database.sql     # Database schema
├── controllers/         # API request handlers
├── middleware/          # Express middleware
├── models/              # Database models
├── public/              # Static assets
│   └── admin/           # Admin dashboard
├── routes/              # API route definitions
├── scripts/             # Utility scripts
├── services/            # Business logic
├── utils/               # Helper functions
├── .env                 # Environment variables
├── .env.example         # Environment template
├── hardhat.config.js    # Hardhat configuration
├── package.json         # Dependencies
└── server.js            # Application entry point
```

## 🔍 API Features

<details>
  <summary><strong>🔐 Authentication</strong></summary>
  <ul>
    <li><code>/api/user/register</code> - Register with biometric data</li>
    <li><code>/api/user/login</code> - Authenticate with facemesh</li>
    <li><code>/api/admin/login</code> - Admin portal access</li>
    <li>JWT-based session management with refresh tokens</li>
  </ul>
</details>

<details>
  <summary><strong>👤 Identity Management</strong></summary>
  <ul>
    <li><code>/api/admin/users</code> - List and search users</li>
    <li><code>/api/admin/users/:id</code> - View user details</li>
    <li><code>/api/admin/users/:id/verify</code> - Verify identity</li>
    <li><code>/api/admin/users/:id/update</code> - Update user data</li>
  </ul>
</details>

<details>
  <summary><strong>⛓️ Blockchain Integration</strong></summary>
  <ul>
    <li><code>/api/blockchain/record</code> - Record identity on-chain</li>
    <li><code>/api/blockchain/fetch/:userId</code> - Retrieve on-chain data</li>
    <li><code>/api/network/status</code> - Check network status</li>
    <li><code>/api/network/switch</code> - Toggle between networks</li>
  </ul>
</details>

<details>
  <summary><strong>👨‍💻 Facemesh Biometrics</strong></summary>
  <ul>
    <li>SHA-256 hashing of biometric data</li>
    <li>Secure storage in PostgreSQL</li>
    <li>Verification against stored templates</li>
    <li>Update capability with admin approval</li>
  </ul>
</details>

<details>
  <summary><strong>📝 Audit System</strong></summary>
  <ul>
    <li><code>/api/admin/logs</code> - View system activity</li>
    <li>Comprehensive action tracking</li>
    <li>Admin accountability</li>
    <li>Tamper-evident logging</li>
  </ul>
</details>

## 🔐 Security Features

<table>
  <tr>
    <td align="center" width="33%">
      <img src="https://img.icons8.com/fluency/48/000000/security-shield-green.png" width="48"/>
      <br/>
      <strong>API Protection</strong>
      <p>Helmet.js security headers, CORS protection, and rate limiting on sensitive endpoints</p>
    </td>
    <td align="center" width="33%">
      <img src="https://img.icons8.com/fluency/48/000000/password.png" width="48"/>
      <br/>
      <strong>Authentication</strong>
      <p>JWT with refresh tokens, Argon2 password hashing, and biometric verification</p>
    </td>
    <td align="center" width="33%">
      <img src="https://img.icons8.com/fluency/48/000000/database-shield.png" width="48"/>
      <br/>
      <strong>Data Protection</strong>
      <p>Parameterized SQL queries, encrypted storage, and role-based access control</p>
    </td>
  </tr>
</table>

## 💻 Installation

### Prerequisites

<table>
  <tr>
    <td><img src="https://img.icons8.com/color/24/000000/nodejs.png"/> Node.js v16+</td>
    <td><img src="https://img.icons8.com/color/24/000000/postgreesql.png"/> PostgreSQL v12+</td>
    <td><img src="https://img.icons8.com/color/24/000000/git.png"/> Git</td>
    <td><img src="https://img.icons8.com/color/24/000000/metamask-logo.png"/> MetaMask</td>
  </tr>
</table>

### Quick Start

```bash
# Clone repository and install dependencies
git clone https://github.com/your-org/dbis.git
cd dbis/backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your settings

# Setup database
npm run init-db

# Start local blockchain & deploy contract
npm run blockchain:local        # Terminal 1 (keep running)
npm run blockchain:deploy-local # Terminal 2

# Start server
npm run dev
```

### Detailed Setup Guide

<details>
  <summary><strong>1. Environment Configuration</strong></summary>
  
  Edit your `.env` file with the following information:
  ```
  # Database
  DB_USER=postgres
  DB_PASSWORD=your_password
  DB_NAME=dbis
  
  # JWT
  JWT_SECRET=generate_a_secure_random_string
  JWT_REFRESH_SECRET=another_secure_random_string
  
  # Blockchain
  ADMIN_PRIVATE_KEY=your_wallet_private_key_for_contract_deployment
  ```
</details>

<details>
  <summary><strong>2. Blockchain Options</strong></summary>
  
  #### Local Development
  ```bash
  # Terminal 1: Start local blockchain node
  npm run blockchain:local
  
  # Terminal 2: Deploy contract
  npm run blockchain:deploy-local
  ```
  
  #### Polygon Mumbai Testnet
  ```bash
  # Get test MATIC from faucet: https://faucet.polygon.technology/
  npm run blockchain:switch-polygon
  npm run blockchain:deploy-polygon
  ```
</details>

<details>
  <summary><strong>3. Running the Server</strong></summary>
  
  ```bash
  # Development mode with auto-reload
  npm run dev
  
  # Production mode
  npm start
  ```
  
  The server will be available at http://localhost:3000
  
  Admin dashboard: http://localhost:3000/admin
</details>

## ⛓️ Blockchain Integration

<div align="center">
  <img src="https://img.icons8.com/color/96/000000/blockchain-technology.png" width="96"/>
</div>

### Smart Contract Features

<table>
  <tr>
    <td width="50%">
      <h4>📝 Identity Management</h4>
      <ul>
        <li>Biometric hash registration</li>
        <li>Government verification</li>
        <li>Identity status tracking</li>
        <li>Tamper-proof storage</li>
      </ul>
    </td>
    <td width="50%">
      <h4>🔒 Access Control</h4>
      <ul>
        <li>Role-based permissions</li>
        <li>Government admin roles</li>
        <li>Verification authority</li>
        <li>Event logging</li>
      </ul>
    </td>
  </tr>
</table>

### Dual-Network Support

<table>
  <tr>
    <td align="center" width="50%">
      <img src="https://img.icons8.com/fluency/48/000000/workstation.png" width="48"/>
      <h4>Local Development</h4>
      <p>Hardhat local blockchain for rapid development and testing</p>
    </td>
    <td align="center" width="50%">
      <img src="https://img.icons8.com/color/48/000000/polygon.png" width="48"/>
      <h4>Polygon Mumbai</h4>
      <p>Testnet deployment for production-like environment</p>
    </td>
  </tr>
</table>

### Network Management

```bash
# View current network status
npm run blockchain:status

# Switch networks
npm run blockchain:switch-local    # Local Hardhat
npm run blockchain:switch-polygon  # Polygon Mumbai

# Deploy contracts
npm run blockchain:deploy-local    # Deploy to local network
npm run blockchain:deploy-polygon  # Deploy to Polygon Mumbai
```

<details>
  <summary><strong>Admin Dashboard Network Management</strong></summary>
  <p>The admin dashboard provides a user-friendly interface for managing blockchain networks at <code>/admin/network.html</code></p>
  <ul>
    <li>View network status and contract details</li>
    <li>Switch between local and Polygon networks</li>
    <li>Deploy contracts with a single click</li>
    <li>Monitor deployment status</li>
  </ul>
</details>

## 📝 Documentation & Resources

<table>
  <tr>
    <td width="33%" align="center">
      <img src="https://img.icons8.com/color/48/000000/api-settings.png" width="48"/>
      <h4>API Reference</h4>
      <p>Available at <code>/api-docs</code> when server is running</p>
    </td>
    <td width="33%" align="center">
      <img src="https://img.icons8.com/color/48/000000/dashboard-layout.png" width="48"/>
      <h4>Admin Dashboard</h4>
      <p>Available at <code>/admin</code></p>
    </td>
    <td width="33%" align="center">
      <img src="https://img.icons8.com/color/48/000000/test-tube.png" width="48"/>
      <h4>Testing</h4>
      <p>Comprehensive test suite</p>
    </td>
  </tr>
</table>

### API Endpoints

<details>
  <summary><strong>Authentication Endpoints</strong></summary>
  <table>
    <tr><th>Endpoint</th><th>Method</th><th>Description</th></tr>
    <tr><td><code>/api/user/register</code></td><td>POST</td><td>Register new user with biometric data</td></tr>
    <tr><td><code>/api/user/login</code></td><td>POST</td><td>Authenticate using facemesh hash</td></tr>
    <tr><td><code>/api/admin/login</code></td><td>POST</td><td>Admin authentication</td></tr>
    <tr><td><code>/api/user/refresh-token</code></td><td>POST</td><td>Refresh expired JWT token</td></tr>
  </table>
</details>

<details>
  <summary><strong>User Management Endpoints</strong></summary>
  <table>
    <tr><th>Endpoint</th><th>Method</th><th>Description</th></tr>
    <tr><td><code>/api/admin/users</code></td><td>GET</td><td>List all users</td></tr>
    <tr><td><code>/api/admin/users/:id</code></td><td>GET</td><td>Get user details</td></tr>
    <tr><td><code>/api/admin/users/:id/verify</code></td><td>POST</td><td>Verify user identity</td></tr>
    <tr><td><code>/api/admin/users/:id/reject</code></td><td>POST</td><td>Reject user identity</td></tr>
  </table>
</details>

<details>
  <summary><strong>Blockchain Endpoints</strong></summary>
  <table>
    <tr><th>Endpoint</th><th>Method</th><th>Description</th></tr>
    <tr><td><code>/api/blockchain/record</code></td><td>POST</td><td>Record identity on blockchain</td></tr>
    <tr><td><code>/api/blockchain/fetch/:userId</code></td><td>GET</td><td>Get blockchain identity data</td></tr>
    <tr><td><code>/api/network/status</code></td><td>GET</td><td>Check blockchain network status</td></tr>
    <tr><td><code>/api/network/switch</code></td><td>POST</td><td>Switch blockchain network</td></tr>
  </table>
</details>

### Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:api        # API tests
npm run test:models     # Database model tests
npm run blockchain:test # Smart contract tests
```

### Troubleshooting

<details>
  <summary><strong>Common Issues</strong></summary>
  <table>
    <tr>
      <td><strong>Database Connection Errors</strong></td>
      <td>
        <ul>
          <li>Ensure PostgreSQL is running: <code>sudo service postgresql status</code></li>
          <li>Verify credentials in <code>.env</code> file</li>
          <li>Check database exists: <code>psql -U postgres -l</code></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>Blockchain Issues</strong></td>
      <td>
        <ul>
          <li>Check network status: <code>npm run blockchain:status</code></li>
          <li>Ensure local node is running for local development</li>
          <li>Verify wallet has sufficient ETH/MATIC for deployments</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>API Errors</strong></td>
      <td>
        <ul>
          <li>Check server logs for detailed error messages</li>
          <li>Verify JWT secrets are properly set</li>
          <li>Ensure required environment variables are defined</li>
        </ul>
      </td>
    </tr>
  </table>
</details>

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---