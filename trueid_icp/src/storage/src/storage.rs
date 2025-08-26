use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    BTreeMap, DefaultMemoryImpl, StableBTreeMap,
};
use ic_cdk::api::time;
use candid::Principal;
use std::cell::RefCell;
use sha2::{Sha256, Digest};

use crate::types::{
    StoredDocument, DocumentChunk, AccessPermission, DocumentMetadata,
    StorageError, StorageResult
};

type Memory = VirtualMemory<DefaultMemoryImpl>;
type DocumentStorage = StableBTreeMap<String, StoredDocument, Memory>;
type ChunkStorage = StableBTreeMap<String, DocumentChunk, Memory>;
type UserDocumentsStorage = StableBTreeMap<Principal, Vec<String>, Memory>;
type DocumentAccessStorage = StableBTreeMap<String, Vec<String>, Memory>; // document_id -> access_log_ids

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static DOCUMENT_STORAGE: RefCell<DocumentStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );

    static CHUNK_STORAGE: RefCell<ChunkStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))
        )
    );

    static USER_DOCUMENTS_STORAGE: RefCell<UserDocumentsStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2)))
        )
    );

    static DOCUMENT_ACCESS_STORAGE: RefCell<DocumentAccessStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3)))
        )
    );
}

pub fn generate_document_id(content_hash: &str, owner: &Principal) -> String {
    let mut hasher = Sha256::new();
    hasher.update(content_hash.as_bytes());
    hasher.update(owner.as_slice());
    hasher.update(get_current_time().to_string().as_bytes());
    hex::encode(hasher.finalize())
}

pub fn generate_chunk_id(document_id: &str, chunk_index: u32) -> String {
    let mut hasher = Sha256::new();
    hasher.update(document_id.as_bytes());
    hasher.update(chunk_index.to_string().as_bytes());
    hex::encode(hasher.finalize())
}

pub fn calculate_content_hash(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hex::encode(hasher.finalize())
}

pub fn store_document(document: StoredDocument) -> StorageResult<()> {
    DOCUMENT_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        if storage.contains_key(&document.id) {
            return Err(StorageError::DocumentAlreadyExists);
        }
        storage.insert(document.id.clone(), document.clone());
    });

    // Update user's document list
    USER_DOCUMENTS_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        let mut user_docs = storage.get(&document.owner_principal).unwrap_or_default();
        user_docs.push(document.id.clone());
        storage.insert(document.owner_principal, user_docs);
    });

    Ok(())
}

pub fn get_document(document_id: &str) -> StorageResult<StoredDocument> {
    DOCUMENT_STORAGE.with(|storage| {
        storage
            .borrow()
            .get(&document_id.to_string())
            .ok_or(StorageError::NotFound)
    })
}

pub fn update_document(document: StoredDocument) -> StorageResult<()> {
    DOCUMENT_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        if !storage.contains_key(&document.id) {
            return Err(StorageError::NotFound);
        }
        storage.insert(document.id.clone(), document);
        Ok(())
    })
}

pub fn delete_document(document_id: &str) -> StorageResult<()> {
    let document = get_document(document_id)?;
    
    // Delete all chunks
    for chunk_id in &document.chunks {
        CHUNK_STORAGE.with(|storage| {
            storage.borrow_mut().remove(chunk_id);
        });
    }
    
    // Remove from document storage
    DOCUMENT_STORAGE.with(|storage| {
        storage.borrow_mut().remove(&document_id.to_string());
    });
    
    // Remove from user's document list
    USER_DOCUMENTS_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        if let Some(mut user_docs) = storage.get(&document.owner_principal) {
            user_docs.retain(|id| id != document_id);
            storage.insert(document.owner_principal, user_docs);
        }
    });
    
    Ok(())
}

pub fn store_chunk(chunk: DocumentChunk) -> StorageResult<()> {
    CHUNK_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        storage.insert(chunk.id.clone(), chunk);
        Ok(())
    })
}

pub fn get_chunk(chunk_id: &str) -> StorageResult<DocumentChunk> {
    CHUNK_STORAGE.with(|storage| {
        storage
            .borrow()
            .get(&chunk_id.to_string())
            .ok_or(StorageError::ChunkNotFound)
    })
}

pub fn get_user_documents(user_principal: &Principal) -> Vec<StoredDocument> {
    let document_ids = USER_DOCUMENTS_STORAGE.with(|storage| {
        storage.borrow().get(user_principal).unwrap_or_default()
    });

    let mut documents = Vec::new();
    for doc_id in document_ids {
        if let Ok(document) = get_document(&doc_id) {
            documents.push(document);
        }
    }
    documents
}

pub fn get_user_document_count(user_principal: &Principal) -> u64 {
    USER_DOCUMENTS_STORAGE.with(|storage| {
        storage.borrow().get(user_principal).unwrap_or_default().len() as u64
    })
}

pub fn get_all_documents() -> Vec<StoredDocument> {
    DOCUMENT_STORAGE.with(|storage| {
        storage
            .borrow()
            .iter()
            .map(|(_, document)| document)
            .collect()
    })
}

pub fn get_total_storage_size() -> u64 {
    DOCUMENT_STORAGE.with(|storage| {
        storage
            .borrow()
            .iter()
            .map(|(_, document)| document.file_size)
            .sum()
    })
}

pub fn get_total_chunk_count() -> u64 {
    CHUNK_STORAGE.with(|storage| {
        storage.borrow().len()
    })
}

pub fn document_exists(document_id: &str) -> bool {
    DOCUMENT_STORAGE.with(|storage| {
        storage.borrow().contains_key(&document_id.to_string())
    })
}

pub fn update_document_access(document_id: &str) -> StorageResult<()> {
    let mut document = get_document(document_id)?;
    document.accessed_at = get_current_time();
    document.access_count += 1;
    update_document(document)
}

pub fn get_current_time() -> u64 {
    time()
}
