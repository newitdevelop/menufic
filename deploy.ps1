# Full deployment script with git pull, build, and docker-compose
# This matches your current workflow but with proper cache busting

Write-Host "Starting deployment process..." -ForegroundColor Green

# Step 1: Stop containers
Write-Host "`n[1/4] Stopping Docker containers..." -ForegroundColor Cyan
docker-compose down

# Step 2: Pull latest code
Write-Host "`n[2/4] Pulling latest code from git..." -ForegroundColor Cyan
git pull origin main

# Step 3: Build with cache busting
Write-Host "`n[3/4] Building Docker image with cache bust..." -ForegroundColor Cyan
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
Write-Host "Using CACHEBUST value: $timestamp" -ForegroundColor Yellow
docker build --build-arg CACHEBUST=$timestamp -t ghcr.io/newitdevelop/menufic:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nBuild failed!" -ForegroundColor Red
    Write-Host "Try running with --no-cache:" -ForegroundColor Yellow
    Write-Host "docker build --no-cache -t ghcr.io/newitdevelop/menufic:latest ." -ForegroundColor Yellow
    exit 1
}

# Step 4: Start containers
Write-Host "`n[4/4] Starting Docker containers..." -ForegroundColor Cyan
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDeployment completed successfully!" -ForegroundColor Green
} else {
    Write-Host "`nDocker compose failed to start!" -ForegroundColor Red
}
