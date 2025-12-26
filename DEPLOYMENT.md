# Deployment Instructions

## 🚀 Deploy with New Features

### First Time Deployment (with security fixes):
Run this command to deploy with automatic security patches:

```bash
docker-compose down && git pull origin main && docker build --no-cache -t ghcr.io/newitdevelop/menufic:latest . && docker-compose up -d
```

### Subsequent Deployments (skip security fixes):
After the first build, you can skip the audit fix step for faster builds:

```bash
docker-compose down && git pull origin main && docker build --no-cache --build-arg SKIP_AUDIT_FIX=1 -t ghcr.io/newitdevelop/menufic:latest . && docker-compose up -d
```

The security audit fix:
- ✅ Only runs when safe patches are available
- ✅ Shows detailed output of what's being fixed
- ✅ Skips if no vulnerabilities or only breaking changes exist
- ✅ Can be disabled with `SKIP_AUDIT_FIX=1` build arg

## What This Does

1. **`docker-compose down`** - Stops and removes current containers
2. **`git pull origin main`** - Gets latest code from repository
3. **`docker build --no-cache`** - Builds fresh Docker image with:
   - New database fields (reservations, privacyPolicyUrl, termsAndConditionsUrl)
   - Database migration applied automatically on startup
   - Prisma client regenerated with new schema
   - Security vulnerabilities auto-fixed (15 safe patches)
   - Latest allergen feature
   - Fixed footer mobile layout
4. **`docker-compose up -d`** - Starts containers in background

## What Happens on First Startup

The `docker-entrypoint.sh` will automatically:
- Apply database migrations (adds new columns)
- Restore translation files from backup
- Generate translations if DeepL API key is configured
- Start the application

## New Features Deployed

### 1. Reservations Link
- Restaurants can add a reservations URL to each menu
- Displays between email and message with calendar icon
- Optional field - only shows when configured

### 2. Venue-Specific Footer URLs
- Each restaurant can configure custom Privacy Policy URL
- Each restaurant can configure custom Terms & Conditions URL
- Falls back to default environment URLs if not set
- Only shows if configured

### 3. Fixed Mobile Footer
- Footer links now display correctly on smartphones
- Vertical stack layout on mobile devices
- Proper spacing and alignment

### 4. Automatic Security Fixes
- 15 non-breaking security vulnerabilities fixed automatically
- No breaking changes applied
- Happens on every build

## Verifying Deployment

After deployment, check:

1. **Container is running**:
   ```bash
   docker ps | grep menufic
   ```

2. **Migrations applied**:
   ```bash
   docker logs menufic | grep "migration"
   ```

3. **Application accessible**:
   Open your browser to the application URL

## Troubleshooting

### If migration fails
```bash
docker exec menufic npx prisma migrate deploy
```

### If translations are missing
```bash
docker exec menufic npm run translate
```

### View logs
```bash
docker logs -f menufic
```

### Restart container
```bash
docker-compose restart
```

## Rolling Back

If you need to rollback:
```bash
docker-compose down
git checkout <previous-commit>
docker build --no-cache -t ghcr.io/newitdevelop/menufic:latest .
docker-compose up -d
```

Note: Database migrations are forward-only. Rolling back code doesn't roll back the database.
