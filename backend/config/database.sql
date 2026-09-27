-- =============================================================================
-- TrueID Unified Database Schema
-- Production Ready PostgreSQL Schema for Decentralized Identity System
-- Target Network: Ethereum Sepolia Testnet (Chain ID: 11155111)
-- =============================================================================

-- Drop existing tables if reinitializing (preserving dependency order)
DROP TABLE IF EXISTS account_deletion_requests CASCADE;
DROP TABLE IF EXISTS data_export_requests CASCADE;
DROP TABLE IF EXISTS suspicious_activities CASCADE;
DROP TABLE IF EXISTS user_security_settings CASCADE;
DROP TABLE IF EXISTS rate_limits CASCADE;
DROP TABLE IF EXISTS mfa_sessions CASCADE;
DROP TABLE IF EXISTS soulbound_badges CASCADE;
DROP TABLE IF EXISTS verification_requests CASCADE;
DROP TABLE IF EXISTS document_records CASCADE;
DROP TABLE IF EXISTS professional_records CASCADE;
DROP TABLE IF EXISTS biometric_verifications CASCADE;
DROP TABLE IF EXISTS biometric_data CASCADE;
DROP TABLE IF EXISTS blockchain_transactions CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS admin_sessions CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS migrations CASCADE;

-- =============================================================================
-- 1. USERS & AUTHENTICATION
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    government_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    password VARCHAR(255),
    phone VARCHAR(50),
    contact_info TEXT,
    
    -- Verification & KYC Status
    is_verified BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(20) DEFAULT 'PENDING',
    verification_notes TEXT,
    verified_by INTEGER,
    verified_at TIMESTAMP,
    professional_verified BOOLEAN DEFAULT FALSE,
    biometric_verified BOOLEAN DEFAULT FALSE,
    
    -- Web3 & Ethereum Sepolia Identity
    wallet_address VARCHAR(42),
    blockchain_network VARCHAR(50) DEFAULT 'sepolia',
    blockchain_status VARCHAR(20) DEFAULT 'PENDING',
    blockchain_tx_hash VARCHAR(66),
    blockchain_registered_at TIMESTAMP,
    blockchain_expiry TIMESTAMP,
    soulbound_token_id BIGINT,
    soulbound_badge_minted BOOLEAN DEFAULT FALSE,
    
    -- Backward compatibility fields
    avax_address TEXT,
    avax_private_key TEXT,
    
    -- Multi-Factor Authentication (MFA)
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    mfa_type VARCHAR(20) DEFAULT 'TOTP', -- TOTP, SMS, EMAIL
    mfa_backup_codes JSONB DEFAULT '[]'::jsonb,
    mfa_verified_at TIMESTAMP,
    mfa_setup_pending BOOLEAN DEFAULT FALSE,
    
    -- Metadata Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT users_verification_status_check CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'IN_REVIEW')),
    CONSTRAINT users_blockchain_status_check CHECK (blockchain_status IN ('PENDING', 'REGISTERED', 'CONFIRMED', 'FAILED', 'REVOKED'))
);

-- =============================================================================
-- 2. ADMINISTRATORS
-- =============================================================================
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'ADMIN',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT admins_role_check CHECK (role IN ('ADMIN', 'SUPER_ADMIN', 'AUDITOR'))
);

-- =============================================================================
-- 3. DOCUMENT RECORDS
-- =============================================================================
CREATE TABLE IF NOT EXISTS document_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) DEFAULT 'NATIONAL_ID', -- PASSPORT, DRIVERS_LICENSE, NATIONAL_ID, CERTIFICATE
    document_number VARCHAR(100),
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_hash VARCHAR(255) NOT NULL,
    ipfs_cid TEXT,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'PENDING',
    verified_by INTEGER REFERENCES admins(id),
    verification_date TIMESTAMP,
    blockchain_tx_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT document_records_verification_status_check CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED'))
);

-- =============================================================================
-- 4. PROFESSIONAL RECORDS
-- =============================================================================
CREATE TABLE IF NOT EXISTS professional_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    record_type VARCHAR(50) NOT NULL, -- EDUCATION, EMPLOYMENT, CERTIFICATION
    institution VARCHAR(255),
    company_name TEXT,
    title VARCHAR(255),
    job_title TEXT,
    description TEXT,
    employment_type TEXT,
    is_current_job BOOLEAN DEFAULT FALSE,
    job_responsibilities TEXT,
    skills_used TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    is_current BOOLEAN DEFAULT FALSE,
    year INTEGER,
    corporate_address TEXT,
    document_url TEXT,
    ipfs_cid TEXT,
    data_hash VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(20) DEFAULT 'PENDING',
    verified_by INTEGER REFERENCES admins(id),
    verified_at TIMESTAMP,
    verification_remarks TEXT,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    on_blockchain BOOLEAN DEFAULT FALSE,
    blockchain_tx_hash VARCHAR(66),
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT professional_records_verification_status_check CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    CONSTRAINT professional_records_record_type_check CHECK (record_type IN ('EDUCATION', 'EMPLOYMENT', 'CERTIFICATION'))
);

-- =============================================================================
-- 5. BIOMETRICS & FACEMESH
-- =============================================================================
CREATE TABLE IF NOT EXISTS biometric_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    facemesh_hash VARCHAR(255) NOT NULL,
    facemesh_data JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    verification_status VARCHAR(20) DEFAULT 'PENDING',
    verification_score NUMERIC(5,2),
    liveness_score NUMERIC(5,2),
    blockchain_tx_hash VARCHAR(66),
    last_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT biometric_data_verification_status_check CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED'))
);

CREATE TABLE IF NOT EXISTS biometric_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    biometric_data_id INTEGER REFERENCES biometric_data(id) ON DELETE SET NULL,
    success BOOLEAN DEFAULT FALSE,
    verification_score NUMERIC(5,2),
    liveness_detected BOOLEAN DEFAULT TRUE,
    attempt_metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 6. VERIFICATION REQUESTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS verification_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    record_id INTEGER NOT NULL,
    record_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    notes TEXT,
    priority INTEGER DEFAULT 0,
    verification_method VARCHAR(20) DEFAULT 'MANUAL',
    assigned_to INTEGER REFERENCES admins(id),
    reviewed_by INTEGER REFERENCES admins(id),
    reviewed_at TIMESTAMP,
    metadata JSONB,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT verification_requests_status_check CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    CONSTRAINT verification_requests_entity_type_check CHECK (entity_type IN ('document_records', 'professional_records', 'biometric_data'))
);

-- =============================================================================
-- 7. BLOCKCHAIN TRANSACTIONS & SOULBOUND BADGES (ETHEREUM SEPOLIA)
-- =============================================================================
CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    transaction_type VARCHAR(50) NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    network VARCHAR(50) DEFAULT 'sepolia',
    chain_id BIGINT DEFAULT 11155111,
    contract_address VARCHAR(42),
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    block_number BIGINT,
    gas_used BIGINT,
    effective_gas_price VARCHAR(78),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    data JSONB,
    metadata JSONB,
    entity_id INTEGER,
    entity_type VARCHAR(50),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT blockchain_transactions_status_check CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED'))
);

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

-- =============================================================================
-- 8. SECURITY & SESSIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    refresh_token TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info JSONB,
    location_info JSONB,
    session_type VARCHAR(20) DEFAULT 'WEB', -- WEB, MOBILE, API
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMP,
    revoked_by INTEGER,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_sessions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    refresh_token TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mfa_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    temp_token VARCHAR(255) NOT NULL,
    mfa_token VARCHAR(10),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

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

CREATE TABLE IF NOT EXISTS user_security_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    allowed_countries JSONB DEFAULT '[]'::jsonb,
    blocked_countries JSONB DEFAULT '[]'::jsonb,
    max_sessions INTEGER DEFAULT 5,
    require_ip_verification BOOLEAN DEFAULT FALSE,
    notify_new_device BOOLEAN DEFAULT TRUE,
    notify_suspicious_activity BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suspicious_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
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

-- =============================================================================
-- 9. GDPR & DATA RIGHTS
-- =============================================================================
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

-- =============================================================================
-- 10. AUDIT LOGS & MIGRATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 11. INDEXES FOR HIGH-THROUGHPUT LOOKUPS
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_users_government_id ON users(government_id);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);
CREATE INDEX IF NOT EXISTS idx_users_blockchain_status ON users(blockchain_status);
CREATE INDEX IF NOT EXISTS idx_users_blockchain_network ON users(blockchain_network);
CREATE INDEX IF NOT EXISTS idx_users_soulbound_token ON users(soulbound_token_id);
CREATE INDEX IF NOT EXISTS idx_users_mfa_enabled ON users(mfa_enabled);

CREATE INDEX IF NOT EXISTS idx_document_records_user_id ON document_records(user_id);
CREATE INDEX IF NOT EXISTS idx_document_records_file_hash ON document_records(file_hash);
CREATE INDEX IF NOT EXISTS idx_document_records_ipfs_cid ON document_records(ipfs_cid);
CREATE INDEX IF NOT EXISTS idx_document_records_status ON document_records(verification_status);

CREATE INDEX IF NOT EXISTS idx_professional_records_user_id ON professional_records(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_records_type ON professional_records(record_type);
CREATE INDEX IF NOT EXISTS idx_professional_records_status ON professional_records(verification_status);

CREATE INDEX IF NOT EXISTS idx_biometric_data_user_id ON biometric_data(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_data_facemesh_hash ON biometric_data(facemesh_hash);
CREATE INDEX IF NOT EXISTS idx_biometric_data_status ON biometric_data(verification_status);

CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_record ON verification_requests(record_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_entity ON verification_requests(entity_type);
CREATE INDEX IF NOT EXISTS idx_verification_requests_assigned ON verification_requests(assigned_to);

CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_user ON blockchain_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_hash ON blockchain_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_status ON blockchain_transactions(status);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_network ON blockchain_transactions(network);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_contract ON blockchain_transactions(contract_address);

CREATE INDEX IF NOT EXISTS idx_soulbound_badges_user ON soulbound_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_soulbound_badges_token ON soulbound_badges(token_id);
CREATE INDEX IF NOT EXISTS idx_soulbound_badges_recipient ON soulbound_badges(recipient_address);
CREATE INDEX IF NOT EXISTS idx_soulbound_badges_hash ON soulbound_badges(tx_hash);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_mfa_sessions_token ON mfa_sessions(temp_token);
CREATE INDEX IF NOT EXISTS idx_mfa_sessions_user ON mfa_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type);

-- =============================================================================
-- 12. AUTOMATIC TIMESTAMP TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE OR REPLACE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_documents_updated_at BEFORE UPDATE ON document_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_professional_updated_at BEFORE UPDATE ON professional_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_biometric_updated_at BEFORE UPDATE ON biometric_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_verification_requests_updated_at BEFORE UPDATE ON verification_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_blockchain_transactions_updated_at BEFORE UPDATE ON blockchain_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_soulbound_badges_updated_at BEFORE UPDATE ON soulbound_badges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 13. SEED DATA
-- =============================================================================
-- Initial Super Admin (username: admin, default password: admin123)
INSERT INTO admins (username, password, email, role)
VALUES ('admin', '$argon2id$v=19$m=65536,t=3,p=4$hnDOWUtprTXmHGMM4ZxTig$2eZ1T3Vy4SY10OuNkXEPTO6UFHT+aFxc2MZwsrfS9tQ', 'admin@trueid.org', 'SUPER_ADMIN')
ON CONFLICT (username) DO UPDATE 
SET email = EXCLUDED.email, role = EXCLUDED.role;

-- Record Baseline Migration
INSERT INTO migrations (name) VALUES 
('001_add_mfa_to_users'),
('002_session_management'),
('003_sepolia_soulbound_identity')
ON CONFLICT (name) DO NOTHING;
