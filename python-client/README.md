# DBIS Python API Client

This is a Python client for interacting with the Decentralized Biometric Identity System (DBIS) API.

## Features

- Authentication (login, register, logout)
- User profile management
- Biometric data registration and verification
- Blockchain identity registration and verification
- Professional record management
- Role-based access control (for admin users)

## Setup

1. Install dependencies:
   ```
   pip install requests tabulate
   ```

2. Configure the client with your API endpoint:
   ```python
   client = DBISClient(base_url="http://your-api-endpoint:3000")
   ```

## Usage

Run the client application:

```
python dbis_api_client.py
```

This will start an interactive CLI that guides you through all available operations.

## API Documentation

The client supports the following API operations:

- User authentication (login, register, logout)
- User profile management (get, update)
- Wallet connection
- Biometric data registration and verification
- Blockchain identity registration and verification
- Professional record management
- Role-based access control (admin only)
