-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_verification_requests_timestamp ON verification_requests;
DROP FUNCTION IF EXISTS update_verification_requests_timestamp();

-- Drop existing table if it exists
DROP TABLE IF EXISTS verification_requests;

-- Add verification_requests table
CREATE TABLE IF NOT EXISTS verification_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  record_id INTEGER NOT NULL,
  record_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  entity_type VARCHAR(50) NOT NULL,
  notes TEXT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INTEGER REFERENCES admins(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  priority INTEGER DEFAULT 0,
  assigned_to INTEGER REFERENCES admins(id),
  verification_method VARCHAR(20) DEFAULT 'MANUAL',
  CONSTRAINT verification_requests_status_check CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  CONSTRAINT verification_requests_entity_type_check CHECK (entity_type IN ('document_records', 'professional_records', 'biometric_data'))
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_record_id ON verification_requests(record_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_entity_type ON verification_requests(entity_type);
CREATE INDEX IF NOT EXISTS idx_verification_requests_assigned_to ON verification_requests(assigned_to);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_verification_requests_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_verification_requests_timestamp
  BEFORE UPDATE ON verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_verification_requests_timestamp(); 