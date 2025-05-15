#!/usr/bin/env python3
"""
TCP Server for Face Authentication System
This server interfaces with the face authentication system and provides
a network interface for client applications.
"""

import socket
import threading
import json
import sys
import os
import time

# Add parent directory to path so we can import from the python-auth module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the face authentication system
from python_auth.src.face_auth import FaceAuth
import python_auth.src.main as face_auth_main

class FaceAuthServer:
    def __init__(self, host='0.0.0.0', port=8080):
        """Initialize the server with host and port."""
        self.host = host
        self.port = port
        self.server_socket = None
        self.clients = []
        self.running = False
        
        # Initialize face authentication
        try:
            # Get database configuration
            self.db_config = face_auth_main.get_db_config()
            
            # Initialize face authentication with database config
            self.auth = FaceAuth(db_params=self.db_config)
            print("Face authentication system initialized successfully")
        except Exception as e:
            print(f"Error initializing face authentication: {str(e)}")
            print("Please make sure you have:")
            print("1. A working webcam")
            print("2. The facial landmark predictor file (shape_predictor_68_face_landmarks.dat)")
            print("3. PostgreSQL database running and accessible")
            print("4. All required dependencies installed")
            sys.exit(1)
    
    def start(self):
        """Start the server."""
        try:
            self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.server_socket.bind((self.host, self.port))
            self.server_socket.listen(5)
            self.running = True
            
            print(f"Server started on {self.host}:{self.port}")
            
            # Accept connections in a loop
            while self.running:
                client_socket, addr = self.server_socket.accept()
                print(f"New connection from {addr[0]}:{addr[1]}")
                
                # Start a new thread to handle the client
                client_thread = threading.Thread(
                    target=self.handle_client,
                    args=(client_socket, addr)
                )
                client_thread.daemon = True
                client_thread.start()
                
                self.clients.append((client_socket, addr, client_thread))
                
        except KeyboardInterrupt:
            print("Server shutting down...")
        except Exception as e:
            print(f"Error starting server: {str(e)}")
        finally:
            self.stop()
    
    def stop(self):
        """Stop the server and close all connections."""
        self.running = False
        
        # Close all client connections
        for client_socket, _, _ in self.clients:
            try:
                client_socket.close()
            except:
                pass
        
        # Close server socket
        if self.server_socket:
            try:
                self.server_socket.close()
            except:
                pass
        
        print("Server stopped")
    
    def handle_client(self, client_socket, addr):
        """Handle client connection."""
        try:
            while self.running:
                # Receive data from client
                data = client_socket.recv(1024)
                if not data:
                    print(f"Client {addr[0]}:{addr[1]} disconnected")
                    break
                
                # Process the request
                response = self.process_request(data.decode('utf-8'))
                
                # Send response back to client
                client_socket.send(response.encode('utf-8'))
        except Exception as e:
            print(f"Error handling client {addr[0]}:{addr[1]}: {str(e)}")
        finally:
            # Close the connection
            client_socket.close()
            # Remove client from list
            self.clients = [(s, a, t) for s, a, t in self.clients if a != addr]
    
    def process_request(self, request):
        """Process client request and return response."""
        try:
            # Parse the request as JSON
            req_data = json.loads(request)
            command = req_data.get('command')
            
            if command == 'register':
                name = req_data.get('name')
                if not name:
                    return json.dumps({'status': 'error', 'message': 'Name is required'})
                
                success = self.auth.register_face(name)
                if success:
                    return json.dumps({'status': 'success', 'message': f'Registration successful for {name}'})
                else:
                    return json.dumps({'status': 'error', 'message': 'Registration failed'})
            
            elif command == 'authenticate':
                result = self.auth.authenticate()
                if result:
                    return json.dumps({'status': 'success', 'message': f'Authentication successful', 'user': result})
                else:
                    return json.dumps({'status': 'error', 'message': 'Authentication failed'})
            
            elif command == 'ping':
                return json.dumps({'status': 'success', 'message': 'pong'})
            
            else:
                return json.dumps({'status': 'error', 'message': f'Unknown command: {command}'})
        
        except json.JSONDecodeError:
            return json.dumps({'status': 'error', 'message': 'Invalid JSON format'})
        except Exception as e:
            return json.dumps({'status': 'error', 'message': f'Server error: {str(e)}'})


def main():
    """Main function to start the server."""
    # Default port
    port = 8080
    
    # Check if port is provided as command line argument
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port number: {sys.argv[1]}")
            print(f"Using default port: {port}")
    
    # Create and start the server
    server = FaceAuthServer(port=port)
    server.start()


if __name__ == "__main__":
    main()
