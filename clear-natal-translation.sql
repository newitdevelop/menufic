-- Clear invalid "Natal" translations
-- This removes cached translations where "Natal" (Portuguese) was incorrectly cached as the English translation

-- Delete all non-Portuguese translations that contain "Natal"
DELETE FROM "Translation"
WHERE "entityType" = 'category'
AND "field" = 'name'
AND "language" != 'PT'
AND "translated" LIKE '%Natal%';

-- Verify what was deleted (run this before the DELETE to see what will be removed)
-- SELECT * FROM "Translation"
-- WHERE "entityType" = 'category'
-- AND "field" = 'name'
-- AND "language" != 'PT'
-- AND "translated" LIKE '%Natal%';
