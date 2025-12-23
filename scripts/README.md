# Translation Generation Script

This script automatically generates translation files for all supported languages using the DeepL API.

## ✨ Intelligent Features

### 🎯 Smart Caching
- **Reuses existing translations** - Only translates new or changed text
- **DeepL API cache** - Saves all DeepL responses to avoid duplicate calls
- **File-based memory** - Remembers translations across script runs
- **Zero cost re-runs** - Re-running on unchanged files uses 0 DeepL tokens

### 💰 Cost Optimization
- **First run**: ~250,000 characters (5 languages × 50k chars)
- **Subsequent runs**: Only changed text is translated
- **Example**: Adding 1 allergen label = ~100 characters × 5 languages = 500 characters
- **Savings**: 99%+ token reduction on incremental updates

## Prerequisites

- DeepL API key (free or paid account)
- Get your API key from: https://www.deepl.com/pro-api

## Usage

### Initial Setup

1. Set your DeepL API key as an environment variable:

```bash
# Windows (PowerShell)
$env:DEEPL_API_KEY="your-api-key-here"

# Windows (CMD)
set DEEPL_API_KEY=your-api-key-here

# Linux/Mac
export DEEPL_API_KEY=your-api-key-here
```

### Generate All Translations

Run the translation script:

```bash
npm run translate
```

This will:
1. Read `src/lang/en.json` (English source file)
2. Load existing translations and cache
3. **Only translate new/changed text** (intelligent diffing)
4. Reuse existing translations for unchanged text
5. Save the translated files as `pt.json`, `es.json`, `fr.json`, `de.json`, `it.json`
6. Update the cache for future runs

### When to Run

Run the translation script whenever you:
- Add new UI text to `en.json`
- Modify existing English text
- Add new features that need translation (like allergen labels)

## Supported Languages

The script generates translations for:
- 🇵🇹 **Portuguese (PT)** - Default language
- 🇪🇸 **Spanish (ES)**
- 🇫🇷 **French (FR)**
- 🇩🇪 **German (DE)**
- 🇮🇹 **Italian (IT)**

## Adding More Languages

To add more languages, edit `scripts/generate-translations.js`:

```javascript
const TARGET_LANGUAGES = {
    pt: "PT",
    es: "ES",
    fr: "FR",
    de: "DE",
    it: "IT",
    nl: "NL",  // Add Dutch
    pl: "PL",  // Add Polish
    // ... add more
};
```

See [DeepL supported languages](https://www.deepl.com/docs-api/translate-text/translate-text/) for all available language codes.

## How It Works

### 1. **Three-Layer Caching System**

**Layer 1: Existing Translation Files**
- Compares `en.json` with existing `pt.json`, `es.json`, etc.
- If English text hasn't changed, reuses the existing translation
- **Cost**: FREE - No API calls

**Layer 2: DeepL API Cache**
- Stores MD5 hash of every translation: `{language}:{hash}` → `translated_text`
- Saved in `scripts/.translation-cache.json`
- Persists across script runs
- **Cost**: FREE - No API calls

**Layer 3: DeepL API**
- Only called for truly new/changed text
- Results saved to cache for future use
- **Cost**: Charged by DeepL

### 2. **Smart Features**

- **Placeholder Protection**: Text with `{name}`, `{year}` protected during translation
- **Recursive Translation**: Deeply nested JSON objects fully translated
- **Intelligent Diffing**: Only translates what changed
- **Rate Limiting**: 2-second delay between languages (only if API called)
- **Error Handling**: Falls back to original English text if translation fails
- **Statistics**: Shows exactly how many tokens were used vs. saved

## Troubleshooting

### "DEEPL_API_KEY environment variable is required"
- Make sure you've set the environment variable correctly
- Try running in the same terminal session where you set the variable

### "DeepL API error: Quota exceeded"
- Free tier has 500,000 character/month limit
- Upgrade to DeepL Pro for higher limits
- Or translate fewer languages at once

### Translations look incorrect
- Check that your `en.json` has proper English text
- Some technical terms may not translate well - consider adding glossary support
- Review generated files and manually adjust if needed

## Cost Estimation

### DeepL Free Tier (500,000 characters/month)

**First Run (Full Translation)**
- A typical `en.json` file: ~50,000 characters
- Translating to 5 languages: ~250,000 characters
- **Cost**: ~250,000 tokens
- Can run ~2 full translations per month

**Subsequent Runs (Incremental Updates)**
- Added 10 new UI labels: ~500 characters
- Translating to 5 languages: ~2,500 characters
- **Cost**: ~2,500 tokens
- **Savings**: 99% compared to full re-translation
- Can run ~200 incremental updates per month

**Example: Adding Allergen Feature**
- Added 14 allergen labels (~1,000 chars)
- Translating to 5 languages: ~5,000 chars
- **Without caching**: Would use 250,000 tokens (full re-translation)
- **With intelligent caching**: Uses only 5,000 tokens
- **Savings**: 98% reduction in API usage

## Production Setup

For automated translation in CI/CD:

```yaml
# .github/workflows/translate.yml
name: Generate Translations
on:
  push:
    paths:
      - 'src/lang/en.json'

jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run translate
        env:
          DEEPL_API_KEY: ${{ secrets.DEEPL_API_KEY }}
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: "🌍 Auto-generate translations"
```
