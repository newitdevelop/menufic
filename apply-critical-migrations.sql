-- ============================================================
-- CRITICAL MIGRATIONS - Run these to fix pack creation error
-- ============================================================
-- This file combines all three critical migrations in the correct order
-- Run this file on your production PostgreSQL database to fix the issues

-- ============================================================
-- Migration 1: Add Allergens to Menu Items
-- File: 20251223_add_allergens_to_menu_item/migration.sql
-- ============================================================
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "isEdible" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "allergens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Update existing menu items to have default values
UPDATE "MenuItem" SET "isEdible" = false, "allergens" = ARRAY[]::TEXT[] WHERE "isEdible" IS NULL OR "allergens" IS NULL;

-- ============================================================
-- Migration 2: Add Item Allergens to Pack Section (FIXES PACK CREATION)
-- File: 20251230163000_add_item_allergens_to_pack_section/migration.sql
-- ============================================================
ALTER TABLE "PackSection" ADD COLUMN IF NOT EXISTS "itemAllergens" JSONB DEFAULT '{}';

-- Update existing records to have default empty object
UPDATE "PackSection" SET "itemAllergens" = '{}' WHERE "itemAllergens" IS NULL;

-- ============================================================
-- Migration 3: Add Reservation System
-- File: 20251230162945_add_reservation_system/migration.sql
-- ============================================================

-- Create enum only if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "ReservationType" AS ENUM ('NONE', 'EXTERNAL', 'FORM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add reservation fields to Menu table
ALTER TABLE "Menu" ADD COLUMN IF NOT EXISTS "reservationType" "ReservationType" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Menu" ADD COLUMN IF NOT EXISTS "reservationUrl" TEXT;
ALTER TABLE "Menu" ADD COLUMN IF NOT EXISTS "reservationEmail" TEXT;
ALTER TABLE "Menu" ADD COLUMN IF NOT EXISTS "reservationStartTime" TEXT;
ALTER TABLE "Menu" ADD COLUMN IF NOT EXISTS "reservationEndTime" TEXT;
ALTER TABLE "Menu" ADD COLUMN IF NOT EXISTS "reservationMaxPartySize" INTEGER;

-- Create index for reservation queries (optional but recommended)
CREATE INDEX IF NOT EXISTS "Menu_reservationType_idx" ON "Menu"("reservationType");

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- Uncomment these to verify the migrations were applied successfully

-- SELECT 'MenuItem allergen fields:' as check;
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'MenuItem' AND column_name IN ('isEdible', 'allergens');

-- SELECT 'PackSection itemAllergens field:' as check;
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'PackSection' AND column_name = 'itemAllergens';

-- SELECT 'Menu reservation fields:' as check;
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'Menu' AND column_name LIKE 'reservation%';

-- SELECT 'ReservationType enum values:' as check;
-- SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
-- WHERE t.typname = 'ReservationType';
