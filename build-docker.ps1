# Docker build script with automatic cache busting for Windows PowerShell
# This ensures the source files are copied fresh on each build

Write-Host "Building Docker image with cache bust..." -ForegroundColor Green
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
docker build --build-arg CACHEBUST=$timestamp -t menufic .

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBuild completed successfully!" -ForegroundColor Green
    Write-Host "To run the container: docker run -p 3000:3000 menufic" -ForegroundColor Cyan
} else {
    Write-Host "`nBuild failed. Check the error messages above." -ForegroundColor Red
}
