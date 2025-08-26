use ic_cdk::api::caller;
use ic_cdk_macros::{init, post_upgrade, pre_upgrade, query, update};
use candid::Principal;
use std::collections::HashMap;

mod types;
mod storage;

use types::{
    ProfessionalRecord, CreateRecordRequest, UpdateRecordRequest, VerificationRequest,
    ProfessionalProfile, SkillEndorsement, RecordType, EndorsementStrength,
    ProfessionalError, ProfessionalResult
};
use storage::{
    create_record, get_record, update_record, delete_record, get_user_records,
    create_endorsement, get_endorsement, get_user_endorsements, get_all_records,
    get_next_record_id, get_next_endorsement_id, get_current_time
};

// Cross-canister call to identity canister
#[ic_cdk::import(canister = "identity")]
async fn get_role(user_principal: Principal) -> (Option<types::UserRole>,);

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

// Initialize canister
#[init]
fn init() {
    // Professional canister initialization
}

// Upgrade hooks
#[pre_upgrade]
fn pre_upgrade() {
    // Stable memory is automatically preserved
}

#[post_upgrade]
fn post_upgrade() {
    // Stable memory is automatically restored
}

// Helper function to check authorization
async fn check_authorization(target_principal: &Principal, admin_only: bool) -> ProfessionalResult<()> {
    let caller = caller();
    
    // Users can always access their own data
    if caller == *target_principal && !admin_only {
        return Ok(());
    }
    
    // Check caller's role via identity canister
    let (role_opt,) = get_role(caller).await;
    if let Some(user_role) = role_opt {
        match user_role.role {
            Role::Admin => Ok(()),
            Role::Government if !admin_only => Ok(()),
            _ => Err(ProfessionalError::Unauthorized),
        }
    } else {
        Err(ProfessionalError::Unauthorized)
    }
}

// Create a new professional record
#[update]
async fn add_professional_record(request: CreateRecordRequest) -> ProfessionalResult<ProfessionalRecord> {
    let caller = caller();
    
    // Validate date range
    if let Some(end_date) = request.end_date {
        if end_date < request.start_date {
            return Err(ProfessionalError::InvalidDateRange);
        }
    }
    
    let current_time = get_current_time();
    let record = ProfessionalRecord {
        id: get_next_record_id(),
        user_principal: caller,
        record_type: request.record_type,
        data_hash: request.data_hash,
        title: request.title,
        organization: request.organization,
        description: request.description,
        start_date: request.start_date,
        end_date: request.end_date,
        location: request.location,
        skills: request.skills,
        verifier: None,
        is_verified: false,
        verification_date: None,
        created_at: current_time,
        updated_at: current_time,
        metadata: request.metadata,
    };
    
    create_record(record.clone())?;
    Ok(record)
}

// Get a specific professional record
#[query]
async fn get_professional_record(record_id: u64) -> ProfessionalResult<ProfessionalRecord> {
    let record = get_record(record_id)?;
    check_authorization(&record.user_principal, false).await?;
    Ok(record)
}

// Update a professional record
#[update]
async fn update_professional_record(request: UpdateRecordRequest) -> ProfessionalResult<ProfessionalRecord> {
    let mut record = get_record(request.record_id)?;
    check_authorization(&record.user_principal, false).await?;
    
    let current_time = get_current_time();
    
    if let Some(title) = request.title {
        record.title = title;
    }
    if let Some(organization) = request.organization {
        record.organization = organization;
    }
    if let Some(description) = request.description {
        record.description = Some(description);
    }
    if let Some(start_date) = request.start_date {
        record.start_date = start_date;
    }
    if let Some(end_date) = request.end_date {
        record.end_date = Some(end_date);
    }
    if let Some(location) = request.location {
        record.location = Some(location);
    }
    if let Some(skills) = request.skills {
        record.skills = skills;
    }
    if let Some(metadata) = request.metadata {
        record.metadata.extend(metadata);
    }
    
    // Validate date range
    if let Some(end_date) = record.end_date {
        if end_date < record.start_date {
            return Err(ProfessionalError::InvalidDateRange);
        }
    }
    
    record.updated_at = current_time;
    update_record(record.clone())?;
    Ok(record)
}

// Delete a professional record
#[update]
async fn delete_professional_record(record_id: u64) -> ProfessionalResult<()> {
    let record = get_record(record_id)?;
    check_authorization(&record.user_principal, false).await?;
    delete_record(record_id)
}

// Verify a professional record (government/admin only)
#[update]
async fn verify_professional_record(request: VerificationRequest) -> ProfessionalResult<ProfessionalRecord> {
    let caller = caller();
    check_authorization(&Principal::anonymous(), true).await?; // Admin check
    
    let mut record = get_record(request.record_id)?;
    let current_time = get_current_time();
    
    record.verifier = Some(request.verifier_principal);
    record.is_verified = true;
    record.verification_date = Some(current_time);
    record.updated_at = current_time;
    
    // Add verification notes to metadata
    if let Some(notes) = request.notes {
        record.metadata.insert("verification_notes".to_string(), notes);
    }
    record.metadata.insert("verification_evidence".to_string(), request.evidence_hash);
    
    update_record(record.clone())?;
    Ok(record)
}

// Get user's professional profile
#[query]
async fn get_professional_profile(user_principal: Principal) -> ProfessionalResult<ProfessionalProfile> {
    check_authorization(&user_principal, false).await?;
    
    let records = get_user_records(&user_principal);
    let current_time = get_current_time();
    
    // Calculate total experience in months
    let mut total_experience_months = 0u64;
    let mut verified_records_count = 0u64;
    let mut all_skills = Vec::new();
    
    for record in &records {
        if record.is_verified {
            verified_records_count += 1;
        }
        
        // Calculate experience duration
        let end_time = record.end_date.unwrap_or(current_time);
        let duration_seconds = end_time.saturating_sub(record.start_date);
        let duration_months = duration_seconds / (30 * 24 * 60 * 60 * 1_000_000_000); // Approximate months
        total_experience_months += duration_months;
        
        // Collect skills
        all_skills.extend(record.skills.clone());
    }
    
    // Deduplicate skills
    all_skills.sort();
    all_skills.dedup();
    
    Ok(ProfessionalProfile {
        user_principal,
        records,
        total_experience_months,
        verified_records_count,
        skills_summary: all_skills,
        last_updated: current_time,
    })
}

// Add skill endorsement
#[update]
async fn add_skill_endorsement(
    user_principal: Principal,
    skill: String,
    endorser_title: String,
    endorser_organization: String,
    strength: EndorsementStrength,
    notes: Option<String>,
) -> ProfessionalResult<SkillEndorsement> {
    let caller = caller();
    
    let endorsement = SkillEndorsement {
        id: get_next_endorsement_id(),
        user_principal,
        skill,
        endorser_principal: caller,
        endorser_title,
        endorser_organization,
        strength,
        notes,
        created_at: get_current_time(),
    };
    
    create_endorsement(endorsement.clone())?;
    Ok(endorsement)
}

// Get user's skill endorsements
#[query]
async fn get_skill_endorsements(user_principal: Principal) -> ProfessionalResult<Vec<SkillEndorsement>> {
    check_authorization(&user_principal, false).await?;
    Ok(get_user_endorsements(&user_principal))
}

// Search records by skill
#[query]
fn search_records_by_skill(skill: String) -> Vec<ProfessionalRecord> {
    get_all_records()
        .into_iter()
        .filter(|record| {
            record.skills.iter().any(|s| s.to_lowercase().contains(&skill.to_lowercase()))
        })
        .collect()
}

// Search records by organization
#[query]
fn search_records_by_organization(organization: String) -> Vec<ProfessionalRecord> {
    get_all_records()
        .into_iter()
        .filter(|record| {
            record.organization.to_lowercase().contains(&organization.to_lowercase())
        })
        .collect()
}

// Get records by type
#[query]
async fn get_records_by_type(user_principal: Principal, record_type: RecordType) -> ProfessionalResult<Vec<ProfessionalRecord>> {
    check_authorization(&user_principal, false).await?;
    
    let records = get_user_records(&user_principal)
        .into_iter()
        .filter(|record| record.record_type == record_type)
        .collect();
    
    Ok(records)
}

// Health check
#[query]
fn health_check() -> String {
    "Professional records canister is healthy".to_string()
}

// Get canister info
#[query]
fn get_canister_info() -> HashMap<String, String> {
    let mut info = HashMap::new();
    info.insert("name".to_string(), "TrueID Professional Records Canister".to_string());
    info.insert("version".to_string(), "1.0.0".to_string());
    info.insert("description".to_string(), "Professional history and skill management".to_string());
    info
}
