#!/usr/bin/env python3
"""
DBIS API Client - A Python client for the Decentralized Biometric Identity System API

This script demonstrates how to interact with all features of the DBIS backend API,
including authentication, user management, identity operations, and blockchain functionality.
"""

import requests
import json
import argparse
import os
from getpass import getpass
from tabulate import tabulate
import time
from datetime import datetime

class DBISClient:
    """Client for interacting with the DBIS API"""
    
    def __init__(self, base_url="http://localhost:3000"):
        """Initialize the client with the API base URL"""
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.headers = {"Content-Type": "application/json"}
    
    def login(self, email, password):
        """Login to the DBIS API and get authentication token"""
        url = f"{self.base_url}/api/auth/login"
        payload = {
            "email": email,
            "password": password
        }
        
        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            
            self.token = data["token"]
            self.user_id = data["user"]["id"]
            self.headers["Authorization"] = f"Bearer {self.token}"
            
            # Use fullName or username based on what's available in the response
            user_display_name = data['user'].get('fullName') or data['user'].get('username')
            print(f"Login successful. Welcome, {user_display_name}!")
            
            # Print user roles if available
            if 'roles' in data['user']:
                roles = ', '.join(data['user']['roles'])
                print(f"Your roles: {roles}")
                
            return True
        except requests.exceptions.RequestException as e:
            print(f"Login failed: {str(e)}")
            if response := getattr(e, "response", None):
                print(f"Server response: {response.text}")
            return False
    
    def register(self, username, email, password, full_name, date_of_birth=None, phone_number=None):
        """Register a new user"""
        url = f"{self.base_url}/api/auth/register"
        payload = {
            "username": username,
            "email": email,
            "password": password,
            "fullName": full_name,
            "dateOfBirth": date_of_birth,
            "phoneNumber": phone_number
        }
        
        # Remove None values
        payload = {k: v for k, v in payload.items() if v is not None}
        
        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            
            print(f"Registration successful. User ID: {data['user']['id']}")
            # Store token if available
            if 'token' in data:
                self.token = data['token']
                self.user_id = data['user']['id']
                self.headers["Authorization"] = f"Bearer {self.token}"
                print(f"You are now logged in as {data['user']['username']}")
            return True
        except requests.exceptions.RequestException as e:
            print(f"Registration failed: {str(e)}")
            if response := getattr(e, "response", None):
                print(f"Server response: {response.text}")
            return False
    
    def get_user_profile(self):
        """Get the current user's profile"""
        if not self.token:
            print("You must login first.")
            return None
        
        url = f"{self.base_url}/api/users/profile"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            
            # Log successful profile retrieval
            print("Profile retrieved successfully.")
            return data
        except requests.exceptions.RequestException as e:
            print(f"Failed to get user profile: {str(e)}")
            if response := getattr(e, "response", None):
                print(f"Server response: {response.text}")
            return None
    
    def update_user_profile(self, data):
        """Update the current user's profile"""
        if not self.token:
            print("You must login first.")
            return False
        
        url = f"{self.base_url}/api/users/profile"
        
        try:
            response = requests.put(url, json=data, headers=self.headers)
            response.raise_for_status()
            print("Profile updated successfully.")
            return True
        except requests.exceptions.RequestException as e:
            print(f"Failed to update profile: {str(e)}")
            if response := getattr(e, "response", None):
                print(f"Server response: {response.text}")
            return False
    
    def connect_wallet(self, wallet_address):
        """Connect a blockchain wallet to the user's account"""
        if not self.token:
            print("You must login first.")
            return False
        
        url = f"{self.base_url}/api/users/wallet"
        payload = {
            "wallet_address": wallet_address
        }
        
        try:
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            print(f"Wallet {wallet_address} connected successfully.")
            return True
        except requests.exceptions.RequestException as e:
            print(f"Failed to connect wallet: {str(e)}")
            if response := getattr(e, "response", None):
                print(f"Server response: {response.text}")
            return False
    
    def register_biometric(self, biometric_data):
        """Register biometric data for the user"""
        if not self.token:
            print("You must login first.")
            return False
        
        url = f"{self.base_url}/api/identity/register-biometric"
        payload = {
            "biometric_data": biometric_data
        }
        
        try:
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            print("Biometric data registered successfully.")
            return True
        except requests.exceptions.RequestException as e:
            print(f"Failed to register biometric data: {str(e)}")
            if response := getattr(e, "response", None):
                print(f"Server response: {response.text}")
            return False
    
    def get_biometric_status(self):
        """Get the status of the user's biometric data"""
        if not self.token:
            print("You must login first.")
            return None
        
        url = f"{self.base_url}/api/identity/biometric-status"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Failed to get biometric status: {str(e)}")
            if response := getattr(e, "response", None):
                print(f"Server response: {response.text}")
            return None
    
    def register_identity_on_blockchain(self):
        """Register the user's identity on the blockchain"""
        if not self.token:
            print("You must login first.")
            return False
        
        url = f"{self.base_url}/api/blockchain/register-identity"
        
        try:
            response = requests.post(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            print("Identity registered on blockchain successfully.")
            print(f"Transaction hash: {data['transaction']['hash']}")
            print(f"Block number: {data['transaction']['blockNumber']}")
            return True
        except requests.exceptions.RequestException as e:
            print(f"Failed to register identity on blockchain: {str(e)}")
            if response := getattr(e, "response", None):
                print(f"Server response: {response.text}")
            return False
    
    def get_identity_status(self):
        """Get the status of the user's identity on the blockchain"""
        if not self.token:
            print("You must login first.")
            return None
        
        url = f"{self.base_url}/api/blockchain/identity-status"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Failed to get identity status: {str(e)}")
            if response := getattr(e, "response", None):
                print(f"Server response: {response.text}")
            return None
    
    def add_professional_record(self, record_data):
        """Add a professional record to the blockchain"""
        if not self.token:
            print("You must login first.")
            return False
        
        url = f"{self.base_url}/api/blockchain/add-professional-record"
        
        try:
            response = requests.post(url, json=record_data, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            print("Professional record added to blockchain successfully.")
            print(f"Transaction hash: {data['transaction']['hash']}")
            return True
        except requests.exceptions.RequestException as e:
            print(f"Failed to add professional record: {str(e)}")
            if response := getattr(e, "response", None):
                print(f"Server response: {response.text}")
            return False
    
    def get_professional_records(self):
        """Get the user's professional records from the blockchain"""
        if not self.token:
            print("You must login first.")
            return None
        
        url = f"{self.base_url}/api/blockchain/professional-records"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Failed to get professional records: {str(e)}")
            if response := getattr(e, "response", None):
                print(f"Server response: {response.text}")
            return None
    
    def create_professional_record(self, title, organization, description, start_date, end_date=None):
        """Create a professional record in the database"""
        if not self.token:
            print("You must login first.")
            return None
        
        url = f"{self.base_url}/api/users/professional-records"
        payload = {
            "title": title,
            "organization": organization,
            "description": description,
            "start_date": start_date,
            "end_date": end_date
        }
        
        try:
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            print(f"Professional record created. Record ID: {data['record']['id']}")
            return data['record']
        except requests.exceptions.RequestException as e:
            print(f"Failed to create professional record: {str(e)}")
            if response := getattr(e, "response", None):
                print(f"Server response: {response.text}")
            return None
    
    def get_professional_records_db(self):
        """Get the user's professional records from the database"""
        if not self.token:
            print("You must login first.")
            return None
        
        url = f"{self.base_url}/api/users/professional-records"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Failed to get professional records: {str(e)}")
            if response := getattr(e, "response", None):
                print(f"Server response: {response.text}")
            return None
    
    def grant_role(self, user_address, role):
        """Grant a role to a user (admin only)"""
        if not self.token:
            print("You must login first.")
            return False
        
        url = f"{self.base_url}/api/blockchain/admin/grant-role"
        payload = {
            "userAddress": user_address,
            "role": role
        }
        
        try:
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            print(f"Role {role} granted successfully to {user_address}")
            print(f"Transaction hash: {data['transaction']['hash']}")
            return True
        except requests.exceptions.RequestException as e:
            print(f"Failed to grant role: {str(e)}")
            if response := getattr(e, "response", None):
                print(f"Server response: {response.text}")
            return False
    
    def revoke_role(self, user_address, role):
        """Revoke a role from a user (admin only)"""
        if not self.token:
            print("You must login first.")
            return False
        
        url = f"{self.base_url}/api/blockchain/admin/revoke-role"
        payload = {
            "userAddress": user_address,
            "role": role
        }
        
        try:
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            print(f"Role {role} revoked successfully from {user_address}")
            print(f"Transaction hash: {data['transaction']['hash']}")
            return True
        except requests.exceptions.RequestException as e:
            print(f"Failed to revoke role: {str(e)}")
            if response := getattr(e, "response", None):
                print(f"Server response: {response.text}")
            return False
    
    def logout(self):
        """Logout from the API"""
        self.token = None
        self.user_id = None
        self.headers = {"Content-Type": "application/json"}
        print("Logged out successfully.")


def display_menu():
    """Display the main menu"""
    print("\n" + "="*50)
    print("DBIS API Client - Main Menu".center(50))
    print("="*50)
    print("1. Register new user")
    print("2. Login")
    print("3. View user profile")
    print("4. Update user profile")
    print("5. Connect wallet")
    print("6. Register biometric data")
    print("7. Get biometric status")
    print("8. Register identity on blockchain")
    print("9. Get identity status from blockchain")
    print("10. Create professional record")
    print("11. Get professional records from database")
    print("12. Add professional record to blockchain")
    print("13. Get professional records from blockchain")
    print("14. Admin: Grant role to user")
    print("15. Admin: Revoke role from user")
    print("16. Logout")
    print("0. Exit")
    print("="*50)
    return input("Enter your choice: ")


def main():
    """Main function to run the DBIS API client"""
    parser = argparse.ArgumentParser(description="DBIS API Client")
    parser.add_argument("--url", default="http://localhost:3000", help="API base URL")
    args = parser.parse_args()
    
    client = DBISClient(base_url=args.url)
    
    while True:
        choice = display_menu()
        
        if choice == "0":
            print("Exiting DBIS API Client. Goodbye!")
            break
        
        elif choice == "1":
            username = input("Enter username (min 3 characters): ")
            email = input("Enter your email: ")
            password = getpass("Enter your password (min 8 characters): ")
            full_name = input("Enter your full name: ")
            date_of_birth = input("Enter your date of birth (YYYY-MM-DD) or leave blank: ")
            phone_number = input("Enter your phone number or leave blank: ")
            
            # Handle empty inputs
            if not date_of_birth:
                date_of_birth = None
            if not phone_number:
                phone_number = None
                
            client.register(username, email, password, full_name, date_of_birth, phone_number)
        
        elif choice == "2":
            email = input("Enter your email: ")
            password = getpass("Enter your password: ")
            client.login(email, password)
        
        elif choice == "3":
            profile = client.get_user_profile()
            if profile:
                print("\nUser Profile:")
                print(f"Username: {profile['user'].get('username', 'N/A')}")
                print(f"Full Name: {profile['user'].get('fullName', 'N/A')}")
                print(f"Email: {profile['user'].get('email', 'N/A')}")
                
                # Display roles if available
                if 'roles' in profile['user']:
                    roles = ', '.join(profile['user']['roles'])
                    print(f"Roles: {roles}")
                
                # Display wallet address if available
                wallet_address = profile['user'].get('walletAddress')
                if wallet_address:
                    print(f"Wallet Address: {wallet_address}")
                else:
                    print("Wallet Address: Not connected")
                    
                # Display additional profile information if available
                if profile['user'].get('dateOfBirth'):
                    print(f"Date of Birth: {profile['user']['dateOfBirth']}")
                if profile['user'].get('phoneNumber'):
                    print(f"Phone Number: {profile['user']['phoneNumber']}")
                if profile['user'].get('createdAt'):
                    print(f"Account Created: {profile['user']['createdAt']}")
                if profile['user'].get('lastLogin'):
                    print(f"Last Login: {profile['user']['lastLogin']}")
                    
                # Display verification status if available
                if 'isVerified' in profile['user']:
                    verified_status = "Verified" if profile['user']['isVerified'] else "Not Verified"
                    print(f"Verification Status: {verified_status}")
                    
                # Display blockchain status if available
                if profile.get('blockchainStatus'):
                    print("\nBlockchain Status:")
                    for key, value in profile['blockchainStatus'].items():
                        print(f"{key}: {value}")
        
        elif choice == "4":
            name = input("Enter new name (leave blank to keep current): ")
            data = {}
            if name:
                data["name"] = name
            
            if data:
                client.update_user_profile(data)
            else:
                print("No changes to update.")
        
        elif choice == "5":
            wallet_address = input("Enter wallet address: ")
            client.connect_wallet(wallet_address)
        
        elif choice == "6":
            # In a real app, this would be actual biometric data
            # For this demo, we'll use a placeholder
            biometric_data = {
                "facemesh_points": [
                    {"x": 0.1, "y": 0.2, "z": 0.3},
                    {"x": 0.2, "y": 0.3, "z": 0.4},
                    # More points would be here in a real app
                ]
            }
            client.register_biometric(biometric_data)
        
        elif choice == "7":
            status = client.get_biometric_status()
            if status:
                print("\nBiometric Status:")
                print(f"Has biometric data: {status['has_biometric_data']}")
                if status['has_biometric_data']:
                    print(f"Registered on: {status['biometric_data']['created_at']}")
                    print(f"Is active: {status['biometric_data']['is_active']}")
                    if status['biometric_data'].get('blockchain_tx_hash'):
                        print(f"Blockchain TX: {status['biometric_data']['blockchain_tx_hash']}")
        
        elif choice == "8":
            client.register_identity_on_blockchain()
        
        elif choice == "9":
            status = client.get_identity_status()
            if status:
                print("\nBlockchain Identity Status:")
                print(f"Wallet Address: {status['blockchainStatus']['walletAddress']}")
                print(f"Is Registered: {status['blockchainStatus']['isRegistered']}")
                print(f"Is Verified: {status['blockchainStatus']['isVerified']}")
                print(f"Professional Record Count: {status['blockchainStatus']['professionalRecordCount']}")
                
                print("\nDatabase Status:")
                print(f"Has Biometric Data: {status['databaseStatus']['hasBiometricData']}")
                if status['databaseStatus']['biometricData']:
                    print(f"Biometric Hash: {status['databaseStatus']['biometricData']['facemesh_hash']}")
        
        elif choice == "10":
            title = input("Enter job title: ")
            organization = input("Enter organization: ")
            description = input("Enter description: ")
            start_date = input("Enter start date (YYYY-MM-DD): ")
            end_date = input("Enter end date (YYYY-MM-DD, leave blank if current): ")
            if not end_date:
                end_date = None
            
            client.create_professional_record(title, organization, description, start_date, end_date)
        
        elif choice == "11":
            records = client.get_professional_records_db()
            if records and records.get('records'):
                print("\nProfessional Records:")
                table_data = []
                for record in records['records']:
                    end_date = record['end_date'] if record['end_date'] else "Current"
                    table_data.append([
                        record['id'],
                        record['title'],
                        record['organization'],
                        record['start_date'],
                        end_date,
                        "Yes" if record.get('blockchain_tx_hash') else "No"
                    ])
                
                headers = ["ID", "Title", "Organization", "Start Date", "End Date", "On Blockchain"]
                print(tabulate(table_data, headers=headers, tablefmt="grid"))
            else:
                print("No professional records found.")
        
        elif choice == "12":
            records = client.get_professional_records_db()
            if records and records.get('records'):
                print("\nSelect a record to add to blockchain:")
                for i, record in enumerate(records['records']):
                    end_date = record['end_date'] if record['end_date'] else "Current"
                    print(f"{i+1}. {record['title']} at {record['organization']} ({record['start_date']} to {end_date})")
                
                try:
                    selection = int(input("Enter record number: ")) - 1
                    if 0 <= selection < len(records['records']):
                        record_id = records['records'][selection]['id']
                        client.add_professional_record({"recordId": record_id})
                    else:
                        print("Invalid selection.")
                except ValueError:
                    print("Please enter a valid number.")
            else:
                print("No professional records found. Create one first.")
        
        elif choice == "13":
            records = client.get_professional_records()
            if records and records.get('records'):
                print("\nBlockchain Professional Records:")
                print(f"Wallet Address: {records['walletAddress']}")
                print(f"Record Count: {records['recordCount']}")
                
                table_data = []
                for record in records['records']:
                    end_date = record['endDate'] if record['endDate'] != "null" else "Current"
                    table_data.append([
                        record['index'],
                        record['dataHash'],
                        record['startDate'],
                        end_date,
                        "Yes" if record['isVerified'] else "No",
                        record['createdAt']
                    ])
                
                headers = ["Index", "Data Hash", "Start Date", "End Date", "Verified", "Created At"]
                print(tabulate(table_data, headers=headers, tablefmt="grid"))
            else:
                print("No blockchain professional records found.")
        
        elif choice == "14":
            print("\nGrant Role to User (Admin only)")
            print("Available roles: USER_ROLE, GOVERNMENT_ROLE, ADMIN_ROLE")
            user_address = input("Enter user's wallet address: ")
            role = input("Enter role to grant: ")
            client.grant_role(user_address, role)
        
        elif choice == "15":
            print("\nRevoke Role from User (Admin only)")
            print("Available roles: USER_ROLE, GOVERNMENT_ROLE, ADMIN_ROLE")
            user_address = input("Enter user's wallet address: ")
            role = input("Enter role to revoke: ")
            client.revoke_role(user_address, role)
            
        elif choice == "16":
            client.logout()
        
        else:
            print("Invalid choice. Please try again.")
        
        # Pause before showing menu again
        input("\nPress Enter to continue...")


if __name__ == "__main__":
    main()
