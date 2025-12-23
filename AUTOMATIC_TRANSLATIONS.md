# Automatic Translation Setup

Menufic now supports **automatic translation generation** on container startup!

## How It Works

When you start the Docker container with `DEEPL_API_KEY` configured:

1. **Container starts** → Checks for DeepL API key
2. **If API key exists** → Checks if translation files are present
3. **If translation files missing** → Automatically generates them
4. **If translation files exist** → Skips generation (run `npm run translate` manually to update)
5. **Application starts** → All languages available immediately

## Setup Instructions

### 1. Get DeepL API Key (Free)

1. Go to https://www.deepl.com/pro-api
2. Sign up for free account (500,000 characters/month)
3. Copy your API key

### 2. Add to Environment Variables

Edit your `.env` file:

```bash
# DeepL Translation API
DEEPL_API_KEY=your_api_key_here
```

### 3. Build & Start Container

```bash
# Build with new code
docker compose build --no-cache app

# Start the container
docker compose up -d

# Watch the logs to see automatic translation
docker compose logs -f app
```

## Expected Startup Behavior

### With DeepL API Key + No Translation Files

```
🚀 Starting Menufic application...
⏳ Waiting for PostgreSQL to be ready...
✅ PostgreSQL is ready!
📦 Deploying pending migrations...
✅ All migrations deployed successfully
🔧 Generating Prisma Client...
🌍 DeepL API key detected - checking translations...
📝 Translation files missing - generating translations...

📝 Processing PT (PT)...
......................................................
✅ Saved pt.json
📊 Stats: 450 translated | 0 from cache | 0 reused
🪙 Tokens used: ~45000 characters

📝 Processing ES (ES)...
......................................................
✅ Saved es.json
📊 Stats: 450 translated | 0 from cache | 0 reused
🪙 Tokens used: ~45000 characters

[... fr, de, it ...]

✅ Translations generated successfully
✅ Initialization complete!
🎉 Starting Next.js application...
```

**Cost**: ~250,000 tokens (one-time, first startup)

### With DeepL API Key + Existing Translation Files

```
🌍 DeepL API key detected - checking translations...
✅ Translation files already exist (run 'npm run translate' to update)
✅ Initialization complete!
🎉 Starting Next.js application...
```

**Cost**: 0 tokens (instant startup)

### Without DeepL API Key

```
ℹ️  DeepL API key not set - skipping translation generation
   Set DEEPL_API_KEY environment variable to enable automatic translations
✅ Initialization complete!
🎉 Starting Next.js application...
```

**Behavior**: Application runs with English-only UI (dynamic content can still use browser translation)

## Manual Translation Update

To update translations after changing `src/lang/en.json`:

### Option 1: Inside Running Container

```bash
# Enter the container
docker exec -it menufic bash

# Generate translations
npm run translate

# Exit container
exit
```

### Option 2: Rebuild Container

```bash
# Rebuild triggers automatic generation on startup
docker compose build --no-cache app
docker compose up -d
```

### Option 3: Local Development

```bash
# Set environment variable
export DEEPL_API_KEY=your_key_here

# Generate translations
npm run translate

# Rebuild container to include new files
docker compose build --no-cache app
docker compose up -d
```

## Behavior Matrix

| Scenario | DeepL Key | Translation Files | Behavior |
|----------|-----------|-------------------|----------|
| **First Deploy** | ✅ Set | ❌ Missing | Auto-generates on startup (~30k tokens) |
| **Subsequent Restarts** | ✅ Set | ✅ Exist in volume | Skips generation (0 tokens) |
| **Subsequent Rebuilds** | ✅ Set | ✅ Exist in volume | Skips generation (0 tokens) - volume persists! |
| **No API Key** | ❌ Not Set | ❌ Missing | Continues without translations |
| **Manual Update** | ✅ Set | ✅ Exist | Run `npm run translate` manually |

## Volume-Based Persistence

Translation files and cache are stored in Docker volumes at:
- `./data/translations` → `/app/src/lang` (translation files: pt.json, es.json, etc.)
- `./data/translation-cache` → `/app/scripts` (DeepL API cache: .translation-cache.json)

**Benefits:**
- ✅ Translations persist between container rebuilds
- ✅ Cache persists between rebuilds (99% cost savings on updates)
- ✅ Only first deployment uses DeepL API (~30k tokens)
- ✅ All subsequent rebuilds: 0 tokens
- ✅ When you update `en.json`, only changed items are translated

## Best Practices

### For Development

**Option A: Volume-Based (Recommended)**
1. **Set DeepL API key** in `.env` file
2. **First container start** generates translations in volume
3. **Subsequent rebuilds** use cached translations (0 cost)
4. **Volume persists** between rebuilds in `./data/translations/`

**Option B: Commit to Git**
1. **Set DeepL API key** in `.env` file
2. **Run translations locally**:
   ```bash
   npm run translate
   git add src/lang/*.json
   git add scripts/.translation-cache.json  # Optional: commit cache too
   git commit -m "Update translations"
   ```
3. **Team benefits** from shared translations (no API usage)

### For Production

**With Volume Persistence:**
1. **Include DeepL key** in production environment
2. **First deployment** generates translations (~30k tokens)
3. **All subsequent deployments/rebuilds** use volume (0 tokens)
4. **Backup volume** periodically: `./data/translations/`

**Without Volumes (commit to git):**
1. **Pre-generate translations** locally and commit
2. **Container starts instantly** (no generation needed)
3. **Zero startup cost** (translations in Docker image)

### For CI/CD

```yaml
# .github/workflows/docker-build.yml
- name: Generate translations before build
  env:
    DEEPL_API_KEY: ${{ secrets.DEEPL_API_KEY }}
  run: npm run translate

- name: Build Docker image
  run: docker build -t menufic .
```

## Cost Management

### First Deployment
- Translation files don't exist
- Container generates them automatically
- **Cost**: ~250,000 tokens (one-time)

### All Subsequent Deployments
- Translation files exist in Docker image
- Container skips generation
- **Cost**: 0 tokens

### When to Regenerate
Only regenerate translations when:
- You added new UI text to `en.json`
- You modified existing English text
- You added a new feature (like allergen labels)

### Recommended Workflow
1. **Develop locally** with translations committed
2. **Production deploys** use pre-generated files
3. **Manual updates** only when needed
4. **Result**: ~99% cost savings

## Troubleshooting

### Container fails to start with translation errors

**Check logs:**
```bash
docker compose logs app | grep -A 10 "Translation"
```

**Common issues:**
- Invalid DeepL API key
- Network issues reaching DeepL API
- Quota exceeded (free tier: 500k/month)

**Solution:**
The container will continue starting even if translation fails. You can:
1. Fix the API key and restart
2. Generate translations manually later
3. Pre-generate translations locally and commit them

### Translations not updating

If you modified `en.json` but translations aren't updating:

```bash
# Force regeneration by removing existing files
docker exec menufic rm -f src/lang/{pt,es,fr,de,it}.json

# Restart container to trigger auto-generation
docker compose restart app
```

Or regenerate manually:
```bash
docker exec menufic npm run translate
docker compose restart app
```

### Application shows English instead of translations

1. **Check translation files exist:**
   ```bash
   docker exec menufic ls src/lang/
   # Should show: en.json, pt.json, es.json, fr.json, de.json, it.json
   ```

2. **Check URL has language parameter:**
   ```
   https://yoursite.com/venue/xyz/menu?lang=ES
   ```

3. **Rebuild container:**
   ```bash
   docker compose build --no-cache app
   docker compose up -d
   ```

## Advanced Configuration

### Disable Automatic Translation

If you prefer to manage translations manually:

1. **Don't set `DEEPL_API_KEY`** in production environment
2. **Pre-generate translations** locally and commit them
3. **Container will skip** automatic generation
4. **Update manually** when needed using `npm run translate`

### Custom Language Support

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
    ja: "JA",  // Add Japanese
};
```

Then regenerate:
```bash
npm run translate
docker compose build --no-cache app
```

## Summary

✅ **Automatic**: Translations generated on first container startup
✅ **Smart**: Skips generation if files already exist
✅ **Cost-effective**: 99% savings with intelligent caching
✅ **Flexible**: Can be manual or automatic
✅ **Failsafe**: Container starts even if translation fails
✅ **Production-ready**: Zero startup cost when pre-generated

For more details, see:
- [scripts/README.md](scripts/README.md) - Translation script documentation
- [TRANSLATION_SYSTEM.md](TRANSLATION_SYSTEM.md) - Complete translation system guide
