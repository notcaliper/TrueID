-- Migration 006: Add blockchain_network column to biometric_data table
ALTER TABLE biometric_data ADD COLUMN IF NOT EXISTS blockchain_network VARCHAR(50) DEFAULT 'sepolia';
