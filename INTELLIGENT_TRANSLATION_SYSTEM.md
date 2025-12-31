# Intelligent Translation Synchronization System

## Overview

An automated system that keeps all language JSON files in sync with your source translations. When you add or update translation keys in `en.json`, the system automatically:
1. Detects the changes
2. Uses DeepL API to translate to all supported languages
3. Updates all language files (pt, fr, es, de, it)

---

## Quick Start

### 1. Set Up DeepL API Key

Add your DeepL API key to your environment:

```bash
# .env or .env.local
DEEPL_API_KEY=your_deepl_api_key_here
```

Get a free API key at: https://www.deepl.com/pro-api

### 2. Run Translation Sync

```bash
npm run sync-translations
```

This will:
- Compare `en.json` with all other language files
- Detect missing or outdated translations
- Use DeepL API to translate them
- Update all language files automatically

---

## How It Works

### Workflow

```
en.json (Source)
    ↓
Detect Changes
    ↓
Missing Keys? → DeepL API → Translate
    ↓
Update pt.json, fr.json, es.json, de.json, it.json
```

### Example

**1. You add a new key to `en.json`:**
```json
{
    "venueSelection": {
        "title": "Select Your Venue",
        "newFeature": "Check out our new feature!"  // ← NEW KEY
    }
}
```

**2. Run sync:**
```bash
npm run sync-translations
```

**3. Script automatically updates all files:**

`pt.json`:
```json
{
    "venueSelection": {
        "title": "Selecione o Seu Local",
        "newFeature": "Confira nossa nova funcionalidade!"  // ← AUTO-TRANSLATED
    }
}
```

`fr.json`:
```json
{
    "venueSelection": {
        "title": "Sélectionnez Votre Établissement",
        "newFeature": "Découvrez notre nouvelle fonctionnalité!"  // ← AUTO-TRANSLATED
    }
}
```

And so on for all languages!

---

## Commands

### `npm run sync-translations`
Synchronize all translation files with DeepL API

**When to use:**
- After adding new keys to `en.json`
- After updating text in `en.json`
- Before committing changes to ensure all languages are up-to-date

**Output:**
```
🌍 Starting translation synchronization...

📖 Source (en.json): 147 translation keys

🔄 Processing PT...
  ✅ Loaded existing pt.json
  📝 Missing keys: 3
  🌐 Translating 3 missing keys to PT...
  Translating 1/3: venueSelection.newFeature
  Translating 2/3: menu.specialOffer
  Translating 3/3: common.welcomeMessage
  ✅ Saved pt.json

🔄 Processing FR...
  ✅ Loaded existing fr.json
  📝 Missing keys: 3
  🌐 Translating 3 missing keys to FR...
  ...

✅ Translation synchronization complete!
```

### `npm run sync-translations:check` *(Coming Soon)*
Dry-run mode - Shows what would be translated without making changes

---

## Script Details

### File: `scripts/sync-translations.ts`

**Functions:**

1. **`getAllPaths(obj)`**
   - Recursively extracts all translation paths from nested JSON
   - Example: `{ auth: { login: "Login" } }` → `"auth.login"`

2. **`translateText(text, targetLang)`**
   - Calls DeepL API to translate text
   - Handles errors gracefully
   - Falls back to placeholder if API fails

3. **`batchTranslate(texts, targetLang)`**
   - Translates multiple texts with rate limiting
   - Prevents hitting DeepL API rate limits
   - Shows progress: "Translating 5/10..."

4. **`syncTranslations()`**
   - Main function
   - Compares `en.json` with other language files
   - Detects missing/updated keys
   - Translates and updates files

---

## Supported Languages

| Code | Language | DeepL Code | File |
|------|----------|------------|------|
| PT | Portuguese (Portugal) | PT-PT | `src/lang/pt.json` |
| EN | English | EN | `src/lang/en.json` (source) |
| FR | French | FR | `src/lang/fr.json` |
| ES | Spanish | ES | `src/lang/es.json` |
| DE | German | DE | `src/lang/de.json` |
| IT | Italian | IT | `src/lang/it.json` |

---

## Rate Limiting

The script includes automatic rate limiting to comply with DeepL API limits:
- **Delay**: 100ms between each translation request
- **For 10 keys**: ~1 second total
- **For 100 keys**: ~10 seconds total

This ensures you don't hit API rate limits while still completing quickly.

---

## Cost Estimation

DeepL API Free Tier:
- **500,000 characters/month** free
- Most translation keys are 20-50 characters
- **Estimated capacity**: ~10,000-25,000 translations/month free

Average sync cost:
- **10 new keys × 5 languages = 50 API calls**
- **50 calls × 30 chars = 1,500 characters**
- Well within free tier limits!

---

## Automated Workflow (Future Enhancement)

### Option 1: Pre-commit Hook (Recommended)

Add to `.husky/pre-commit`:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Sync translations before commit
npm run sync-translations

# Stage updated translation files
git add src/lang/*.json
```

**Benefits:**
- Automatic synchronization before every commit
- Never forget to sync translations
- Always have complete translations in git

### Option 2: GitHub Actions

Create `.github/workflows/sync-translations.yml`:
```yaml
name: Sync Translations

on:
  push:
    paths:
      - 'src/lang/en.json'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run sync-translations
        env:
          DEEPL_API_KEY: ${{ secrets.DEEPL_API_KEY }}
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: "chore: sync translations"
          file_pattern: src/lang/*.json
```

**Benefits:**
- Automatic sync when `en.json` is pushed
- No manual intervention needed
- CI/CD integration

---

## Manual Translation Overrides

If you want to manually override a DeepL translation:

1. Edit the target language file directly:
```json
{
    "venueSelection": {
        "title": "My Custom Translation"  // ← Manual override
    }
}
```

2. The script **will NOT** overwrite manual translations unless:
   - The English source text changes
   - The translation is a placeholder (starts with `[PT]`, `[FR]`, etc.)

---

## Troubleshooting

### "DEEPL_API_KEY not set"
**Solution:** Add your DeepL API key to `.env`:
```bash
DEEPL_API_KEY=your_key_here
```

### "DeepL API error: 403"
**Possible causes:**
- Invalid API key
- Exceeded free tier limit (500k chars/month)

**Solution:** Check your DeepL account dashboard

### Translations are placeholders `[FR] Text`
**Cause:** Script ran without DEEPL_API_KEY

**Solution:**
1. Set API key in `.env`
2. Run `npm run sync-translations` again

### "Script failed: ENOENT en.json"
**Cause:** Script can't find `src/lang/en.json`

**Solution:** Ensure you're running from project root directory

---

## Best Practices

### 1. Always Edit English First
```
✅ Edit en.json → Run sync → Get translations
❌ Edit fr.json directly → Gets overwritten
```

### 2. Use Descriptive Keys
```
✅ "menu.dishOfTheDay": "Dish of the Day"
❌ "menu.item1": "Dish of the Day"
```

### 3. Group Related Keys
```json
{
    "reservation": {
        "title": "Reserve a Table",
        "dateLabel": "Date",
        "timeLabel": "Time"
    }
}
```

### 4. Run Sync Before Committing
```bash
git add src/lang/en.json
npm run sync-translations  # ← Syncs all languages
git add src/lang/*.json
git commit -m "feat: add new translations"
```

### 5. Review AI Translations
DeepL is excellent but not perfect. Review critical translations:
- Legal text (terms, privacy)
- Brand messaging
- Call-to-action buttons

---

## File Structure

```
menufic-main/
├── src/
│   └── lang/
│       ├── en.json  ← SOURCE OF TRUTH
│       ├── pt.json  ← Auto-synced
│       ├── fr.json  ← Auto-synced
│       ├── es.json  ← Auto-synced
│       ├── de.json  ← Auto-synced
│       └── it.json  ← Auto-synced
├── scripts/
│   └── sync-translations.ts  ← Sync script
└── package.json  ← npm run sync-translations
```

---

## Example: Adding a New Feature

Let's say you're adding a new "Special Offers" section:

**1. Add keys to `en.json`:**
```json
{
    "specialOffers": {
        "title": "Special Offers",
        "subtitle": "Check out our amazing deals!",
        "viewAll": "View All Offers",
        "validUntil": "Valid until {date}"
    }
}
```

**2. Run sync:**
```bash
npm run sync-translations
```

**3. Check output:**
```
🔄 Processing PT...
  📝 Missing keys: 4
  🌐 Translating 4 missing keys to PT...
  Translating 1/4: specialOffers.title
  Translating 2/4: specialOffers.subtitle
  Translating 3/4: specialOffers.viewAll
  Translating 4/4: specialOffers.validUntil
  ✅ Saved pt.json

... (same for FR, ES, DE, IT)
```

**4. Use in your component:**
```typescript
import { useTranslations } from "next-intl";

export const SpecialOffers: FC = () => {
    const t = useTranslations("specialOffers");

    return (
        <div>
            <h2>{t("title")}</h2>
            <p>{t("subtitle")}</p>
            <button>{t("viewAll")}</button>
        </div>
    );
};
```

**5. Commit everything:**
```bash
git add src/lang/*.json src/components/SpecialOffers.tsx
git commit -m "feat: add special offers section with i18n"
```

Done! All 6 languages are automatically translated and ready to use! 🎉

---

## Status

✅ **Script Created** - `scripts/sync-translations.ts`
✅ **Commands Added** - `npm run sync-translations`
✅ **Documentation Complete** - This file

### Next Steps (Optional):
1. Set up `DEEPL_API_KEY` in your environment
2. Run `npm run sync-translations` to test
3. Add pre-commit hook for automatic syncing
4. Consider GitHub Actions for CI/CD integration

---

## Need Help?

- **DeepL API Docs**: https://www.deepl.com/docs-api
- **next-intl Docs**: https://next-intl-docs.vercel.app/
- **Script Issues**: Check `scripts/sync-translations.ts` comments
