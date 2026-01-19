# Aluminify Docker Run Script (PowerShell)
# This script runs the Docker container with proper configuration

# Configuration
$IMAGE_NAME = "sinesystec/aluminify"
$CONTAINER_NAME = "aluminify-app"
$PORT = if ($env:PORT) { $env:PORT } else { "3000" }
$ENV_FILE = if ($env:ENV_FILE) { $env:ENV_FILE } else { ".env.local" }

Write-Host "=== Aluminify Docker Run ===" -ForegroundColor Green
Write-Host ""

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Docker is not installed" -ForegroundColor Red
    exit 1
}

# Check if .env.local exists
if (-not (Test-Path $ENV_FILE)) {
    Write-Host "Error: $ENV_FILE not found" -ForegroundColor Red
    Write-Host "Please create $ENV_FILE with your environment variables." -ForegroundColor Yellow
    Write-Host "You can use .env.docker.example as a template." -ForegroundColor Yellow
    exit 1
}

# Stop and remove existing container if it exists
$existingContainer = docker ps -a --format "{{.Names}}" | Where-Object { $_ -eq $CONTAINER_NAME }
if ($existingContainer) {
    Write-Host "Stopping and removing existing container..." -ForegroundColor Yellow
    docker stop $CONTAINER_NAME 2>$null
    docker rm $CONTAINER_NAME 2>$null
}

# Run container
Write-Host "Starting container..." -ForegroundColor Green
Write-Host "Image: $IMAGE_NAME:latest"
Write-Host "Container: $CONTAINER_NAME"
Write-Host "Port: $PORT"
Write-Host "Environment: $ENV_FILE"
Write-Host ""

docker run -d `
    --name $CONTAINER_NAME `
    -p "${PORT}:3000" `
    --env-file $ENV_FILE `
    --restart unless-stopped `
    --health-cmd="node -e `"require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})`"" `
    --health-interval=30s `
    --health-timeout=10s `
    --health-start-period=40s `
    --health-retries=3 `
    "${IMAGE_NAME}:latest"

Write-Host ""
Write-Host "✓ Container started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Application URL: http://localhost:$PORT"
Write-Host ""
Write-Host "Useful commands:"
Write-Host "  - View logs: docker logs -f $CONTAINER_NAME"
Write-Host "  - Stop container: docker stop $CONTAINER_NAME"
Write-Host "  - Remove container: docker rm $CONTAINER_NAME"
Write-Host "  - Check health: docker inspect --format='{{.State.Health.Status}}' $CONTAINER_NAME"
Write-Host ""

# Wait a moment and show logs
Start-Sleep -Seconds 2
Write-Host "Container logs:" -ForegroundColor Green
docker logs $CONTAINER_NAME
