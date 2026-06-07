-- Migration: Add MFA support to users table
-- Created: 2026-06-07

-- Add MFA columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(255),
ADD COLUMN IF NOT EXISTS mfa_type VARCHAR(20) DEFAULT 'TOTP', -- TOTP, SMS, EMAIL
ADD COLUMN IF NOT EXISTS mfa_backup_codes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS mfa_verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS mfa_setup_pending BOOLEAN DEFAULT FALSE;

-- Create MFA verification sessions table for temporary MFA tokens during login
CREATE TABLE IF NOT EXISTS mfa_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    temp_token VARCHAR(255) NOT NULL,
    mfa_token VARCHAR(10), -- The expected MFA code for verification
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mfa_sessions_temp_token ON mfa_sessions(temp_token);
CREATE INDEX IF NOT EXISTS idx_mfa_sessions_user_id ON mfa_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_mfa_enabled ON users(mfa_enabled);

-- Log migration
INSERT INTO migrations (name) VALUES ('001_add_mfa_to_users') ON CONFLICT (name) DO NOTHING;
