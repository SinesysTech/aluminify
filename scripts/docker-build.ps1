# Aluminify Docker Build Script (PowerShell)
# This script builds the Docker image with proper tagging and versioning

# Configuration
$IMAGE_NAME = "sinesystec/aluminify"
$REGISTRY = $env:DOCKER_REGISTRY
$VERSION = if ($env:VERSION) { $env:VERSION } else { "latest" }
$PLATFORMS = if ($env:PLATFORMS) { $env:PLATFORMS } else { "linux/amd64,linux/arm64" }

Write-Host "=== Aluminify Docker Build ===" -ForegroundColor Green
Write-Host ""

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Docker is not installed" -ForegroundColor Red
    exit 1
}

# Check if .env.local exists
if (-not (Test-Path .env.local)) {
    Write-Host "Warning: .env.local not found. Make sure to configure environment variables before running." -ForegroundColor Yellow
    Write-Host "You can use .env.docker.example as a template." -ForegroundColor Yellow
}

# Build image
Write-Host "Building Docker image..." -ForegroundColor Green
Write-Host "Image name: $IMAGE_NAME"
Write-Host "Version: $VERSION"
Write-Host "Platforms: $PLATFORMS"
Write-Host ""

# Determine full image name
if ($REGISTRY) {
    $FULL_IMAGE_NAME = "${REGISTRY}/${IMAGE_NAME}:${VERSION}"
} else {
    $FULL_IMAGE_NAME = "${IMAGE_NAME}:${VERSION}"
}

# Build for multiple platforms if buildx is available
try {
    docker buildx version | Out-Null
    Write-Host "Using Docker Buildx for multi-platform build..." -ForegroundColor Green
    docker buildx build `
        --platform $PLATFORMS `
        -t $FULL_IMAGE_NAME `
        -t "${IMAGE_NAME}:latest" `
        --load `
        .
} catch {
    Write-Host "Docker Buildx not available. Building for current platform only..." -ForegroundColor Yellow
    docker build `
        --build-arg DOCKER_BUILD=true `
        -t $FULL_IMAGE_NAME `
        -t "${IMAGE_NAME}:latest" `
        .
}

Write-Host ""
Write-Host "✓ Build completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Image: $FULL_IMAGE_NAME"
Write-Host ""

# Ask if user wants to push to registry
if ($REGISTRY) {
    $response = Read-Host "Push to registry? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "Pushing to registry..." -ForegroundColor Green
        docker push $FULL_IMAGE_NAME
        Write-Host "✓ Push completed successfully!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "  - Run locally: .\scripts\docker-run.ps1"
Write-Host "  - Run with compose (dev): docker-compose up"
Write-Host "  - Run with compose (prod): docker-compose -f docker-compose.prod.yml up -d"
