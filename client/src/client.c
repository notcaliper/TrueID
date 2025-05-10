/**
 * client.c - Implementation of client network communication for face authentication
 */
#include "client.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <errno.h>
#include <ctype.h>

// Global socket file descriptor
static int sock_fd = -1;

int client_init(void) {
    // Nothing to initialize for now
    return 0;
}

int client_connect(const char *server_ip, int port) {
    struct sockaddr_in server_addr;
    
    // Create socket
    sock_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (sock_fd < 0) {
        perror("Socket creation failed");
        return -1;
    }
    
    // Prepare server address structure
    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(port);
    
    // Convert IP address from text to binary form
    if (inet_pton(AF_INET, server_ip, &server_addr.sin_addr) <= 0) {
        perror("Invalid address or address not supported");
        close(sock_fd);
        sock_fd = -1;
        return -1;
    }
    
    // Connect to the server
    if (connect(sock_fd, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
        perror("Connection failed");
        close(sock_fd);
        sock_fd = -1;
        return -1;
    }
    
    return 0;
}

int client_send_message(const char *message) {
    if (sock_fd < 0) {
        fprintf(stderr, "Not connected to server\n");
        return -1;
    }
    
    size_t len = strlen(message);
    ssize_t bytes_sent = send(sock_fd, message, len, 0);
    
    if (bytes_sent < 0) {
        perror("Send failed");
        return -1;
    }
    
    if ((size_t)bytes_sent < len) {
        fprintf(stderr, "Sent only %zd bytes out of %zu\n", bytes_sent, len);
        return -1;
    }
    
    return 0;
}

/**
 * Format a JSON request for the face authentication server
 * 
 * @param command The command to send (e.g., "register", "authenticate")
 * @param name The name parameter (optional, can be NULL)
 * @param buffer The buffer to store the formatted JSON
 * @param buffer_size The size of the buffer
 * @return 0 on success, -1 on failure
 */
int client_format_json_request(const char *command, const char *name, char *buffer, int buffer_size) {
    if (!command || !buffer) {
        return -1;
    }
    
    if (name) {
        // Format JSON with name parameter
        int written = snprintf(buffer, buffer_size, "{\"command\":\"%s\",\"name\":\"%s\"}", command, name);
        if (written < 0 || written >= buffer_size) {
            return -1;
        }
    } else {
        // Format JSON without name parameter
        int written = snprintf(buffer, buffer_size, "{\"command\":\"%s\"}", command);
        if (written < 0 || written >= buffer_size) {
            return -1;
        }
    }
    
    return 0;
}

/**
 * Parse a JSON response from the server
 * 
 * @param json_str The JSON string to parse
 * @param status Buffer to store the status value
 * @param message Buffer to store the message value
 * @param user Buffer to store the user value (can be NULL)
 * @param status_size Size of the status buffer
 * @param message_size Size of the message buffer
 * @param user_size Size of the user buffer
 * @return 0 on success, -1 on failure
 */
int client_parse_json_response(const char *json_str, char *status, char *message, char *user, 
                              int status_size, int message_size, int user_size) {
    if (!json_str || !status || !message) {
        return -1;
    }
    
    // Simple JSON parser for responses of the form {"status":"...","message":"...","user":"..."}
    // This is a very basic parser and not robust for all JSON
    
    // Find status
    const char *status_key = "\"status\":\"";
    char *status_start = strstr(json_str, status_key);
    if (!status_start) {
        return -1;
    }
    status_start += strlen(status_key);
    char *status_end = strchr(status_start, '"');
    if (!status_end) {
        return -1;
    }
    int status_len = status_end - status_start;
    if (status_len >= status_size) {
        status_len = status_size - 1;
    }
    strncpy(status, status_start, status_len);
    status[status_len] = '\0';
    
    // Find message
    const char *message_key = "\"message\":\"";
    char *message_start = strstr(json_str, message_key);
    if (!message_start) {
        return -1;
    }
    message_start += strlen(message_key);
    char *message_end = strchr(message_start, '"');
    if (!message_end) {
        return -1;
    }
    int message_len = message_end - message_start;
    if (message_len >= message_size) {
        message_len = message_size - 1;
    }
    strncpy(message, message_start, message_len);
    message[message_len] = '\0';
    
    // Find user (optional)
    if (user && user_size > 0) {
        user[0] = '\0';  // Initialize to empty string
        const char *user_key = "\"user\":\"";
        char *user_start = strstr(json_str, user_key);
        if (user_start) {
            user_start += strlen(user_key);
            char *user_end = strchr(user_start, '"');
            if (user_end) {
                int user_len = user_end - user_start;
                if (user_len >= user_size) {
                    user_len = user_size - 1;
                }
                strncpy(user, user_start, user_len);
                user[user_len] = '\0';
            }
        }
    }
    
    return 0;
}

int client_receive_message(char *buffer, int buffer_size) {
    if (sock_fd < 0) {
        fprintf(stderr, "Not connected to server\n");
        return -1;
    }
    
    // Clear the buffer
    memset(buffer, 0, buffer_size);
    
    // Receive data
    ssize_t bytes_received = recv(sock_fd, buffer, buffer_size - 1, 0);
    
    if (bytes_received < 0) {
        perror("Receive failed");
        return -1;
    }
    
    if (bytes_received == 0) {
        fprintf(stderr, "Server closed connection\n");
        return 0;
    }
    
    // Ensure null termination
    buffer[bytes_received] = '\0';
    
    return (int)bytes_received;
}

int client_disconnect(void) {
    if (sock_fd < 0) {
        return 0;  // Already disconnected
    }
    
    if (close(sock_fd) < 0) {
        perror("Close failed");
        return -1;
    }
    
    sock_fd = -1;
    return 0;
}

void client_cleanup(void) {
    if (sock_fd >= 0) {
        client_disconnect();
    }
}
