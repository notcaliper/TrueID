-- Migration: 005_add_did_to_users.sql
-- Description: Add dedicated W3C Decentralized Identifier (did) column to users table

BEGIN;

-- 1. Add did column to users
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS did VARCHAR(120) UNIQUE;

-- 2. Populate did for existing users based on their custodial/wallet address
UPDATE users 
SET did = 'did:trueid:' || COALESCE(wallet_address, avax_address)
WHERE did IS NULL AND (wallet_address IS NOT NULL OR avax_address IS NOT NULL);

-- 3. Create index for high-performance DID resolution
CREATE INDEX IF NOT EXISTS idx_users_did ON users(did);

-- 4. Record migration
INSERT INTO migrations (name, executed_at) 
VALUES ('005_add_did_to_users.sql', NOW())
ON CONFLICT DO NOTHING;

COMMIT;
