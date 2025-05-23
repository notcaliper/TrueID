#!/bin/bash

# TrueID All-in-One Setup Script
# This script provides a comprehensive setup for the TrueID backend system

# Color codes for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Variables to track PIDs
LOCAL_BLOCKCHAIN_PID=""
SERVER_PID=""

# Function to display header
show_header() {
  clear
  echo -e "${BLUE}${BOLD}=========================================================${NC}"
  echo -e "${BLUE}${BOLD}            TrueID All-in-One Setup Script               ${NC}"
  echo -e "${BLUE}${BOLD}=========================================================${NC}"
  echo -e "${CYAN}Comprehensive setup for TrueID backend with blockchain support${NC}"
  echo
}

# Function to cleanup on exit
cleanup() {
  echo -e "\n${YELLOW}Cleaning up...${NC}"
  # Kill the local blockchain if it's running
  if [ ! -z "$LOCAL_BLOCKCHAIN_PID" ]; then
    echo -e "${YELLOW}Stopping local blockchain (PID: $LOCAL_BLOCKCHAIN_PID)${NC}"
    kill $LOCAL_BLOCKCHAIN_PID 2>/dev/null
  fi
  # Kill the server if it's running
  if [ ! -z "$SERVER_PID" ]; then
    echo -e "${YELLOW}Stopping backend server (PID: $SERVER_PID)${NC}"
    kill $SERVER_PID 2>/dev/null
  fi
  echo -e "${GREEN}Cleanup complete.${NC}"
}

# Set up trap to catch Ctrl+C and other exit signals
trap cleanup SIGINT SIGTERM

# Function to check if a command exists
command_exists() {
  command -v "$1" &> /dev/null
}

# Function to check if Node.js is installed
check_nodejs() {
  echo -e "${YELLOW}Checking Node.js installation...${NC}"
  if ! command_exists node; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js to continue.${NC}"
    echo -e "${YELLOW}Visit https://nodejs.org/ for installation instructions.${NC}"
    exit 1
  fi

  # Check Node.js version
  NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
  if [ "$NODE_VERSION" -lt 14 ]; then
    echo -e "${RED}Error: Node.js version is too old. Please install Node.js v14 or higher.${NC}"
    exit 1
  fi

  echo -e "${GREEN}Node.js v$(node -v) is installed.${NC}"
}

# Function to check if npm is installed
check_npm() {
  echo -e "${YELLOW}Checking npm installation...${NC}"
  if ! command_exists npm; then
    echo -e "${RED}Error: npm is not installed. Please install npm to continue.${NC}"
    exit 1
  fi
  echo -e "${GREEN}npm v$(npm -v) is installed.${NC}"
}

# Function to check if PostgreSQL is installed and running
check_postgres() {
  echo -e "${YELLOW}Checking PostgreSQL installation...${NC}"
  if command_exists psql; then
    echo -e "${GREEN}PostgreSQL client is installed.${NC}"
    
    # Try to connect to PostgreSQL
    echo -e "${YELLOW}Checking PostgreSQL connection...${NC}"
    if psql -h localhost -U postgres -c "SELECT 1" &>/dev/null; then
      echo -e "${GREEN}Successfully connected to PostgreSQL.${NC}"
      return 0
    else
      echo -e "${YELLOW}Could not connect to PostgreSQL with default credentials.${NC}"
      return 1
    fi
  else
    echo -e "${YELLOW}PostgreSQL client is not installed.${NC}"
    return 2
  fi
}

# Function to check if a port is in use
is_port_in_use() {
  if command_exists lsof; then
    lsof -i:"$1" &> /dev/null
    return $?
  elif command_exists netstat; then
    netstat -tuln | grep -q ":$1 "
    return $?
  else
    echo -e "${YELLOW}Warning: Cannot check if port $1 is in use (lsof and netstat not available)${NC}"
    return 1
  fi
}

# Function to install dependencies
install_dependencies() {
  echo -e "${YELLOW}Installing project dependencies...${NC}"
  npm install
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install dependencies.${NC}"
    exit 1
  fi
  echo -e "${GREEN}Dependencies installed successfully.${NC}"
}

# Function to setup .env file
setup_env_file() {
  echo -e "${YELLOW}Setting up environment variables...${NC}"
  
  if [ -f .env ]; then
    echo -e "${YELLOW}Found existing .env file. Do you want to keep it? (y/n)${NC}"
    read -r keep_env
    
    if [[ ! "$keep_env" =~ ^[Yy]$ ]]; then
      mv .env .env.backup
      echo -e "${YELLOW}Existing .env file backed up as .env.backup${NC}"
      
      # Create new .env file
      cat > .env << EOL
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=dbis
DB_PASSWORD=postgres
DB_PORT=5432

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h

# Blockchain Configuration
ADMIN_PRIVATE_KEY=your_private_key_here
AVALANCHE_FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

# Contract Configuration
CONTRACT_ADDRESS=your_deployed_contract_address_here
EOL
      echo -e "${GREEN}Created new .env file with default settings.${NC}"
    else
      echo -e "${GREEN}Keeping existing .env file.${NC}"
    fi
  else
    # Create new .env file
    cat > .env << EOL
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=dbis
DB_PASSWORD=postgres
DB_PORT=5432

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h

# Blockchain Configuration
ADMIN_PRIVATE_KEY=your_private_key_here
AVALANCHE_FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

# Contract Configuration
CONTRACT_ADDRESS=your_deployed_contract_address_here
EOL
    echo -e "${GREEN}Created new .env file with default settings.${NC}"
  fi
  
  # Ask for database password
  echo -e "${YELLOW}Do you want to update the database password in .env? (y/n)${NC}"
  read -r update_db_password
  
  if [[ "$update_db_password" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Enter your PostgreSQL password:${NC}"
    read -r db_password
    
    # Update password in .env
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$db_password/" .env
    echo -e "${GREEN}Database password updated.${NC}"
  fi
  
  # Check if blockchain private key needs setting
  if grep -q "ADMIN_PRIVATE_KEY=your_private_key_here" .env; then
    echo -e "${YELLOW}Blockchain private key is not set.${NC}"
    echo -e "${YELLOW}Do you want to update the blockchain private key in .env? (y/n)${NC}"
    read -r update_private_key
    
    if [[ "$update_private_key" =~ ^[Yy]$ ]]; then
      echo -e "${YELLOW}Enter your Ethereum/Avalanche private key (without 0x prefix):${NC}"
      read -r private_key
      
      # Update private key in .env
      sed -i "s/ADMIN_PRIVATE_KEY=.*/ADMIN_PRIVATE_KEY=$private_key/" .env
      echo -e "${GREEN}Blockchain private key updated.${NC}"
    else
      echo -e "${YELLOW}Warning: Blockchain operations will not work without a valid private key.${NC}"
    fi
  fi
}

# Function to initialize the database
init_database() {
  echo -e "${YELLOW}Initializing database...${NC}"
  
  # Check if DB_NAME exists
  source <(grep -v '^#' .env | sed -E 's/(.*)=(.*)/export \1="\2"/')
  
  if ! command_exists psql; then
    echo -e "${RED}PostgreSQL client is not installed. Cannot initialize database.${NC}"
    return 1
  fi
  
  # Create database if it doesn't exist
  if ! psql -h ${DB_HOST:-localhost} -U ${DB_USER:-postgres} -lqt | cut -d \| -f 1 | grep -qw ${DB_NAME:-dbis}; then
    echo -e "${YELLOW}Database ${DB_NAME:-dbis} does not exist. Creating it...${NC}"
    if psql -h ${DB_HOST:-localhost} -U ${DB_USER:-postgres} -c "CREATE DATABASE ${DB_NAME:-dbis};" &>/dev/null; then
      echo -e "${GREEN}Database ${DB_NAME:-dbis} created successfully.${NC}"
    else
      echo -e "${RED}Failed to create database. Please create it manually.${NC}"
      return 1
    fi
  else
    echo -e "${GREEN}Database ${DB_NAME:-dbis} already exists.${NC}"
  fi
  
  # Run the initialization script
  echo -e "${YELLOW}Running database schema initialization script...${NC}"
  if node scripts/init-db.js; then
    echo -e "${GREEN}Database initialization completed successfully.${NC}"
    return 0
  else
    echo -e "${RED}Database initialization failed.${NC}"
    return 1
  fi
}

# Function to start local blockchain
start_local_blockchain() {
  echo -e "${YELLOW}Starting local blockchain...${NC}"
  
  # Check if a blockchain is already running
  if is_port_in_use 8545; then
    echo -e "${YELLOW}A blockchain service is already running on port 8545.${NC}"
    echo -e "${YELLOW}Do you want to use the existing service? (y/n)${NC}"
    read -r use_existing
    
    if [[ "$use_existing" =~ ^[Yy]$ ]]; then
      echo -e "${GREEN}Using existing blockchain service.${NC}"
      return 0
    else
      echo -e "${RED}Cannot start a new blockchain service while port 8545 is in use.${NC}"
      echo -e "${RED}Please stop the existing service and try again.${NC}"
      return 1
    fi
  fi
  
  # Clear previous log
  > hardhat-node.log
  
  # Start the node with detailed logging
  echo -e "${YELLOW}Starting local Hardhat network...${NC}"
  npx hardhat node > hardhat-node.log 2>&1 &
  LOCAL_BLOCKCHAIN_PID=$!
  
  # Wait for node to start
  echo -e "${YELLOW}Waiting for node to start (this may take a moment)...${NC}"
  sleep 2
  
  # Check if process is still running
  if ! ps -p $LOCAL_BLOCKCHAIN_PID > /dev/null; then
    echo -e "${RED}Failed to start local Hardhat network. The process terminated.${NC}"
    echo -e "${YELLOW}Checking logs for errors...${NC}"
    cat hardhat-node.log
    return 1
  fi
  
  # Check if node is actually working
  attempt=1
  max_attempts=10
  while [ $attempt -le $max_attempts ]; do
    if grep -q "Started HTTP and WebSocket JSON-RPC server at" hardhat-node.log; then
      echo -e "${GREEN}Local Hardhat network started successfully with PID: $LOCAL_BLOCKCHAIN_PID${NC}"
      echo $LOCAL_BLOCKCHAIN_PID > .node.pid
      return 0
    fi
    
    if ! ps -p $LOCAL_BLOCKCHAIN_PID > /dev/null; then
      echo -e "${RED}Hardhat node process terminated unexpectedly${NC}"
      echo -e "${YELLOW}Log contents:${NC}"
      cat hardhat-node.log
      return 1
    fi
    
    echo -e "${YELLOW}Waiting for node to initialize (attempt $attempt/$max_attempts)...${NC}"
    sleep 2
    attempt=$((attempt+1))
  done
  
  echo -e "${RED}Timed out waiting for Hardhat node to start${NC}"
  echo -e "${YELLOW}Log contents:${NC}"
  cat hardhat-node.log
  return 1
}

# Function to deploy contracts
deploy_contracts() {
  echo -e "${YELLOW}Deploying smart contracts to local blockchain...${NC}"
  
  # Run deployment script
  if npx hardhat run --network localhost blockchain/scripts/deploy-local.js; then
    echo -e "${GREEN}Contracts deployed successfully to local blockchain!${NC}"
    return 0
  else
    echo -e "${RED}Contract deployment failed.${NC}"
    return 1
  fi
}

# Function to check if contracts are deployed
check_contract_deployment() {
  source <(grep -v '^#' .env | sed -E 's/(.*)=(.*)/export \1="\2"/')
  
  if [ -z "$CONTRACT_ADDRESS" ] || [ "$CONTRACT_ADDRESS" == "your_deployed_contract_address_here" ]; then
    echo -e "${YELLOW}No contract address found in .env file.${NC}"
    return 1
  else
    echo -e "${GREEN}Contract is deployed at address: $CONTRACT_ADDRESS${NC}"
    return 0
  fi
}

# Function to start backend server
start_backend_server() {
  echo -e "${YELLOW}Starting TrueID backend server...${NC}"
  
  # Check if port 3000 is available
  if is_port_in_use ${PORT:-3000}; then
    echo -e "${RED}Port ${PORT:-3000} is already in use. Cannot start the server.${NC}"
    return 1
  fi
  
  # Start the server
  node server.js > server.log 2>&1 &
  SERVER_PID=$!
  
  # Check if server started successfully
  sleep 3
  if ps -p $SERVER_PID > /dev/null; then
    echo -e "${GREEN}Backend server started successfully with PID: $SERVER_PID${NC}"
    return 0
  else
    echo -e "${RED}Failed to start backend server.${NC}"
    echo -e "${YELLOW}Server log:${NC}"
    cat server.log
    return 1
  fi
}

# Function to deploy to Avalanche Fuji testnet
deploy_to_fuji() {
  echo -e "${YELLOW}Deploying to Avalanche Fuji Testnet...${NC}"
  
  # Check if private key is set
  source <(grep -v '^#' .env | sed -E 's/(.*)=(.*)/export \1="\2"/')
  
  if [ -z "$ADMIN_PRIVATE_KEY" ] || [ "$ADMIN_PRIVATE_KEY" == "your_private_key_here" ]; then
    echo -e "${RED}Admin private key is not set in the .env file.${NC}"
    echo -e "${YELLOW}Would you like to set it now? (y/n)${NC}"
    read -r set_key
    
    if [[ "$set_key" =~ ^[Yy]$ ]]; then
      echo -e "${YELLOW}Enter your Ethereum/Avalanche private key (without 0x prefix):${NC}"
      read -r private_key
      
      # Update private key in .env
      sed -i "s/ADMIN_PRIVATE_KEY=.*/ADMIN_PRIVATE_KEY=$private_key/" .env
      export ADMIN_PRIVATE_KEY="$private_key"
      echo -e "${GREEN}Private key updated.${NC}"
    else
      echo -e "${RED}Cannot deploy without a private key.${NC}"
      return 1
    fi
  fi
  
  # Deploy to Fuji testnet
  echo -e "${YELLOW}Running deployment script. This may take some time...${NC}"
  if npx hardhat run --network avalanche_fuji ./scripts/deploy-avalanche-proxy.js; then
    echo -e "${GREEN}Contracts deployed successfully to Avalanche Fuji Testnet!${NC}"
    return 0
  else
    echo -e "${RED}Deployment to Avalanche Fuji Testnet failed.${NC}"
    echo -e "${YELLOW}Trying standard deployment...${NC}"
    
    if npx hardhat run --network avalanche_fuji ./scripts/deploy-avalanche.js; then
      echo -e "${GREEN}Contracts deployed successfully to Avalanche Fuji Testnet!${NC}"
      return 0
    else
      echo -e "${RED}All deployment attempts failed.${NC}"
      return 1
    fi
  fi
}

# Function to run the blockchain manager
run_blockchain_manager() {
  echo -e "${YELLOW}Starting Blockchain Manager...${NC}"
  node blockchain-manager.js
}

# Function to display the main menu
show_main_menu() {
  show_header
  echo -e "${CYAN}${BOLD}MAIN MENU${NC}"
  echo -e "1. ${CYAN}Full System Setup (Automated)${NC}"
  echo -e "2. ${CYAN}Database Setup${NC}"
  echo -e "3. ${CYAN}Local Blockchain Setup${NC}"
  echo -e "4. ${CYAN}Avalanche Testnet Deployment${NC}"
  echo -e "5. ${CYAN}Start Backend Server${NC}"
  echo -e "6. ${CYAN}Run Blockchain Manager${NC}"
  echo -e "7. ${CYAN}Environment Setup (.env)${NC}"
  echo -e "0. ${RED}Exit${NC}"
  echo
  echo -e "${YELLOW}Enter your choice:${NC}"
  
  read -r choice
  
  case $choice in
    1) full_system_setup ;;
    2) database_menu ;;
    3) blockchain_menu ;;
    4) deploy_to_fuji; press_enter_to_continue ;;
    5) start_backend_server; press_enter_to_continue ;;
    6) run_blockchain_manager ;;
    7) setup_env_file; press_enter_to_continue ;;
    0) cleanup; exit 0 ;;
    *) echo -e "${RED}Invalid choice. Please try again.${NC}"; sleep 1; show_main_menu ;;
  esac
}

# Database menu
database_menu() {
  show_header
  echo -e "${CYAN}${BOLD}DATABASE MENU${NC}"
  echo -e "1. ${CYAN}Check PostgreSQL Connection${NC}"
  echo -e "2. ${CYAN}Initialize Database Schema${NC}"
  echo -e "3. ${CYAN}Create Admin User${NC}"
  echo -e "4. ${CYAN}Full Database Setup (All of the above)${NC}"
  echo -e "0. ${YELLOW}Back to Main Menu${NC}"
  echo
  echo -e "${YELLOW}Enter your choice:${NC}"
  
  read -r choice
  
  case $choice in
    1) check_postgres; press_enter_to_continue ;;
    2) init_database; press_enter_to_continue ;;
    3) node scripts/create-admin.js; press_enter_to_continue ;;
    4) init_database; press_enter_to_continue ;;
    0) show_main_menu ;;
    *) echo -e "${RED}Invalid choice. Please try again.${NC}"; sleep 1; database_menu ;;
  esac
}

# Blockchain menu
blockchain_menu() {
  show_header
  echo -e "${CYAN}${BOLD}BLOCKCHAIN MENU${NC}"
  echo -e "1. ${CYAN}Start Local Blockchain${NC}"
  echo -e "2. ${CYAN}Deploy Contracts to Local Blockchain${NC}"
  echo -e "3. ${CYAN}Deploy to Avalanche Fuji Testnet${NC}"
  echo -e "4. ${CYAN}Run Blockchain Manager${NC}"
  echo -e "0. ${YELLOW}Back to Main Menu${NC}"
  echo
  echo -e "${YELLOW}Enter your choice:${NC}"
  
  read -r choice
  
  case $choice in
    1) start_local_blockchain; press_enter_to_continue ;;
    2) deploy_contracts; press_enter_to_continue ;;
    3) deploy_to_fuji; press_enter_to_continue ;;
    4) run_blockchain_manager ;;
    0) show_main_menu ;;
    *) echo -e "${RED}Invalid choice. Please try again.${NC}"; sleep 1; blockchain_menu ;;
  esac
}

# Function for automated full system setup
full_system_setup() {
  show_header
  echo -e "${CYAN}${BOLD}FULL SYSTEM SETUP${NC}"
  echo -e "${YELLOW}This will perform a complete setup of the TrueID backend system.${NC}"
  echo -e "${YELLOW}Do you want to continue? (y/n)${NC}"
  
  read -r proceed
  
  if [[ ! "$proceed" =~ ^[Yy]$ ]]; then
    show_main_menu
    return
  fi
  
  # Step 1: Check requirements
  echo -e "\n${CYAN}[1/7] Checking system requirements...${NC}"
  check_nodejs
  check_npm
  check_postgres
  
  # Step 2: Install dependencies
  echo -e "\n${CYAN}[2/7] Installing dependencies...${NC}"
  install_dependencies
  
  # Step 3: Setup environment file
  echo -e "\n${CYAN}[3/7] Setting up environment file...${NC}"
  setup_env_file
  
  # Step 4: Initialize database
  echo -e "\n${CYAN}[4/7] Initializing database...${NC}"
  init_database
  
  # Step 5: Start local blockchain
  echo -e "\n${CYAN}[5/7] Starting local blockchain...${NC}"
  start_local_blockchain
  
  # Step 6: Deploy contracts
  echo -e "\n${CYAN}[6/7] Deploying contracts to local blockchain...${NC}"
  deploy_contracts
  
  # Step 7: Start backend server
  echo -e "\n${CYAN}[7/7] Starting backend server...${NC}"
  start_backend_server
  
  echo -e "\n${GREEN}${BOLD}Full system setup completed!${NC}"
  echo -e "${GREEN}Local blockchain is running on port 8545${NC}"
  echo -e "${GREEN}Backend server is running on port ${PORT:-3000}${NC}"
  echo
  echo -e "${YELLOW}Would you like to deploy to Avalanche Fuji Testnet as well? (y/n)${NC}"
  
  read -r deploy_fuji
  
  if [[ "$deploy_fuji" =~ ^[Yy]$ ]]; then
    deploy_to_fuji
  fi
  
  press_enter_to_continue
}

# Utility function
press_enter_to_continue() {
  echo
  read -n 1 -s -r -p "Press Enter to continue..."
  echo
  show_main_menu
}

# Main function
main() {
  # Check if we're in the right directory
  if [ ! -f "server.js" ] || [ ! -f "package.json" ]; then
    echo -e "${RED}Error: This script must be run from the TrueID backend directory.${NC}"
    exit 1
  fi
  
  # Show the main menu
  show_main_menu
}

# Start the script
main 