-- Migration to add blockchain_status and blockchain_expiry columns to users table

-- Check if blockchain_status column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='blockchain_status') THEN
        ALTER TABLE users ADD COLUMN blockchain_status VARCHAR(20) DEFAULT 'PENDING';
    END IF;
END
$$;

-- Check if blockchain_expiry column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='blockchain_expiry') THEN
        ALTER TABLE users ADD COLUMN blockchain_expiry TIMESTAMP;
    END IF;
END
$$;

-- Add comment to the columns
COMMENT ON COLUMN users.blockchain_status IS 'Status of user identity on blockchain: PENDING, REGISTERED, CONFIRMED';
COMMENT ON COLUMN users.blockchain_expiry IS 'Expiry time for blockchain registration';
