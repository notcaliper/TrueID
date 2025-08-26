use ic_cdk::api::caller;
use ic_cdk_macros::{init, post_upgrade, pre_upgrade, query, update};
use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

mod types;
mod storage;

use types::{
    Identity, IdentityMetadata, IdentityUpdate, VerificationLevel, 
    Role, UserRole, IdentityError, IdentityResult
};
use storage::{
    get_identity, create_identity, update_identity, delete_identity,
    identity_exists, get_all_identities, get_user_role, set_user_role,
    remove_user_role, get_current_time
};

// Initialize canister
#[init]
fn init() {
    let deployer = caller();
    let admin_role = UserRole {
        principal: deployer,
        role: Role::Admin,
        granted_by: deployer,
        granted_at: get_current_time(),
    };
    
    if let Err(e) = set_user_role(admin_role) {
        ic_cdk::trap(&format!("Failed to set admin role: {:?}", e));
    }
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
fn check_authorization(target_principal: &Principal, required_roles: &[Role]) -> IdentityResult<()> {
    let caller = caller();
    
    // Users can always access their own data
    if caller == *target_principal {
        return Ok(());
    }
    
    // Check if caller has required role
    if let Some(user_role) = get_user_role(&caller) {
        if required_roles.contains(&user_role.role) {
            return Ok(());
        }
    }
    
    Err(IdentityError::Unauthorized)
}

// Create a new identity
#[update]
fn create_user_identity(
    biometric_hash: String,
    professional_data_hash: String,
    metadata: Option<IdentityMetadata>,
) -> IdentityResult<Identity> {
    let caller = caller();
    
    if identity_exists(&caller) {
        return Err(IdentityError::AlreadyExists);
    }
    
    let mut attributes = HashMap::new();
    if let Some(meta) = metadata {
        if let Some(name) = meta.name {
            attributes.insert("name".to_string(), name);
        }
        if let Some(email) = meta.email {
            attributes.insert("email".to_string(), email);
        }
        if let Some(phone) = meta.phone {
            attributes.insert("phone".to_string(), phone);
        }
        if let Some(dob) = meta.date_of_birth {
            attributes.insert("date_of_birth".to_string(), dob);
        }
        if let Some(nationality) = meta.nationality {
            attributes.insert("nationality".to_string(), nationality);
        }
        attributes.extend(meta.additional_attributes);
    }
    
    let current_time = get_current_time();
    let identity = Identity {
        principal: caller,
        biometric_hash,
        professional_data_hash,
        created_at: current_time,
        updated_at: current_time,
        updated_by: caller,
        is_verified: false,
        verification_level: VerificationLevel::SelfVerified,
        attributes,
    };
    
    create_identity(identity.clone())?;
    
    // Grant user role
    let user_role = UserRole {
        principal: caller,
        role: Role::User,
        granted_by: caller,
        granted_at: current_time,
    };
    set_user_role(user_role)?;
    
    Ok(identity)
}

// Get identity information
#[query]
fn get_user_identity(user_principal: Principal) -> IdentityResult<Identity> {
    check_authorization(&user_principal, &[Role::Government, Role::Admin])?;
    get_identity(&user_principal)
}

// Update identity information
#[update]
fn update_user_identity(
    user_principal: Principal,
    updates: IdentityUpdate,
) -> IdentityResult<Identity> {
    check_authorization(&user_principal, &[Role::Government, Role::Admin])?;
    
    let mut identity = get_identity(&user_principal)?;
    let caller = caller();
    let current_time = get_current_time();
    
    if let Some(biometric_hash) = updates.biometric_hash {
        identity.biometric_hash = biometric_hash;
    }
    
    if let Some(professional_data_hash) = updates.professional_data_hash {
        identity.professional_data_hash = professional_data_hash;
    }
    
    if let Some(metadata) = updates.metadata {
        if let Some(name) = metadata.name {
            identity.attributes.insert("name".to_string(), name);
        }
        if let Some(email) = metadata.email {
            identity.attributes.insert("email".to_string(), email);
        }
        if let Some(phone) = metadata.phone {
            identity.attributes.insert("phone".to_string(), phone);
        }
        if let Some(dob) = metadata.date_of_birth {
            identity.attributes.insert("date_of_birth".to_string(), dob);
        }
        if let Some(nationality) = metadata.nationality {
            identity.attributes.insert("nationality".to_string(), nationality);
        }
        identity.attributes.extend(metadata.additional_attributes);
    }
    
    if let Some(attributes) = updates.attributes {
        identity.attributes.extend(attributes);
    }
    
    identity.updated_at = current_time;
    identity.updated_by = caller;
    
    update_identity(&user_principal, identity.clone())?;
    Ok(identity)
}

// Verify biometric hash
#[query]
fn verify_biometric_hash(user_principal: Principal, biometric_hash: String) -> IdentityResult<bool> {
    let identity = get_identity(&user_principal)?;
    Ok(identity.biometric_hash == biometric_hash)
}

// Verify identity (government/admin only)
#[update]
fn verify_user_identity(
    user_principal: Principal,
    verification_level: VerificationLevel,
) -> IdentityResult<Identity> {
    let caller = caller();
    let user_role = get_user_role(&caller).ok_or(IdentityError::Unauthorized)?;
    
    match user_role.role {
        Role::Government => {
            if verification_level != VerificationLevel::GovernmentVerified {
                return Err(IdentityError::Unauthorized);
            }
        }
        Role::Admin => {
            // Admin can set any verification level
        }
        Role::User => {
            return Err(IdentityError::Unauthorized);
        }
    }
    
    let mut identity = get_identity(&user_principal)?;
    identity.is_verified = true;
    identity.verification_level = verification_level;
    identity.updated_at = get_current_time();
    identity.updated_by = caller;
    
    update_identity(&user_principal, identity.clone())?;
    Ok(identity)
}

// Grant role (admin only)
#[update]
fn grant_role(user_principal: Principal, role: Role) -> IdentityResult<()> {
    let caller = caller();
    let caller_role = get_user_role(&caller).ok_or(IdentityError::Unauthorized)?;
    
    if caller_role.role != Role::Admin {
        return Err(IdentityError::Unauthorized);
    }
    
    let user_role = UserRole {
        principal: user_principal,
        role,
        granted_by: caller,
        granted_at: get_current_time(),
    };
    
    set_user_role(user_role)
}

// Revoke role (admin only)
#[update]
fn revoke_role(user_principal: Principal) -> IdentityResult<()> {
    let caller = caller();
    let caller_role = get_user_role(&caller).ok_or(IdentityError::Unauthorized)?;
    
    if caller_role.role != Role::Admin {
        return Err(IdentityError::Unauthorized);
    }
    
    remove_user_role(&user_principal)
}

// Get user role
#[query]
fn get_role(user_principal: Principal) -> Option<UserRole> {
    get_user_role(&user_principal)
}

// Get all identities (admin only)
#[query]
fn get_all_user_identities() -> IdentityResult<Vec<(Principal, Identity)>> {
    let caller = caller();
    let caller_role = get_user_role(&caller).ok_or(IdentityError::Unauthorized)?;
    
    if caller_role.role != Role::Admin {
        return Err(IdentityError::Unauthorized);
    }
    
    Ok(get_all_identities())
}

// Health check
#[query]
fn health_check() -> String {
    "Identity canister is healthy".to_string()
}

// Get canister info
#[query]
fn get_canister_info() -> HashMap<String, String> {
    let mut info = HashMap::new();
    info.insert("name".to_string(), "TrueID Identity Canister".to_string());
    info.insert("version".to_string(), "1.0.0".to_string());
    info.insert("description".to_string(), "Decentralized biometric identity management".to_string());
    info
}
