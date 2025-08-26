use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct Identity {
    pub principal: Principal,
    pub biometric_hash: String,
    pub professional_data_hash: String,
    pub created_at: u64,
    pub updated_at: u64,
    pub updated_by: Principal,
    pub is_verified: bool,
    pub verification_level: VerificationLevel,
    pub attributes: HashMap<String, String>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum VerificationLevel {
    None,
    SelfVerified,
    GovernmentVerified,
    EnterpriseVerified,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct IdentityMetadata {
    pub name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub date_of_birth: Option<String>,
    pub nationality: Option<String>,
    pub additional_attributes: HashMap<String, String>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct IdentityUpdate {
    pub biometric_hash: Option<String>,
    pub professional_data_hash: Option<String>,
    pub metadata: Option<IdentityMetadata>,
    pub attributes: Option<HashMap<String, String>>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct VerificationRequest {
    pub user_principal: Principal,
    pub verifier_principal: Principal,
    pub verification_type: VerificationLevel,
    pub evidence_hash: String,
    pub notes: Option<String>,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug, PartialEq)]
pub enum Role {
    User,
    Government,
    Admin,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct UserRole {
    pub principal: Principal,
    pub role: Role,
    pub granted_by: Principal,
    pub granted_at: u64,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub enum IdentityError {
    NotFound,
    AlreadyExists,
    Unauthorized,
    InvalidInput(String),
    InternalError(String),
}

pub type IdentityResult<T> = Result<T, IdentityError>;
