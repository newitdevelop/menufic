-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN "isEdible" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MenuItem" ADD COLUMN "allergens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Update existing menu items to have default values
UPDATE "MenuItem" SET "isEdible" = false, "allergens" = ARRAY[]::TEXT[] WHERE "isEdible" IS NULL OR "allergens" IS NULL;
