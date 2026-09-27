-- Migration: Sepolia Network Migration & Soulbound Badge Identity
-- Version: 003
-- Created: 2026-09-27

-- 1. Upgrade Users Table for Ethereum Sepolia & Soulbound Badges
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42),
ADD COLUMN IF NOT EXISTS blockchain_network VARCHAR(50) DEFAULT 'sepolia',
ADD COLUMN IF NOT EXISTS blockchain_tx_hash VARCHAR(66),
ADD COLUMN IF NOT EXISTS blockchain_registered_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS soulbound_token_id BIGINT,
ADD COLUMN IF NOT EXISTS soulbound_badge_minted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS biometric_verified BOOLEAN DEFAULT FALSE;

-- Create indexes for quick address and network lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_soulbound_token_id ON users(soulbound_token_id);
CREATE INDEX IF NOT EXISTS idx_users_blockchain_network ON users(blockchain_network);

-- Update blockchain status check constraint to include CONFIRMED
DO $$
BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_blockchain_status_check;
    ALTER TABLE users ADD CONSTRAINT users_blockchain_status_check 
    CHECK (blockchain_status IN ('PENDING', 'REGISTERED', 'CONFIRMED', 'FAILED', 'REVOKED'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 2. Upgrade Document Records
ALTER TABLE document_records
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50) DEFAULT 'NATIONAL_ID',
ADD COLUMN IF NOT EXISTS document_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS ipfs_cid TEXT;

CREATE INDEX IF NOT EXISTS idx_document_records_ipfs_cid ON document_records(ipfs_cid);
CREATE INDEX IF NOT EXISTS idx_document_records_doc_type ON document_records(document_type);

-- 3. Upgrade Blockchain Transactions Table
ALTER TABLE blockchain_transactions
ADD COLUMN IF NOT EXISTS network VARCHAR(50) DEFAULT 'sepolia',
ADD COLUMN IF NOT EXISTS chain_id BIGINT DEFAULT 11155111,
ADD COLUMN IF NOT EXISTS contract_address VARCHAR(42),
ADD COLUMN IF NOT EXISTS gas_used BIGINT,
ADD COLUMN IF NOT EXISTS effective_gas_price VARCHAR(78);

CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_network ON blockchain_transactions(network);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_chain_id ON blockchain_transactions(chain_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_contract ON blockchain_transactions(contract_address);

-- 4. Create Soulbound Badges Table (ERC-5192 Minimal Soulbound Badge)
CREATE TABLE IF NOT EXISTS soulbound_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_id BIGINT UNIQUE NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    network VARCHAR(50) DEFAULT 'sepolia',
    chain_id BIGINT DEFAULT 11155111,
    recipient_address VARCHAR(42) NOT NULL,
    token_uri TEXT,
    badge_type VARCHAR(50) DEFAULT 'IDENTITY_VERIFIED',
    metadata JSONB,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP,
    revocation_reason TEXT,
    minted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_soulbound_badges_user_id ON soulbound_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_soulbound_badges_token_id ON soulbound_badges(token_id);
CREATE INDEX IF NOT EXISTS idx_soulbound_badges_recipient ON soulbound_badges(recipient_address);
CREATE INDEX IF NOT EXISTS idx_soulbound_badges_tx_hash ON soulbound_badges(tx_hash);

-- 5. Ensure GDPR export and account deletion tables exist
CREATE TABLE IF NOT EXISTS data_export_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'PENDING',
    request_type VARCHAR(50) DEFAULT 'FULL_EXPORT',
    format VARCHAR(20) DEFAULT 'JSON',
    file_path TEXT,
    file_url TEXT,
    expires_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS account_deletion_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'PENDING',
    reason TEXT,
    scheduled_deletion_date TIMESTAMP,
    cancelled_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Record Migration
INSERT INTO migrations (name) VALUES ('003_sepolia_soulbound_identity') 
ON CONFLICT (name) DO NOTHING;
