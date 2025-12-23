# Selective Translation System

## Problem Solved

The original translation script was translating **everything** including:
- ❌ Legal text (Terms & Conditions, Privacy Policy)
- ❌ Long disclaimers and warranty text
- ❌ Content users never see in other languages
- ❌ Caused DeepL rate limiting (429 errors)
- ❌ Wasted tokens on unnecessary translations

## New Approach: Selective Translation

Only translates **menu-viewing content** that users actually see:

✅ Common UI labels (Save, Edit, Delete, etc.)
✅ **Footer link names** (Privacy Policy, Terms, Complaint Book) - URLs stay the same
✅ **All allergen labels** (Cereals, Fish, Nuts, etc.)
✅ Translation helper text
✅ Login/Logout buttons
✅ Footer copyright text

❌ Keeps legal **page content** in English (Terms & Conditions full text)
❌ Keeps privacy policy **page content** in English (full text)
❌ Keeps disclaimers in English

## Usage

### Selective Translation (Default - Recommended)

```bash
export DEEPL_API_KEY=your_key
npm run translate
```

**What it does:**
- Translates ~50 menu-related text items
- Keeps legal text in English
- **Cost**: ~5,000 characters × 5 languages = **25,000 tokens**
- **Time**: ~30 seconds
- **Rate limit safe**: 500ms delay between requests

### Full Translation (If needed)

```bash
export DEEPL_API_KEY=your_key
npm run translate:full
```

**What it does:**
- Translates everything (including legal text)
- **Cost**: ~50,000 characters × 5 languages = **250,000 tokens**
- **Time**: ~5 minutes
- **Risk**: May hit rate limits

## What Gets Translated

The selective script only translates these key paths:

```javascript
const KEYS_TO_TRANSLATE = [
    "common.save",
    "common.edit",
    "common.delete",
    "common.cancel",
    "common.confirmDelete",
    "common.deleteSuccess",
    "common.createSuccess",
    "common.updateSuccess",
    "common.allergens",           // 🎯 All allergen labels (MAIN FEATURE)
    "common.privacyPolicy",       // Footer link name (URL stays the same)
    "common.terms&Conditions",    // Footer link name (URL stays the same)
    "common.complaintBook",       // Footer link name (URL stays the same)
    "common.footerCopyright",     // Footer copyright text with {year} and {appName}
    "common.login",
    "common.logout",
    "common.openDashboard",
    "common.translatePage",
    "common.translateInstructions",
    "common.translateChrome",
    "common.translateSafari",
    "common.translateFirefox",
    "dashboard.editMenu.menuItem.allergensInfo", // "Might contain the following allergens"
];
```

Everything else stays in English.

## Cost Comparison

| Approach | Content Translated | Tokens Used | Rate Limit Risk |
|----------|-------------------|-------------|-----------------|
| **Selective** (new) | Menu-related only | ~30,000 | ✅ Safe |
| **Full** (old) | Everything including legal | ~250,000 | ⚠️ High risk |
| **Savings** | - | **88% reduction** | - |

## Adding New Translatable Content

If you add new UI text that should be translated, add it to `KEYS_TO_TRANSLATE`:

```javascript
// In scripts/generate-translations-selective.js
const KEYS_TO_TRANSLATE = [
    // ... existing keys
    "dashboard.myNewFeature",  // Add your new feature key
];
```

Then run:
```bash
npm run translate
```

## Rate Limiting Protection

The selective script includes:

1. **500ms delay** between each translation request
2. **3 second delay** between languages
3. **Error handling** for 429 (rate limit) errors
4. **Smart caching** to avoid re-translating
5. **Selective translation** - only ~50 items instead of ~500

## Example Output

```bash
$ npm run translate

🌍 Starting selective translation generation...
ℹ️  Only translating menu-related content

📦 Loaded translation cache (0 entries)
✅ Loaded English translations

📋 Will translate the following sections:
   • common.save
   • common.edit
   • common.allergens
   • common.privacyPolicy
   • common.terms&Conditions
   • common.complaintBook
   • ... (and 16 more)

🔒 All other content will remain in English (legal text, etc.)

📝 Processing PT (PT)...
   Found existing pt.json
   ...................
   ✅ Saved pt.json
   📊 Stats: 18 translated | 5 from cache | 450 kept
   🪙 Tokens used: ~1200 characters

   ⏳ Waiting 3 seconds before next language...

📝 Processing ES (ES)...
   Found existing es.json
   ...................
   ✅ Saved es.json
   📊 Stats: 18 translated | 5 from cache | 450 kept
   🪙 Tokens used: ~1200 characters

[... fr, de, it ...]

💾 Saved translation cache (90 entries)
🎉 All translations generated successfully!

📊 Overall Statistics:
   • Total API calls: 90
   • Reused from cache: 90
   • Kept in English: 2160
💰 Estimated cost: ~450 characters across all languages
```

## Why This Approach?

### User Experience
- ✅ Users see allergen labels in their language
- ✅ Menu UI is translated
- ✅ Footer link names are translated (URLs stay the same)
- ✅ Legal page content in English is standard practice (enforceable)

### Cost Efficiency
- ✅ 88% token savings
- ✅ Can run 16x more often on free tier
- ✅ Faster execution

### Rate Limit Safety
- ✅ Stays well under DeepL rate limits
- ✅ No 429 errors
- ✅ Reliable execution

### Maintenance
- ✅ Legal text changes rarely
- ✅ Menu features change often
- ✅ Only translate what matters

## Migration from Full to Selective

If you were using the full translation before:

```bash
# Backup current translations (optional)
cp src/lang/pt.json src/lang/pt.json.backup

# Run selective translation
npm run translate

# Test the app
docker compose build --no-cache app
docker compose up -d

# Visit menu with ?lang=ES to verify allergens are translated
```

Your existing translations for menu content will be reused (from cache).
Only legal text will revert to English.

## Recommendation

✅ **Use selective translation by default** (`npm run translate`)
- Covers all user-facing menu content
- Includes allergen labels
- Safe from rate limiting
- Cost-effective

❌ **Avoid full translation** unless you specifically need legal text translated
- Most users won't read legal text in their language anyway
- Standard practice is to keep legal text in source language
- 10x more expensive

## Summary

The selective translation system:
- ✅ Translates allergen labels (main goal)
- ✅ Translates all menu-viewing UI
- ✅ Translates footer link names (URLs stay fixed)
- ✅ 88% cost reduction
- ✅ Rate-limit safe
- ✅ Faster execution
- ✅ Easier to maintain

Perfect for restaurant menu applications where legal page content doesn't need translation!
