use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    BTreeMap, DefaultMemoryImpl, StableBTreeMap,
};
use ic_cdk::api::time;
use candid::Principal;
use std::cell::RefCell;

use crate::types::{Identity, UserRole, IdentityError, IdentityResult};

type Memory = VirtualMemory<DefaultMemoryImpl>;
type IdentityStorage = StableBTreeMap<Principal, Identity, Memory>;
type RoleStorage = StableBTreeMap<Principal, UserRole, Memory>;

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static IDENTITY_STORAGE: RefCell<IdentityStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );

    static ROLE_STORAGE: RefCell<RoleStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))
        )
    );
}

pub fn get_identity(principal: &Principal) -> IdentityResult<Identity> {
    IDENTITY_STORAGE.with(|storage| {
        storage
            .borrow()
            .get(principal)
            .ok_or(IdentityError::NotFound)
    })
}

pub fn create_identity(identity: Identity) -> IdentityResult<()> {
    IDENTITY_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        if storage.contains_key(&identity.principal) {
            return Err(IdentityError::AlreadyExists);
        }
        storage.insert(identity.principal, identity);
        Ok(())
    })
}

pub fn update_identity(principal: &Principal, identity: Identity) -> IdentityResult<()> {
    IDENTITY_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        if !storage.contains_key(principal) {
            return Err(IdentityError::NotFound);
        }
        storage.insert(*principal, identity);
        Ok(())
    })
}

pub fn delete_identity(principal: &Principal) -> IdentityResult<()> {
    IDENTITY_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        storage
            .remove(principal)
            .ok_or(IdentityError::NotFound)
            .map(|_| ())
    })
}

pub fn identity_exists(principal: &Principal) -> bool {
    IDENTITY_STORAGE.with(|storage| storage.borrow().contains_key(principal))
}

pub fn get_all_identities() -> Vec<(Principal, Identity)> {
    IDENTITY_STORAGE.with(|storage| {
        storage
            .borrow()
            .iter()
            .collect()
    })
}

pub fn get_user_role(principal: &Principal) -> Option<UserRole> {
    ROLE_STORAGE.with(|storage| storage.borrow().get(principal))
}

pub fn set_user_role(role: UserRole) -> IdentityResult<()> {
    ROLE_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        storage.insert(role.principal, role);
        Ok(())
    })
}

pub fn remove_user_role(principal: &Principal) -> IdentityResult<()> {
    ROLE_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        storage
            .remove(principal)
            .ok_or(IdentityError::NotFound)
            .map(|_| ())
    })
}

pub fn get_current_time() -> u64 {
    time()
}
