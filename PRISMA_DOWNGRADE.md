# Prisma Downgrade - Version 4.16.2

## Changes Made

To fix the persistent `The "path" argument must be of type string. Received undefined` error during Docker builds, both Prisma packages have been downgraded from version 5.1.1 to 4.16.2.

### Modified Files

1. **[package.json](package.json)**
   - `@prisma/client`: `^5.1.1` → `^4.16.2` (dependencies)
   - `prisma`: `^5.1.1` → `^4.16.2` (devDependencies)

## Why This Fix

The error was occurring during `npx prisma generate` step in the Docker build. Prisma 5.x introduced changes to how it handles:
- Custom output paths in schema.prisma
- Environment variable resolution
- Path handling in containerized environments

Version 4.16.2 is the last stable release from the 4.x series and matches the original working version of the codebase before the version bump.

## Testing Instructions

### 1. Clean Build Test

```bash
# Remove old containers and images
docker compose down
docker rmi menufic:latest

# Build with no cache
docker compose build --no-cache

# Expected output should show:
# ✓ Prisma generate completes successfully
# ✓ npm run build completes
# ✓ Image builds successfully
```

### 2. Full Stack Test

```bash
# Start all services
docker compose up -d

# Check logs for successful initialization
docker compose logs -f menufic

# Expected output:
# 🚀 Starting Menufic application...
# ⏳ Waiting for PostgreSQL to be ready...
# ✅ PostgreSQL is ready!
# 🔍 Checking database state...
# 📦 Database is empty - initializing schema...
# ✅ Database schema created successfully!
# 🔧 Generating Prisma Client...
# ✅ Initialization complete!
# 🎉 Starting Next.js application...
```

### 3. Verify Application

```bash
# Application should be accessible at
http://localhost:3003

# Test login page shows only configured providers:
# ✓ Azure AD button (if AZURE_AD_* env vars configured)
# ✓ Google button (if GOOGLE_* env vars configured)
# ✓ GitHub button (if GITHUB_* env vars configured)
```

## Rollback Plan

If version 4.16.2 still causes issues, there are two options:

### Option A: Use Original Version 4.13.0

The original package.json showed `@prisma/client: ^4.13.0`. To revert:

```bash
npm install @prisma/client@4.13.0 prisma@4.13.0
```

Update package.json:
```json
{
  "dependencies": {
    "@prisma/client": "^4.13.0"
  },
  "devDependencies": {
    "prisma": "^4.13.0"
  }
}
```

### Option B: Remove Custom Output Path

Edit [prisma/schema.prisma](prisma/schema.prisma:4-7):

```prisma
generator client {
    provider = "prisma-client-js"
    // Remove this line if it causes issues:
    // output = "../node_modules/.prisma/client"
}
```

However, this may require changes to import statements throughout the codebase.

## Verification Checklist

- [ ] Docker image builds without Prisma errors
- [ ] Database initializes automatically on first run
- [ ] Application starts on port 3003
- [ ] Login page shows only configured auth providers
- [ ] Can create and view restaurants
- [ ] No version mismatch warnings in logs

## Related Issues Fixed

This downgrade also resolves:
- ✅ Prisma version mismatch warning
- ✅ "path must be of type string" error
- ✅ Build failures during npm install phase

## Next Steps After Successful Build

1. Test Azure AD authentication flow
2. Test optional provider configuration (disable Google/GitHub)
3. Verify database persistence across container restarts
4. Test complete CRUD operations for restaurants/menus
