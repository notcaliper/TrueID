from face_auth import FaceAuth
import time
import sys
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
    try:
        # Get database configuration
        db_config = get_db_config()
        
        # Initialize face authentication with database config
        auth = FaceAuth(db_params=db_config)
    except Exception as e:
        print(f"Error initializing face authentication: {str(e)}")
        print("Please make sure you have:")
        print("1. A working webcam")
        print("2. The facial landmark predictor file (shape_predictor_68_face_landmarks.dat)")
        print("3. PostgreSQL database running and accessible")
        print("4. All required dependencies installed")
        return
    
    while True:
        try:
            print("\nFace Authentication System")
            print("1. Register new face")
            print("2. Authenticate face")
            print("3. Exit")
            
            choice = input("Enter your choice (1-3): ")
            
            if choice == "1":
                name = input("Enter your name: ")
                if auth.register_face(name):
                    print("Registration successful!")
                else:
                    print("Registration failed. Please try again.")
                    
            elif choice == "2":
                result = auth.authenticate()
                if result:
                    print(f"Authentication successful! Welcome, {result}!")
                else:
                    print("Authentication failed. Face not recognized.")
                    
            elif choice == "3":
                print("Exiting...")
                break
                
            else:
                print("Invalid choice. Please try again.")
            
            time.sleep(1)  # Small delay for better user experience
            
        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except Exception as e:
            print(f"An error occurred: {str(e)}")
            print("Please try again.")

if __name__ == "__main__":
    main() 