# Face Authentication System

A robust face authentication system using dlib and face_recognition libraries. This system allows you to register faces and authenticate users using facial recognition, with data stored in a PostgreSQL database.

## Requirements

- Python 3.7 or higher
- Webcam
- PostgreSQL database
- Required Python packages (see requirements.txt)

## Installation

1. Clone this repository
2. Install PostgreSQL if not already installed:
   - Windows: Download from [PostgreSQL official website](https://www.postgresql.org/download/windows/)
   - Linux: `sudo apt-get install postgresql postgresql-contrib`
   - macOS: `brew install postgresql`

3. Create a PostgreSQL database:
   ```sql
   CREATE DATABASE face_auth;
   ```

4. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

Note: Installing dlib might require additional system dependencies. On Windows, you might need to install Visual Studio Build Tools.

## Usage

1. Make sure your PostgreSQL database is running
2. Run the main program:
   ```bash
   python main.py
   ```
3. Enter your PostgreSQL database details when prompted
4. Choose from the following options:
   - Register new face: Register a new user with their face
   - Authenticate face: Verify a user's identity
   - Exit: Close the program

## How it Works

1. **Registration**:
   - The system captures an image from your webcam
   - Detects and encodes the face
   - Stores the face encoding and landmarks in the PostgreSQL database

2. **Authentication**:
   - The system captures an image from your webcam
   - Detects and encodes the face
   - Compares the face encoding with stored encodings from the database
   - Returns the name of the matched person or None if no match is found

## Database Schema

The system uses two tables in the PostgreSQL database:

1. `users` table:
   - `id`: Primary key
   - `name`: User's name (unique)
   - `created_at`: Timestamp of user creation

2. `face_data` table:
   - `id`: Primary key
   - `user_id`: Foreign key to users table
   - `face_encoding`: Binary data of face encoding
   - `landmarks`: Binary data of facial landmarks
   - `created_at`: Timestamp of face data creation

## Security Notes

- Face data is stored securely in a PostgreSQL database
- The system uses dlib's face recognition algorithm which is robust against various lighting conditions and angles
- For production use, consider adding additional security measures like:
  - Liveness detection
  - Multi-factor authentication
  - Secure database credentials management
  - Database encryption

## License

This project is open source and available under the MIT License. 