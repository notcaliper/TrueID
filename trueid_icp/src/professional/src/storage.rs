use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    BTreeMap, DefaultMemoryImpl, StableBTreeMap,
};
use ic_cdk::api::time;
use candid::Principal;
use std::cell::RefCell;

use crate::types::{ProfessionalRecord, SkillEndorsement, ProfessionalError, ProfessionalResult};

type Memory = VirtualMemory<DefaultMemoryImpl>;
type RecordStorage = StableBTreeMap<u64, ProfessionalRecord, Memory>;
type UserRecordsStorage = StableBTreeMap<Principal, Vec<u64>, Memory>;
type EndorsementStorage = StableBTreeMap<u64, SkillEndorsement, Memory>;
type UserEndorsementsStorage = StableBTreeMap<Principal, Vec<u64>, Memory>;

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static RECORD_STORAGE: RefCell<RecordStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );

    static USER_RECORDS_STORAGE: RefCell<UserRecordsStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))
        )
    );

    static ENDORSEMENT_STORAGE: RefCell<EndorsementStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2)))
        )
    );

    static USER_ENDORSEMENTS_STORAGE: RefCell<UserEndorsementsStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3)))
        )
    );

    static NEXT_RECORD_ID: RefCell<u64> = RefCell::new(1);
    static NEXT_ENDORSEMENT_ID: RefCell<u64> = RefCell::new(1);
}

pub fn get_next_record_id() -> u64 {
    NEXT_RECORD_ID.with(|id| {
        let mut id = id.borrow_mut();
        let current = *id;
        *id += 1;
        current
    })
}

pub fn get_next_endorsement_id() -> u64 {
    NEXT_ENDORSEMENT_ID.with(|id| {
        let mut id = id.borrow_mut();
        let current = *id;
        *id += 1;
        current
    })
}

pub fn create_record(record: ProfessionalRecord) -> ProfessionalResult<()> {
    RECORD_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        storage.insert(record.id, record.clone());
    });

    // Update user's record list
    USER_RECORDS_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        let mut user_records = storage.get(&record.user_principal).unwrap_or_default();
        user_records.push(record.id);
        storage.insert(record.user_principal, user_records);
    });

    Ok(())
}

pub fn get_record(record_id: u64) -> ProfessionalResult<ProfessionalRecord> {
    RECORD_STORAGE.with(|storage| {
        storage
            .borrow()
            .get(&record_id)
            .ok_or(ProfessionalError::RecordNotFound)
    })
}

pub fn update_record(record: ProfessionalRecord) -> ProfessionalResult<()> {
    RECORD_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        if !storage.contains_key(&record.id) {
            return Err(ProfessionalError::RecordNotFound);
        }
        storage.insert(record.id, record);
        Ok(())
    })
}

pub fn delete_record(record_id: u64) -> ProfessionalResult<()> {
    let record = get_record(record_id)?;
    
    RECORD_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        storage.remove(&record_id);
    });

    // Remove from user's record list
    USER_RECORDS_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        if let Some(mut user_records) = storage.get(&record.user_principal) {
            user_records.retain(|&id| id != record_id);
            storage.insert(record.user_principal, user_records);
        }
    });

    Ok(())
}

pub fn get_user_records(user_principal: &Principal) -> Vec<ProfessionalRecord> {
    let record_ids = USER_RECORDS_STORAGE.with(|storage| {
        storage.borrow().get(user_principal).unwrap_or_default()
    });

    let mut records = Vec::new();
    for record_id in record_ids {
        if let Ok(record) = get_record(record_id) {
            records.push(record);
        }
    }
    records
}

pub fn create_endorsement(endorsement: SkillEndorsement) -> ProfessionalResult<()> {
    ENDORSEMENT_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        storage.insert(endorsement.id, endorsement.clone());
    });

    // Update user's endorsement list
    USER_ENDORSEMENTS_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        let mut user_endorsements = storage.get(&endorsement.user_principal).unwrap_or_default();
        user_endorsements.push(endorsement.id);
        storage.insert(endorsement.user_principal, user_endorsements);
    });

    Ok(())
}

pub fn get_endorsement(endorsement_id: u64) -> ProfessionalResult<SkillEndorsement> {
    ENDORSEMENT_STORAGE.with(|storage| {
        storage
            .borrow()
            .get(&endorsement_id)
            .ok_or(ProfessionalError::NotFound)
    })
}

pub fn get_user_endorsements(user_principal: &Principal) -> Vec<SkillEndorsement> {
    let endorsement_ids = USER_ENDORSEMENTS_STORAGE.with(|storage| {
        storage.borrow().get(user_principal).unwrap_or_default()
    });

    let mut endorsements = Vec::new();
    for endorsement_id in endorsement_ids {
        if let Ok(endorsement) = get_endorsement(endorsement_id) {
            endorsements.push(endorsement);
        }
    }
    endorsements
}

pub fn get_all_records() -> Vec<ProfessionalRecord> {
    RECORD_STORAGE.with(|storage| {
        storage
            .borrow()
            .iter()
            .map(|(_, record)| record)
            .collect()
    })
}

pub fn get_current_time() -> u64 {
    time()
}
