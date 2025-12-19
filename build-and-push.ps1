# Build and Push Script for Menufic Docker Image (PowerShell)
# Usage: .\build-and-push.ps1 -Version "1.0.0" -Registry "myusername"
# Example: .\build-and-push.ps1 -Version "1.0.0" -Registry "myusername"
# Example: .\build-and-push.ps1 -Version "1.0.0" -Registry "myregistry.azurecr.io"

param(
    [Parameter(Mandatory=$false)]
    [string]$Version = "latest",

    [Parameter(Mandatory=$true)]
    [string]$Registry
)

# Configuration
$ImageName = "menufic"
$ErrorActionPreference = "Stop"

# Functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Start
Write-Info "Starting build and push process..."
Write-Info "Image: $ImageName"
Write-Info "Version: $Version"
Write-Info "Registry: $Registry"

# Build the image
Write-Info "Building Docker image..."
try {
    docker build -t "${ImageName}:${Version}" .
    Write-Info "Build successful!"
}
catch {
    Write-Error "Build failed!"
    exit 1
}

# Tag for registry
Write-Info "Tagging image for registry..."
docker tag "${ImageName}:${Version}" "${Registry}/${ImageName}:${Version}"

# Also tag as latest if version is not 'latest'
if ($Version -ne "latest") {
    Write-Info "Tagging as latest..."
    docker tag "${ImageName}:${Version}" "${Registry}/${ImageName}:latest"
}

# Push to registry
Write-Info "Pushing ${Registry}/${ImageName}:${Version} to registry..."
try {
    docker push "${Registry}/${ImageName}:${Version}"
    Write-Info "Push successful for version $Version!"
}
catch {
    Write-Error "Push failed for version $Version!"
    exit 1
}

# Push latest tag if applicable
if ($Version -ne "latest") {
    Write-Info "Pushing ${Registry}/${ImageName}:latest to registry..."
    try {
        docker push "${Registry}/${ImageName}:latest"
        Write-Info "Push successful for latest tag!"
    }
    catch {
        Write-Warning "Push failed for latest tag (non-critical)"
    }
}

# Summary
Write-Host ""
Write-Info "=========================================="
Write-Info "Build and push completed successfully!"
Write-Info "=========================================="
Write-Info "Image: ${Registry}/${ImageName}:${Version}"
if ($Version -ne "latest") {
    Write-Info "Also tagged as: ${Registry}/${ImageName}:latest"
}
Write-Host ""
Write-Info "To pull this image:"
Write-Host "  docker pull ${Registry}/${ImageName}:${Version}"
Write-Host ""
Write-Info "To update docker-compose.yml, set:"
Write-Host "  image: ${Registry}/${ImageName}:${Version}"
Write-Host ""
