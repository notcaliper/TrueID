-- Migration: Enhanced Session Management & Security Features
-- Created: 2026-06-07

-- Add metadata columns to user_sessions table
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS device_info JSONB,
ADD COLUMN IF NOT EXISTS location_info JSONB,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS revoked_by INTEGER,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS session_type VARCHAR(20) DEFAULT 'WEB'; -- WEB, MOBILE, API

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 0,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, endpoint, window_start)
);

-- Create user security settings table
CREATE TABLE IF NOT EXISTS user_security_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    allowed_countries JSONB DEFAULT '[]'::jsonb, -- Empty means all countries allowed
    blocked_countries JSONB DEFAULT '[]'::jsonb,
    max_sessions INTEGER DEFAULT 5,
    require_ip_verification BOOLEAN DEFAULT FALSE,
    notify_new_device BOOLEAN DEFAULT TRUE,
    notify_suspicious_activity BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create suspicious activity log table
CREATE TABLE IF NOT EXISTS suspicious_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- FAILED_LOGIN, SUSPICIOUS_IP, RATE_LIMIT_HIT, etc.
    ip_address VARCHAR(45),
    location_info JSONB,
    device_info JSONB,
    details JSONB,
    severity VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolved_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create data export requests table (GDPR)
CREATE TABLE IF NOT EXISTS data_export_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
    format VARCHAR(10) DEFAULT 'JSON', -- JSON, PDF
    file_path TEXT,
    file_size BIGINT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create account deletion requests table (GDPR)
CREATE TABLE IF NOT EXISTS account_deletion_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED
    reason TEXT,
    confirmation_code VARCHAR(255),
    confirmed_at TIMESTAMP,
    scheduled_deletion_at TIMESTAMP,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_user_id ON suspicious_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_created ON suspicious_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_data_export_user_id ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_account_deletion_user_id ON account_deletion_requests(user_id);

-- Add function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    UPDATE user_sessions 
    SET is_active = FALSE 
    WHERE expires_at < CURRENT_TIMESTAMP AND is_active = TRUE;
    
    -- Log the cleanup
    INSERT INTO audit_logs (action, entity_type, details, created_at)
    VALUES (
        'SESSIONS_CLEANUP',
        'system',
        jsonb_build_object('message', 'Cleaned up expired sessions'),
        CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql;

-- Log migration
INSERT INTO migrations (name) VALUES ('002_session_management') ON CONFLICT (name) DO NOTHING;
