-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN "vatRate" INTEGER NOT NULL DEFAULT 23;
ALTER TABLE "MenuItem" ADD COLUMN "vatIncluded" BOOLEAN NOT NULL DEFAULT true;

-- Update existing menu items to have 23% VAT
UPDATE "MenuItem" SET "vatRate" = 23, "vatIncluded" = true WHERE "vatRate" IS NULL OR "vatIncluded" IS NULL;
