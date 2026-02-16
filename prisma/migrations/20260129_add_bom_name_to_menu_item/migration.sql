-- AlterTable: Add bomId column to MenuItem (optional integer, for internal menu items)
-- First add the new bomId column
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "bomId" INTEGER;

-- If bomName existed (from earlier migration), migrate numeric values and drop it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'MenuItem' AND column_name = 'bomName') THEN
        UPDATE "MenuItem" SET "bomId" = CAST("bomName" AS INTEGER) WHERE "bomName" IS NOT NULL AND "bomName" ~ '^\d+$';
        ALTER TABLE "MenuItem" DROP COLUMN "bomName";
    END IF;
END $$;
