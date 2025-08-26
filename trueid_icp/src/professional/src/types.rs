use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct ProfessionalRecord {
    pub id: u64,
    pub user_principal: Principal,
    pub record_type: RecordType,
    pub data_hash: String,
    pub title: String,
    pub organization: String,
    pub description: Option<String>,
    pub start_date: u64,
    pub end_date: Option<u64>, // None if current
    pub location: Option<String>,
    pub skills: Vec<String>,
    pub verifier: Option<Principal>,
    pub is_verified: bool,
    pub verification_date: Option<u64>,
    pub created_at: u64,
    pub updated_at: u64,
    pub metadata: HashMap<String, String>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum RecordType {
    Employment,
    Education,
    Certification,
    Volunteer,
    Project,
    Award,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct CreateRecordRequest {
    pub record_type: RecordType,
    pub data_hash: String,
    pub title: String,
    pub organization: String,
    pub description: Option<String>,
    pub start_date: u64,
    pub end_date: Option<u64>,
    pub location: Option<String>,
    pub skills: Vec<String>,
    pub metadata: HashMap<String, String>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct UpdateRecordRequest {
    pub record_id: u64,
    pub title: Option<String>,
    pub organization: Option<String>,
    pub description: Option<String>,
    pub start_date: Option<u64>,
    pub end_date: Option<u64>,
    pub location: Option<String>,
    pub skills: Option<Vec<String>>,
    pub metadata: Option<HashMap<String, String>>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct VerificationRequest {
    pub record_id: u64,
    pub verifier_principal: Principal,
    pub evidence_hash: String,
    pub notes: Option<String>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct ProfessionalProfile {
    pub user_principal: Principal,
    pub records: Vec<ProfessionalRecord>,
    pub total_experience_months: u64,
    pub verified_records_count: u64,
    pub skills_summary: Vec<String>,
    pub last_updated: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct SkillEndorsement {
    pub id: u64,
    pub user_principal: Principal,
    pub skill: String,
    pub endorser_principal: Principal,
    pub endorser_title: String,
    pub endorser_organization: String,
    pub strength: EndorsementStrength,
    pub notes: Option<String>,
    pub created_at: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum EndorsementStrength {
    Basic,
    Intermediate,
    Advanced,
    Expert,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum ProfessionalError {
    NotFound,
    AlreadyExists,
    Unauthorized,
    InvalidInput(String),
    InvalidDateRange,
    RecordNotFound,
    VerificationFailed,
    InternalError(String),
}

pub type ProfessionalResult<T> = Result<T, ProfessionalError>;
