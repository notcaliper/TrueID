# DBIS C API Client

This is a C client for interacting with the Decentralized Biometric Identity System (DBIS) API.

## Features

- Authentication (login, register, logout)
- User profile management
- Biometric data registration and verification
- Blockchain identity registration and verification
- Professional record management

## Building

Compile the client using:

```bash
gcc -o bin/dbis_api_client_c src/dbis_api_client.c -lcurl -ljson-c
```

## Dependencies

- libcurl
- json-c

## Usage

Run the compiled client:

```bash
./bin/dbis_api_client_c
```

This will start an interactive CLI that guides you through all available operations.
