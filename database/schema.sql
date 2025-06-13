-- DBIS Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    username character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    government_id character varying(255) NOT NULL,
    email character varying(255),
    password_hash character varying(255),
    phone character varying(50),
    wallet_address character varying(42),
    is_verified boolean DEFAULT FALSE,
    verification_status character varying(20) DEFAULT 'PENDING',
    verification_notes text,
    verified_by integer,
    verified_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    avax_address text,
    avax_private_key text,
    password character varying(255),
    blockchain_status character varying(20) DEFAULT 'PENDING',
    blockchain_expiry timestamp without time zone,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_government_id_key UNIQUE (government_id),
    CONSTRAINT users_username_key UNIQUE (username)
);

-- Biometric data table
CREATE TABLE IF NOT EXISTS biometric_data (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  facemesh_hash VARCHAR(255) NOT NULL,
  facemesh_data JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  blockchain_tx_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verification_status VARCHAR(20) DEFAULT 'PENDING',
  verification_score NUMERIC(5,2),
  last_verified_at TIMESTAMP,
  CONSTRAINT biometric_data_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES users(id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- Argon2 or bcrypt hashed password
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'ADMIN', -- ADMIN, SUPER_ADMIN
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Professional records table
CREATE TABLE IF NOT EXISTS professional_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  record_type VARCHAR(50) NOT NULL, -- EDUCATION, EMPLOYMENT, CERTIFICATION
  institution VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  data_hash VARCHAR(255), -- Hash of record data
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by INTEGER REFERENCES admins(id),
  verified_at TIMESTAMP,
  blockchain_tx_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  refresh_token VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  refresh_token VARCHAR(255),
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
  status VARCHAR(20) NOT NULL, -- PENDING, CONFIRMED, FAILED
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial admin user (password: admin123)
INSERT INTO admins (username, password, email, role)
VALUES ('admin', '$argon2id$v=19$m=65536,t=3,p=4$hnDOWUtprTXmHGMM4ZxTig$2eZ1T3Vy4SY10OuNkXEPTO6UFHT+aFxc2MZwsrfS9tQ', 'admin@dbis.gov', 'SUPER_ADMIN')
ON CONFLICT (username) DO NOTHING;

-- Biometric verifications table
CREATE TABLE IF NOT EXISTS biometric_verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  biometric_data_id INTEGER REFERENCES biometric_data(id) ON DELETE SET NULL,
  success BOOLEAN DEFAULT FALSE,
  verification_score NUMERIC(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_government_id ON users USING btree (government_id);
CREATE INDEX IF NOT EXISTS idx_users_avax_address ON users USING btree (avax_address);
CREATE INDEX IF NOT EXISTS idx_biometric_data_facemesh_hash ON biometric_data(facemesh_hash);
CREATE INDEX IF NOT EXISTS idx_biometric_data_user_id ON biometric_data(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_verifications_user_id ON biometric_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_professional_records_user_id ON professional_records(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_user_id ON blockchain_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_hash ON blockchain_transactions(transaction_hash); 