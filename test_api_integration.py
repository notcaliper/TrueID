#!/usr/bin/env python3

"""
DBIS API Integration Test Script

This script tests the integration between the frontend and backend of the DBIS system.
It validates all API endpoints and authentication flows.
"""

import requests
import json
import time
import sys
from colorama import init, Fore, Style

# Initialize colorama for colored output
init()

# Configuration
BACKEND_URL = "http://localhost:3000/api"
FRONTEND_URL = "http://localhost:3003"
ADMIN_CREDENTIALS = {"email": "admin@dbis.gov", "password": "admin123"}

# Test results tracking
tests_passed = 0
tests_failed = 0

def print_header(text):
    print(f"\n{Fore.CYAN}{'=' * 80}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{text.center(80)}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'=' * 80}{Style.RESET_ALL}")

def print_test(name):
    print(f"\n{Fore.YELLOW}[TEST] {name}{Style.RESET_ALL}")

def print_success(message):
    global tests_passed
    tests_passed += 1
    print(f"{Fore.GREEN}[✓] SUCCESS: {message}{Style.RESET_ALL}")

def print_failure(message, error=None):
    global tests_failed
    tests_failed += 1
    print(f"{Fore.RED}[✗] FAILED: {message}{Style.RESET_ALL}")
    if error:
        print(f"{Fore.RED}      Error: {error}{Style.RESET_ALL}")

def print_info(message):
    print(f"{Fore.BLUE}[i] INFO: {message}{Style.RESET_ALL}")

def print_summary():
    print(f"\n{Fore.CYAN}{'=' * 80}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'TEST SUMMARY'.center(80)}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'=' * 80}{Style.RESET_ALL}")
    print(f"{Fore.GREEN}Tests Passed: {tests_passed}{Style.RESET_ALL}")
    print(f"{Fore.RED}Tests Failed: {tests_failed}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}Total Tests: {tests_passed + tests_failed}{Style.RESET_ALL}")
    
    if tests_failed == 0:
        print(f"\n{Fore.GREEN}All tests passed successfully!{Style.RESET_ALL}")
    else:
        print(f"\n{Fore.RED}Some tests failed. Please check the logs above.{Style.RESET_ALL}")

def test_backend_health():
    print_test("Backend Health Check")
    try:
        response = requests.get(f"{BACKEND_URL}/health")
        if response.status_code == 200:
            print_success("Backend health check endpoint is responding")
            return True
        else:
            print_failure(f"Backend health check failed with status code {response.status_code}")
            return False
    except Exception as e:
        print_failure("Backend health check failed", str(e))
        return False

def test_admin_login():
    print_test("Admin Login")
    try:
        response = requests.post(f"{BACKEND_URL}/admin/login", json=ADMIN_CREDENTIALS)
        if response.status_code == 200:
            data = response.json()
            if data.get('success') or data.get('token') or (data.get('data') and data['data'].get('token')):
                print_success("Admin login successful")
                
                # Extract token based on response structure
                if data.get('data') and data['data'].get('token'):
                    token = data['data']['token']
                    refresh_token = data['data'].get('refreshToken')
                else:
                    token = data.get('token')
                    refresh_token = data.get('refreshToken')
                
                print_info(f"Token: {token[:20]}...")
                return token, refresh_token
            else:
                print_failure("Admin login response missing token")
                return None, None
        else:
            print_failure(f"Admin login failed with status code {response.status_code}")
            return None, None
    except Exception as e:
        print_failure("Admin login failed", str(e))
        return None, None

def test_protected_endpoint(token, endpoint, method="GET", data=None):
    print_test(f"Protected Endpoint: {endpoint} [{method}]")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        if method == "GET":
            response = requests.get(f"{BACKEND_URL}{endpoint}", headers=headers)
        elif method == "POST":
            response = requests.post(f"{BACKEND_URL}{endpoint}", headers=headers, json=data or {})
        elif method == "PUT":
            response = requests.put(f"{BACKEND_URL}{endpoint}", headers=headers, json=data or {})
        elif method == "DELETE":
            response = requests.delete(f"{BACKEND_URL}{endpoint}", headers=headers)
        else:
            print_failure(f"Unsupported method: {method}")
            return None
        
        if response.status_code in [200, 201]:
            print_success(f"{method} {endpoint} successful")
            return response.json()
        else:
            print_failure(f"{method} {endpoint} failed with status code {response.status_code}")
            try:
                error_data = response.json()
                print_info(f"Response: {json.dumps(error_data, indent=2)}")
            except:
                print_info(f"Response: {response.text}")
            return None
    except Exception as e:
        print_failure(f"{method} {endpoint} failed", str(e))
        return None

def test_blockchain_endpoints(token):
    print_header("BLOCKCHAIN ENDPOINTS TESTS")
    
    # Test blockchain health
    test_protected_endpoint(token, "/blockchain/health")
    
    # Test get all transactions
    transactions = test_protected_endpoint(token, "/blockchain/transactions")
    
    # If we have transactions, test getting details for one
    if transactions and (transactions.get('data') or transactions.get('transactions')):
        # Handle different response formats
        if transactions.get('data') and transactions['data'].get('transactions'):
            tx_list = transactions['data']['transactions']
        else:
            tx_list = transactions.get('transactions', [])
            
        if tx_list and len(tx_list) > 0:
            tx_hash = tx_list[0].get('transaction_hash')
            if tx_hash:
                test_protected_endpoint(token, f"/blockchain/transaction/{tx_hash}")
    
    # Test user transactions endpoint with a sample user ID
    test_protected_endpoint(token, "/blockchain/user-transactions/1")

def test_user_management(token):
    print_header("USER MANAGEMENT TESTS")
    
    # Get all users
    users_response = test_protected_endpoint(token, "/admin/users")
    
    # If we have users, test getting details for one
    if users_response and (users_response.get('data') or users_response.get('users')):
        # Handle different response formats
        if users_response.get('data') and users_response['data'].get('users'):
            users = users_response['data']['users']
        else:
            users = users_response.get('users', [])
            
        if users and len(users) > 0:
            user_id = users[0].get('id')
            if user_id:
                test_protected_endpoint(token, f"/admin/users/{user_id}")

def test_cors_integration():
    print_header("CORS INTEGRATION TESTS")
    print_test("CORS Pre-flight Request")
    
    try:
        # Simulate a pre-flight CORS request
        headers = {
            "Origin": FRONTEND_URL,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type, Authorization"
        }
        response = requests.options(f"{BACKEND_URL}/admin/login", headers=headers)
        
        if response.status_code in [200, 204]:
            cors_headers = response.headers
            allow_origin = cors_headers.get("Access-Control-Allow-Origin")
            allow_methods = cors_headers.get("Access-Control-Allow-Methods")
            allow_headers = cors_headers.get("Access-Control-Allow-Headers")
            
            if allow_origin and allow_methods and allow_headers:
                print_success("CORS headers are properly configured")
                print_info(f"Access-Control-Allow-Origin: {allow_origin}")
                print_info(f"Access-Control-Allow-Methods: {allow_methods}")
                print_info(f"Access-Control-Allow-Headers: {allow_headers}")
            else:
                print_failure("CORS headers are missing or incomplete")
        else:
            print_failure(f"CORS pre-flight request failed with status code {response.status_code}")
    except Exception as e:
        print_failure("CORS pre-flight request failed", str(e))

def main():
    print_header("DBIS API INTEGRATION TEST")
    print_info(f"Backend URL: {BACKEND_URL}")
    print_info(f"Frontend URL: {FRONTEND_URL}")
    
    # Test backend health
    if not test_backend_health():
        print("\nBackend is not responding. Exiting tests.")
        return
    
    # Test admin login
    token, refresh_token = test_admin_login()
    if not token:
        print("\nAuthentication failed. Cannot proceed with protected endpoint tests.")
        return
    
    # Test CORS integration
    test_cors_integration()
    
    # Test blockchain endpoints
    test_blockchain_endpoints(token)
    
    # Test user management
    test_user_management(token)
    
    # Print summary
    print_summary()

if __name__ == "__main__":
    main()
