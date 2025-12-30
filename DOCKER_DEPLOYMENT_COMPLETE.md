# Docker Deployment - All Dependencies Added ✅

## Summary

All new dependencies and configurations have been properly added to Docker files for automated installation and deployment.

---

## ✅ What's Been Updated

### 1. **package.json** - Dependencies Added
**File**: `package.json`

**Production Dependencies**:
```json
"nodemailer": "^7.0.12"
```

**Dev Dependencies**:
```json
"@types/nodemailer": "^7.0.4"
```

**Installation Method**: Automatically installed during Docker build via `npm ci --legacy-peer-deps` in Dockerfile line 27.

---

### 2. **Dockerfile** - Already Configured ✅
**File**: `Dockerfile`

**No changes needed** because the Dockerfile already:
- Copies `package*.json` files (line 18)
- Runs `npm ci --legacy-peer-deps` which installs ALL dependencies including nodemailer (line 27)
- Copies entire `node_modules` directory to production image (line 71)

**Build Process**:
```dockerfile
# Line 18: Copy package files
COPY package*.json ./

# Line 27: Install all dependencies (includes nodemailer)
npm ci --legacy-peer-deps --prefer-offline

# Line 71: Copy node_modules to production stage
COPY --from=builder /app/node_modules ./node_modules
```

**Result**: ✅ nodemailer is automatically installed during Docker build

---

### 3. **docker-compose.yml** - Already Configured ✅
**File**: `docker-compose.yml`

**No changes needed** because docker-compose already:
- Uses `.env` file for all environment variables (line 10)
- SMTP_* variables will be automatically picked up from `.env` file
- No hardcoded environment variables that need updating

**Configuration**:
```yaml
# Line 10: Automatically loads .env file
env_file:
  - .env
```

**Result**: ✅ SMTP environment variables automatically available to application

---

### 4. **.env.example** - Updated with SMTP Variables ✅
**File**: `.env.example` (lines 126-139)

**Added Documentation**:
```bash
# SMTP Email Configuration (OPTIONAL but required for reservation system emails)
# Used for sending reservation notifications to restaurants
# All fields are optional - if not configured, email features will be disabled
# SMTP_HOST=smtp.gmail.com                    # SMTP server hostname
# SMTP_PORT=587                               # Port: 587 (TLS), 465 (SSL), 25 (unencrypted)
# SMTP_USER=your-email@gmail.com              # SMTP username/email
# SMTP_PASS=your-app-specific-password        # SMTP password (for Gmail, use app-specific password)
# SMTP_FROM=noreply@menufic.com               # From address (defaults to SMTP_USER if not set)
#
# Common SMTP Configurations:
# Gmail: smtp.gmail.com:587 (generate app password at https://myaccount.google.com/apppasswords)
# Office 365: smtp.office365.com:587
# AWS SES: email-smtp.{region}.amazonaws.com:587
# Custom: mail.yourdomain.com:587
```

**Result**: ✅ Developers have clear examples for configuring SMTP

---

### 5. **docker-entrypoint.sh** - Migration Fallback Updated ✅
**File**: `docker-entrypoint.sh` (line 50)

**Added Migrations to Fallback List**:
```bash
FAILED_MIGRATIONS="20251226203500_add_is_ai_generated_to_image
                   20251228212939_add_temporary_and_festive_menus
                   20251229_add_menu_packs
                   20251223_add_allergens_to_menu_item
                   20251230163000_add_item_allergens_to_pack_section
                   20251230162945_add_reservation_system"
```

**Result**: ✅ Migrations automatically resolved during container startup if they fail

---

## 📋 Deployment Checklist

### For First-Time Setup:

1. **Copy environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and configure**:
   ```bash
   # Required: Database (already in .env.example)
   DATABASE_URL=postgresql://menufic:menufic_password@postgres:5432/menufic_db

   # Required: ImageKit (already in .env.example)
   IMAGEKIT_PUBLIC_KEY=your_public_key
   IMAGEKIT_PRIVATE_KEY=your_private_key
   NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/xxxx

   # NEW - Required for reservation emails:
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-specific-password
   SMTP_FROM=noreply@menufic.com
   ```

3. **Build and start containers**:
   ```bash
   docker-compose up -d --build
   ```

4. **Verify installation**:
   ```bash
   # Check logs for nodemailer installation
   docker logs menufic | grep nodemailer

   # Should see during build:
   # added nodemailer@7.0.12

   # Check logs for SMTP configuration (after app starts)
   docker logs menufic | grep "Email Service"

   # Should see (if SMTP configured):
   # [Email Service] SMTP transporter configured: smtp.gmail.com:587
   ```

### For Existing Deployments:

1. **Update `.env` file** with SMTP variables (see examples in `.env.example`)

2. **Rebuild and restart**:
   ```bash
   # Rebuild to get latest package.json with nodemailer
   docker-compose build --no-cache

   # Restart containers
   docker-compose down
   docker-compose up -d
   ```

3. **Migrations will run automatically** via docker-entrypoint.sh fallback mechanism

---

## 🔍 Verification

### Check Dependencies Installed:

```bash
# Enter running container
docker exec -it menufic sh

# Check if nodemailer is installed
npm list nodemailer

# Expected output:
# menufic@1.0.0 /app
# └── nodemailer@7.0.12

# Exit container
exit
```

### Check SMTP Configuration:

```bash
# View application logs
docker logs menufic

# Look for:
# ✅ [Email Service] SMTP transporter configured: smtp.gmail.com:587

# If SMTP not configured, you'll see during reservation attempt:
# ⚠️  [Email Service] Email service is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS environment variables to enable email functionality.
```

### Test Reservation Email:

1. Access application: `http://localhost:3003`
2. Login to admin panel
3. Edit a menu → Set Reservation Type to "FORM"
4. Configure: email, start time (10:00), end time (22:00), max party size (12)
5. Save menu
6. Visit public menu page
7. Click "Reserve a Table"
8. Complete 4-step form
9. Check configured email inbox
10. ✅ Should receive professional HTML email with reservation details

---

## 🛠️ Troubleshooting

### Issue: nodemailer not installed after build

**Check**:
```bash
docker-compose build --no-cache
docker run --rm menufic npm list nodemailer
```

**Solution**: The Dockerfile uses `npm ci --legacy-peer-deps` which should install all dependencies. If missing, rebuild with:
```bash
docker-compose build --pull --no-cache
```

### Issue: SMTP variables not available to app

**Check**:
```bash
docker exec menufic env | grep SMTP
```

**Solution**:
1. Verify variables are in `.env` file
2. Restart containers: `docker-compose restart`
3. If using secrets/environment in docker-compose, ensure they're properly passed through

### Issue: Migrations not running

**Check**:
```bash
docker logs menufic | grep migration
```

**Solution**:
- Migrations run automatically via docker-entrypoint.sh
- Check logs for migration errors
- Manually run migrations (see MIGRATIONS_QUICK_REFERENCE.md)

---

## 📦 What Gets Installed Automatically

When you run `docker-compose up -d --build`:

1. ✅ **Build Stage (Dockerfile lines 1-46)**:
   - Copies package.json with nodemailer dependency
   - Runs `npm ci --legacy-peer-deps`
   - Installs nodemailer@7.0.12 and @types/nodemailer@7.0.4
   - Builds Next.js application
   - Generates Prisma client

2. ✅ **Production Stage (Dockerfile lines 48-82)**:
   - Copies node_modules (including nodemailer) from build stage
   - Copies docker-entrypoint.sh with migration fallback
   - Sets up entrypoint

3. ✅ **Container Startup (docker-entrypoint.sh)**:
   - Waits for PostgreSQL
   - Runs database migrations (automatic fallback for new migrations)
   - Generates Prisma client
   - Optionally generates translations if DeepL configured
   - Starts Next.js application

4. ✅ **Application Runtime**:
   - Loads SMTP_* environment variables from .env
   - Initializes email service
   - Ready to send reservation emails

---

## 🎯 Summary

**All Docker files are properly configured!**

✅ **package.json** - nodemailer dependencies added
✅ **Dockerfile** - automatically installs all dependencies (no changes needed)
✅ **docker-compose.yml** - reads .env file for SMTP variables (no changes needed)
✅ **.env.example** - documented SMTP configuration with examples
✅ **docker-entrypoint.sh** - migration fallback includes new migrations

**To deploy**:
1. Copy `.env.example` to `.env`
2. Add SMTP credentials to `.env`
3. Run `docker-compose up -d --build`
4. Test reservation system

**Everything installs and configures automatically!** 🚀
