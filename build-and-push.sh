#!/bin/bash

# Build and Push Script for Menufic Docker Image
# Usage: ./build-and-push.sh [version] [registry-url]
# Example: ./build-and-push.sh 1.0.0 myusername
# Example: ./build-and-push.sh 1.0.0 myregistry.azurecr.io

set -e  # Exit on error

# Configuration
IMAGE_NAME="menufic"
VERSION=${1:-latest}
REGISTRY_URL=${2:-""}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate inputs
if [ -z "$REGISTRY_URL" ]; then
    print_error "Registry URL is required!"
    echo ""
    echo "Usage: ./build-and-push.sh [version] [registry-url]"
    echo ""
    echo "Examples:"
    echo "  Docker Hub:           ./build-and-push.sh 1.0.0 yourusername"
    echo "  Azure ACR:            ./build-and-push.sh 1.0.0 yourregistry.azurecr.io"
    echo "  GitHub Container Reg: ./build-and-push.sh 1.0.0 ghcr.io/yourusername"
    echo ""
    exit 1
fi

print_info "Starting build and push process..."
print_info "Image: ${IMAGE_NAME}"
print_info "Version: ${VERSION}"
print_info "Registry: ${REGISTRY_URL}"

# Build the image
print_info "Building Docker image..."
docker build -t ${IMAGE_NAME}:${VERSION} .

if [ $? -eq 0 ]; then
    print_info "Build successful!"
else
    print_error "Build failed!"
    exit 1
fi

# Tag for registry
print_info "Tagging image for registry..."
docker tag ${IMAGE_NAME}:${VERSION} ${REGISTRY_URL}/${IMAGE_NAME}:${VERSION}

# Also tag as latest if version is not 'latest'
if [ "$VERSION" != "latest" ]; then
    print_info "Tagging as latest..."
    docker tag ${IMAGE_NAME}:${VERSION} ${REGISTRY_URL}/${IMAGE_NAME}:latest
fi

# Push to registry
print_info "Pushing ${REGISTRY_URL}/${IMAGE_NAME}:${VERSION} to registry..."
docker push ${REGISTRY_URL}/${IMAGE_NAME}:${VERSION}

if [ $? -eq 0 ]; then
    print_info "Push successful for version ${VERSION}!"
else
    print_error "Push failed for version ${VERSION}!"
    exit 1
fi

# Push latest tag if applicable
if [ "$VERSION" != "latest" ]; then
    print_info "Pushing ${REGISTRY_URL}/${IMAGE_NAME}:latest to registry..."
    docker push ${REGISTRY_URL}/${IMAGE_NAME}:latest

    if [ $? -eq 0 ]; then
        print_info "Push successful for latest tag!"
    else
        print_warning "Push failed for latest tag (non-critical)"
    fi
fi

# Summary
echo ""
print_info "=========================================="
print_info "Build and push completed successfully!"
print_info "=========================================="
print_info "Image: ${REGISTRY_URL}/${IMAGE_NAME}:${VERSION}"
if [ "$VERSION" != "latest" ]; then
    print_info "Also tagged as: ${REGISTRY_URL}/${IMAGE_NAME}:latest"
fi
echo ""
print_info "To pull this image:"
echo "  docker pull ${REGISTRY_URL}/${IMAGE_NAME}:${VERSION}"
echo ""
print_info "To update docker-compose.yml, set:"
echo "  image: ${REGISTRY_URL}/${IMAGE_NAME}:${VERSION}"
echo ""
