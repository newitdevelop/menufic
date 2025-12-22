@echo off
REM Full deployment script with git pull, build, and docker-compose
REM This matches your current workflow but with proper cache busting

echo Starting deployment process...

REM Step 1: Stop containers
echo.
echo [1/4] Stopping Docker containers...
docker-compose down

REM Step 2: Pull latest code
echo.
echo [2/4] Pulling latest code from git...
git pull origin main

REM Step 3: Build with cache busting
echo.
echo [3/4] Building Docker image with cache bust...
echo Using CACHEBUST value: %RANDOM%
docker build --build-arg CACHEBUST=%RANDOM% -t ghcr.io/newitdevelop/menufic:latest .

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Build failed!
    echo Try running with --no-cache:
    echo docker build --no-cache -t ghcr.io/newitdevelop/menufic:latest .
    exit /b 1
)

REM Step 4: Start containers
echo.
echo [4/4] Starting Docker containers...
docker-compose up -d

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Deployment completed successfully!
) else (
    echo.
    echo Docker compose failed to start!
)
