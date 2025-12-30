# Fix Pack Creation Error - Quick Guide

## Problem

You're seeing this error when creating packs:
```
Unknown arg `itemAllergens` in data.itemAllergens for type PackSectionUncheckedCreateInput
```

## Cause

The database migration that adds the `itemAllergens` field to the `PackSection` table hasn't been applied to your production database yet.

## Solution (Choose ONE method)

### Method 1: Single SQL File (Easiest)

Run the combined migration file that includes all three migrations:

```bash
# If using psql command line
psql -h <your-host> -U <your-user> -d <your-database> -f apply-critical-migrations.sql

# If using Docker PostgreSQL
docker exec -i <postgres-container> psql -U <user> -d <database> < apply-critical-migrations.sql

# Example for menufic-db container:
docker exec -i menufic-db psql -U menufic -d menufic_db < apply-critical-migrations.sql
```

### Method 2: Docker Compose (Automatic)

If you're using Docker Compose, restart your containers and the migrations will apply automatically via the docker-entrypoint.sh fallback mechanism:

```bash
docker-compose restart
docker-compose logs -f menufic
```

Look for these log messages:
```
🔧 Resolving migration: 20251230163000_add_item_allergens_to_pack_section
✅ Database schema matches - marking migration as applied
```

### Method 3: Individual Migration Files

Run just the critical migration that fixes pack creation:

```bash
# Using psql
psql -h <host> -U <user> -d <database> -f prisma/migrations/20251230163000_add_item_allergens_to_pack_section/migration.sql

# Using Docker
docker exec -i menufic-db psql -U menufic -d menufic_db < prisma/migrations/20251230163000_add_item_allergens_to_pack_section/migration.sql
```

### Method 4: GUI Tool (pgAdmin, DBeaver, etc.)

1. Connect to your PostgreSQL database
2. Open a SQL query window
3. Copy and paste the contents of `apply-critical-migrations.sql`
4. Execute the query

## Verification

After running the migration, verify it was applied:

```sql
-- Check if itemAllergens column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'PackSection' AND column_name = 'itemAllergens';
```

Expected output:
```
  column_name   | data_type
----------------+-----------
 itemAllergens  | jsonb
```

## Test

After applying the migration:

1. Restart your application (if not using Docker)
   ```bash
   # If using Docker
   docker-compose restart menufic

   # If using systemd/pm2/etc
   systemctl restart menufic
   # OR
   pm2 restart menufic
   ```

2. Try creating a pack again
3. The error should be gone ✅

## Troubleshooting

### Still getting the error after migration

1. **Verify migration was applied**:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'PackSection';
   ```

   You should see `itemAllergens` in the list.

2. **Restart the application** to reload the Prisma client:
   ```bash
   docker-compose restart menufic
   ```

3. **Regenerate Prisma client** (if running locally):
   ```bash
   npx prisma generate
   ```

### Migration fails with "column already exists"

This is safe to ignore - it means the column is already there. The migration uses `IF NOT EXISTS` to prevent errors.

### Can't connect to database

Check your database connection string in `.env`:
```bash
DATABASE_URL=postgresql://menufic:menufic_password@postgres:5432/menufic_db
```

For Docker, use the container name (`postgres`) instead of `localhost`.

## What This Migration Does

The migration adds a new field to the PackSection table:
- **Field**: `itemAllergens`
- **Type**: JSONB (JSON object)
- **Default**: `{}` (empty object)
- **Purpose**: Stores allergen information for each item in a pack section

This field was added in the code but was missing from the database schema, causing the pack creation error.

## Additional Migrations Included

The `apply-critical-migrations.sql` file also includes:

1. **Allergens for Menu Items** - Adds allergen tracking to individual menu items
2. **Reservation System** - Adds the new reservation system fields to Menu table

All three migrations are safe to run even if some were already applied (they use `IF NOT EXISTS` where possible).
