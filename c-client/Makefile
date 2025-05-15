CC = gcc
CFLAGS = -Wall -Wextra
LDFLAGS = -lcurl -ljson-c

SRC_DIR = src
BIN_DIR = bin
OBJ_DIR = obj

TARGET = $(BIN_DIR)/dbis_api_client_c
SRC = $(SRC_DIR)/dbis_api_client.c
OBJ = $(OBJ_DIR)/dbis_api_client.o

.PHONY: all clean

all: $(TARGET)

$(TARGET): $(OBJ) | $(BIN_DIR)
	$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)

$(OBJ_DIR)/%.o: $(SRC_DIR)/%.c | $(OBJ_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

$(BIN_DIR) $(OBJ_DIR):
	mkdir -p $@

clean:
	rm -rf $(OBJ_DIR) $(BIN_DIR)
