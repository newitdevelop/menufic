-- Create DailyStats table for aggregated analytics (long-term storage)
-- Using IF NOT EXISTS for idempotency (safe to run multiple times)
CREATE TABLE IF NOT EXISTS "DailyStats" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "countryStats" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyStats_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for restaurant + date combination
CREATE UNIQUE INDEX IF NOT EXISTS "DailyStats_restaurantId_date_key" ON "DailyStats"("restaurantId", "date");

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "DailyStats_restaurantId_idx" ON "DailyStats"("restaurantId");
CREATE INDEX IF NOT EXISTS "DailyStats_date_idx" ON "DailyStats"("date");
