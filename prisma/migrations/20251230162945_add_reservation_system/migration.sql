-- CreateEnum
CREATE TYPE "ReservationType" AS ENUM ('NONE', 'EXTERNAL', 'FORM');

-- AlterTable Menu - Add new reservation system fields
ALTER TABLE "Menu" ADD COLUMN "reservationType" "ReservationType" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Menu" ADD COLUMN "reservationUrl" TEXT;
ALTER TABLE "Menu" ADD COLUMN "reservationEmail" TEXT;
ALTER TABLE "Menu" ADD COLUMN "reservationStartTime" TEXT;
ALTER TABLE "Menu" ADD COLUMN "reservationEndTime" TEXT;
ALTER TABLE "Menu" ADD COLUMN "reservationMaxPartySize" INTEGER;

-- Create index for reservation queries (optional but recommended)
CREATE INDEX "Menu_reservationType_idx" ON "Menu"("reservationType");
