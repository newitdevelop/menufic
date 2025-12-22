# Docker Build Instructions

## IMPORTANT: How to Build

You **MUST** use one of these methods to avoid Docker cache issues:

### Method 1: Use the provided build script (EASIEST)

**Windows:**
```bash
build-docker.bat
```

**Linux/Mac:**
```bash
chmod +x build-docker.sh
./build-docker.sh
```

### Method 2: Manual build with cache-busting argument
```bash
docker build --build-arg CACHEBUST=$(date +%s) -t menufic .
```

### Method 3: Complete cache bypass (slower but guaranteed fresh)
```bash
docker build --no-cache -t menufic .
```

## ❌ DO NOT USE
```bash
docker build -t menufic .
```
This will use cached layers and fail with "restaurant folder not found" error.

## Understanding the Cache Issue

Docker caches each layer in the Dockerfile. When you run `COPY . .`, Docker checks if the source directory has changed. However, sometimes Docker's cache detection can be unreliable, especially after major refactoring like renaming folders from `restaurant` to `venue`.

The Dockerfile now includes:
1. **Build argument for cache busting** - `ARG CACHEBUST=1` before `COPY . .` ensures fresh copy when the argument changes
2. **Build artifact cleanup** - `RUN rm -rf .next` removes Next.js cache
3. **Structure verification** - Checks that `src/pages/venue` exists before building

## Running the Container

After building, run with:
```bash
docker run -p 3000:3000 menufic
```

Or use docker-compose if you have it configured:
```bash
docker-compose up
```

## Troubleshooting

**Problem:** Build fails with error about `src/pages/restaurant/[restaurantId].tsx`

**Solution:** This means Docker is using cached layers from before the venue refactoring. Use Option 1 or Option 2 above to force a fresh copy of source files.

**Problem:** Build is very slow

**Solution:** Option 2 (`--no-cache`) rebuilds everything including npm install. Use Option 1 instead - it only invalidates the source copy cache while keeping npm packages cached.
