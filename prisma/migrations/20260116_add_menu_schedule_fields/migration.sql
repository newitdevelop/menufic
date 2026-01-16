-- Add schedule fields to Menu table (same as banner scheduling)
ALTER TABLE "Menu" ADD COLUMN "scheduleType" "BannerScheduleType" NOT NULL DEFAULT 'ALWAYS';
ALTER TABLE "Menu" ADD COLUMN "dailyStartTime" TEXT;
ALTER TABLE "Menu" ADD COLUMN "dailyEndTime" TEXT;
ALTER TABLE "Menu" ADD COLUMN "weeklyDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
ALTER TABLE "Menu" ADD COLUMN "monthlyDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
ALTER TABLE "Menu" ADD COLUMN "yearlyStartDate" TEXT;
ALTER TABLE "Menu" ADD COLUMN "yearlyEndDate" TEXT;
ALTER TABLE "Menu" ADD COLUMN "periodStartDate" TIMESTAMP(3);
ALTER TABLE "Menu" ADD COLUMN "periodEndDate" TIMESTAMP(3);
