-- Migration: 004_w3c_verifiable_credentials.sql
-- Description: Expand record_type constraint and add W3C Verifiable Credential JSON-LD fields

BEGIN;

-- 1. Safely expand the record_type constraint on professional_records
ALTER TABLE professional_records DROP CONSTRAINT IF EXISTS professional_records_record_type_check;

ALTER TABLE professional_records ADD CONSTRAINT professional_records_record_type_check 
  CHECK (record_type IN ('EDUCATION', 'ACADEMIC', 'EMPLOYMENT', 'CERTIFICATION', 'GOVERNMENT', 'LICENSE'));

-- 2. Add native W3C Verifiable Credential schema columns
ALTER TABLE professional_records 
  ADD COLUMN IF NOT EXISTS credential_id VARCHAR(120),
  ADD COLUMN IF NOT EXISTS issuer_did VARCHAR(120),
  ADD COLUMN IF NOT EXISTS proof_schema VARCHAR(120),
  ADD COLUMN IF NOT EXISTS vc_payload JSONB;

-- 3. Populate default W3C DID metadata for existing verified records
UPDATE professional_records 
SET 
  credential_id = COALESCE(credential_id, 'urn:uuid:' || md5(random()::text || clock_timestamp()::text)),
  issuer_did = COALESCE(issuer_did, 'did:trueid:authority:gov-01'),
  proof_schema = COALESCE(proof_schema, 'JsonWebSignature2020')
WHERE credential_id IS NULL;

-- 4. Record the migration
INSERT INTO migrations (name, executed_at) 
VALUES ('004_w3c_verifiable_credentials.sql', NOW())
ON CONFLICT DO NOTHING;

COMMIT;
