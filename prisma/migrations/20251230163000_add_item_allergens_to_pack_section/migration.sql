-- AlterTable PackSection - Add itemAllergens field
ALTER TABLE "PackSection" ADD COLUMN IF NOT EXISTS "itemAllergens" JSONB DEFAULT '{}';

-- Update existing records to have default empty object
UPDATE "PackSection" SET "itemAllergens" = '{}' WHERE "itemAllergens" IS NULL;
