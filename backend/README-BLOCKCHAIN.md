# Local Blockchain Setup for DBIS

This guide explains how to set up and use a local blockchain network for the Decentralized Biometric Identity System (DBIS).

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Setup Instructions

1. **Install Dependencies**

   All required dependencies have been installed in the project. If you need to reinstall them, run:

   ```bash
   npm install
   ```

2. **Start the Local Blockchain**

   Start a local Ethereum blockchain using Ganache:

   ```bash
   npm run blockchain:start
   ```

   This will:
   - Start a local blockchain at http://localhost:8545
   - Create 10 test accounts with 1000 ETH each
   - Display the accounts and their private keys
   - Save the first account's private key to `.env.local`

   Keep this terminal window open as long as you need the blockchain running.

3. **Deploy the Smart Contract**

   In a new terminal window, deploy the IdentityManagement smart contract to the local blockchain:

   ```bash
   npm run blockchain:deploy
   ```

   This will:
   - Compile the IdentityManagement.sol contract
   - Deploy it to the local blockchain
   - Save the contract address to `.env.local`
   - Update the ABI file if needed

4. **Test the Blockchain Integration**

   Test the blockchain integration to make sure everything is working:

   ```bash
   npm run blockchain:test
   ```

   This will:
   - Connect to the local blockchain
   - Create a test identity
   - Add a professional record
   - Verify that everything is working correctly

5. **Start the Backend Server**

   Start the backend server which will connect to the local blockchain:

   ```bash
   npm run dev
   ```

## Using the Local Blockchain

The backend server will automatically connect to the local blockchain using the configuration in `.env.local`. You can use the API endpoints to interact with the blockchain:

- `POST /api/blockchain/register-identity`: Register a user's identity on the blockchain
- `GET /api/blockchain/identity-status`: Get a user's identity status from the blockchain
- `POST /api/blockchain/add-professional-record`: Add a professional record to the blockchain
- `GET /api/blockchain/professional-records`: Get a user's professional records from the blockchain

## Troubleshooting

1. **Contract Deployment Fails**

   If contract deployment fails, make sure:
   - The local blockchain is running
   - The account has enough ETH for gas fees
   - The contract compiles without errors

2. **Connection Issues**

   If the backend can't connect to the blockchain:
   - Check that the local blockchain is still running
   - Verify that the RPC URL in `.env.local` is correct (http://localhost:8545)
   - Make sure the contract address in `.env.local` is valid

3. **Transaction Errors**

   If transactions fail:
   - Check the console for error messages
   - Verify that the account has enough ETH for gas fees
   - Make sure the contract functions are being called correctly

## Moving to Other Networks

Once you've tested on the local network, you can deploy to other networks by:

1. Update the `.env` file with the new network details:
   ```
   BLOCKCHAIN_RPC_URL=https://your-network-rpc-url
   PRIVATE_KEY=your-private-key-without-0x-prefix
   ```

2. Deploy the contract to the new network:
   ```bash
   BLOCKCHAIN_RPC_URL=https://your-network-rpc-url PRIVATE_KEY=your-private-key-without-0x-prefix node src/blockchain/deploy.js
   ```

3. Update the `.env` file with the new contract address.

## Security Considerations

- **NEVER** use the private keys from this local setup in production
- For production, use secure key management solutions
- Consider implementing additional security measures like multisig wallets
- Always use HTTPS for RPC connections in production environments
