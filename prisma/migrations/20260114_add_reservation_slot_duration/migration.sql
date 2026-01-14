-- AlterTable Menu - Add reservation slot duration field
ALTER TABLE "Menu" ADD COLUMN "reservationSlotDuration" INTEGER DEFAULT 30;
