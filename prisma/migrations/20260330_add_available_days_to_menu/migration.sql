-- Add availableDays column to Menu table
-- Stores which days of the week the menu is available (shown to guests)
-- 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
-- Idempotent: IF NOT EXISTS ensures this is safe to run multiple times
ALTER TABLE "Menu" ADD COLUMN IF NOT EXISTS "availableDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
