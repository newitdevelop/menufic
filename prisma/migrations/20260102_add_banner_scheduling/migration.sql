-- CreateEnum
CREATE TYPE "BannerScheduleType" AS ENUM ('ALWAYS', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'PERIOD');

-- AlterTable Image - Add banner scheduling fields
ALTER TABLE "Image" ADD COLUMN "expiryDate" TIMESTAMP(3);
ALTER TABLE "Image" ADD COLUMN "scheduleType" "BannerScheduleType" NOT NULL DEFAULT 'ALWAYS';
ALTER TABLE "Image" ADD COLUMN "dailyStartTime" TEXT;
ALTER TABLE "Image" ADD COLUMN "dailyEndTime" TEXT;
ALTER TABLE "Image" ADD COLUMN "weeklyDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
ALTER TABLE "Image" ADD COLUMN "monthlyDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
ALTER TABLE "Image" ADD COLUMN "yearlyStartDate" TEXT;
ALTER TABLE "Image" ADD COLUMN "yearlyEndDate" TEXT;
ALTER TABLE "Image" ADD COLUMN "periodStartDate" TIMESTAMP(3);
ALTER TABLE "Image" ADD COLUMN "periodEndDate" TIMESTAMP(3);

-- Create indexes for performance
CREATE INDEX "Image_expiryDate_idx" ON "Image"("expiryDate");
CREATE INDEX "Image_scheduleType_idx" ON "Image"("scheduleType");
