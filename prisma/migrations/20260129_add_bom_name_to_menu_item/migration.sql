-- AlterTable: Add bomName column to MenuItem (optional, for internal menu items)
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "bomName" TEXT;
