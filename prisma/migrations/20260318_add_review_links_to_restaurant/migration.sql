-- Add Google Place ID and TripAdvisor URL to Restaurant
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "googlePlaceId" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "tripadvisorUrl" TEXT;
