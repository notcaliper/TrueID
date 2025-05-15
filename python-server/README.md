# DBIS Python Face Authentication Server

This is a TCP server for the Face Authentication component of the Decentralized Biometric Identity System (DBIS).

## Features

- TCP socket server for remote face authentication
- Interfaces with the face authentication system
- Provides network API for client applications
- Supports face registration and authentication

## Setup

1. Install dependencies:
   ```
   pip install face_recognition opencv-python dlib imutils psycopg2-binary
   ```

2. Ensure PostgreSQL database is running and accessible

3. Configure the server port (default: 8080):
   ```
   python server.py [port]
   ```

## API Protocol

The server accepts JSON requests with the following commands:

- `register`: Register a new face
  ```json
  {"command": "register", "name": "User Name"}
  ```

- `authenticate`: Authenticate a face
  ```json
  {"command": "authenticate"}
  ```

- `ping`: Check server status
  ```json
  {"command": "ping"}
  ```

## Response Format

All responses are in JSON format:

```json
{
  "status": "success|error",
  "message": "Response message",
  "user": "User name (only for successful authentication)"
}
```
