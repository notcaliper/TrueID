# Face Authentication Module

This module provides facial recognition and authentication functionality for the Decentralized Biometric Identity System (DBIS).

## Features

- Face registration with multiple captures for accuracy
- Facial landmark detection and visualization
- Face authentication with confidence threshold
- PostgreSQL database integration for storing face data

## Setup

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Make sure you have a PostgreSQL database running
   - Default database name: `face_auth`
   - Default user: `postgres`
   - Default password: `postgres`
   - Default host: `localhost`
   - Default port: `5432`

## Usage

Run the main application:

```
python -m src.main
```

The application will guide you through:
- Database configuration
- Face registration
- Face authentication

## Structure

- `src/main.py` - Main application entry point
- `src/face_auth.py` - Face authentication implementation
- `src/database.py` - Database integration for face data storage
