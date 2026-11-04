/**
 * Script to mint an ERC-5192 Soulbound Badge on Ethereum Sepolia for citizen Akshay Manbhaw (User #2)
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { ethers } = require('ethers');
const db = require('../../services/db.service');

async function main() {
  console.log('====================================================');
  console.log('   MINTING SOULBOUND BADGE ON ETHEREUM SEPOLIA       ');
  console.log('====================================================');

  const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
  const privateKey = process.env.ADMIN_WALLET_PRIVATE_KEY;
  const sbtAddress = process.env.SOULBOUND_BADGE_ADDRESS || '0x6f4d27d80f84ce44eFecF9A1eAd6A5e6489ae9Bf';
  const didAddress = process.env.DID_REGISTRY_ADDRESS || '0x6877d0edD489fdCa49Cb9086684E6868e1153985';

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log('Deployer Wallet:   ', wallet.address);

  const sbtArtifact = require('../artifacts/blockchain/contracts/TrueIDSoulboundBadge.sol/TrueIDSoulboundBadge.json');
  const didArtifact = require('../artifacts/blockchain/contracts/TrueIDDIDRegistry.sol/TrueIDDIDRegistry.json');

  const sbtContract = new ethers.Contract(sbtAddress, sbtArtifact.abi, wallet);
  const didContract = new ethers.Contract(didAddress, didArtifact.abi, wallet);

  const recipient = '0xc628d3e2b63cCeb6038Ffe05A8E18B1e9304BBC5';
  const badgeType = 'IDENTITY_VERIFIED';
  const metadataURI = 'ipfs://bafybeihkoviema7g3gxyt6la7vd5ho32ictqbilu3wnlo3rs7ewhnp7lly/notakshay-sbt.json';
  const biometricCommitment = '0xe53230d382bdd7e72598244c0794981967853c72fe83705bb724ea530f5634d6';

  console.log('\nSubmitting ERC-5192 mintBadge transaction...');
  console.log('Recipient Address: ', recipient);
  console.log('Badge Type:        ', badgeType);
  console.log('Biometric Hash:    ', biometricCommitment);

  const tx = await sbtContract.mintBadge(recipient, badgeType, metadataURI, biometricCommitment);
  console.log(`\nTransaction submitted: ${tx.hash}`);
  console.log('Waiting for block confirmation on Sepolia...');

  const receipt = await tx.wait(1);
  console.log(`Block Number: ${receipt.blockNumber} | Gas Used: ${receipt.gasUsed.toString()}`);

  // Retrieve minted token ID from contract
  const primaryTokenId = await sbtContract.userPrimaryBadge(recipient);
  const tokenId = Number(primaryTokenId) > 0 ? Number(primaryTokenId) : 1;
  console.log(`Soulbound Badge Token ID: #${tokenId}`);

  // Verify locked status under ERC-5192 standard
  const isLocked = await sbtContract.locked(tokenId);
  console.log(`ERC-5192 locked status: ${isLocked} (Non-transferable)`);

  // Link to DID Registry
  console.log(`\nLinking Token #${tokenId} in W3C DID Registry...`);
  try {
    const linkTx = await didContract.linkSoulboundToken(recipient, tokenId);
    console.log(`DID link Tx submitted: ${linkTx.hash}`);
    await linkTx.wait(1);
    console.log('Token linked in DID registry successfully.');
  } catch (err) {
    console.log('DID linking notice:', err.message);
  }

  // Persist into live PostgreSQL database
  console.log('\nUpdating PostgreSQL database...');
  await db.query(
    'UPDATE users SET soulbound_token_id = $1, soulbound_badge_minted = true, updated_at = NOW() WHERE id = 2',
    [tokenId]
  );

  await db.query(
    `INSERT INTO soulbound_badges 
       (user_id, token_id, contract_address, tx_hash, network, chain_id, recipient_address, token_uri, badge_type, is_revoked, minted_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'sepolia', 11155111, $5, $6, $7, false, NOW(), NOW(), NOW())`,
    [2, tokenId, sbtAddress, tx.hash, recipient, metadataURI, badgeType]
  );

  await db.query(
    `INSERT INTO blockchain_transactions 
       (user_id, transaction_type, transaction_hash, network, chain_id, contract_address, from_address, to_address, block_number, gas_used, status, created_at, updated_at)
     VALUES ($1, 'SOULBOUND_BADGE_MINT', $2, 'sepolia', 11155111, $3, $4, $5, $6, $7, 'CONFIRMED', NOW(), NOW())`,
    [2, tx.hash, sbtAddress, wallet.address, recipient, receipt.blockNumber, receipt.gasUsed.toString()]
  );

  console.log('\n====================================================');
  console.log('   MINT & DATABASE SYNC COMPLETE!                   ');
  console.log('====================================================');
  console.log(`Citizen:          Akshay Manbhaw (User #2)`);
  console.log(`Token ID:         #${tokenId}`);
  console.log(`Contract:         ${sbtAddress}`);
  console.log(`Explorer:         https://sepolia.etherscan.io/tx/${tx.hash}`);

  process.exit(0);
}

main().catch(err => {
  console.error('\nMinting Failed:', err);
  process.exit(1);
});
