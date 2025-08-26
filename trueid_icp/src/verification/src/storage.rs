use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    BTreeMap, DefaultMemoryImpl, StableBTreeMap,
};
use ic_cdk::api::time;
use candid::Principal;
use std::cell::RefCell;

use crate::types::{
    VerificationRequest, VerificationAuditLog, ExternalApiConfig,
    VerificationError, VerificationResultType
};

type Memory = VirtualMemory<DefaultMemoryImpl>;
type VerificationStorage = StableBTreeMap<u64, VerificationRequest, Memory>;
type UserVerificationsStorage = StableBTreeMap<Principal, Vec<u64>, Memory>;
type AuditLogStorage = StableBTreeMap<u64, VerificationAuditLog, Memory>;
type ApiConfigStorage = StableBTreeMap<String, ExternalApiConfig, Memory>;

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static VERIFICATION_STORAGE: RefCell<VerificationStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );

    static USER_VERIFICATIONS_STORAGE: RefCell<UserVerificationsStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))
        )
    );

    static AUDIT_LOG_STORAGE: RefCell<AuditLogStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2)))
        )
    );

    static API_CONFIG_STORAGE: RefCell<ApiConfigStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3)))
        )
    );

    static NEXT_VERIFICATION_ID: RefCell<u64> = RefCell::new(1);
    static NEXT_AUDIT_LOG_ID: RefCell<u64> = RefCell::new(1);
}

pub fn get_next_verification_id() -> u64 {
    NEXT_VERIFICATION_ID.with(|id| {
        let mut id = id.borrow_mut();
        let current = *id;
        *id += 1;
        current
    })
}

pub fn get_next_audit_log_id() -> u64 {
    NEXT_AUDIT_LOG_ID.with(|id| {
        let mut id = id.borrow_mut();
        let current = *id;
        *id += 1;
        current
    })
}

pub fn create_verification_request(request: VerificationRequest) -> VerificationResultType<()> {
    VERIFICATION_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        storage.insert(request.id, request.clone());
    });

    // Update user's verification list
    USER_VERIFICATIONS_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        let mut user_verifications = storage.get(&request.target_principal).unwrap_or_default();
        user_verifications.push(request.id);
        storage.insert(request.target_principal, user_verifications);
    });

    Ok(())
}

pub fn get_verification_request(verification_id: u64) -> VerificationResultType<VerificationRequest> {
    VERIFICATION_STORAGE.with(|storage| {
        storage
            .borrow()
            .get(&verification_id)
            .ok_or(VerificationError::NotFound)
    })
}

pub fn update_verification_request(request: VerificationRequest) -> VerificationResultType<()> {
    VERIFICATION_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        if !storage.contains_key(&request.id) {
            return Err(VerificationError::NotFound);
        }
        storage.insert(request.id, request);
        Ok(())
    })
}

pub fn get_user_verifications(user_principal: &Principal) -> Vec<VerificationRequest> {
    let verification_ids = USER_VERIFICATIONS_STORAGE.with(|storage| {
        storage.borrow().get(user_principal).unwrap_or_default()
    });

    let mut verifications = Vec::new();
    for verification_id in verification_ids {
        if let Ok(verification) = get_verification_request(verification_id) {
            verifications.push(verification);
        }
    }
    verifications
}

pub fn create_audit_log(log: VerificationAuditLog) -> VerificationResultType<()> {
    AUDIT_LOG_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        storage.insert(log.id, log);
        Ok(())
    })
}

pub fn get_audit_logs_for_verification(verification_id: u64) -> Vec<VerificationAuditLog> {
    AUDIT_LOG_STORAGE.with(|storage| {
        storage
            .borrow()
            .iter()
            .filter(|(_, log)| log.verification_id == verification_id)
            .map(|(_, log)| log)
            .collect()
    })
}

pub fn set_api_config(config: ExternalApiConfig) -> VerificationResultType<()> {
    API_CONFIG_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        storage.insert(config.api_name.clone(), config);
        Ok(())
    })
}

pub fn get_api_config(api_name: &str) -> Option<ExternalApiConfig> {
    API_CONFIG_STORAGE.with(|storage| {
        storage.borrow().get(&api_name.to_string())
    })
}

pub fn get_all_api_configs() -> Vec<ExternalApiConfig> {
    API_CONFIG_STORAGE.with(|storage| {
        storage
            .borrow()
            .iter()
            .map(|(_, config)| config)
            .collect()
    })
}

pub fn get_all_verification_requests() -> Vec<VerificationRequest> {
    VERIFICATION_STORAGE.with(|storage| {
        storage
            .borrow()
            .iter()
            .map(|(_, request)| request)
            .collect()
    })
}

pub fn get_current_time() -> u64 {
    time()
}
