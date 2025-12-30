# Translation Issue Fix Guide

## Problem
The category name "Natal" (Portuguese) is not being translated to "Christmas" (English) when viewing the menu in English.

## Root Cause
The application uses DeepL API for translations, but the `DEEPL_API_KEY` is not configured in the `.env` file. When the API key is missing, the translation system returns the original Portuguese text and caches it.

## Solutions

### Solution 1: Configure DeepL API (Recommended)

1. **Get a DeepL API key:**
   - Sign up for a free DeepL API account at: https://www.deepl.com/pro-api
   - The free tier includes 500,000 characters/month

2. **Add the API key to your `.env` file:**
   ```bash
   DEEPL_API_KEY=your-api-key-here
   ```

3. **Clear invalid cached translations:**

   The system has cached the untranslated "Natal" as the English translation. You have two options to clear it:

   **Option A: Edit the category name (easiest)**
   - Go to the admin dashboard
   - Edit the "Natal" category
   - Change the name to "Natal " (add a space) and save
   - Change it back to "Natal" and save again
   - This triggers translation cache invalidation

   **Option B: Clear translations via database**
   - If you have database access, delete the invalid translation:
   ```sql
   DELETE FROM Translation
   WHERE entityType = 'category'
   AND field = 'name'
   AND language != 'PT'
   AND translated LIKE '%Natal%';
   ```

4. **Reload the menu in English:**
   - Visit the menu page with `?lang=EN` parameter
   - The category should now translate to "Christmas"

### Solution 2: Manual Workaround (No DeepL needed)

If you don't want to use DeepL API, you can work around this by creating separate categories for different languages:

1. Create a category named "Christmas" for English menus
2. Keep "Natal" for Portuguese menus
3. Move items between categories based on the active menu's language

**Note:** This approach requires manual management and doesn't scale well.

### Solution 3: Use Database Script (Advanced)

If you have `DATABASE_URL` configured in your `.env`, you can use the provided script:

```bash
# Clear all invalid translations
npx ts-node scripts/clear-invalid-translations.ts

# Clear translations for a specific category
npx ts-node scripts/clear-invalid-translations.ts category <category-id>
```

This script finds and removes cached translations that contain Portuguese characters when they should be in other languages.

## Verification

After applying any solution:

1. Visit your menu with English language: `/venue/[restaurantId]/menu?lang=EN`
2. Check that "Natal" is now translated to "Christmas"
3. Verify other Portuguese content is also translated

## How Translations Work

The app follows this workflow:

1. **Content is stored in Portuguese** (default language) in the database
2. **When a user requests a different language:**
   - The system checks if translation is cached
   - If not cached, calls DeepL API to translate
   - Caches the translation for future requests
3. **Translation cache is invalidated** when content is updated

## Environment Variables for Translation

```bash
# Required for translations to work
DEEPL_API_KEY=your-deepl-api-key

# Your database connection string
DATABASE_URL=your-database-url
```

## Support

If translations are still not working after following this guide:

1. Check the server logs for translation errors
2. Verify DEEPL_API_KEY is valid and has available quota
3. Ensure the target language is supported by DeepL (EN, ES, FR, DE, IT, etc.)
4. Check that Portuguese content is properly stored in the database

## Supported Languages

The app supports translation to:
- English (EN-GB, EN-US)
- Spanish (ES)
- French (FR)
- German (DE)
- Italian (IT)
- Dutch (NL)
- Polish (PL)
- Russian (RU)
- Japanese (JA)
- Chinese (ZH)

Source language: Portuguese (PT)
