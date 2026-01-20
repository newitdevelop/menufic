-- Add monthlyWeekdayRules JSON field to Image table (for banners)
-- This field allows multiple weekday rules like "First Tuesday AND Third Tuesday"
-- Format: [{weekday: 2, ordinal: 1}, {weekday: 2, ordinal: 3}]
ALTER TABLE "Image" ADD COLUMN "monthlyWeekdayRules" JSONB;

-- Add monthlyWeekdayRules JSON field to Menu table
-- Same field for menu scheduling with multiple weekday rules
ALTER TABLE "Menu" ADD COLUMN "monthlyWeekdayRules" JSONB;
