# Why Migrations Aren't Auto-Applying

## Root Cause

Your `docker-compose.yml` is configured to use a pre-built image:
```yaml
image: ghcr.io/newitdevelop/menufic:latest
```

When you run `docker-compose restart`, it uses the **existing cached image** which:
- Has the OLD docker-entrypoint.sh (without the new migrations in the fallback list)
- Doesn't include the new migration files we created
- Won't automatically apply the itemAllergens migration

## Solution: Rebuild the Docker Image

You need to rebuild the image to include:
1. Updated docker-entrypoint.sh with new migrations in fallback list
2. New migration SQL files
3. Updated package.json with nodemailer
4. Updated Prisma schema

### Step 1: Rebuild the Image

```bash
# Stop containers
docker-compose down

# Rebuild the image (this will take a few minutes)
docker-compose build --no-cache menufic

# Start containers
docker-compose up -d
```

### Step 2: Watch the Logs

```bash
# Follow the logs to see migration application
docker-compose logs -f menufic

# You should see:
# 🚀 Starting Menufic application...
# ⏳ Waiting for PostgreSQL to be ready...
# ✅ PostgreSQL is ready!
# 🔍 Checking database state...
# 🔄 Running database migrations...
# 🔧 Resolving migration: 20251230163000_add_item_allergens_to_pack_section
# ✅ Database schema matches - marking migration as applied
# ✅ All migrations deployed successfully
# 🎉 Starting Next.js application...
```

### Step 3: Verify Migration Applied

After the container starts, check if the migration worked:

```bash
# Connect to the database
docker exec -it menufic-db psql -U menufic -d menufic_db

# Run verification query
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'PackSection' AND column_name = 'itemAllergens';

# Should see:
#   column_name   | data_type
# ----------------+-----------
#  itemAllergens  | jsonb

# Exit psql
\q
```

### Step 4: Test Pack Creation

Now try creating a pack - the error should be gone!

---

## Alternative: Manual Migration (Faster)

If you don't want to rebuild (takes 5-10 minutes), manually apply the migration:

```bash
# Connect to database and run the migration
docker exec -it menufic-db psql -U menufic -d menufic_db

# Paste this SQL:
ALTER TABLE "PackSection" ADD COLUMN IF NOT EXISTS "itemAllergens" JSONB DEFAULT '{}';
UPDATE "PackSection" SET "itemAllergens" = '{}' WHERE "itemAllergens" IS NULL;

# Exit
\q

# Restart the app
docker-compose restart menufic
```

This is faster but won't include other updates (nodemailer, reservation system migrations, etc.).

---

## Why This Happened

The docker-entrypoint.sh fallback mechanism works, but only if:
1. The container is built with the updated script
2. The migration files exist in the image
3. Prisma schema matches

Since you were using a pre-built image and just restarting, the container was running the old version without the updates.

---

## Recommended Approach

**For immediate fix**: Use the manual migration (30 seconds)

**For complete solution**: Rebuild the image (includes all updates: nodemailer, reservation system, allergen fixes)

After manual migration, you can rebuild at your convenience to get all the new features.
