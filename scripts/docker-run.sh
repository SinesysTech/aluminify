#!/bin/bash

# Aluminify Docker Run Script
# This script runs the Docker container with proper configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="sinesystec/aluminify"
CONTAINER_NAME="aluminify-app"
PORT="${PORT:-3000}"
ENV_FILE="${ENV_FILE:-.env.local}"

echo -e "${GREEN}=== Aluminify Docker Run ===${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: $ENV_FILE not found${NC}"
    echo -e "${YELLOW}Please create $ENV_FILE with your environment variables.${NC}"
    echo -e "${YELLOW}You can use .env.docker.example as a template.${NC}"
    exit 1
fi

# Stop and remove existing container if it exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}Stopping and removing existing container...${NC}"
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
fi

# Run container
echo -e "${GREEN}Starting container...${NC}"
echo "Image: ${IMAGE_NAME}:latest"
echo "Container: ${CONTAINER_NAME}"
echo "Port: ${PORT}"
echo "Environment: ${ENV_FILE}"
echo ""

docker run -d \
    --name "$CONTAINER_NAME" \
    -p "${PORT}:3000" \
    --env-file "$ENV_FILE" \
    --restart unless-stopped \
    --health-cmd="node -e \"require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\"" \
    --health-interval=30s \
    --health-timeout=10s \
    --health-start-period=40s \
    --health-retries=3 \
    "${IMAGE_NAME}:latest"

echo ""
echo -e "${GREEN}✓ Container started successfully!${NC}"
echo ""
echo "Application URL: http://localhost:${PORT}"
echo ""
echo "Useful commands:"
echo "  - View logs: docker logs -f ${CONTAINER_NAME}"
echo "  - Stop container: docker stop ${CONTAINER_NAME}"
echo "  - Remove container: docker rm ${CONTAINER_NAME}"
echo "  - Check health: docker inspect --format='{{.State.Health.Status}}' ${CONTAINER_NAME}"
echo ""

# Wait a moment and show logs
sleep 2
echo -e "${GREEN}Container logs:${NC}"
docker logs "$CONTAINER_NAME"
