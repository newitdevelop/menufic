#!/bin/bash

# Database Setup Script for Menufic
# This script helps initialize the database for first-time setup

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Menufic Database Setup${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}No .env file found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}⚠ Please update the credentials in .env file before continuing${NC}"
    echo ""
    read -p "Press enter to continue after updating .env..."
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ docker-compose is not installed${NC}"
    echo "Please install docker-compose and try again"
    exit 1
fi

# Start PostgreSQL
echo -e "${GREEN}Starting PostgreSQL database...${NC}"
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Check if PostgreSQL is healthy
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U menufic &> /dev/null; then
        echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# Generate Prisma Client
echo -e "${GREEN}Generating Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"

# Run migrations
echo -e "${GREEN}Running database migrations...${NC}"
npx prisma migrate deploy
echo -e "${GREEN}✓ Migrations completed${NC}"

# Verify setup
echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Database setup completed!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo "Next steps:"
echo "1. Start the application: docker-compose up -d"
echo "2. View logs: docker-compose logs -f menufic"
echo "3. Open Prisma Studio to view data: npx prisma studio"
echo ""
echo -e "${GREEN}Database is ready to use!${NC}"
