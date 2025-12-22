# Quick Start - Docker Build Fix

## The Problem
Your command `$(date +%s)` doesn't work in Windows shells, so Docker is using cached layers with the old `restaurant` folder.

## The Solution

### Option 1: Use the deployment script (EASIEST)

**Windows PowerShell (Recommended):**
```powershell
.\deploy.ps1
```

**Windows Command Prompt:**
```cmd
deploy.bat
```

**Git Bash / WSL / Linux:**
```bash
chmod +x deploy.sh
./deploy.sh
```

These scripts do exactly what your command does, but with proper cache busting for your shell.

---

### Option 2: Fix your current command

**If using Windows PowerShell:**
```powershell
docker-compose down && git pull origin main && docker build --build-arg CACHEBUST=$(Get-Date -Format "yyyyMMddHHmmss") -t ghcr.io/newitdevelop/menufic:latest . && docker-compose up -d
```

**If using Windows Command Prompt:**
```cmd
docker-compose down && git pull origin main && docker build --build-arg CACHEBUST=%RANDOM% -t ghcr.io/newitdevelop/menufic:latest . && docker-compose up -d
```

**If using Git Bash / WSL / Linux:**
```bash
docker-compose down && git pull origin main && docker build --build-arg CACHEBUST=$(date +%s) -t ghcr.io/newitdevelop/menufic:latest . && docker-compose up -d
```

---

### Option 3: Guaranteed fix (slower, rebuilds everything)

```bash
docker-compose down && git pull origin main && docker build --no-cache -t ghcr.io/newitdevelop/menufic:latest . && docker-compose up -d
```

This works in any shell but takes longer because it rebuilds all layers including npm install.

---

## Why This Happened

- `$(date +%s)` is bash syntax that doesn't work in Windows Command Prompt or PowerShell
- Without the proper timestamp, Docker didn't invalidate its cache
- The cache still has the old `src/pages/restaurant/` folder from before the refactoring
- The source code is correct, but Docker is copying from a cached layer

## Files Created

- **[deploy.ps1](deploy.ps1)** - PowerShell deployment script
- **[deploy.bat](deploy.bat)** - CMD deployment script
- **[deploy.sh](deploy.sh)** - Bash deployment script
- **[BUILD_INSTRUCTIONS.txt](BUILD_INSTRUCTIONS.txt)** - Detailed reference
- **[DOCKER_BUILD.md](DOCKER_BUILD.md)** - Full documentation
