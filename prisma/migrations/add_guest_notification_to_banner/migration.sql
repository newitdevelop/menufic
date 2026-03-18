-- Add guest notification fields to Image (banner)
ALTER TABLE "Image" ADD COLUMN IF NOT EXISTS "notifyGuests" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Image" ADD COLUMN IF NOT EXISTS "guestMessage" TEXT;
