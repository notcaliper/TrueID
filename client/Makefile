CC = gcc
CFLAGS = -Wall -Wextra -pedantic -std=c99
LDFLAGS = 
SRC_DIR = src
OBJ_DIR = obj
BIN_DIR = bin

# Source files and object files
SRC = $(wildcard $(SRC_DIR)/*.c)
OBJ = $(patsubst $(SRC_DIR)/%.c, $(OBJ_DIR)/%.o, $(SRC))

# Target executable
TARGET = $(BIN_DIR)/client

# Default target
all: directories $(TARGET)

# Create necessary directories
directories:
	mkdir -p $(OBJ_DIR) $(BIN_DIR)

# Compile the executable
$(TARGET): $(OBJ)
	$(CC) $(LDFLAGS) -o $@ $^

# Compile object files
$(OBJ_DIR)/%.o: $(SRC_DIR)/%.c
	$(CC) $(CFLAGS) -c $< -o $@

# Clean up
clean:
	rm -rf $(OBJ_DIR) $(BIN_DIR)

# Phony targets
.PHONY: all clean directories
