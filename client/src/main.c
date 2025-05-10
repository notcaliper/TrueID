/**
 * main.c - Entry point for the client application
 */
#include <stdio.h>
#include <stdlib.h>
#include "client.h"

int main(int argc, char *argv[]) {
    if (argc != 3) {
        fprintf(stderr, "Usage: %s <server_ip> <port>\n", argv[0]);
        return EXIT_FAILURE;
    }

    const char *server_ip = argv[1];
    int port = atoi(argv[2]);

    printf("Starting client, connecting to %s:%d\n", server_ip, port);
    
    // Initialize the client
    if (client_init() != 0) {
        fprintf(stderr, "Failed to initialize client\n");
        return EXIT_FAILURE;
    }

    // Connect to the server
    if (client_connect(server_ip, port) != 0) {
        fprintf(stderr, "Failed to connect to server\n");
        client_cleanup();
        return EXIT_FAILURE;
    }

    printf("Connected to server successfully\n");

    // Send and receive data
    const char *message = "Hello from client";
    if (client_send_message(message) != 0) {
        fprintf(stderr, "Failed to send message\n");
    } else {
        printf("Sent message: %s\n", message);
    }

    char buffer[1024];
    if (client_receive_message(buffer, sizeof(buffer)) > 0) {
        printf("Received response: %s\n", buffer);
    } else {
        fprintf(stderr, "Failed to receive response\n");
    }

    // Cleanup
    client_disconnect();
    client_cleanup();
    
    printf("Client terminated\n");
    return EXIT_SUCCESS;
}
