#!/bin/bash

# Aluminify Docker Build Script
# This script builds the Docker image with proper tagging and versioning

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="sinesystec/aluminify"
REGISTRY="${DOCKER_REGISTRY:-}"
VERSION="${VERSION:-latest}"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"

echo -e "${GREEN}=== Aluminify Docker Build ===${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}Warning: .env.local not found. Make sure to configure environment variables before running.${NC}"
    echo -e "${YELLOW}You can use .env.docker.example as a template.${NC}"
fi

# Build image
echo -e "${GREEN}Building Docker image...${NC}"
echo "Image name: ${IMAGE_NAME}"
echo "Version: ${VERSION}"
echo "Platforms: ${PLATFORMS}"
echo ""

# Determine full image name
if [ -n "$REGISTRY" ]; then
    FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${VERSION}"
else
    FULL_IMAGE_NAME="${IMAGE_NAME}:${VERSION}"
fi

# Build for multiple platforms if buildx is available
if docker buildx version &> /dev/null; then
    echo -e "${GREEN}Using Docker Buildx for multi-platform build...${NC}"
    docker buildx build \
        --platform "${PLATFORMS}" \
        -t "${FULL_IMAGE_NAME}" \
        -t "${IMAGE_NAME}:latest" \
        --load \
        .
else
    echo -e "${YELLOW}Docker Buildx not available. Building for current platform only...${NC}"
    docker build \
        --build-arg DOCKER_BUILD=true \
        -t "${FULL_IMAGE_NAME}" \
        -t "${IMAGE_NAME}:latest" \
        .
fi

echo ""
echo -e "${GREEN}✓ Build completed successfully!${NC}"
echo ""
echo "Image: ${FULL_IMAGE_NAME}"
echo ""

# Ask if user wants to push to registry
if [ -n "$REGISTRY" ]; then
    read -p "Push to registry? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Pushing to registry...${NC}"
        docker push "${FULL_IMAGE_NAME}"
        echo -e "${GREEN}✓ Push completed successfully!${NC}"
    fi
fi

echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "  - Run locally: ./scripts/docker-run.sh"
echo "  - Run with compose (dev): docker-compose up"
echo "  - Run with compose (prod): docker-compose -f docker-compose.prod.yml up -d"
