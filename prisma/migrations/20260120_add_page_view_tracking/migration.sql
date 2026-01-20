-- Create PageView table for tracking restaurant page visits
-- Using IF NOT EXISTS for idempotency (safe to run multiple times)
CREATE TABLE IF NOT EXISTS "PageView" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "ip" TEXT,
    "country" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- Create indexes for efficient querying (IF NOT EXISTS for idempotency)
CREATE INDEX IF NOT EXISTS "PageView_restaurantId_idx" ON "PageView"("restaurantId");
CREATE INDEX IF NOT EXISTS "PageView_createdAt_idx" ON "PageView"("createdAt");
CREATE INDEX IF NOT EXISTS "PageView_restaurantId_createdAt_idx" ON "PageView"("restaurantId", "createdAt");
