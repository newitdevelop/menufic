# Database Migrations - Quick Reference

## Required Migrations (Run in Order)

These three migrations must be run on your production PostgreSQL database to enable:
1. ✅ Menu item allergens tracking
2. ✅ Pack section allergens (fixes pack creation error)
3. ✅ Advanced reservation system

### Migration 1: Add Allergens to Menu Items
**File**: `prisma/migrations/20251223_add_allergens_to_menu_item/migration.sql`
**Purpose**: Adds allergen tracking to menu items

```bash
# Run this migration first
psql -h <host> -U <user> -d <database> -f prisma/migrations/20251223_add_allergens_to_menu_item/migration.sql
```

### Migration 2: Add Item Allergens to Pack Section
**File**: `prisma/migrations/20251230163000_add_item_allergens_to_pack_section/migration.sql`
**Purpose**: Fixes "Unknown arg `itemAllergens`" error when creating packs

```bash
# Run this migration second
psql -h <host> -U <user> -d <database> -f prisma/migrations/20251230163000_add_item_allergens_to_pack_section/migration.sql
```

### Migration 3: Add Reservation System
**File**: `prisma/migrations/20251230162945_add_reservation_system/migration.sql`
**Purpose**: Enables advanced reservation system with forms

```bash
# Run this migration third
psql -h <host> -U <user> -d <database> -f prisma/migrations/20251230162945_add_reservation_system/migration.sql
```

## One-Command Migration (All Three)

```bash
# Connect to database and run all migrations in sequence
psql -h <host> -U <user> -d <database> << 'EOF'
\i prisma/migrations/20251223_add_allergens_to_menu_item/migration.sql
\i prisma/migrations/20251230163000_add_item_allergens_to_pack_section/migration.sql
\i prisma/migrations/20251230162945_add_reservation_system/migration.sql
EOF
```

## Docker PostgreSQL

If PostgreSQL is running in Docker:

```bash
# Method 1: Direct execution (recommended)
docker exec -i <postgres-container> psql -U <user> -d <database> < prisma/migrations/20251223_add_allergens_to_menu_item/migration.sql
docker exec -i <postgres-container> psql -U <user> -d <database> < prisma/migrations/20251230163000_add_item_allergens_to_pack_section/migration.sql
docker exec -i <postgres-container> psql -U <user> -d <database> < prisma/migrations/20251230162945_add_reservation_system/migration.sql

# Method 2: Interactive shell
docker exec -it <postgres-container> psql -U <user> -d <database>
# Then paste each migration file's SQL content
```

## Verify Migrations Were Applied

```sql
-- Check MenuItem has allergen fields
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'MenuItem'
AND column_name IN ('isEdible', 'allergens');

-- Check PackSection has itemAllergens field
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'PackSection'
AND column_name = 'itemAllergens';

-- Check Menu has reservation fields
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Menu'
AND column_name LIKE 'reservation%';

-- Check ReservationType enum exists
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'ReservationType';
```

Expected output:
```
-- MenuItem fields
isEdible   | boolean
allergens  | ARRAY

-- PackSection field
itemAllergens | jsonb

-- Menu fields
reservationType        | USER-DEFINED
reservationUrl         | text
reservationEmail       | text
reservationStartTime   | text
reservationEndTime     | text
reservationMaxPartySize| integer

-- ReservationType enum values
NONE
EXTERNAL
FORM
```

## Rollback (If Needed)

```sql
-- Rollback Migration 3 (Reservation System)
DROP INDEX IF EXISTS "Menu_reservationType_idx";
ALTER TABLE "Menu" DROP COLUMN IF EXISTS "reservationMaxPartySize";
ALTER TABLE "Menu" DROP COLUMN IF EXISTS "reservationEndTime";
ALTER TABLE "Menu" DROP COLUMN IF EXISTS "reservationStartTime";
ALTER TABLE "Menu" DROP COLUMN IF EXISTS "reservationEmail";
ALTER TABLE "Menu" DROP COLUMN IF EXISTS "reservationUrl";
ALTER TABLE "Menu" DROP COLUMN IF EXISTS "reservationType";
DROP TYPE IF EXISTS "ReservationType";

-- Rollback Migration 2 (Pack Allergens)
ALTER TABLE "PackSection" DROP COLUMN IF EXISTS "itemAllergens";

-- Rollback Migration 1 (MenuItem Allergens)
ALTER TABLE "MenuItem" DROP COLUMN IF EXISTS "allergens";
ALTER TABLE "MenuItem" DROP COLUMN IF EXISTS "isEdible";
```

## After Migration Checklist

- [ ] All three migrations executed successfully
- [ ] Verification queries return expected columns
- [ ] Application restarted (to pick up schema changes)
- [ ] SMTP environment variables configured (see DEPLOYMENT_INSTRUCTIONS.md)
- [ ] Test pack creation - should work without errors
- [ ] Test reservation form - should send emails to configured address

## Troubleshooting

### "relation already exists" or "column already exists"
This is safe to ignore - means migration was already applied. The migrations use `IF NOT EXISTS` where possible.

### "type already exists"
The ReservationType enum already exists. Safe to ignore or remove the CREATE TYPE line from migration.

### Still getting "Unknown arg `itemAllergens`" error
1. Verify migration 2 ran successfully
2. Check if `itemAllergens` column exists (see verification query above)
3. Restart application to reload Prisma schema
4. Check Prisma client is regenerated: `npx prisma generate`

### Email not sending
See DEPLOYMENT_INSTRUCTIONS.md for SMTP configuration requirements.
