use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct VerificationRequest {
    pub id: u64,
    pub requester_principal: Principal,
    pub target_principal: Principal,
    pub verification_type: VerificationType,
    pub document_hash: String,
    pub evidence_urls: Vec<String>,
    pub metadata: HashMap<String, String>,
    pub status: VerificationStatus,
    pub created_at: u64,
    pub updated_at: u64,
    pub completed_at: Option<u64>,
    pub verifier_principal: Option<Principal>,
    pub verification_result: Option<VerificationResult>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum VerificationType {
    Identity,
    Document,
    Employment,
    Education,
    Government,
    Biometric,
    ThirdParty,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum VerificationStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
    Rejected,
    Expired,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct VerificationResult {
    pub is_valid: bool,
    pub confidence_score: f64,
    pub verification_details: HashMap<String, String>,
    pub external_reference: Option<String>,
    pub verifier_notes: Option<String>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct CreateVerificationRequest {
    pub target_principal: Principal,
    pub verification_type: VerificationType,
    pub document_hash: String,
    pub evidence_urls: Vec<String>,
    pub metadata: HashMap<String, String>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct ExternalApiConfig {
    pub api_name: String,
    pub endpoint_url: String,
    pub api_key_hash: String,
    pub timeout_seconds: u64,
    pub max_retries: u32,
    pub is_active: bool,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct HttpOutcallRequest {
    pub url: String,
    pub method: String,
    pub headers: Vec<(String, String)>,
    pub body: Option<Vec<u8>>,
    pub max_response_bytes: Option<u64>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct HttpOutcallResponse {
    pub status: u16,
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct VerificationAuditLog {
    pub id: u64,
    pub verification_id: u64,
    pub action: String,
    pub actor_principal: Principal,
    pub timestamp: u64,
    pub details: HashMap<String, String>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct VerificationStats {
    pub total_requests: u64,
    pub completed_verifications: u64,
    pub failed_verifications: u64,
    pub average_completion_time: u64,
    pub success_rate: f64,
    pub verification_types_breakdown: HashMap<String, u64>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum VerificationError {
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

pub type VerificationResultType<T> = Result<T, VerificationError>;
