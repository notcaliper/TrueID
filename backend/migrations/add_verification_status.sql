-- Add verification_status column
ALTER TABLE professional_records 
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'PENDING';

-- Convert existing is_verified boolean to verification_status
UPDATE professional_records 
SET verification_status = CASE 
  WHEN is_verified = true THEN 'VERIFIED'
  ELSE 'PENDING'
END;

-- Add constraint to ensure valid status values
ALTER TABLE professional_records
ADD CONSTRAINT valid_verification_status 
CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED'));

-- Drop the is_verified column (optional, can keep for backward compatibility)
-- ALTER TABLE professional_records DROP COLUMN is_verified; 