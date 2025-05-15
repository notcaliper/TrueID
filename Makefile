CC = gcc
CFLAGS = -Wall -Wextra -g
LDFLAGS = -lcurl -ljson-c

# Main Makefile for DBIS project

TARGET = dbis_api_client_c
SRC = dbis_api_client.c

.PHONY: all clean python-auth python-client c-client backend government-portal

all: python-auth python-client c-client backend government-portal

python-auth:
	cd python-auth && pip install -r requirements.txt

python-client:
	cd python-client && pip install requests tabulate

python-server:
	cd python-server && pip install -r requirements.txt

c-client:
	cd c-client && make

backend:
	cd backend && npm install

government-portal:
	cd government-portal && npm install

clean:
	cd c-client && make clean
	rm -rf python-auth/__pycache__ python-auth/src/__pycache__ python-auth/src/utils/__pycache__
	rm -rf python-client/__pycache__ python-server/__pycache__
	cd backend && npm run clean
	cd government-portal && npm run clean

.PHONY: all clean
