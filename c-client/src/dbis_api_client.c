/**
 * DBIS API Client - C Version
 * A C client for the Decentralized Biometric Identity System API
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <curl/curl.h>
#include <json-c/json.h>
#include <stdbool.h>
#include <unistd.h>
#include <termios.h>

#define MAX_URL_LENGTH 256
#define MAX_BUFFER_SIZE 4096
#define MAX_TOKEN_LENGTH 512
#define MAX_INPUT_LENGTH 256

// Structure to hold response data
typedef struct {
    char *data;
    size_t size;
} ResponseData;

// Structure to hold user session
typedef struct {
    char base_url[MAX_URL_LENGTH];
    char token[MAX_TOKEN_LENGTH];
    char user_id[64];
    bool is_logged_in;
} DBISClient;

// Function prototypes
void init_client(DBISClient *client, const char *base_url);
bool register_user(DBISClient *client);
bool login(DBISClient *client);
bool view_profile(DBISClient *client);
bool connect_wallet(DBISClient *client);
bool register_biometric(DBISClient *client);
bool get_biometric_status(DBISClient *client);
bool register_identity_on_blockchain(DBISClient *client);
bool get_identity_status(DBISClient *client);
bool create_professional_record(DBISClient *client);
bool get_professional_records(DBISClient *client);
bool add_professional_record_to_blockchain(DBISClient *client);
bool get_blockchain_professional_records(DBISClient *client);
bool grant_role(DBISClient *client);
bool revoke_role(DBISClient *client);
void logout(DBISClient *client);
int display_menu();
void get_password(char *password, size_t size);

// Callback function for CURL to handle response data
static size_t write_callback(void *contents, size_t size, size_t nmemb, void *userp) {
    size_t real_size = size * nmemb;
    ResponseData *resp = (ResponseData *)userp;
    
    char *ptr = realloc(resp->data, resp->size + real_size + 1);
    if (!ptr) {
        fprintf(stderr, "Error: Out of memory\n");
        return 0;
    }
    
    resp->data = ptr;
    memcpy(&(resp->data[resp->size]), contents, real_size);
    resp->size += real_size;
    resp->data[resp->size] = 0;
    
    return real_size;
}

// Initialize the client
void init_client(DBISClient *client, const char *base_url) {
    strncpy(client->base_url, base_url, MAX_URL_LENGTH - 1);
    client->base_url[MAX_URL_LENGTH - 1] = '\0';
    client->token[0] = '\0';
    client->user_id[0] = '\0';
    client->is_logged_in = false;
}

// Register a new user
bool register_user(DBISClient *client) {
    CURL *curl;
    CURLcode res;
    ResponseData resp = {0};
    resp.data = malloc(1);
    resp.size = 0;
    
    char username[MAX_INPUT_LENGTH];
    char email[MAX_INPUT_LENGTH];
    char password[MAX_INPUT_LENGTH];
    char full_name[MAX_INPUT_LENGTH];
    char date_of_birth[MAX_INPUT_LENGTH];
    char phone_number[MAX_INPUT_LENGTH];
    
    printf("Enter username (min 3 characters): ");
    fgets(username, MAX_INPUT_LENGTH, stdin);
    username[strcspn(username, "\n")] = 0;
    
    printf("Enter your email: ");
    fgets(email, MAX_INPUT_LENGTH, stdin);
    email[strcspn(email, "\n")] = 0;
    
    printf("Enter your password (min 8 characters): ");
    get_password(password, MAX_INPUT_LENGTH);
    
    printf("Enter your full name: ");
    fgets(full_name, MAX_INPUT_LENGTH, stdin);
    full_name[strcspn(full_name, "\n")] = 0;
    
    printf("Enter your date of birth (YYYY-MM-DD) or leave blank: ");
    fgets(date_of_birth, MAX_INPUT_LENGTH, stdin);
    date_of_birth[strcspn(date_of_birth, "\n")] = 0;
    
    printf("Enter your phone number or leave blank: ");
    fgets(phone_number, MAX_INPUT_LENGTH, stdin);
    phone_number[strcspn(phone_number, "\n")] = 0;
    
    // Create JSON payload
    struct json_object *payload = json_object_new_object();
    json_object_object_add(payload, "username", json_object_new_string(username));
    json_object_object_add(payload, "email", json_object_new_string(email));
    json_object_object_add(payload, "password", json_object_new_string(password));
    json_object_object_add(payload, "fullName", json_object_new_string(full_name));
    
    if (strlen(date_of_birth) > 0) {
        json_object_object_add(payload, "dateOfBirth", json_object_new_string(date_of_birth));
    }
    
    if (strlen(phone_number) > 0) {
        json_object_object_add(payload, "phoneNumber", json_object_new_string(phone_number));
    }
    
    const char *json_payload = json_object_to_json_string(payload);
    
    curl = curl_easy_init();
    if (curl) {
        char url[MAX_URL_LENGTH];
        snprintf(url, MAX_URL_LENGTH, "%s/api/auth/register", client->base_url);
        
        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/json");
        
        curl_easy_setopt(curl, CURLOPT_URL, url);
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json_payload);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&resp);
        
        res = curl_easy_perform(curl);
        
        long http_code = 0;
        curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_code);
        
        if (res != CURLE_OK || http_code >= 400) {
            fprintf(stderr, "Registration failed: %s\n", curl_easy_strerror(res));
            if (resp.data) {
                fprintf(stderr, "Server response: %s\n", resp.data);
            }
            curl_slist_free_all(headers);
            curl_easy_cleanup(curl);
            free(resp.data);
            json_object_put(payload);
            return false;
        }
        
        // Parse response
        struct json_object *response_json = json_tokener_parse(resp.data);
        struct json_object *user_obj, *token_obj, *user_id_obj;
        
        if (json_object_object_get_ex(response_json, "user", &user_obj) &&
            json_object_object_get_ex(user_obj, "id", &user_id_obj) &&
            json_object_object_get_ex(response_json, "token", &token_obj)) {
            
            const char *user_id = json_object_get_string(user_id_obj);
            const char *token = json_object_get_string(token_obj);
            
            strncpy(client->user_id, user_id, sizeof(client->user_id) - 1);
            client->user_id[sizeof(client->user_id) - 1] = '\0';
            
            strncpy(client->token, token, sizeof(client->token) - 1);
            client->token[sizeof(client->token) - 1] = '\0';
            
            client->is_logged_in = true;
            
            printf("Registration successful. User ID: %s\n", client->user_id);
            printf("You are now logged in.\n");
        } else {
            printf("Registration successful but couldn't parse response.\n");
        }
        
        json_object_put(response_json);
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
        free(resp.data);
        json_object_put(payload);
        return true;
    }
    
    free(resp.data);
    json_object_put(payload);
    return false;
}

// Login to the API
bool login(DBISClient *client) {
    CURL *curl;
    CURLcode res;
    ResponseData resp = {0};
    resp.data = malloc(1);
    resp.size = 0;
    
    char email[MAX_INPUT_LENGTH];
    char password[MAX_INPUT_LENGTH];
    
    printf("Enter your email: ");
    fgets(email, MAX_INPUT_LENGTH, stdin);
    email[strcspn(email, "\n")] = 0;
    
    printf("Enter your password: ");
    get_password(password, MAX_INPUT_LENGTH);
    
    // Create JSON payload
    struct json_object *payload = json_object_new_object();
    json_object_object_add(payload, "email", json_object_new_string(email));
    json_object_object_add(payload, "password", json_object_new_string(password));
    
    const char *json_payload = json_object_to_json_string(payload);
    
    curl = curl_easy_init();
    if (curl) {
        char url[MAX_URL_LENGTH];
        snprintf(url, MAX_URL_LENGTH, "%s/api/auth/login", client->base_url);
        
        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/json");
        
        curl_easy_setopt(curl, CURLOPT_URL, url);
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json_payload);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&resp);
        
        res = curl_easy_perform(curl);
        
        long http_code = 0;
        curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_code);
        
        if (res != CURLE_OK || http_code >= 400) {
            fprintf(stderr, "Login failed: %s\n", curl_easy_strerror(res));
            if (resp.data) {
                fprintf(stderr, "Server response: %s\n", resp.data);
            }
            curl_slist_free_all(headers);
            curl_easy_cleanup(curl);
            free(resp.data);
            json_object_put(payload);
            return false;
        }
        
        // Parse response
        struct json_object *response_json = json_tokener_parse(resp.data);
        struct json_object *user_obj, *token_obj, *user_id_obj, *username_obj, *fullname_obj;
        
        if (json_object_object_get_ex(response_json, "user", &user_obj) &&
            json_object_object_get_ex(user_obj, "id", &user_id_obj) &&
            json_object_object_get_ex(response_json, "token", &token_obj)) {
            
            const char *user_id = json_object_get_string(user_id_obj);
            const char *token = json_object_get_string(token_obj);
            
            strncpy(client->user_id, user_id, sizeof(client->user_id) - 1);
            client->user_id[sizeof(client->user_id) - 1] = '\0';
            
            strncpy(client->token, token, sizeof(client->token) - 1);
            client->token[sizeof(client->token) - 1] = '\0';
            
            client->is_logged_in = true;
            
            // Get display name
            const char *display_name = NULL;
            if (json_object_object_get_ex(user_obj, "fullName", &fullname_obj)) {
                display_name = json_object_get_string(fullname_obj);
            } else if (json_object_object_get_ex(user_obj, "username", &username_obj)) {
                display_name = json_object_get_string(username_obj);
            }
            
            printf("Login successful. Welcome, %s!\n", display_name ? display_name : "User");
            
            // Print roles if available
            struct json_object *roles_obj;
            if (json_object_object_get_ex(user_obj, "roles", &roles_obj)) {
                int roles_len = json_object_array_length(roles_obj);
                printf("Your roles: ");
                for (int i = 0; i < roles_len; i++) {
                    struct json_object *role = json_object_array_get_idx(roles_obj, i);
                    printf("%s%s", json_object_get_string(role), (i < roles_len - 1) ? ", " : "");
                }
                printf("\n");
            }
        } else {
            printf("Login successful but couldn't parse response.\n");
        }
        
        json_object_put(response_json);
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
        free(resp.data);
        json_object_put(payload);
        return true;
    }
    
    free(resp.data);
    json_object_put(payload);
    return false;
}

// Grant role to a user (admin only)
bool grant_role(DBISClient *client) {
    if (!client->is_logged_in) {
        printf("You must login first.\n");
        return false;
    }
    
    CURL *curl;
    CURLcode res;
    ResponseData resp = {0};
    resp.data = malloc(1);
    resp.size = 0;
    
    printf("\nGrant Role to User (Admin only)\n");
    printf("Available roles: USER_ROLE, GOVERNMENT_ROLE, ADMIN_ROLE\n");
    
    char user_address[MAX_INPUT_LENGTH];
    char role[MAX_INPUT_LENGTH];
    
    printf("Enter user's wallet address: ");
    fgets(user_address, MAX_INPUT_LENGTH, stdin);
    user_address[strcspn(user_address, "\n")] = 0;
    
    printf("Enter role to grant: ");
    fgets(role, MAX_INPUT_LENGTH, stdin);
    role[strcspn(role, "\n")] = 0;
    
    // Create JSON payload
    struct json_object *payload = json_object_new_object();
    json_object_object_add(payload, "userAddress", json_object_new_string(user_address));
    json_object_object_add(payload, "role", json_object_new_string(role));
    
    const char *json_payload = json_object_to_json_string(payload);
    
    curl = curl_easy_init();
    if (curl) {
        char url[MAX_URL_LENGTH];
        snprintf(url, MAX_URL_LENGTH, "%s/api/blockchain/admin/grant-role", client->base_url);
        
        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/json");
        
        char auth_header[MAX_TOKEN_LENGTH + 20];
        snprintf(auth_header, sizeof(auth_header), "Authorization: Bearer %s", client->token);
        headers = curl_slist_append(headers, auth_header);
        
        curl_easy_setopt(curl, CURLOPT_URL, url);
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json_payload);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&resp);
        
        res = curl_easy_perform(curl);
        
        long http_code = 0;
        curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_code);
        
        if (res != CURLE_OK || http_code >= 400) {
            fprintf(stderr, "Failed to grant role: %s\n", curl_easy_strerror(res));
            if (resp.data) {
                fprintf(stderr, "Server response: %s\n", resp.data);
            }
            curl_slist_free_all(headers);
            curl_easy_cleanup(curl);
            free(resp.data);
            json_object_put(payload);
            return false;
        }
        
        // Parse response
        struct json_object *response_json = json_tokener_parse(resp.data);
        struct json_object *transaction_obj, *hash_obj;
        
        if (json_object_object_get_ex(response_json, "transaction", &transaction_obj) &&
            json_object_object_get_ex(transaction_obj, "hash", &hash_obj)) {
            
            const char *tx_hash = json_object_get_string(hash_obj);
            printf("Role %s granted successfully to %s\n", role, user_address);
            printf("Transaction hash: %s\n", tx_hash);
        } else {
            printf("Role granted successfully but couldn't parse transaction details.\n");
        }
        
        json_object_put(response_json);
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
        free(resp.data);
        json_object_put(payload);
        return true;
    }
    
    free(resp.data);
    json_object_put(payload);
    return false;
}

// Revoke role from a user (admin only)
bool revoke_role(DBISClient *client) {
    if (!client->is_logged_in) {
        printf("You must login first.\n");
        return false;
    }
    
    CURL *curl;
    CURLcode res;
    ResponseData resp = {0};
    resp.data = malloc(1);
    resp.size = 0;
    
    printf("\nRevoke Role from User (Admin only)\n");
    printf("Available roles: USER_ROLE, GOVERNMENT_ROLE, ADMIN_ROLE\n");
    
    char user_address[MAX_INPUT_LENGTH];
    char role[MAX_INPUT_LENGTH];
    
    printf("Enter user's wallet address: ");
    fgets(user_address, MAX_INPUT_LENGTH, stdin);
    user_address[strcspn(user_address, "\n")] = 0;
    
    printf("Enter role to revoke: ");
    fgets(role, MAX_INPUT_LENGTH, stdin);
    role[strcspn(role, "\n")] = 0;
    
    // Create JSON payload
    struct json_object *payload = json_object_new_object();
    json_object_object_add(payload, "userAddress", json_object_new_string(user_address));
    json_object_object_add(payload, "role", json_object_new_string(role));
    
    const char *json_payload = json_object_to_json_string(payload);
    
    curl = curl_easy_init();
    if (curl) {
        char url[MAX_URL_LENGTH];
        snprintf(url, MAX_URL_LENGTH, "%s/api/blockchain/admin/revoke-role", client->base_url);
        
        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/json");
        
        char auth_header[MAX_TOKEN_LENGTH + 20];
        snprintf(auth_header, sizeof(auth_header), "Authorization: Bearer %s", client->token);
        headers = curl_slist_append(headers, auth_header);
        
        curl_easy_setopt(curl, CURLOPT_URL, url);
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json_payload);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&resp);
        
        res = curl_easy_perform(curl);
        
        long http_code = 0;
        curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_code);
        
        if (res != CURLE_OK || http_code >= 400) {
            fprintf(stderr, "Failed to revoke role: %s\n", curl_easy_strerror(res));
            if (resp.data) {
                fprintf(stderr, "Server response: %s\n", resp.data);
            }
            curl_slist_free_all(headers);
            curl_easy_cleanup(curl);
            free(resp.data);
            json_object_put(payload);
            return false;
        }
        
        // Parse response
        struct json_object *response_json = json_tokener_parse(resp.data);
        struct json_object *transaction_obj, *hash_obj;
        
        if (json_object_object_get_ex(response_json, "transaction", &transaction_obj) &&
            json_object_object_get_ex(transaction_obj, "hash", &hash_obj)) {
            
            const char *tx_hash = json_object_get_string(hash_obj);
            printf("Role %s revoked successfully from %s\n", role, user_address);
            printf("Transaction hash: %s\n", tx_hash);
        } else {
            printf("Role revoked successfully but couldn't parse transaction details.\n");
        }
        
        json_object_put(response_json);
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
        free(resp.data);
        json_object_put(payload);
        return true;
    }
    
    free(resp.data);
    json_object_put(payload);
    return false;
}

// Logout
void logout(DBISClient *client) {
    client->token[0] = '\0';
    client->user_id[0] = '\0';
    client->is_logged_in = false;
    printf("Logged out successfully.\n");
}

// Display menu and get user choice
int display_menu() {
    printf("\n%s\n", "==================================================");
    printf("%s\n", "           DBIS API Client - Main Menu            ");
    printf("%s\n", "==================================================");
    printf("1. Register new user\n");
    printf("2. Login\n");
    printf("3. View user profile\n");
    printf("4. Update user profile\n");
    printf("5. Connect wallet\n");
    printf("6. Register biometric data\n");
    printf("7. Get biometric status\n");
    printf("8. Register identity on blockchain\n");
    printf("9. Get identity status from blockchain\n");
    printf("10. Create professional record\n");
    printf("11. Get professional records from database\n");
    printf("12. Add professional record to blockchain\n");
    printf("13. Get professional records from blockchain\n");
    printf("14. Admin: Grant role to user\n");
    printf("15. Admin: Revoke role from user\n");
    printf("16. Logout\n");
    printf("0. Exit\n");
    printf("%s\n", "==================================================");
    
    char choice_str[10];
    printf("Enter your choice: ");
    fgets(choice_str, sizeof(choice_str), stdin);
    return atoi(choice_str);
}

// Get password without showing it on screen
void get_password(char *password, size_t size) {
    struct termios old, new;
    
    // Get current terminal settings
    tcgetattr(STDIN_FILENO, &old);
    new = old;
    
    // Disable echo
    new.c_lflag &= ~ECHO;
    
    // Set new terminal settings
    tcsetattr(STDIN_FILENO, TCSANOW, &new);
    
    // Read password
    fgets(password, size, stdin);
    password[strcspn(password, "\n")] = 0;
    
    // Restore terminal settings
    tcsetattr(STDIN_FILENO, TCSANOW, &old);
    
    printf("\n");
}

// Main function
int main(int argc, char *argv[]) {
    // Initialize CURL
    curl_global_init(CURL_GLOBAL_ALL);
    
    // Initialize client
    DBISClient client;
    const char *base_url = "http://localhost:3000";
    
    // Check if base URL is provided as command line argument
    if (argc > 1) {
        base_url = argv[1];
    }
    
    init_client(&client, base_url);
    
    int choice;
    bool running = true;
    
    while (running) {
        choice = display_menu();
        
        switch (choice) {
            case 0:
                printf("Exiting DBIS API Client. Goodbye!\n");
                running = false;
                break;
            case 1:
                register_user(&client);
                break;
            case 2:
                login(&client);
                break;
            case 14:
                grant_role(&client);
                break;
            case 15:
                revoke_role(&client);
                break;
            case 16:
                logout(&client);
                break;
            default:
                printf("This functionality is not implemented in the C version.\n");
                printf("Please use the Python version for full functionality.\n");
                break;
        }
        
        if (running) {
            printf("\nPress Enter to continue...");
            getchar();
        }
    }
    
    // Cleanup
    curl_global_cleanup();
    
    return 0;
}
