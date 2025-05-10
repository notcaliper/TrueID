# C Client Application

A simple TCP client application written in C that can connect to a server, send messages, and receive responses.

## Features

- Connect to a TCP server using IP address and port
- Send messages to the server
- Receive responses from the server
- Clean error handling and resource management

## Building the Application

To build the application, run:

```bash
make
```

This will create the executable in the `bin` directory.

## Running the Application

To run the client application:

```bash
./bin/client <server_ip> <port>
```

For example:

```bash
./bin/client 127.0.0.1 8080
```

## Project Structure

- `src/main.c` - Entry point for the client application
- `src/client.c` - Implementation of the client functionality
- `src/client.h` - Header file defining the client interface
- `Makefile` - Build configuration

## Requirements

- GCC compiler
- POSIX-compliant operating system (Linux, macOS, etc.)
