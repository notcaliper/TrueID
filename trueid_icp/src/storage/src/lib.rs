use ic_cdk::api::caller;
use ic_cdk_macros::{init, post_upgrade, pre_upgrade, query, update};
use candid::Principal;
use std::collections::HashMap;

mod types;
mod storage;

use types::{
    StoredDocument, DocumentChunk, AccessPermission, PermissionType, UploadRequest,
    UploadResponse, ShareRequest, StorageStats, DocumentMetadata,
    StorageError, StorageResult, MAX_FILE_SIZE, CHUNK_SIZE, MAX_DOCUMENTS_PER_USER
};
use storage::{
    store_document, get_document, update_document, delete_document,
    store_chunk, get_chunk, get_user_documents, get_user_document_count,
    get_all_documents, get_total_storage_size, get_total_chunk_count,
    document_exists, update_document_access, get_current_time,
    generate_document_id, generate_chunk_id, calculate_content_hash
};

// Cross-canister calls
#[ic_cdk::import(canister = "identity")]
async fn get_role(user_principal: Principal) -> (Option<UserRole>,);

#[derive(candid::CandidType, serde::Deserialize, Clone, Debug)]
struct UserRole {
    principal: Principal,
    role: Role,
    granted_by: Principal,
    granted_at: u64,
}

#[derive(candid::CandidType, serde::Deserialize, Clone, Debug, PartialEq)]
enum Role {
    User,
    Government,
    Admin,
}

// Initialize canister
#[init]
fn init() {
    // Storage canister initialization
}

// Upgrade hooks
#[pre_upgrade]
fn pre_upgrade() {
    // Stable memory is automatically preserved
}

#[post_upgrade]
fn post_upgrade() {
    // Stable memory is automatically restored
}

// Helper function to check authorization
async fn check_authorization(target_principal: &Principal, admin_only: bool) -> StorageResult<()> {
    let caller = caller();
    
    // Users can access their own data
    if caller == *target_principal && !admin_only {
        return Ok(());
    }
    
    // Check caller's role via identity canister
    let (role_opt,) = get_role(caller).await;
    if let Some(user_role) = role_opt {
        match user_role.role {
            Role::Admin => Ok(()),
            Role::Government if !admin_only => Ok(()),
            _ => Err(StorageError::Unauthorized),
        }
    } else {
        Err(StorageError::Unauthorized)
    }
}

// Check document access permission
fn check_document_permission(
    document: &StoredDocument,
    caller: &Principal,
    required_permission: PermissionType,
) -> StorageResult<()> {
    // Owner has all permissions
    if document.owner_principal == *caller {
        return Ok(());
    }
    
    // Check explicit permissions
    for permission in &document.access_permissions {
        if permission.principal == *caller {
            // Check if permission is valid (not expired)
            if let Some(expires_at) = permission.expires_at {
                if get_current_time() > expires_at {
                    continue; // Permission expired
                }
            }
            
            // Check permission type
            match (&permission.permission_type, &required_permission) {
                (PermissionType::Admin, _) => return Ok(()),
                (perm, req) if perm == req => return Ok(()),
                _ => continue,
            }
        }
    }
    
    Err(StorageError::PermissionDenied)
}

// Simple encryption (XOR with key - for demo purposes, use proper encryption in production)
fn encrypt_data(data: &[u8], key: &[u8]) -> Vec<u8> {
    data.iter()
        .zip(key.iter().cycle())
        .map(|(d, k)| d ^ k)
        .collect()
}

fn decrypt_data(encrypted_data: &[u8], key: &[u8]) -> Vec<u8> {
    encrypt_data(encrypted_data, key) // XOR is symmetric
}

// Generate encryption key from user principal
fn generate_encryption_key(principal: &Principal) -> Vec<u8> {
    let mut key = principal.as_slice().to_vec();
    key.resize(32, 0); // Ensure 32-byte key
    key
}

// Upload document
#[update]
async fn upload_document(request: UploadRequest) -> StorageResult<UploadResponse> {
    let caller = caller();
    
    // Validate file size
    if request.data.len() as u64 > MAX_FILE_SIZE {
        return Err(StorageError::FileTooLarge);
    }
    
    // Check user document quota
    let user_doc_count = get_user_document_count(&caller);
    if user_doc_count >= MAX_DOCUMENTS_PER_USER {
        return Err(StorageError::StorageQuotaExceeded);
    }
    
    let content_hash = calculate_content_hash(&request.data);
    let document_id = generate_document_id(&content_hash, &caller);
    
    // Check if document already exists
    if document_exists(&document_id) {
        return Err(StorageError::DocumentAlreadyExists);
    }
    
    let current_time = get_current_time();
    let mut data_to_store = request.data.clone();
    let encryption_key_hash = if request.encrypt {
        let key = generate_encryption_key(&caller);
        data_to_store = encrypt_data(&request.data, &key);
        calculate_content_hash(&key)
    } else {
        String::new()
    };
    
    // Split data into chunks
    let mut chunks = Vec::new();
    let chunk_count = (data_to_store.len() + CHUNK_SIZE - 1) / CHUNK_SIZE;
    
    for (index, chunk_data) in data_to_store.chunks(CHUNK_SIZE).enumerate() {
        let chunk_id = generate_chunk_id(&document_id, index as u32);
        let chunk_hash = calculate_content_hash(chunk_data);
        
        let chunk = DocumentChunk {
            id: chunk_id.clone(),
            document_id: document_id.clone(),
            chunk_index: index as u32,
            data: chunk_data.to_vec(),
            hash: chunk_hash,
            size: chunk_data.len() as u64,
            created_at: current_time,
        };
        
        store_chunk(chunk)?;
        chunks.push(chunk_id);
    }
    
    let document = StoredDocument {
        id: document_id.clone(),
        owner_principal: caller,
        file_name: request.file_name,
        file_type: request.file_type,
        file_size: request.data.len() as u64,
        content_hash,
        encryption_key_hash,
        chunks,
        access_permissions: Vec::new(),
        metadata: request.metadata,
        is_encrypted: request.encrypt,
        created_at: current_time,
        updated_at: current_time,
        accessed_at: current_time,
        access_count: 0,
    };
    
    store_document(document)?;
    
    Ok(UploadResponse {
        document_id,
        content_hash: document.content_hash,
        file_size: document.file_size,
        chunks_count: chunk_count as u32,
    })
}

// Download document
#[update]
async fn download_document(document_id: String) -> StorageResult<Vec<u8>> {
    let caller = caller();
    let document = get_document(&document_id)?;
    
    // Check permission
    check_document_permission(&document, &caller, PermissionType::Read)?;
    
    // Update access statistics
    update_document_access(&document_id)?;
    
    // Reconstruct file from chunks
    let mut file_data = Vec::new();
    for chunk_id in &document.chunks {
        let chunk = get_chunk(chunk_id)?;
        file_data.extend(chunk.data);
    }
    
    // Decrypt if necessary
    if document.is_encrypted && document.owner_principal == caller {
        let key = generate_encryption_key(&caller);
        file_data = decrypt_data(&file_data, &key);
    }
    
    Ok(file_data)
}

// Get document metadata
#[query]
async fn get_document_metadata(document_id: String) -> StorageResult<DocumentMetadata> {
    let caller = caller();
    let document = get_document(&document_id)?;
    
    // Check permission
    check_document_permission(&document, &caller, PermissionType::Read)?;
    
    Ok(DocumentMetadata {
        id: document.id,
        file_name: document.file_name,
        file_type: document.file_type,
        file_size: document.file_size,
        content_hash: document.content_hash,
        is_encrypted: document.is_encrypted,
        created_at: document.created_at,
        updated_at: document.updated_at,
        access_count: document.access_count,
        metadata: document.metadata,
    })
}

// Share document
#[update]
async fn share_document(request: ShareRequest) -> StorageResult<()> {
    let caller = caller();
    let mut document = get_document(&request.document_id)?;
    
    // Check permission (only owner or admin can share)
    check_document_permission(&document, &caller, PermissionType::Share)?;
    
    let current_time = get_current_time();
    let expires_at = request.expires_in_seconds.map(|seconds| current_time + seconds * 1_000_000_000);
    
    let permission = AccessPermission {
        principal: request.target_principal,
        permission_type: request.permission_type,
        granted_by: caller,
        granted_at: current_time,
        expires_at,
    };
    
    // Remove existing permission for the same principal if exists
    document.access_permissions.retain(|p| p.principal != request.target_principal);
    document.access_permissions.push(permission);
    document.updated_at = current_time;
    
    update_document(document)?;
    Ok(())
}

// Revoke document access
#[update]
async fn revoke_document_access(document_id: String, target_principal: Principal) -> StorageResult<()> {
    let caller = caller();
    let mut document = get_document(&document_id)?;
    
    // Check permission (only owner or admin can revoke)
    check_document_permission(&document, &caller, PermissionType::Admin)?;
    
    document.access_permissions.retain(|p| p.principal != target_principal);
    document.updated_at = get_current_time();
    
    update_document(document)?;
    Ok(())
}

// Delete document
#[update]
async fn delete_user_document(document_id: String) -> StorageResult<()> {
    let caller = caller();
    let document = get_document(&document_id)?;
    
    // Check permission (only owner or admin can delete)
    check_document_permission(&document, &caller, PermissionType::Delete)?;
    
    delete_document(&document_id)
}

// Get user's documents
#[query]
async fn get_user_document_list(user_principal: Principal) -> StorageResult<Vec<DocumentMetadata>> {
    check_authorization(&user_principal, false).await?;
    
    let documents = get_user_documents(&user_principal);
    let metadata_list = documents
        .into_iter()
        .map(|doc| DocumentMetadata {
            id: doc.id,
            file_name: doc.file_name,
            file_type: doc.file_type,
            file_size: doc.file_size,
            content_hash: doc.content_hash,
            is_encrypted: doc.is_encrypted,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
            access_count: doc.access_count,
            metadata: doc.metadata,
        })
        .collect();
    
    Ok(metadata_list)
}

// Get storage statistics (admin only)
#[query]
async fn get_storage_statistics() -> StorageResult<StorageStats> {
    check_authorization(&Principal::anonymous(), true).await?;
    
    let all_documents = get_all_documents();
    let total_documents = all_documents.len() as u64;
    let total_storage_bytes = get_total_storage_size();
    let total_chunks = get_total_chunk_count();
    
    let unique_owners = all_documents
        .iter()
        .map(|doc| doc.owner_principal)
        .collect::<std::collections::HashSet<_>>()
        .len() as u64;
    
    let encrypted_documents = all_documents
        .iter()
        .filter(|doc| doc.is_encrypted)
        .count() as u64;
    
    let public_documents = total_documents - encrypted_documents;
    
    let average_file_size = if total_documents > 0 {
        total_storage_bytes / total_documents
    } else {
        0
    };
    
    let storage_utilization = if MAX_FILE_SIZE * MAX_DOCUMENTS_PER_USER > 0 {
        total_storage_bytes as f64 / (MAX_FILE_SIZE * MAX_DOCUMENTS_PER_USER) as f64 * 100.0
    } else {
        0.0
    };
    
    Ok(StorageStats {
        total_documents,
        total_storage_bytes,
        total_chunks,
        unique_owners,
        encrypted_documents,
        public_documents,
        average_file_size,
        storage_utilization,
    })
}

// Search documents by file type
#[query]
async fn search_documents_by_type(file_type: String) -> StorageResult<Vec<DocumentMetadata>> {
    let caller = caller();
    check_authorization(&caller, false).await?;
    
    let user_documents = get_user_documents(&caller);
    let filtered_docs = user_documents
        .into_iter()
        .filter(|doc| doc.file_type.to_lowercase().contains(&file_type.to_lowercase()))
        .map(|doc| DocumentMetadata {
            id: doc.id,
            file_name: doc.file_name,
            file_type: doc.file_type,
            file_size: doc.file_size,
            content_hash: doc.content_hash,
            is_encrypted: doc.is_encrypted,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
            access_count: doc.access_count,
            metadata: doc.metadata,
        })
        .collect();
    
    Ok(filtered_docs)
}

// Health check
#[query]
fn health_check() -> String {
    "Storage canister is healthy".to_string()
}

// Get canister info
#[query]
fn get_canister_info() -> HashMap<String, String> {
    let mut info = HashMap::new();
    info.insert("name".to_string(), "TrueID Storage Canister".to_string());
    info.insert("version".to_string(), "1.0.0".to_string());
    info.insert("description".to_string(), "Decentralized document storage with encryption".to_string());
    info.insert("max_file_size".to_string(), MAX_FILE_SIZE.to_string());
    info.insert("max_documents_per_user".to_string(), MAX_DOCUMENTS_PER_USER.to_string());
    info
}
