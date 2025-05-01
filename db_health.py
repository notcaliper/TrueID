import psycopg2
import sys
from datetime import datetime
import pickle
import numpy as np
import json
import os

def save_db_config(db_params):
    """Save database configuration to a file"""
    try:
        with open('db_config.json', 'w') as f:
            json.dump(db_params, f, indent=4)
        print("\n✅ Database configuration saved to db_config.json")
    except Exception as e:
        print(f"Error saving configuration: {str(e)}")

def load_db_config():
    """Load database configuration from file"""
    try:
        if os.path.exists('db_config.json'):
            with open('db_config.json', 'r') as f:
                return json.load(f)
        return None
    except Exception as e:
        print(f"Error loading configuration: {str(e)}")
        return None

def check_database_health(db_params):
    """
    Check if the PostgreSQL database is online and accessible.
    Returns True if healthy, False otherwise.
    """
    try:
        # Try to connect to the database
        conn = psycopg2.connect(**db_params)
        cursor = conn.cursor()
        
        # Check if we can execute a simple query
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        
        # Check if required tables exist
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            );
        """)
        users_table_exists = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'face_data'
            );
        """)
        face_data_table_exists = cursor.fetchone()[0]
        
        # Clean up
        cursor.close()
        conn.close()
        
        # Print status
        print("\nDatabase Health Check Results:")
        print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Database Version: {version}")
        print(f"Users table exists: {'Yes' if users_table_exists else 'No'}")
        print(f"Face data table exists: {'Yes' if face_data_table_exists else 'No'}")
        
        return True
        
    except psycopg2.OperationalError as e:
        print(f"\nDatabase Connection Error: {str(e)}")
        return False
    except Exception as e:
        print(f"\nUnexpected Error: {str(e)}")
        return False

def show_database_entries(db_params):
    """
    Display all entries in the database
    """
    try:
        conn = psycopg2.connect(**db_params)
        cursor = conn.cursor()
        
        # Get user count
        cursor.execute("SELECT COUNT(*) FROM users;")
        user_count = cursor.fetchone()[0]
        
        print(f"\nTotal Users in Database: {user_count}")
        print("\nUser Details:")
        print("-" * 50)
        
        # Get all users with their face data
        cursor.execute("""
            SELECT u.id, u.name, u.created_at, 
                   COUNT(fd.id) as face_data_count
            FROM users u
            LEFT JOIN face_data fd ON u.id = fd.user_id
            GROUP BY u.id, u.name, u.created_at
            ORDER BY u.created_at DESC;
        """)
        
        users = cursor.fetchall()
        
        if not users:
            print("No users found in the database.")
            return
        
        for user in users:
            user_id, name, created_at, face_data_count = user
            print(f"User ID: {user_id}")
            print(f"Name: {name}")
            print(f"Registered: {created_at}")
            print(f"Number of face entries: {face_data_count}")
            print("-" * 50)
            
            # Get face data details for this user
            cursor.execute("""
                SELECT id, created_at
                FROM face_data
                WHERE user_id = %s
                ORDER BY created_at DESC;
            """, (user_id,))
            
            face_entries = cursor.fetchall()
            if face_entries:
                print("Face Data Entries:")
                for entry in face_entries:
                    entry_id, entry_date = entry
                    print(f"  - Entry ID: {entry_id}, Created: {entry_date}")
                print("-" * 50)
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error displaying database entries: {str(e)}")

def get_db_config():
    """Get database configuration from user input or saved config"""
    # Try to load saved configuration
    saved_config = load_db_config()
    
    if saved_config:
        print("\nFound saved database configuration:")
        print(f"Database: {saved_config['dbname']}")
        print(f"Host: {saved_config['host']}")
        print(f"Port: {saved_config['port']}")
        print(f"Username: {saved_config['user']}")
        
        use_saved = input("\nDo you want to use this configuration? (y/n): ").lower()
        if use_saved == 'y':
            return saved_config
    
    # Get new configuration
    print("\nEnter your PostgreSQL database details:")
    dbname = input("Database name [face_auth]: ") or "face_auth"
    user = input("Username [postgres]: ") or "postgres"
    password = input("Password [postgres]: ") or "postgres"
    host = input("Host [localhost]: ") or "localhost"
    port = input("Port [5432]: ") or "5432"
    
    db_params = {
        'dbname': dbname,
        'user': user,
        'password': password,
        'host': host,
        'port': port
    }
    
    # Ask if user wants to save the configuration
    save_config = input("\nDo you want to save this configuration? (y/n): ").lower()
    if save_config == 'y':
        save_db_config(db_params)
    
    return db_params

def main():
    print("Database Health Check Tool")
    print("-------------------------")
    
    # Get database configuration
    db_params = get_db_config()
    
    # Check database health first
    is_healthy = check_database_health(db_params)
    
    if is_healthy:
        print("\n✅ Database is healthy and accessible!")
        
        # Ask if user wants to see entries
        while True:
            choice = input("\nDo you want to see database entries? (y/n): ").lower()
            if choice in ['y', 'n']:
                break
            print("Please enter 'y' or 'n'")
        
        if choice == 'y':
            show_database_entries(db_params)
        
        sys.exit(0)
    else:
        print("\n❌ Database is not accessible. Please check your configuration and try again.")
        sys.exit(1)

if __name__ == "__main__":
    main() 