# Face Authentication System

A robust face authentication system using dlib and face_recognition libraries. This system allows you to register faces and authenticate users using facial recognition.

## Requirements

- Python 3.7 or higher
- Webcam
- Required Python packages (see requirements.txt)

## Installation

1. Clone this repository
2. Install the required packages:
```bash
pip install -r requirements.txt
```

Note: Installing dlib might require additional system dependencies. On Windows, you might need to install Visual Studio Build Tools.

## Usage

1. Run the main program:
```bash
python main.py
```

2. Choose from the following options:
   - Register new face: Register a new user with their face
   - Authenticate face: Verify a user's identity
   - Exit: Close the program

## How it Works

1. **Registration**:
   - The system captures an image from your webcam
   - Detects and encodes the face
   - Stores the face encoding with the provided name

2. **Authentication**:
   - The system captures an image from your webcam
   - Detects and encodes the face
   - Compares the face encoding with stored encodings
   - Returns the name of the matched person or None if no match is found

## Security Notes

- Face data is stored locally in the `face_data` directory
- The system uses dlib's face recognition algorithm which is robust against various lighting conditions and angles
- For production use, consider adding additional security measures like:
  - Liveness detection
  - Multi-factor authentication
  - Secure storage of face data

## License

This project is open source and available under the MIT License. 