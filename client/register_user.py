#!/usr/bin/env python3
"""
DBIS User Registration Client

This script handles user registration for the Decentralized Biometric Identity System (DBIS).
It captures user information and submits the registration to the DBIS backend.
"""

import os
import sys
import json
import argparse
import requests
from datetime import datetime

# Configuration
API_URL = "http://localhost:3000/api"
REGISTRATION_ENDPOINT = "/auth/register"
HEALTH_CHECK_ENDPOINT = "/health"

class DBISRegistrationClient:
    """Client for registering users with the DBIS system"""
    
    def __init__(self, api_url=API_URL):
        """Initialize the registration client"""
        self.api_url = api_url
        self.session = requests.Session()
    
    def check_server_health(self):
        """Check if the backend server is available"""
        try:
            response = self.session.get(f"{self.api_url}{HEALTH_CHECK_ENDPOINT}")
            if response.status_code == 200:
                health_data = response.json()
                print(f"Server status: {health_data.get('status', 'Unknown')}")
                return True
            else:
                print(f"Server health check failed with status code: {response.status_code}")
                return False
        except requests.RequestException as e:
            print(f"Error connecting to server: {e}")
            return False
    
    def collect_user_information(self):
        """Collect user information through CLI prompts"""
        print("\n=== DBIS User Registration ===\n")
        print("Please provide the following information:\n")
        
        # Required fields based on the validation rules
        first_name = input("First Name: ")
        last_name = input("Last Name: ")
        full_name = f"{first_name} {last_name}"
        
        # Username must be between 3-50 characters
        while True:
            username = input("Username (3-50 characters): ")
            if len(username) >= 3 and len(username) <= 50:
                break
            print("Username must be between 3 and 50 characters. Please try again.")
        
        # Government ID is required
        while True:
            government_id = input("Government ID (required): ")
            if government_id.strip():
                break
            print("Government ID is required. Please try again.")
        
        # Email is required and must be valid
        while True:
            email = input("Email Address: ")
            if '@' in email and '.' in email and len(email) > 5:  # Simple validation
                break
            print("Please enter a valid email address.")
        
        # Password must be at least 8 characters
        while True:
            password = input("Password (min 8 characters): ")
            if len(password) >= 8:
                confirm_password = input("Confirm Password: ")
                if password == confirm_password:
                    break
                print("Passwords do not match. Please try again.")
            else:
                print("Password must be at least 8 characters long. Please try again.")
        
        # Format the data according to what the backend expects
        user_info = {
            "username": username,
            "fullName": full_name,
            "email": email,
            "password": password,
            "government_id": government_id
        }
        
        # Add phone as additional information
        phone = input("Phone Number (optional): ")
        if phone.strip():
            user_info["phone"] = phone
        
        print("\nReview your information:")
        print(f"Name: {user_info['fullName']}")
        print(f"Username: {user_info['username']}")
        print(f"Government ID: {user_info['government_id']}")
        print(f"Email: {user_info['email']}")
        print(f"Password: {'*' * len(user_info['password'])}")
        if "phone" in user_info:
            print(f"Phone: {user_info['phone']}")
        
        confirm = input("\nIs this information correct? (y/n): ").lower()
        if confirm != 'y':
            print("Let's try again.")
            return self.collect_user_information()
        
        return user_info
    
    def register_user(self, user_info):
        """Register a new user account with the DBIS backend"""
        # Use the user_info directly
        registration_data = user_info
        
        max_attempts = 3
        current_attempt = 1
        
        while current_attempt <= max_attempts:
            try:
                print(f"\nSubmitting registration to DBIS server... (Attempt {current_attempt}/{max_attempts})")
                
                # Debug: Print the request payload
                print("\nRequest payload (keys only):")
                for key in registration_data.keys():
                    print(f"  - {key}")
                
                response = self.session.post(
                    f"{self.api_url}{REGISTRATION_ENDPOINT}",
                    json=registration_data,
                    headers={
                        "Content-Type": "application/json"
                    }
                )
                
                # Debug: Print response headers
                print(f"\nResponse headers: {dict(response.headers)}")
                print(f"Response content type: {response.headers.get('Content-Type', 'unknown')}")
                
                if response.status_code == 201:
                    result = response.json()
                    print("\n✅ Registration successful!")
                    print(f"User ID: {result['user']['id']}")
                    print(f"Username: {result['user']['username']}")
                    print(f"Name: {result['user']['name']}")
                    print(f"Government ID: {result['user']['government_id']}")
                    if 'phone' in result['user']:
                        print(f"Phone: {result['user']['phone']}")
                    print("\nPlease keep your User ID and Username safe as you'll need them for future authentication.")
                    return True
                else:
                    print(f"\n❌ Registration failed with status code: {response.status_code}")
                    try:
                        error_data = response.json()
                        error_message = error_data.get('message', 'Unknown error')
                        print(f"Error message: {error_message}")
                        
                        # Print full error data for debugging
                        print(f"Full error data: {error_data}")
                        
                        # Check for validation errors
                        if 'errors' in error_data:
                            print("\nValidation errors:")
                            for error in error_data['errors']:
                                print(f"  - {error.get('param', 'unknown')}: {error.get('msg', 'unknown error')}")
                        
                        # Check for specific error types that might need different handling
                        if response.status_code == 409 and "already exists" in error_message:
                            print("This user or government ID is already registered in the system.")
                            return False  # No retry for duplicate registration
                        
                    except Exception as e:
                        print(f"Error parsing response: {str(e)}")
                        print(f"Raw response: {response.text}")
                    
                    if current_attempt < max_attempts:
                        retry = input(f"Would you like to retry registration? (y/n): ").lower()
                        if retry != 'y':
                            print("Registration cancelled.")
                            return False
                        current_attempt += 1
                    else:
                        print("Maximum retry attempts reached. Please try again later or contact support.")
                        return False
                    
            except requests.exceptions.RequestException as e:
                print(f"\n❌ Network error during registration: {str(e)}")
                if current_attempt < max_attempts:
                    retry = input(f"Network error occurred. Would you like to retry? (y/n): ").lower()
                    if retry != 'y':
                        print("Registration cancelled.")
                        return False
                    current_attempt += 1
                else:
                    print("Maximum retry attempts reached. Please check your network connection and try again later.")
                    return False
        
        # If we've exhausted all attempts without returning, it's a failure
        return False
        
    def run(self):
        """Run the registration process"""
        print("Welcome to the DBIS Registration Client")
        print("=======================================")
        
        # Check server health
        if not self.check_server_health():
            print("Cannot connect to DBIS server. Please try again later.")
            return False
        
        # Collect user information
        user_info = self.collect_user_information()
        
        # Register the user account
        success = self.register_user(user_info)
        
        if success:
            print("\nThank you for registering with DBIS!")
            print("Your account has been created successfully.")
            print("You can now log in to the system using your username and password.")
        
        return success

def main():
    """Main function to run the registration client"""
    parser = argparse.ArgumentParser(description="DBIS User Registration Client")
    parser.add_argument("--server", default=API_URL, help="DBIS API server URL")
    args = parser.parse_args()
    
    client = DBISRegistrationClient(api_url=args.server)
    try:
        client.run()  # Call the run method
    except KeyboardInterrupt:
        print("\nRegistration process cancelled.")
    finally:
        print("\nExiting DBIS Registration Client.")

if __name__ == "__main__":
    main()
