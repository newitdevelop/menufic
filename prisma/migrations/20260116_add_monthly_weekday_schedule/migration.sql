-- Add monthly weekday scheduling fields to Image table (for banners)
-- These fields allow scheduling like "every first Monday of the month"
ALTER TABLE "Image" ADD COLUMN "monthlyWeekday" INTEGER;
ALTER TABLE "Image" ADD COLUMN "monthlyWeekdayOrdinal" INTEGER;

-- Add monthly weekday scheduling fields to Menu table
-- Same fields for menu scheduling
ALTER TABLE "Menu" ADD COLUMN "monthlyWeekday" INTEGER;
ALTER TABLE "Menu" ADD COLUMN "monthlyWeekdayOrdinal" INTEGER;
