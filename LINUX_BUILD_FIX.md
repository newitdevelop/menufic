# Docker Build Fix for Linux

## The Problem
Even with `--build-arg CACHEBUST=$(date +%s)`, Docker was still using cached layers because the ARG wasn't being used in a RUN command to invalidate the cache.

## The Fix
The [Dockerfile](Dockerfile#L21) now includes:
```dockerfile
ARG CACHEBUST=1
RUN echo "Cache bust: $CACHEBUST"
COPY . .
```

The `RUN echo` command forces Docker to invalidate all subsequent layers when CACHEBUST changes.

## How to Build Now

### Option 1: Use the deployment script
```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Your current command (now it will work)
```bash
docker-compose down && git pull origin main && docker build --build-arg CACHEBUST=$(date +%s) -t ghcr.io/newitdevelop/menufic:latest . && docker-compose up -d
```

### Option 3: Guaranteed fresh build
```bash
docker-compose down && git pull origin main && docker build --no-cache -t ghcr.io/newitdevelop/menufic:latest . && docker-compose up -d
```

## What Changed in the Dockerfile

**Before:**
```dockerfile
ARG CACHEBUST=1
COPY . .
```

**After:**
```dockerfile
ARG CACHEBUST=1
RUN echo "Cache bust: $CACHEBUST"
COPY . .
```

The additional RUN command ensures that when you pass a different CACHEBUST value, Docker cannot use the cached layer and must execute the RUN command again, which invalidates all subsequent layers including `COPY . .`.

## Verification

When you run the build, you should see in the output:
```
Cache bust: 1734878400  (or whatever timestamp you passed)
```

This confirms the CACHEBUST value is being used and the cache is being invalidated.
