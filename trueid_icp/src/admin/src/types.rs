use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct SystemStats {
    pub total_users: u64,
    pub verified_users: u64,
    pub total_professional_records: u64,
    pub verified_professional_records: u64,
    pub total_verifications: u64,
    pub completed_verifications: u64,
    pub total_documents: u64,
    pub total_storage_bytes: u64,
    pub system_uptime: u64,
    pub canister_cycles: HashMap<String, u64>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct UserAnalytics {
    pub user_principal: Principal,
    pub registration_date: u64,
    pub last_activity: u64,
    pub verification_level: String,
    pub professional_records_count: u64,
    pub documents_count: u64,
    pub verification_requests_count: u64,
    pub activity_score: f64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct SystemConfig {
    pub max_file_size: u64,
    pub max_documents_per_user: u64,
    pub verification_timeout_hours: u64,
    pub auto_cleanup_enabled: bool,
    pub maintenance_mode: bool,
    pub rate_limiting_enabled: bool,
    pub external_apis_enabled: bool,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct AuditLog {
    pub id: u64,
    pub timestamp: u64,
    pub actor_principal: Principal,
    pub action: String,
    pub target: Option<String>,
    pub details: HashMap<String, String>,
    pub severity: LogSeverity,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum LogSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct GovernanceProposal {
    pub id: u64,
    pub proposer: Principal,
    pub title: String,
    pub description: String,
    pub proposal_type: ProposalType,
    pub created_at: u64,
    pub voting_deadline: u64,
    pub status: ProposalStatus,
    pub votes_for: u64,
    pub votes_against: u64,
    pub voters: Vec<Principal>,
    pub execution_payload: Option<String>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum ProposalType {
    SystemConfig,
    CanisterUpgrade,
    RoleAssignment,
    FeatureToggle,
    EmergencyAction,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum ProposalStatus {
    Active,
    Passed,
    Rejected,
    Executed,
    Expired,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct Vote {
    pub proposal_id: u64,
    pub voter: Principal,
    pub vote: bool, // true for yes, false for no
    pub timestamp: u64,
    pub weight: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct CreateProposalRequest {
    pub title: String,
    pub description: String,
    pub proposal_type: ProposalType,
    pub voting_duration_hours: u64,
    pub execution_payload: Option<String>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct NetworkHealth {
    pub identity_canister_status: CanisterStatus,
    pub professional_canister_status: CanisterStatus,
    pub verification_canister_status: CanisterStatus,
    pub storage_canister_status: CanisterStatus,
    pub admin_canister_status: CanisterStatus,
    pub overall_health_score: f64,
    pub last_health_check: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct CanisterStatus {
    pub canister_id: Principal,
    pub status: String,
    pub cycles_balance: u64,
    pub memory_usage: u64,
    pub last_response_time: u64,
    pub error_count: u64,
    pub is_healthy: bool,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum AdminError {
    Unauthorized,
    NotFound,
    InvalidInput(String),
    ProposalNotActive,
    AlreadyVoted,
    InsufficientPermissions,
    SystemInMaintenanceMode,
    InternalError(String),
}

pub type AdminResult<T> = Result<T, AdminError>;
