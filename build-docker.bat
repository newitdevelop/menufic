@echo off
REM Docker build script with automatic cache busting for Windows
REM This ensures the source files are copied fresh on each build

echo Building Docker image with cache bust...
docker build --build-arg CACHEBUST=%date%-%time% -t menufic .
