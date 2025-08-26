use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    BTreeMap, DefaultMemoryImpl, StableBTreeMap,
};
use ic_cdk::api::time;
use candid::Principal;
use std::cell::RefCell;

use crate::types::{
    SystemConfig, AuditLog, GovernanceProposal, Vote, NetworkHealth,
    AdminError, AdminResult
};

type Memory = VirtualMemory<DefaultMemoryImpl>;
type ConfigStorage = StableBTreeMap<String, SystemConfig, Memory>;
type AuditLogStorage = StableBTreeMap<u64, AuditLog, Memory>;
type ProposalStorage = StableBTreeMap<u64, GovernanceProposal, Memory>;
type VoteStorage = StableBTreeMap<u64, Vote, Memory>;
type HealthStorage = StableBTreeMap<String, NetworkHealth, Memory>;

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static CONFIG_STORAGE: RefCell<ConfigStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );

    static AUDIT_LOG_STORAGE: RefCell<AuditLogStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1)))
        )
    );

    static PROPOSAL_STORAGE: RefCell<ProposalStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2)))
        )
    );

    static VOTE_STORAGE: RefCell<VoteStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3)))
        )
    );

    static HEALTH_STORAGE: RefCell<HealthStorage> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(4)))
        )
    );

    static NEXT_AUDIT_LOG_ID: RefCell<u64> = RefCell::new(1);
    static NEXT_PROPOSAL_ID: RefCell<u64> = RefCell::new(1);
    static NEXT_VOTE_ID: RefCell<u64> = RefCell::new(1);
}

pub fn get_next_audit_log_id() -> u64 {
    NEXT_AUDIT_LOG_ID.with(|id| {
        let mut id = id.borrow_mut();
        let current = *id;
        *id += 1;
        current
    })
}

pub fn get_next_proposal_id() -> u64 {
    NEXT_PROPOSAL_ID.with(|id| {
        let mut id = id.borrow_mut();
        let current = *id;
        *id += 1;
        current
    })
}

pub fn get_next_vote_id() -> u64 {
    NEXT_VOTE_ID.with(|id| {
        let mut id = id.borrow_mut();
        let current = *id;
        *id += 1;
        current
    })
}

pub fn get_system_config() -> SystemConfig {
    CONFIG_STORAGE.with(|storage| {
        storage
            .borrow()
            .get(&"system".to_string())
            .unwrap_or_else(|| SystemConfig {
                max_file_size: 10 * 1024 * 1024, // 10MB
                max_documents_per_user: 100,
                verification_timeout_hours: 72,
                auto_cleanup_enabled: true,
                maintenance_mode: false,
                rate_limiting_enabled: true,
                external_apis_enabled: true,
            })
    })
}

pub fn set_system_config(config: SystemConfig) -> AdminResult<()> {
    CONFIG_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        storage.insert("system".to_string(), config);
        Ok(())
    })
}

pub fn create_audit_log(log: AuditLog) -> AdminResult<()> {
    AUDIT_LOG_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        storage.insert(log.id, log);
        Ok(())
    })
}

pub fn get_audit_logs(limit: Option<u64>) -> Vec<AuditLog> {
    AUDIT_LOG_STORAGE.with(|storage| {
        let logs: Vec<AuditLog> = storage
            .borrow()
            .iter()
            .map(|(_, log)| log)
            .collect();
        
        let mut sorted_logs = logs;
        sorted_logs.sort_by(|a, b| b.timestamp.cmp(&a.timestamp)); // Most recent first
        
        if let Some(limit) = limit {
            sorted_logs.truncate(limit as usize);
        }
        
        sorted_logs
    })
}

pub fn create_proposal(proposal: GovernanceProposal) -> AdminResult<()> {
    PROPOSAL_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        storage.insert(proposal.id, proposal);
        Ok(())
    })
}

pub fn get_proposal(proposal_id: u64) -> AdminResult<GovernanceProposal> {
    PROPOSAL_STORAGE.with(|storage| {
        storage
            .borrow()
            .get(&proposal_id)
            .ok_or(AdminError::NotFound)
    })
}

pub fn update_proposal(proposal: GovernanceProposal) -> AdminResult<()> {
    PROPOSAL_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        if !storage.contains_key(&proposal.id) {
            return Err(AdminError::NotFound);
        }
        storage.insert(proposal.id, proposal);
        Ok(())
    })
}

pub fn get_all_proposals() -> Vec<GovernanceProposal> {
    PROPOSAL_STORAGE.with(|storage| {
        storage
            .borrow()
            .iter()
            .map(|(_, proposal)| proposal)
            .collect()
    })
}

pub fn create_vote(vote: Vote) -> AdminResult<()> {
    VOTE_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        storage.insert(vote.proposal_id, vote);
        Ok(())
    })
}

pub fn get_votes_for_proposal(proposal_id: u64) -> Vec<Vote> {
    VOTE_STORAGE.with(|storage| {
        storage
            .borrow()
            .iter()
            .filter(|(_, vote)| vote.proposal_id == proposal_id)
            .map(|(_, vote)| vote)
            .collect()
    })
}

pub fn user_has_voted(proposal_id: u64, user: &Principal) -> bool {
    VOTE_STORAGE.with(|storage| {
        storage
            .borrow()
            .iter()
            .any(|(_, vote)| vote.proposal_id == proposal_id && vote.voter == *user)
    })
}

pub fn set_network_health(health: NetworkHealth) -> AdminResult<()> {
    HEALTH_STORAGE.with(|storage| {
        let mut storage = storage.borrow_mut();
        storage.insert("current".to_string(), health);
        Ok(())
    })
}

pub fn get_network_health() -> Option<NetworkHealth> {
    HEALTH_STORAGE.with(|storage| {
        storage.borrow().get(&"current".to_string())
    })
}

pub fn get_current_time() -> u64 {
    time()
}
