use ic_cdk::api::caller;
use ic_cdk_macros::{init, post_upgrade, pre_upgrade, query, update};
use candid::Principal;
use std::collections::HashMap;

mod types;
mod storage;

use types::{
    SystemStats, UserAnalytics, SystemConfig, AuditLog, LogSeverity,
    GovernanceProposal, Vote, CreateProposalRequest, ProposalType, ProposalStatus,
    NetworkHealth, CanisterStatus, AdminError, AdminResult
};
use storage::{
    get_system_config, set_system_config, create_audit_log, get_audit_logs,
    create_proposal, get_proposal, update_proposal, get_all_proposals,
    create_vote, get_votes_for_proposal, user_has_voted,
    set_network_health, get_network_health, get_current_time,
    get_next_audit_log_id, get_next_proposal_id, get_next_vote_id
};

// Cross-canister calls
#[ic_cdk::import(canister = "identity")]
async fn get_role(user_principal: Principal) -> (Option<UserRole>,);

#[ic_cdk::import(canister = "identity")]
async fn get_all_user_identities() -> (IdentitiesResult,);

#[ic_cdk::import(canister = "professional")]
async fn get_canister_info() -> (Vec<(String, String)>,);

#[ic_cdk::import(canister = "verification")]
async fn get_verification_statistics() -> (StatsResult,);

#[ic_cdk::import(canister = "storage")]
async fn get_storage_statistics() -> (StorageStatsResult,);

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

#[derive(candid::CandidType, serde::Deserialize)]
enum IdentitiesResult {
    Ok(Vec<(Principal, Identity)>),
    Err(IdentityError),
}

#[derive(candid::CandidType, serde::Deserialize)]
struct Identity {
    principal: Principal,
    biometric_hash: String,
    professional_data_hash: String,
    created_at: u64,
    updated_at: u64,
    updated_by: Principal,
    is_verified: bool,
    verification_level: String,
    attributes: Vec<(String, String)>,
}

#[derive(candid::CandidType, serde::Deserialize)]
enum IdentityError {
    NotFound,
    AlreadyExists,
    Unauthorized,
    InvalidInput(String),
    InternalError(String),
}

#[derive(candid::CandidType, serde::Deserialize)]
enum StatsResult {
    Ok(VerificationStats),
    Err(VerificationError),
}

#[derive(candid::CandidType, serde::Deserialize)]
struct VerificationStats {
    total_requests: u64,
    completed_verifications: u64,
    failed_verifications: u64,
    average_completion_time: u64,
    success_rate: f64,
    verification_types_breakdown: Vec<(String, u64)>,
}

#[derive(candid::CandidType, serde::Deserialize)]
enum VerificationError {
    NotFound,
    Unauthorized,
    InvalidInput(String),
    ExternalApiError(String),
    NetworkError(String),
    TimeoutError,
    InvalidResponse(String),
    InsufficientEvidence,
    VerificationExpired,
    InternalError(String),
}

#[derive(candid::CandidType, serde::Deserialize)]
enum StorageStatsResult {
    Ok(StorageStats),
    Err(StorageError),
}

#[derive(candid::CandidType, serde::Deserialize)]
struct StorageStats {
    total_documents: u64,
    total_storage_bytes: u64,
    total_chunks: u64,
    unique_owners: u64,
    encrypted_documents: u64,
    public_documents: u64,
    average_file_size: u64,
    storage_utilization: f64,
}

#[derive(candid::CandidType, serde::Deserialize)]
enum StorageError {
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

// Initialize canister
#[init]
fn init() {
    let deployer = caller();
    
    // Log system initialization
    let init_log = AuditLog {
        id: get_next_audit_log_id(),
        timestamp: get_current_time(),
        actor_principal: deployer,
        action: "system_initialized".to_string(),
        target: None,
        details: HashMap::from([
            ("deployer".to_string(), deployer.to_string()),
            ("version".to_string(), "1.0.0".to_string()),
        ]),
        severity: LogSeverity::Info,
    };
    
    let _ = create_audit_log(init_log);
}

// Upgrade hooks
#[pre_upgrade]
fn pre_upgrade() {
    // Log upgrade start
    let upgrade_log = AuditLog {
        id: get_next_audit_log_id(),
        timestamp: get_current_time(),
        actor_principal: caller(),
        action: "canister_upgrade_start".to_string(),
        target: None,
        details: HashMap::new(),
        severity: LogSeverity::Info,
    };
    
    let _ = create_audit_log(upgrade_log);
}

#[post_upgrade]
fn post_upgrade() {
    // Log upgrade completion
    let upgrade_log = AuditLog {
        id: get_next_audit_log_id(),
        timestamp: get_current_time(),
        actor_principal: caller(),
        action: "canister_upgrade_complete".to_string(),
        target: None,
        details: HashMap::new(),
        severity: LogSeverity::Info,
    };
    
    let _ = create_audit_log(upgrade_log);
}

// Helper function to check admin authorization
async fn check_admin_authorization() -> AdminResult<()> {
    let caller = caller();
    let (role_opt,) = get_role(caller).await;
    
    if let Some(user_role) = role_opt {
        if user_role.role == Role::Admin {
            Ok(())
        } else {
            Err(AdminError::Unauthorized)
        }
    } else {
        Err(AdminError::Unauthorized)
    }
}

// Log admin action
fn log_admin_action(
    action: String,
    target: Option<String>,
    details: HashMap<String, String>,
    severity: LogSeverity,
) -> AdminResult<()> {
    let log = AuditLog {
        id: get_next_audit_log_id(),
        timestamp: get_current_time(),
        actor_principal: caller(),
        action,
        target,
        details,
        severity,
    };
    create_audit_log(log)
}

// Get system statistics
#[query]
async fn get_system_statistics() -> AdminResult<SystemStats> {
    check_admin_authorization().await?;
    
    // Get identity statistics
    let (identities_result,) = get_all_user_identities().await;
    let (total_users, verified_users) = match identities_result {
        IdentitiesResult::Ok(identities) => {
            let total = identities.len() as u64;
            let verified = identities.iter().filter(|(_, identity)| identity.is_verified).count() as u64;
            (total, verified)
        }
        IdentitiesResult::Err(_) => (0, 0),
    };
    
    // Get verification statistics
    let (verification_stats_result,) = get_verification_statistics().await;
    let (total_verifications, completed_verifications) = match verification_stats_result {
        StatsResult::Ok(stats) => (stats.total_requests, stats.completed_verifications),
        StatsResult::Err(_) => (0, 0),
    };
    
    // Get storage statistics
    let (storage_stats_result,) = get_storage_statistics().await;
    let (total_documents, total_storage_bytes) = match storage_stats_result {
        StorageStatsResult::Ok(stats) => (stats.total_documents, stats.total_storage_bytes),
        StorageStatsResult::Err(_) => (0, 0),
    };
    
    let mut canister_cycles = HashMap::new();
    canister_cycles.insert("identity".to_string(), 0u64); // Placeholder - would need actual cycle balance
    canister_cycles.insert("professional".to_string(), 0u64);
    canister_cycles.insert("verification".to_string(), 0u64);
    canister_cycles.insert("storage".to_string(), 0u64);
    canister_cycles.insert("admin".to_string(), 0u64);
    
    Ok(SystemStats {
        total_users,
        verified_users,
        total_professional_records: 0, // Would need cross-canister call
        verified_professional_records: 0,
        total_verifications,
        completed_verifications,
        total_documents,
        total_storage_bytes,
        system_uptime: get_current_time(),
        canister_cycles,
    })
}

// Get system configuration
#[query]
async fn get_system_configuration() -> AdminResult<SystemConfig> {
    check_admin_authorization().await?;
    Ok(get_system_config())
}

// Update system configuration
#[update]
async fn update_system_configuration(config: SystemConfig) -> AdminResult<()> {
    check_admin_authorization().await?;
    
    set_system_config(config.clone())?;
    
    log_admin_action(
        "system_config_updated".to_string(),
        None,
        HashMap::from([
            ("max_file_size".to_string(), config.max_file_size.to_string()),
            ("maintenance_mode".to_string(), config.maintenance_mode.to_string()),
        ]),
        LogSeverity::Info,
    )?;
    
    Ok(())
}

// Create governance proposal
#[update]
async fn create_governance_proposal(request: CreateProposalRequest) -> AdminResult<GovernanceProposal> {
    check_admin_authorization().await?;
    
    let current_time = get_current_time();
    let voting_deadline = current_time + (request.voting_duration_hours * 60 * 60 * 1_000_000_000);
    
    let proposal = GovernanceProposal {
        id: get_next_proposal_id(),
        proposer: caller(),
        title: request.title.clone(),
        description: request.description,
        proposal_type: request.proposal_type,
        created_at: current_time,
        voting_deadline,
        status: ProposalStatus::Active,
        votes_for: 0,
        votes_against: 0,
        voters: Vec::new(),
        execution_payload: request.execution_payload,
    };
    
    create_proposal(proposal.clone())?;
    
    log_admin_action(
        "governance_proposal_created".to_string(),
        Some(proposal.id.to_string()),
        HashMap::from([
            ("title".to_string(), request.title),
            ("type".to_string(), format!("{:?}", proposal.proposal_type)),
        ]),
        LogSeverity::Info,
    )?;
    
    Ok(proposal)
}

// Vote on governance proposal
#[update]
async fn vote_on_proposal(proposal_id: u64, vote: bool) -> AdminResult<()> {
    check_admin_authorization().await?;
    
    let caller = caller();
    
    // Check if user already voted
    if user_has_voted(proposal_id, &caller) {
        return Err(AdminError::AlreadyVoted);
    }
    
    let mut proposal = get_proposal(proposal_id)?;
    
    // Check if proposal is still active
    if proposal.status != ProposalStatus::Active {
        return Err(AdminError::ProposalNotActive);
    }
    
    // Check if voting deadline has passed
    if get_current_time() > proposal.voting_deadline {
        proposal.status = ProposalStatus::Expired;
        update_proposal(proposal)?;
        return Err(AdminError::ProposalNotActive);
    }
    
    // Create vote record
    let vote_record = Vote {
        proposal_id,
        voter: caller,
        vote,
        timestamp: get_current_time(),
        weight: 1, // Simple 1-vote-per-admin system
    };
    
    create_vote(vote_record)?;
    
    // Update proposal vote counts
    if vote {
        proposal.votes_for += 1;
    } else {
        proposal.votes_against += 1;
    }
    proposal.voters.push(caller);
    
    // Check if proposal should be decided
    let total_votes = proposal.votes_for + proposal.votes_against;
    if total_votes >= 3 { // Simple majority with minimum 3 votes
        if proposal.votes_for > proposal.votes_against {
            proposal.status = ProposalStatus::Passed;
        } else {
            proposal.status = ProposalStatus::Rejected;
        }
    }
    
    update_proposal(proposal)?;
    
    log_admin_action(
        "governance_vote_cast".to_string(),
        Some(proposal_id.to_string()),
        HashMap::from([
            ("vote".to_string(), vote.to_string()),
            ("voter".to_string(), caller.to_string()),
        ]),
        LogSeverity::Info,
    )?;
    
    Ok(())
}

// Get governance proposals
#[query]
async fn get_governance_proposals() -> AdminResult<Vec<GovernanceProposal>> {
    check_admin_authorization().await?;
    Ok(get_all_proposals())
}

// Get audit logs
#[query]
async fn get_audit_log(limit: Option<u64>) -> AdminResult<Vec<AuditLog>> {
    check_admin_authorization().await?;
    Ok(get_audit_logs(limit))
}

// Perform system health check
#[update]
async fn perform_health_check() -> AdminResult<NetworkHealth> {
    check_admin_authorization().await?;
    
    let current_time = get_current_time();
    
    // Create placeholder canister statuses (in real implementation, would ping each canister)
    let identity_status = CanisterStatus {
        canister_id: Principal::anonymous(), // Would be actual canister ID
        status: "running".to_string(),
        cycles_balance: 1_000_000_000_000, // 1T cycles
        memory_usage: 50_000_000, // 50MB
        last_response_time: 100, // 100ms
        error_count: 0,
        is_healthy: true,
    };
    
    let professional_status = identity_status.clone();
    let verification_status = identity_status.clone();
    let storage_status = identity_status.clone();
    let admin_status = identity_status.clone();
    
    // Calculate overall health score
    let health_scores = vec![
        identity_status.is_healthy as u8,
        professional_status.is_healthy as u8,
        verification_status.is_healthy as u8,
        storage_status.is_healthy as u8,
        admin_status.is_healthy as u8,
    ];
    
    let overall_health_score = health_scores.iter().sum::<u8>() as f64 / health_scores.len() as f64 * 100.0;
    
    let network_health = NetworkHealth {
        identity_canister_status: identity_status,
        professional_canister_status: professional_status,
        verification_canister_status: verification_status,
        storage_canister_status: storage_status,
        admin_canister_status: admin_status,
        overall_health_score,
        last_health_check: current_time,
    };
    
    set_network_health(network_health.clone())?;
    
    log_admin_action(
        "health_check_performed".to_string(),
        None,
        HashMap::from([
            ("health_score".to_string(), overall_health_score.to_string()),
        ]),
        LogSeverity::Info,
    )?;
    
    Ok(network_health)
}

// Get network health
#[query]
async fn get_network_health_status() -> AdminResult<NetworkHealth> {
    check_admin_authorization().await?;
    get_network_health().ok_or(AdminError::NotFound)
}

// Emergency system shutdown
#[update]
async fn emergency_shutdown(reason: String) -> AdminResult<()> {
    check_admin_authorization().await?;
    
    let mut config = get_system_config();
    config.maintenance_mode = true;
    set_system_config(config)?;
    
    log_admin_action(
        "emergency_shutdown".to_string(),
        None,
        HashMap::from([
            ("reason".to_string(), reason),
            ("initiated_by".to_string(), caller().to_string()),
        ]),
        LogSeverity::Critical,
    )?;
    
    Ok(())
}

// Health check
#[query]
fn health_check() -> String {
    "Admin canister is healthy".to_string()
}

// Get canister info
#[query]
fn get_admin_canister_info() -> HashMap<String, String> {
    let mut info = HashMap::new();
    info.insert("name".to_string(), "TrueID Admin Canister".to_string());
    info.insert("version".to_string(), "1.0.0".to_string());
    info.insert("description".to_string(), "System administration and governance".to_string());
    info
}
