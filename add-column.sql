-- Add isAiGenerated column to Image table
ALTER TABLE "Image" ADD COLUMN IF NOT EXISTS "isAiGenerated" BOOLEAN NOT NULL DEFAULT false;
