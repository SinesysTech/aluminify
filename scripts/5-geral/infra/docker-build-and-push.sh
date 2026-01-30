#!/bin/bash

# Aluminify Docker Build and Push Script
# This script builds the Docker image and pushes it to Docker Hub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="sinesystec/aluminify"
VERSION="${VERSION:-latest}"

echo -e "${GREEN}=== Aluminify Docker Build and Push ===${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}Error: .env.local not found${NC}"
    echo -e "${YELLOW}Please create .env.local with your environment variables.${NC}"
    echo -e "${YELLOW}You can use .env.docker.example as a template.${NC}"
    exit 1
fi

# Login to Docker Hub
echo -e "${GREEN}Logging in to Docker Hub...${NC}"
docker login

echo ""
echo -e "${GREEN}Building Docker image...${NC}"
echo "Image name: ${IMAGE_NAME}"
echo "Version: ${VERSION}"
echo ""

# Load environment variables from .env.local
BUILD_ARGS=""
if [ -f .env.local ]; then
    echo -e "${GREEN}Loading environment variables from .env.local...${NC}"
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ $key =~ ^#.*$ ]] && continue
        [[ -z $key ]] && continue
        # Only pass NEXT_PUBLIC_* and UPSTASH_* variables
        if [[ $key =~ ^NEXT_PUBLIC_ ]] || [[ $key =~ ^UPSTASH_ ]]; then
            BUILD_ARGS="$BUILD_ARGS --build-arg $key=$value"
            echo "  ✓ Loaded: $key"
        fi
    done < .env.local
fi

echo ""
echo -e "${GREEN}Building image with loaded environment variables...${NC}"

# Build image
docker build \
    $BUILD_ARGS \
    -t "${IMAGE_NAME}:${VERSION}" \
    -t "${IMAGE_NAME}:latest" \
    .

echo ""
echo -e "${GREEN}✓ Build completed successfully!${NC}"
echo ""

# Push image
echo -e "${GREEN}Pushing to Docker Hub...${NC}"
docker push "${IMAGE_NAME}:${VERSION}"
docker push "${IMAGE_NAME}:latest"

echo ""
echo -e "${GREEN}✓ Push completed successfully!${NC}"
echo ""
echo -e "${GREEN}Images pushed:${NC}"
echo "  - ${IMAGE_NAME}:${VERSION}"
echo "  - ${IMAGE_NAME}:latest"
echo ""
echo -e "${GREEN}Next steps on your server:${NC}"
echo "  docker pull ${IMAGE_NAME}:latest"
echo "  docker-compose -f docker-compose.prod.yml up -d --force-recreate"
