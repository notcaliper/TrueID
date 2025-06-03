-- Add blockchain_status column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS blockchain_status VARCHAR(20) DEFAULT 'PENDING';

-- Add blockchain_expiry column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS blockchain_expiry TIMESTAMP;

-- Add comments to the columns
COMMENT ON COLUMN users.blockchain_status IS 'Status of user identity on blockchain: PENDING, REGISTERED, CONFIRMED';
COMMENT ON COLUMN users.blockchain_expiry IS 'Expiry time for blockchain registration';
