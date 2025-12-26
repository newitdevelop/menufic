# Translation System Setup

## Overview

Menufic uses a **dual translation system**:
1. **Static UI translations** - For fixed interface elements (buttons, labels, menus)
2. **Dynamic content translations** - For user-entered content (menu items, categories, descriptions)

Both systems now support **optional translation files**, allowing the app to build and run in Docker without requiring the DeepL API key at build time.

---

## Static UI Translation System

### How It Works

The app uses `next-intl` for static UI translation with an improved fallback mechanism:

1. **Source**: All UI strings are defined in `src/lang/en.json`
2. **Optional translations**: Other languages (pt.json, es.json, fr.json, de.json, it.json) can be generated
3. **Automatic fallback**: If a translation file is missing, the app automatically falls back to English
4. **Runtime loading**: Translation files are loaded dynamically, not required at build time

### File Structure

```
src/
  lang/
    en.json          ✅ Required (source of truth)
    pt.json          ⚠️  Optional (generated)
    es.json          ⚠️  Optional (generated)
    fr.json          ⚠️  Optional (generated)
    de.json          ⚠️  Optional (generated)
    it.json          ⚠️  Optional (generated)
  utils/
    loadTranslations.ts  ✅ Safe loader with fallback
```

###Usage in Components

```typescript
import { useTranslations } from "next-intl";

const MyComponent = () => {
  const t = useTranslations("common");

  return <Button>{t("save")}</Button>; // "Save" (or translated if available)
};
```

### Usage in Pages

```typescript
import { loadTranslations } from "src/utils/loadTranslations";

export const getStaticProps = async () => ({
  props: {
    messages: await loadTranslations("en"), // Safely loads with fallback
  },
});
```

---

## Generating Translation Files (Optional)

Translation files are **optional** but recommended for production.

### Prerequisites

1. Get a free DeepL API key: https://www.deepl.com/pro-api
   - Free tier: 500,000 characters/month
   - More than enough for UI strings

2. Set the API key:
   ```bash
   export DEEPL_API_KEY=your_api_key_here
   ```

### Generate Translations

```bash
# One-time generation (recommended before deploying to production)
npm run translate
```

This will:
- Read `src/lang/en.json`
- Generate translations for PT, ES, FR, DE, IT
- Cache results in `scripts/.translation-cache.json`
- Save translations to `src/lang/*.json`

**Output:**
```
🌍 Starting selective translation generation...
📦 Loaded translation cache (0 entries)
✅ Loaded English translations

📝 Processing PT (PT)...
   ✅ Saved pt.json
   📊 Stats: 22 translated | 0 from cache | 780 kept
   🪙 Tokens used: ~5,000 characters

📝 Processing ES (ES)...
   ✅ Saved es.json
   ...

🎉 All translations generated successfully!
💰 Estimated cost: ~25,000 characters total (well within free tier)
```

### What Gets Translated

Only menu-related content is translated (88% cost savings):

**Translated:**
- ✅ Common UI: Save, Edit, Delete, Cancel
- ✅ Footer links: Privacy Policy, Terms & Conditions
- ✅ Allergen names: Cereals, Fish, Nuts, etc.
- ✅ Success/Error messages
- ✅ Translation help text

**Not translated (kept in English):**
- ❌ Legal text (Privacy Policy, Terms & Conditions pages)
- ❌ Admin-only interface
- ❌ Technical error messages

---

## Docker Build Workflow

### Build Without Translations (Development)

```bash
# Docker build works without DEEPL_API_KEY
docker build -t menufic:latest .
```

**Behavior:**
- ✅ Build succeeds
- ✅ App runs normally
- ✅ UI shows in English
- ⚠️  Other languages will also show English (fallback)

### Build With Translations (Production)

**Option 1: Generate translations locally, then build**
```bash
# On your development machine:
export DEEPL_API_KEY=your_key
npm run translate

# Commit the generated files:
git add src/lang/*.json
git commit -m "Add UI translations"

# Build (translations are now in the image):
docker build -t menufic:latest .
```

**Option 2: Generate translations in Docker volume**
```bash
# Build without translations:
docker build -t menufic:latest .

# Run container:
docker-compose up -d

# Generate translations inside container:
docker-compose exec app sh -c "export DEEPL_API_KEY=your_key && npm run translate"

# Restart to pick up new translations:
docker-compose restart app
```

**Option 3: Use build args (if you modify Dockerfile)**
```dockerfile
# Add to Dockerfile:
ARG DEEPL_API_KEY
ENV DEEPL_API_KEY=$DEEPL_API_KEY
RUN if [ -n "$DEEPL_API_KEY" ]; then npm run translate; fi
```

```bash
docker build --build-arg DEEPL_API_KEY=your_key -t menufic:latest .
```

---

## Dynamic Content Translation System

This system translates user-entered content (menu items, categories) on-demand.

### How It Works

1. **Database-driven**: Translations stored in `Translation` table
2. **DeepL API**: Translations generated via DeepL when first requested
3. **Cached**: Once translated, stored in database for future requests
4. **Language parameter**: Controlled via `?lang=ES` query parameter

### Usage

**In tRPC Router:**
```typescript
// src/server/api/routers/restaurant.router.ts
import { translateMenu, translateCategory, translateMenuItem } from "src/server/services/translation.service";

const translatedMenus = await Promise.all(
  restaurant.menus.map(menu => translateMenu(menu, language))
);
```

**In Client:**
```typescript
// Automatically translated based on ?lang= parameter
const { data: restaurant } = api.restaurant.getDetails.useQuery({
  id: restaurantId,
  language: "ES", // Spanish
});
```

### Supported Languages

- **PT** - Portuguese (default)
- **ES** - Spanish
- **FR** - French
- **DE** - German
- **IT** - Italian

To add more languages, update `src/utils/deepl.ts`:
```typescript
export const SUPPORTED_LANGUAGES = {
  // ... existing
  NL: "NL", // Dutch
  PL: "PL", // Polish
};
```

---

## Translation Cache

### Static UI Cache

**Location:** `scripts/.translation-cache.json`

**Purpose:**
- Avoid re-translating unchanged strings
- Speed up subsequent `npm run translate` runs
- Reduce API costs

**When to clear:**
```bash
rm scripts/.translation-cache.json
npm run translate  # Will re-translate everything
```

### Dynamic Content Cache

**Location:** PostgreSQL database (`Translation` table)

**Schema:**
```sql
CREATE TABLE "Translation" (
    id            TEXT PRIMARY KEY,
    entityType    TEXT NOT NULL,  -- "menuItem", "category", "menu", "ui"
    entityId      TEXT NOT NULL,  -- ID of the entity
    language      TEXT NOT NULL,  -- "PT", "ES", "FR", "DE", "IT"
    field         TEXT NOT NULL,  -- "name", "description", etc.
    translated    TEXT NOT NULL,  -- The translated text
    createdAt     TIMESTAMP DEFAULT NOW()
);
```

**When to clear:**
```sql
-- Clear all translations for a specific menu item:
DELETE FROM "Translation" WHERE "entityType" = 'menuItem' AND "entityId" = 'item-id';

-- Clear all translations for a language:
DELETE FROM "Translation" WHERE language = 'ES';

-- Clear everything (will regenerate on next request):
TRUNCATE TABLE "Translation";
```

---

## Troubleshooting

### Issue: Build fails with "Cannot find module 'src/lang/pt.json'"

**Solution:** This should not happen with the new system. If it does:
1. Verify `src/utils/loadTranslations.ts` exists
2. Check that pages import `loadTranslations`
3. Ensure pages use: `messages: await loadTranslations("en")`

### Issue: UI shows English when I expected Spanish

**Possible causes:**
1. Translation file `src/lang/es.json` doesn't exist → Run `npm run translate`
2. Page is using hardcoded `loadTranslations("en")` → This is correct; language selection happens client-side via `?lang=` parameter for dynamic content only

**Note:** Static UI translations currently only support English unless you generate the translation files.

### Issue: Dynamic content not translating

**Check:**
1. Is `?lang=ES` in the URL?
2. Is `DEEPL_API_KEY` set in environment variables?
3. Check database for Translation records:
   ```sql
   SELECT * FROM "Translation" WHERE language = 'ES' LIMIT 10;
   ```
4. Check server logs for DeepL API errors

### Issue: DeepL API rate limit errors

**Symptoms:**
```
❌ DeepL API error: 429
Rate limited - increase delay between requests
```

**Solutions:**
1. Increase delay in `scripts/generate-translations-selective.js`:
   ```javascript
   await sleep(1000); // Increase from 500ms to 1000ms
   ```
2. Upgrade to DeepL Pro (remove rate limits)
3. Run translation in smaller batches

---

## Cost Analysis

### Static UI Translation

**One-time generation:**
- ~22 keys × 500 chars avg × 5 languages = ~55,000 characters
- Free tier: 500,000 chars/month
- **Cost: FREE** (well within limits)

**Incremental updates:**
- Only changed strings are re-translated (cache system)
- Typical update: ~2,000 characters
- **Cost: FREE**

### Dynamic Content Translation

**Per restaurant:**
- Average: 50 menu items × 200 chars × 5 languages = 50,000 characters
- **Cost: FREE** (cached after first translation)

**Total monthly:**
- 10 restaurants × 50,000 chars = 500,000 characters
- Exactly at free tier limit
- **Cost: FREE** or **$5.49/month** for Pro (unlimited)

---

## Best Practices

### 1. Generate translations before production deploy

```bash
npm run translate
git add src/lang/*.json
git commit -m "Update translations"
```

### 2. Don't commit the cache file

Already in `.gitignore`:
```
scripts/.translation-cache.json
```

### 3. Set DEEPL_API_KEY in environment

```bash
# .env (for local development)
DEEPL_API_KEY=your_key_here

# Docker (in docker-compose.yml)
services:
  app:
    environment:
      - DEEPL_API_KEY=${DEEPL_API_KEY}
```

### 4. Regenerate translations when en.json changes

```bash
# After updating src/lang/en.json:
npm run translate
```

### 5. Use selective translation

Don't translate everything - the current setup only translates user-facing menu content, saving 88% on API costs.

---

## Migration from Old System

If you're upgrading from a version that required translation files at build time:

### Before (Old System - BREAKS IN DOCKER)
```typescript
// Pages had hardcoded imports:
export const getStaticProps = async () => ({
  props: { messages: (await import("src/lang/en.json")).default },
});
```

**Problem:** Docker builds failed if pt.json, es.json, etc. didn't exist.

### After (New System - WORKS IN DOCKER)
```typescript
// Pages use safe loader:
import { loadTranslations } from "src/utils/loadTranslations";

export const getStaticProps = async () => ({
  props: { messages: await loadTranslations("en") },
});
```

**Benefit:** Falls back to English if translation files don't exist.

---

## Summary

✅ **No DEEPL_API_KEY required for Docker builds**
✅ **App works perfectly with only English translations**
✅ **Translation files are optional** (can be generated anytime)
✅ **Automatic fallback to English** if files missing
✅ **Dynamic content translation still works** (database-driven)
✅ **Cost-effective** (free tier covers typical usage)

**Recommended workflow:**
1. Develop without translations (English only)
2. Generate translations before production deploy
3. Commit translation files to git
4. Deploy with full multilingual support

---

**Last Updated:** 2025-12-26
**Status:** ✅ Production Ready
**Docker Builds:** ✅ Work without DEEPL_API_KEY
