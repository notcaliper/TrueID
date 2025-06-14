-- DBIS Database Schema

-- Drop existing tables if they exist
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

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    government_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    phone VARCHAR(50),
    wallet_address VARCHAR(42),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(20) DEFAULT 'PENDING',
    verification_notes TEXT,
    verified_by INTEGER,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    avax_address TEXT,
    avax_private_key TEXT,
    password VARCHAR(255),
    blockchain_status VARCHAR(20) DEFAULT 'PENDING',
    blockchain_expiry TIMESTAMP,
    professional_verified BOOLEAN DEFAULT FALSE,
    contact_info TEXT,
    CONSTRAINT users_verification_status_check CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED'))
);

-- Admins table
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
    CONSTRAINT admins_role_check CHECK (role IN ('ADMIN', 'SUPER_ADMIN'))
);

-- Document records table
CREATE TABLE IF NOT EXISTS document_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_hash VARCHAR(255) NOT NULL,
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

-- Professional records table
CREATE TABLE IF NOT EXISTS professional_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    record_type VARCHAR(50) NOT NULL,
    institution VARCHAR(255),
    title VARCHAR(255),
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    is_current BOOLEAN DEFAULT FALSE,
    data_hash VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by INTEGER REFERENCES admins(id),
    verified_at TIMESTAMP,
    blockchain_tx_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    on_blockchain BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(20) DEFAULT 'PENDING',
    document_url TEXT,
    year INTEGER,
    corporate_address TEXT,
    job_title TEXT,
    company_name TEXT,
    employment_type TEXT,
    is_current_job BOOLEAN DEFAULT FALSE,
    job_responsibilities TEXT,
    skills_used TEXT,
    ipfs_cid TEXT,
    submission_date TIMESTAMP,
    status TEXT,
    verification_remarks TEXT,
    CONSTRAINT professional_records_verification_status_check CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    CONSTRAINT professional_records_record_type_check CHECK (record_type IN ('EDUCATION', 'EMPLOYMENT', 'CERTIFICATION'))
);

-- Biometric data table
CREATE TABLE IF NOT EXISTS biometric_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    facemesh_hash VARCHAR(255) NOT NULL,
    facemesh_data JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    blockchain_tx_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verification_status VARCHAR(20) DEFAULT 'PENDING',
    verification_score NUMERIC(5,2),
    last_verified_at TIMESTAMP,
    CONSTRAINT biometric_data_verification_status_check CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED'))
);

-- Verification requests table
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

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    refresh_token TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin sessions table
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

-- Audit logs table
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

-- Blockchain transactions table
CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    transaction_type VARCHAR(50) NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    block_number INTEGER,
    status VARCHAR(20) NOT NULL,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    network VARCHAR(50),
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    entity_id INTEGER,
    entity_type VARCHAR(50),
    metadata JSONB,
    expires_at TIMESTAMP,
    CONSTRAINT blockchain_transactions_status_check CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED'))
);

-- Biometric verifications table
CREATE TABLE IF NOT EXISTS biometric_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    biometric_data_id INTEGER REFERENCES biometric_data(id) ON DELETE SET NULL,
    success BOOLEAN DEFAULT FALSE,
    verification_score NUMERIC(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migrations table
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_government_id ON users(government_id);
CREATE INDEX IF NOT EXISTS idx_users_avax_address ON users(avax_address);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);
CREATE INDEX IF NOT EXISTS idx_users_blockchain_status ON users(blockchain_status);

CREATE INDEX IF NOT EXISTS idx_document_records_user_id ON document_records(user_id);
CREATE INDEX IF NOT EXISTS idx_document_records_verification_status ON document_records(verification_status);
CREATE INDEX IF NOT EXISTS idx_document_records_file_hash ON document_records(file_hash);

CREATE INDEX IF NOT EXISTS idx_professional_records_user_id ON professional_records(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_records_verification_status ON professional_records(verification_status);
CREATE INDEX IF NOT EXISTS idx_professional_records_record_type ON professional_records(record_type);

CREATE INDEX IF NOT EXISTS idx_biometric_data_user_id ON biometric_data(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_data_facemesh_hash ON biometric_data(facemesh_hash);
CREATE INDEX IF NOT EXISTS idx_biometric_data_verification_status ON biometric_data(verification_status);

CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_record_id ON verification_requests(record_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_entity_type ON verification_requests(entity_type);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);

CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_user_id ON blockchain_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_hash ON blockchain_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_status ON blockchain_transactions(status);

-- Initial admin user (password: admin123)
INSERT INTO admins (username, password, email, role)
VALUES ('admin', '$argon2id$v=19$m=65536,t=3,p=4$hnDOWUtprTXmHGMM4ZxTig$2eZ1T3Vy4SY10OuNkXEPTO6UFHT+aFxc2MZwsrfS9tQ', 'admin@dbis.gov', 'SUPER_ADMIN')
ON CONFLICT (username) DO NOTHING;
