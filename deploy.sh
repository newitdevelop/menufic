#!/bin/bash

# Full deployment script with git pull, build, and docker-compose
# This matches your current workflow but with proper cache busting

set -e  # Exit on error

# Enable Docker BuildKit for faster builds
export DOCKER_BUILDKIT=1

echo "Starting deployment process..."

# Step 1: Stop containers
echo ""
echo "[1/4] Stopping Docker containers..."
docker-compose down

# Step 2: Pull latest code
echo ""
echo "[2/4] Pulling latest code from git..."
git pull origin main

# Step 3: Build with cache busting
echo ""
echo "[3/4] Building Docker image with cache bust..."
CACHEBUST=$(date +%s)
echo "Using CACHEBUST value: $CACHEBUST"
echo "This will force a fresh copy of source files to fix the restaurant->venue folder issue"
docker build --build-arg CACHEBUST=$CACHEBUST -t ghcr.io/newitdevelop/menufic:latest .

# Step 4: Start containers
echo ""
echo "[4/4] Starting Docker containers..."
docker-compose up -d

echo ""
echo "Deployment completed successfully!"
echo "The application should now be running with the updated venue structure."
