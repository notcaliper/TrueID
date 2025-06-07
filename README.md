# 🎯 TrueID: Decentralized Biometric Identity System

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://img.shields.io/badge/Node.js-v14+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-v18+-61DAFB?logo=react)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v13+-336791?logo=postgresql)](https://www.postgresql.org)
[![Avalanche](https://img.shields.io/badge/Avalanche-Fuji-orange?logo=avalanche)](https://www.avax.network)
[![Android](https://img.shields.io/badge/Android-SDK%2021+-3DDC84?logo=android)](https://developer.android.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/notcaliper/TrueID/pulls)
[![Discord](https://img.shields.io/discord/1234567890?color=7289DA&label=Discord&logo=discord&logoColor=white)](https://discord.gg/trueid)

<img src="docs/assets/trueid-logo.png" alt="TrueID Logo" width="300"/>

### 🔐 Secure • ⛓️ Decentralized • 🛡️ Privacy-Focused

[![Watch the video](https://img.shields.io/badge/Watch-Demo%20Video-red?style=for-the-badge)](https://youtube.com/watch?v=demo)
[![Try it now](https://img.shields.io/badge/Try-TrueID%20Demo-blue?style=for-the-badge)](https://demo.trueid.dev)

</div>

## 📑 Table of Contents

- [Overview](#-system-overview)
- [Features](#-key-features)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Security](#-security-features)
- [Development](#-development-guidelines)
- [Contributing](#-contributing)
- [Support](#-support)

## 🌟 Key Features

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="docs/assets/biometric.png" width="100" alt="Biometric"/>
        <br />
        <b>Biometric Auth</b>
        <br />
        <sub>Secure face recognition</sub>
      </td>
      <td align="center">
        <img src="docs/assets/blockchain.png" width="100" alt="Blockchain"/>
        <br />
        <b>Blockchain</b>
        <br />
        <sub>Immutable records</sub>
      </td>
      <td align="center">
        <img src="docs/assets/privacy.png" width="100" alt="Privacy"/>
        <br />
        <b>Privacy</b>
        <br />
        <sub>End-to-end encryption</sub>
      </td>
    </tr>
    <tr>
      <td align="center">
        <img src="docs/assets/mobile.png" width="100" alt="Mobile"/>
        <br />
        <b>Mobile App</b>
        <br />
        <sub>Cross-platform</sub>
      </td>
      <td align="center">
        <img src="docs/assets/government.png" width="100" alt="Government"/>
        <br />
        <b>Gov Portal</b>
        <br />
        <sub>Admin dashboard</sub>
      </td>
      <td align="center">
        <img src="docs/assets/security.png" width="100" alt="Security"/>
        <br />
        <b>Security</b>
        <br />
        <sub>Multi-factor auth</sub>
      </td>
    </tr>
  </table>
</div>

## 📋 System Overview

TrueID combines blockchain technology with biometric authentication to create a tamper-proof identity management system. The system consists of the following components:

<details>
<summary><b>📱 1. Android Mobile App</b></summary>

- 📝 **User Registration**: Streamlined onboarding process
- 🔍 **Biometric Auth**: ML Kit Face Detection integration
- 📊 **Identity Management**: Professional profile versioning
- 💎 **Blockchain Wallet**: Secure transaction verification
- 🔒 **Data Security**: Encrypted storage
- 📡 **Offline Mode**: Authentication without internet
- 📱 **QR Codes**: Easy identity sharing
- 📸 **CameraX**: Advanced camera features
- 🔄 **Retrofit**: Efficient API communication

</details>

<details>
<summary><b>🖥️ 2. Backend Server</b></summary>

- 🌐 **RESTful API**: Node.js/Express.js endpoints
- 🔑 **Auth System**: JWT with refresh tokens
- ⛓️ **Blockchain**: Ethers.js integration
- 💾 **Database**: PostgreSQL operations
- 🔐 **Biometric**: SHA-256 hashing
- 🛡️ **Security**: Rate limiting & validation
- 🔔 **Webhooks**: Event notifications
- 🛡️ **Helmet**: Enhanced security headers
- 📝 **Morgan**: Request logging

</details>

<details>
<summary><b>⛓️ 3. Blockchain Layer</b></summary>

- 📜 **Smart Contracts**: Avalanche Fuji deployment
- ✍️ **Multi-sig**: Identity verification
- 📚 **History**: Immutable records
- ⏱️ **Audit Trail**: Timestamp verification
- 👥 **Access Control**: Role-based permissions
- 💰 **Gas Optimization**: Cost-effective transactions

</details>

<details>
<summary><b>🌐 4. Frontend Web Application</b></summary>

- ⚛️ **React.js**: Modern UI with Material UI
- 📱 **Responsive**: All device support
- 🔗 **Web3**: Blockchain integration
- 🔐 **Auth**: Secure token management
- 🎨 **UI/UX**: User-friendly interface
- 🔄 **Real-time**: Polling updates

</details>

<details>
<summary><b>🏛️ 5. Government Portal</b></summary>

- ⚛️ **React.js**: Tailwind CSS dashboard
- 👥 **RBAC**: Administrative hierarchy
- 📋 **Identity**: Detailed user profiles
- 🔍 **Records**: Search & filtering
- 📊 **Analytics**: Audit trail viewing
- 📈 **Stats**: Real-time visualization
- 🛠️ **Dev Mode**: Testing tools
- ♿ **Accessibility**: Headless UI
- ✨ **Animations**: Framer Motion

</details>

<details>
<summary><b>🔧 6. C Client</b></summary>

- ⚡ **Lightweight**: Embedded systems
- 🔌 **API Client**: Backend integration
- 📦 **Minimal**: Few dependencies

</details>

## 🏗️ Architecture

<div align="center">
  <img src="docs/assets/architecture.png" alt="TrueID Architecture" width="800"/>
  <br/>
  <sub><i>TrueID System Architecture</i></sub>
</div>

## 📁 Project Structure

```bash
TrueID/
├── 📱 android-app/         # Mobile application
│   ├── 📂 app/            # Android source
│   │   ├── 📂 src/        # Source code
│   │   └── 📄 build.gradle # Build config
│   └── 📂 gradle/         # Gradle wrapper
├── 🖥️ backend/            # Node.js server
│   ├── ⛓️ blockchain/     # Smart contracts
│   ├── ⚙️ config/         # Config files
│   ├── 🎮 controllers/    # API controllers
│   ├── 🔌 middleware/     # Express middleware
│   ├── 📊 models/         # Database models
│   ├── 🛣️ routes/         # API routes
│   ├── 🛠️ services/       # Business logic
│   └── 🧰 utils/          # Utilities
├── 🔧 c-client/           # C implementation
├── 💾 database/           # DB schemas
├── 🌐 frontend/           # React web app
├── 🏛️ government-portal/  # Admin dashboard
│   ├── 📂 public/         # Static assets
│   ├── 📂 src/            # React components
│   └── 📄 package.json    # Dependencies
└── 📜 scripts/            # Utilities
```

## 🚀 Getting Started

### 📋 Prerequisites

<div align="center">
  <table>
    <tr>
      <td align="center">
        <a href="https://nodejs.org">
          <img src="docs/assets/nodejs.png" width="50" alt="Node.js"/>
          <br/>
          <sub>Node.js v14+</sub>
        </a>
      </td>
      <td align="center">
        <a href="https://www.postgresql.org">
          <img src="docs/assets/postgresql.png" width="50" alt="PostgreSQL"/>
          <br/>
          <sub>PostgreSQL v13+</sub>
        </a>
      </td>
      <td align="center">
        <a href="https://developer.android.com/studio">
          <img src="docs/assets/android-studio.png" width="50" alt="Android Studio"/>
          <br/>
          <sub>Android Studio</sub>
        </a>
      </td>
    </tr>
    <tr>
      <td align="center">
        <a href="https://www.oracle.com/java/technologies/downloads/">
          <img src="docs/assets/java.png" width="50" alt="JDK"/>
          <br/>
          <sub>JDK 8+</sub>
        </a>
      </td>
      <td align="center">
        <a href="https://metamask.io">
          <img src="docs/assets/metamask.png" width="50" alt="Metamask"/>
          <br/>
          <sub>Metamask</sub>
        </a>
      </td>
      <td align="center">
        <a href="https://docs.avax.network/quickstart/fuji-workflow">
          <img src="docs/assets/avalanche.png" width="50" alt="Avalanche"/>
          <br/>
          <sub>Avalanche Fuji</sub>
        </a>
      </td>
    </tr>
  </table>
</div>

### ⚙️ Installation

<div align="center">
  <table>
    <tr>
      <td align="center">
        <b>1. Clone</b>
        <br/>
        <code>git clone https://github.com/notcaliper/TrueID.git</code>
      </td>
      <td align="center">
        <b>2. Backend</b>
        <br/>
        <code>cd backend && npm install</code>
      </td>
      <td align="center">
        <b>3. Database</b>
        <br/>
        <code>cd database && npm run migrate</code>
      </td>
    </tr>
    <tr>
      <td align="center">
        <b>4. Frontend</b>
        <br/>
        <code>cd frontend && npm install</code>
      </td>
      <td align="center">
        <b>5. Portal</b>
        <br/>
        <code>cd government-portal && npm install</code>
      </td>
      <td align="center">
        <b>6. Deploy</b>
        <br/>
        <code>cd backend && npm run blockchain:deploy:fuji</code>
      </td>
    </tr>
  </table>
</div>

### ⚙️ Configuration

<details>
<summary><b>🔐 Environment Variables</b></summary>

#### Backend (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_USER=your_db_user
DB_HOST=localhost
DB_NAME=trueid_db
DB_PASSWORD=your_db_password
DB_PORT=5432

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=1h
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRATION=7d

# Blockchain
BLOCKCHAIN_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
CONTRACT_ADDRESS=your_contract_address
ADMIN_WALLET_PRIVATE_KEY=your_private_key
```

#### Frontend (.env)
```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000

# Blockchain Configuration
REACT_APP_AVALANCHE_CONTRACT_ADDRESS=your_contract_address
REACT_APP_AVALANCHE_NETWORK=fuji
REACT_APP_AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
```

#### Government Portal (.env)
```env
# Server Configuration
PORT=8000

# API Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_AVALANCHE_CONTRACT_ADDRESS=your_contract_address
```
</details>

### 🏃‍♂️ Running the System

<div align="center">
  <table>
    <tr>
      <td align="center">
        <b>Backend</b>
        <br/>
        <code>cd backend && npm run dev</code>
      </td>
      <td align="center">
        <b>Frontend</b>
        <br/>
        <code>cd frontend && npm start</code>
      </td>
      <td align="center">
        <b>Portal</b>
        <br/>
        <code>cd government-portal && npm start</code>
      </td>
    </tr>
    <tr>
      <td align="center">
        <b>Dev Mode</b>
        <br/>
        <code>cd government-portal && npm run dev:mock</code>
      </td>
      <td align="center">
        <b>Android</b>
        <br/>
        <code>cd android-app && ./gradlew assembleDebug</code>
      </td>
      <td align="center">
        <b>Tests</b>
        <br/>
        <code>npm run test</code>
      </td>
    </tr>
  </table>
</div>

## 🛡️ Security Features

<div align="center">
  <table>
    <tr>
      <td align="center">
        <b>🔒 Data Protection</b>
        <br/>
        <sub>Biometric hashing</sub>
        <br/>
        <sub>End-to-end encryption</sub>
      </td>
      <td align="center">
        <b>🔐 Authentication</b>
        <br/>
        <sub>JWT with refresh</sub>
        <br/>
        <sub>Multi-factor auth</sub>
      </td>
      <td align="center">
        <b>⛓️ Blockchain</b>
        <br/>
        <sub>Immutable records</sub>
        <br/>
        <sub>Smart contracts</sub>
      </td>
    </tr>
    <tr>
      <td align="center">
        <b>🛡️ Access Control</b>
        <br/>
        <sub>Role-based permissions</sub>
        <br/>
        <sub>Rate limiting</sub>
      </td>
      <td align="center">
        <b>📜 Compliance</b>
        <br/>
        <sub>Data protection</sub>
        <br/>
        <sub>Security audits</sub>
      </td>
      <td align="center">
        <b>🔍 Monitoring</b>
        <br/>
        <sub>Audit trails</sub>
        <br/>
        <sub>Activity logging</sub>
      </td>
    </tr>
  </table>
</div>

## 👨‍💻 Development Guidelines

### 📝 Code Style
<div align="center">
  <table>
    <tr>
      <td align="center">
        <b>🎨 Formatting</b>
        <br/>
        <sub>ESLint & Prettier</sub>
      </td>
      <td align="center">
        <b>📚 Style Guide</b>
        <br/>
        <sub>Airbnb JavaScript</sub>
      </td>
      <td align="center">
        <b>📘 TypeScript</b>
        <br/>
        <sub>Type safety</sub>
      </td>
    </tr>
    <tr>
      <td align="center">
        <b>✅ Testing</b>
        <br/>
        <sub>Unit tests</sub>
      </td>
      <td align="center">
        <b>📖 Documentation</b>
        <br/>
        <sub>API docs</sub>
      </td>
      <td align="center">
        <b>🔍 Code Review</b>
        <br/>
        <sub>Peer review</sub>
      </td>
    </tr>
  </table>
</div>

### 🔄 Git Workflow
<div align="center">
  <table>
    <tr>
      <td align="center">
        <b>🌿 Branches</b>
        <br/>
        <sub>Feature branches</sub>
      </td>
      <td align="center">
        <b>👥 Reviews</b>
        <br/>
        <sub>PR reviews</sub>
      </td>
      <td align="center">
        <b>📝 Commits</b>
        <br/>
        <sub>Conventional</sub>
      </td>
    </tr>
  </table>
</div>

### 🧪 Testing
<div align="center">
  <table>
    <tr>
      <td align="center">
        <b>🧪 Unit</b>
        <br/>
        <sub>Jest</sub>
      </td>
      <td align="center">
        <b>🔄 Integration</b>
        <br/>
        <sub>Supertest</sub>
      </td>
      <td align="center">
        <b>🌐 E2E</b>
        <br/>
        <sub>Cypress</sub>
      </td>
    </tr>
    <tr>
      <td align="center">
        <b>📱 Mobile</b>
        <br/>
        <sub>Espresso</sub>
      </td>
      <td align="center">
        <b>⛓️ Smart Contracts</b>
        <br/>
        <sub>Hardhat</sub>
      </td>
      <td align="center">
        <b>📊 Coverage</b>
        <br/>
        <sub>Reports</sub>
      </td>
    </tr>
  </table>
</div>

## 🤝 Contributing

<div align="center">
  <table>
    <tr>
      <td align="center">
        <b>1. 🍴 Fork</b>
        <br/>
        <sub>Clone the repo</sub>
      </td>
      <td align="center">
        <b>2. 🌿 Branch</b>
        <br/>
        <sub>Create feature branch</sub>
      </td>
      <td align="center">
        <b>3. 💾 Commit</b>
        <br/>
        <sub>Make changes</sub>
      </td>
    </tr>
    <tr>
      <td align="center">
        <b>4. 📤 Push</b>
        <br/>
        <sub>To your branch</sub>
      </td>
      <td align="center">
        <b>5. 🔄 PR</b>
        <br/>
        <sub>Create pull request</sub>
      </td>
      <td align="center">
        <b>6. ✅ Review</b>
        <br/>
        <sub>Address feedback</sub>
      </td>
    </tr>
  </table>
</div>

## 💬 Support

<div align="center">
  <table>
    <tr>
      <td align="center">
        <a href="https://github.com/notcaliper/TrueID/issues">
          <img src="docs/assets/github.png" width="50" alt="GitHub"/>
          <br/>
          <sub>GitHub Issues</sub>
        </a>
      </td>
      <td align="center">
        <a href="https://discord.gg/trueid">
          <img src="docs/assets/discord.png" width="50" alt="Discord"/>
          <br/>
          <sub>Discord Community</sub>
        </a>
      </td>
      <td align="center">
        <a href="mailto:support@trueid.dev">
          <img src="docs/assets/email.png" width="50" alt="Email"/>
          <br/>
          <sub>Email Support</sub>
        </a>
      </td>
    </tr>
  </table>
</div>

---

<div align="center">
  <img src="docs/assets/trueid-banner.png" alt="TrueID Banner" width="800"/>
  
  Made with ❤️ by Akshay
  
  [![Website](https://img.shields.io/badge/Website-trueid.dev-blue?style=for-the-badge)](https://trueid.dev)
  [![Documentation](https://img.shields.io/badge/Docs-docs.trueid.dev-green?style=for-the-badge)](https://docs.trueid.dev)
  [![Blog](https://img.shields.io/badge/Blog-blog.trueid.dev-orange?style=for-the-badge)](https://blog.trueid.dev)
  
  <sub>Copyright © 2024 TrueID. All rights reserved.</sub>
</div>
