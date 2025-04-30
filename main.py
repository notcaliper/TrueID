from face_auth import FaceAuth
import time
import sys

def main():
    try:
        auth = FaceAuth()
    except Exception as e:
        print(f"Error initializing face authentication: {str(e)}")
        print("Please make sure you have:")
        print("1. A working webcam")
        print("2. The facial landmark predictor file (shape_predictor_68_face_landmarks.dat)")
        print("3. All required dependencies installed")
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