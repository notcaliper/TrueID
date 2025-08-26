use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct StoredDocument {
    pub id: String,
    pub owner_principal: Principal,
    pub file_name: String,
    pub file_type: String,
    pub file_size: u64,
    pub content_hash: String,
    pub encryption_key_hash: String,
    pub chunks: Vec<String>, // Chunk IDs for large files
    pub access_permissions: Vec<AccessPermission>,
    pub metadata: HashMap<String, String>,
    pub is_encrypted: bool,
    pub created_at: u64,
    pub updated_at: u64,
    pub accessed_at: u64,
    pub access_count: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct DocumentChunk {
    pub id: String,
    pub document_id: String,
    pub chunk_index: u32,
    pub data: Vec<u8>,
    pub hash: String,
    pub size: u64,
    pub created_at: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct AccessPermission {
    pub principal: Principal,
    pub permission_type: PermissionType,
    pub granted_by: Principal,
    pub granted_at: u64,
    pub expires_at: Option<u64>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum PermissionType {
    Read,
    Write,
    Delete,
    Share,
    Admin,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct UploadRequest {
    pub file_name: String,
    pub file_type: String,
    pub data: Vec<u8>,
    pub encrypt: bool,
    pub metadata: HashMap<String, String>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct UploadResponse {
    pub document_id: String,
    pub content_hash: String,
    pub file_size: u64,
    pub chunks_count: u32,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct ShareRequest {
    pub document_id: String,
    pub target_principal: Principal,
    pub permission_type: PermissionType,
    pub expires_in_seconds: Option<u64>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct StorageStats {
    pub total_documents: u64,
    pub total_storage_bytes: u64,
    pub total_chunks: u64,
    pub unique_owners: u64,
    pub encrypted_documents: u64,
    pub public_documents: u64,
    pub average_file_size: u64,
    pub storage_utilization: f64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct DocumentMetadata {
    pub id: String,
    pub file_name: String,
    pub file_type: String,
    pub file_size: u64,
    pub content_hash: String,
    pub is_encrypted: bool,
    pub created_at: u64,
    pub updated_at: u64,
    pub access_count: u64,
    pub metadata: HashMap<String, String>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum StorageError {
    NotFound,
    Unauthorized,
    InvalidInput(String),
    FileTooLarge,
    StorageQuotaExceeded,
    EncryptionError,
    ChunkNotFound,
    PermissionDenied,
    DocumentAlreadyExists,
    InternalError(String),
}

pub type StorageResult<T> = Result<T, StorageError>;

// Constants
pub const MAX_FILE_SIZE: u64 = 10 * 1024 * 1024; // 10MB per file
pub const CHUNK_SIZE: usize = 1024 * 1024; // 1MB per chunk
pub const MAX_DOCUMENTS_PER_USER: u64 = 100;
