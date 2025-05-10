/**
 * client.h - Client interface for network communication
 */
#ifndef CLIENT_H
#define CLIENT_H

/**
 * Initialize the client resources
 * 
 * @return 0 on success, -1 on failure
 */
int client_init(void);

/**
 * Connect to a server
 * 
 * @param server_ip The IP address of the server
 * @param port The port number to connect to
 * @return 0 on success, -1 on failure
 */
int client_connect(const char *server_ip, int port);

/**
 * Send a message to the connected server
 * 
 * @param message The message to send
 * @return 0 on success, -1 on failure
 */
int client_send_message(const char *message);

/**
 * Receive a message from the connected server
 * 
 * @param buffer The buffer to store the received message
 * @param buffer_size The size of the buffer
 * @return Number of bytes received, or -1 on failure
 */
int client_receive_message(char *buffer, int buffer_size);

/**
 * Disconnect from the server
 * 
 * @return 0 on success, -1 on failure
 */
int client_disconnect(void);

/**
 * Clean up client resources
 */
void client_cleanup(void);

#endif /* CLIENT_H */
