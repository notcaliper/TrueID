use ic_cdk::api::{caller, management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpMethod, HttpResponse, TransformArgs,
}};
use ic_cdk_macros::{init, post_upgrade, pre_upgrade, query, update};
use candid::Principal;
use serde_json;
use std::collections::HashMap;

mod types;
mod storage;

use types::{
    VerificationRequest, CreateVerificationRequest, VerificationResult, VerificationStatus,
    VerificationType, VerificationAuditLog, ExternalApiConfig, HttpOutcallRequest,
    HttpOutcallResponse, VerificationStats, VerificationError, VerificationResultType
};
use storage::{
    create_verification_request, get_verification_request, update_verification_request,
    get_user_verifications, create_audit_log, get_audit_logs_for_verification,
    set_api_config, get_api_config, get_all_api_configs, get_all_verification_requests,
    get_next_verification_id, get_next_audit_log_id, get_current_time
};

// Cross-canister calls
#[ic_cdk::import(canister = "identity")]
async fn get_role(user_principal: Principal) -> (Option<UserRole>,);

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
    // Initialize default API configurations
    let default_configs = vec![
        ExternalApiConfig {
            api_name: "government_id_verification".to_string(),
            endpoint_url: "https://api.gov.verification.com/v1/verify".to_string(),
            api_key_hash: "".to_string(),
            timeout_seconds: 30,
            max_retries: 3,
            is_active: false,
        },
        ExternalApiConfig {
            api_name: "document_verification".to_string(),
            endpoint_url: "https://api.docverify.com/v2/validate".to_string(),
            api_key_hash: "".to_string(),
            timeout_seconds: 45,
            max_retries: 2,
            is_active: false,
        },
    ];

    for config in default_configs {
        let _ = set_api_config(config);
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
async fn check_authorization(target_principal: &Principal, admin_only: bool) -> VerificationResultType<()> {
    let caller = caller();
    
    // Users can access their own data
    if caller == *target_principal && !admin_only {
        return Ok(());
    }
    
    // Check caller's role via identity canister
    let (role_opt,) = get_role(caller).await;
    if let Some(user_role) = role_opt {
        match user_role.role {
            Role::Admin => Ok(()),
            Role::Government if !admin_only => Ok(()),
            _ => Err(VerificationError::Unauthorized),
        }
    } else {
        Err(VerificationError::Unauthorized)
    }
}

// Create audit log entry
fn log_verification_action(
    verification_id: u64,
    action: String,
    actor_principal: Principal,
    details: HashMap<String, String>,
) -> VerificationResultType<()> {
    let log = VerificationAuditLog {
        id: get_next_audit_log_id(),
        verification_id,
        action,
        actor_principal,
        timestamp: get_current_time(),
        details,
    };
    create_audit_log(log)
}

// Transform function for HTTP outcalls
#[query]
fn transform_http_response(args: TransformArgs) -> HttpResponse {
    let mut response = args.response;
    
    // Remove sensitive headers
    response.headers.retain(|(name, _)| {
        !name.to_lowercase().contains("authorization") &&
        !name.to_lowercase().contains("api-key") &&
        !name.to_lowercase().contains("x-api-key")
    });
    
    response
}

// Make HTTP outcall to external API
async fn make_http_outcall(request: HttpOutcallRequest) -> VerificationResultType<HttpOutcallResponse> {
    let http_request = CanisterHttpRequestArgument {
        url: request.url,
        method: match request.method.as_str() {
            "GET" => HttpMethod::GET,
            "POST" => HttpMethod::POST,
            "PUT" => HttpMethod::PUT,
            "DELETE" => HttpMethod::DELETE,
            _ => HttpMethod::GET,
        },
        body: request.body,
        max_response_bytes: request.max_response_bytes,
        transform: Some(ic_cdk::api::management_canister::http_request::TransformContext {
            function: ic_cdk::api::management_canister::http_request::TransformFunc(
                candid::Func {
                    principal: ic_cdk::api::id(),
                    method: "transform_http_response".to_string(),
                }
            ),
            context: vec![],
        }),
        headers: request.headers.into_iter().collect(),
    };

    match http_request(http_request, 25_000_000_000).await {
        Ok((response,)) => Ok(HttpOutcallResponse {
            status: response.status.0.try_into().unwrap_or(500),
            headers: response.headers.into_iter().collect(),
            body: response.body,
        }),
        Err((code, msg)) => Err(VerificationError::NetworkError(
            format!("HTTP outcall failed: {:?} - {}", code, msg)
        )),
    }
}

// Create verification request
#[update]
async fn create_verification(request: CreateVerificationRequest) -> VerificationResultType<VerificationRequest> {
    let caller = caller();
    check_authorization(&request.target_principal, false).await?;
    
    let current_time = get_current_time();
    let verification_request = VerificationRequest {
        id: get_next_verification_id(),
        requester_principal: caller,
        target_principal: request.target_principal,
        verification_type: request.verification_type,
        document_hash: request.document_hash,
        evidence_urls: request.evidence_urls,
        metadata: request.metadata,
        status: VerificationStatus::Pending,
        created_at: current_time,
        updated_at: current_time,
        completed_at: None,
        verifier_principal: None,
        verification_result: None,
    };
    
    create_verification_request(verification_request.clone())?;
    
    // Log the creation
    log_verification_action(
        verification_request.id,
        "verification_created".to_string(),
        caller,
        HashMap::new(),
    )?;
    
    Ok(verification_request)
}

// Get verification request
#[query]
async fn get_verification(verification_id: u64) -> VerificationResultType<VerificationRequest> {
    let verification = get_verification_request(verification_id)?;
    check_authorization(&verification.target_principal, false).await?;
    Ok(verification)
}

// Process verification with external API
#[update]
async fn process_verification_with_api(
    verification_id: u64,
    api_name: String,
) -> VerificationResultType<VerificationRequest> {
    let caller = caller();
    let mut verification = get_verification_request(verification_id)?;
    
    // Check authorization (government/admin only for processing)
    check_authorization(&Principal::anonymous(), true).await?;
    
    // Get API configuration
    let api_config = get_api_config(&api_name)
        .ok_or(VerificationError::InvalidInput("API configuration not found".to_string()))?;
    
    if !api_config.is_active {
        return Err(VerificationError::InvalidInput("API is not active".to_string()));
    }
    
    // Update status to in progress
    verification.status = VerificationStatus::InProgress;
    verification.updated_at = get_current_time();
    update_verification_request(verification.clone())?;
    
    // Prepare API request payload
    let payload = serde_json::json!({
        "document_hash": verification.document_hash,
        "verification_type": format!("{:?}", verification.verification_type),
        "evidence_urls": verification.evidence_urls,
        "metadata": verification.metadata
    });
    
    let http_request = HttpOutcallRequest {
        url: api_config.endpoint_url,
        method: "POST".to_string(),
        headers: vec![
            ("Content-Type".to_string(), "application/json".to_string()),
            ("User-Agent".to_string(), "TrueID-ICP-Canister/1.0".to_string()),
        ],
        body: Some(payload.to_string().into_bytes()),
        max_response_bytes: Some(1024 * 1024), // 1MB limit
    };
    
    // Make the HTTP outcall
    match make_http_outcall(http_request).await {
        Ok(response) => {
            if response.status >= 200 && response.status < 300 {
                // Parse successful response
                let response_text = String::from_utf8_lossy(&response.body);
                
                match serde_json::from_str::<serde_json::Value>(&response_text) {
                    Ok(json_response) => {
                        let is_valid = json_response["is_valid"].as_bool().unwrap_or(false);
                        let confidence_score = json_response["confidence_score"].as_f64().unwrap_or(0.0);
                        
                        let mut verification_details = HashMap::new();
                        if let Some(details) = json_response["details"].as_object() {
                            for (key, value) in details {
                                verification_details.insert(
                                    key.clone(),
                                    value.as_str().unwrap_or("").to_string()
                                );
                            }
                        }
                        
                        verification.verification_result = Some(VerificationResult {
                            is_valid,
                            confidence_score,
                            verification_details,
                            external_reference: json_response["reference_id"].as_str().map(|s| s.to_string()),
                            verifier_notes: Some(format!("Verified via {}", api_name)),
                        });
                        
                        verification.status = VerificationStatus::Completed;
                        verification.completed_at = Some(get_current_time());
                        verification.verifier_principal = Some(caller);
                    }
                    Err(_) => {
                        verification.status = VerificationStatus::Failed;
                        verification.verification_result = Some(VerificationResult {
                            is_valid: false,
                            confidence_score: 0.0,
                            verification_details: HashMap::from([
                                ("error".to_string(), "Invalid API response format".to_string())
                            ]),
                            external_reference: None,
                            verifier_notes: Some("Failed to parse API response".to_string()),
                        });
                    }
                }
            } else {
                verification.status = VerificationStatus::Failed;
                verification.verification_result = Some(VerificationResult {
                    is_valid: false,
                    confidence_score: 0.0,
                    verification_details: HashMap::from([
                        ("error".to_string(), format!("API returned status {}", response.status))
                    ]),
                    external_reference: None,
                    verifier_notes: Some("External API verification failed".to_string()),
                });
            }
        }
        Err(e) => {
            verification.status = VerificationStatus::Failed;
            verification.verification_result = Some(VerificationResult {
                is_valid: false,
                confidence_score: 0.0,
                verification_details: HashMap::from([
                    ("error".to_string(), format!("{:?}", e))
                ]),
                external_reference: None,
                verifier_notes: Some("Network error during verification".to_string()),
            });
        }
    }
    
    verification.updated_at = get_current_time();
    update_verification_request(verification.clone())?;
    
    // Log the processing
    log_verification_action(
        verification_id,
        "verification_processed".to_string(),
        caller,
        HashMap::from([
            ("api_name".to_string(), api_name),
            ("status".to_string(), format!("{:?}", verification.status))
        ]),
    )?;
    
    Ok(verification)
}

// Manual verification (government/admin only)
#[update]
async fn manual_verification(
    verification_id: u64,
    is_valid: bool,
    confidence_score: f64,
    verifier_notes: String,
) -> VerificationResultType<VerificationRequest> {
    let caller = caller();
    let mut verification = get_verification_request(verification_id)?;
    
    // Check authorization (government/admin only)
    check_authorization(&Principal::anonymous(), true).await?;
    
    verification.verification_result = Some(VerificationResult {
        is_valid,
        confidence_score,
        verification_details: HashMap::from([
            ("verification_method".to_string(), "manual".to_string())
        ]),
        external_reference: None,
        verifier_notes: Some(verifier_notes),
    });
    
    verification.status = VerificationStatus::Completed;
    verification.completed_at = Some(get_current_time());
    verification.verifier_principal = Some(caller);
    verification.updated_at = get_current_time();
    
    update_verification_request(verification.clone())?;
    
    // Log the manual verification
    log_verification_action(
        verification_id,
        "manual_verification".to_string(),
        caller,
        HashMap::from([
            ("is_valid".to_string(), is_valid.to_string()),
            ("confidence_score".to_string(), confidence_score.to_string())
        ]),
    )?;
    
    Ok(verification)
}

// Get user verifications
#[query]
async fn get_user_verification_requests(user_principal: Principal) -> VerificationResultType<Vec<VerificationRequest>> {
    check_authorization(&user_principal, false).await?;
    Ok(get_user_verifications(&user_principal))
}

// Get verification audit log
#[query]
async fn get_verification_audit_log(verification_id: u64) -> VerificationResultType<Vec<VerificationAuditLog>> {
    let verification = get_verification_request(verification_id)?;
    check_authorization(&verification.target_principal, false).await?;
    Ok(get_audit_logs_for_verification(verification_id))
}

// Configure external API (admin only)
#[update]
async fn configure_external_api(config: ExternalApiConfig) -> VerificationResultType<()> {
    check_authorization(&Principal::anonymous(), true).await?;
    set_api_config(config)
}

// Get API configurations (admin only)
#[query]
async fn get_api_configurations() -> VerificationResultType<Vec<ExternalApiConfig>> {
    check_authorization(&Principal::anonymous(), true).await?;
    Ok(get_all_api_configs())
}

// Get verification statistics (admin only)
#[query]
async fn get_verification_statistics() -> VerificationResultType<VerificationStats> {
    check_authorization(&Principal::anonymous(), true).await?;
    
    let all_verifications = get_all_verification_requests();
    let total_requests = all_verifications.len() as u64;
    
    let completed_verifications = all_verifications
        .iter()
        .filter(|v| v.status == VerificationStatus::Completed)
        .count() as u64;
    
    let failed_verifications = all_verifications
        .iter()
        .filter(|v| v.status == VerificationStatus::Failed)
        .count() as u64;
    
    let success_rate = if total_requests > 0 {
        completed_verifications as f64 / total_requests as f64 * 100.0
    } else {
        0.0
    };
    
    // Calculate average completion time
    let completion_times: Vec<u64> = all_verifications
        .iter()
        .filter_map(|v| {
            if let Some(completed_at) = v.completed_at {
                Some(completed_at - v.created_at)
            } else {
                None
            }
        })
        .collect();
    
    let average_completion_time = if !completion_times.is_empty() {
        completion_times.iter().sum::<u64>() / completion_times.len() as u64
    } else {
        0
    };
    
    // Breakdown by verification type
    let mut verification_types_breakdown = HashMap::new();
    for verification in &all_verifications {
        let type_name = format!("{:?}", verification.verification_type);
        *verification_types_breakdown.entry(type_name).or_insert(0) += 1;
    }
    
    Ok(VerificationStats {
        total_requests,
        completed_verifications,
        failed_verifications,
        average_completion_time,
        success_rate,
        verification_types_breakdown,
    })
}

// Health check
#[query]
fn health_check() -> String {
    "Verification canister is healthy".to_string()
}

// Get canister info
#[query]
fn get_canister_info() -> HashMap<String, String> {
    let mut info = HashMap::new();
    info.insert("name".to_string(), "TrueID Verification Canister".to_string());
    info.insert("version".to_string(), "1.0.0".to_string());
    info.insert("description".to_string(), "External verification and HTTP outcalls".to_string());
    info
}
