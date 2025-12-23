# Volume-Based Translation Persistence

## Overview

Translation files and cache are stored in Docker volumes to persist between container rebuilds. This eliminates the need to regenerate translations on every rebuild, saving DeepL API costs.

## How It Works

### Volume Mapping

```yaml
volumes:
  - ./data/translations:/app/src/lang
  - ./data/translation-cache/.translation-cache.json:/app/scripts/.translation-cache.json
```

**Note**: We mount only the cache file (not the entire scripts directory) to avoid overriding the translation script itself.

### Directory Structure

```
data/
├── translations/           # Translation files persist here
│   ├── en.json            # English source (copied from src/lang/)
│   ├── pt.json            # Portuguese (auto-generated)
│   ├── es.json            # Spanish (auto-generated)
│   ├── fr.json            # French (auto-generated)
│   ├── de.json            # German (auto-generated)
│   └── it.json            # Italian (auto-generated)
└── translation-cache/      # DeepL API cache persists here
    └── .translation-cache.json  # MD5 hash cache
```

## Lifecycle

### First Container Start (Fresh Install)

1. Container starts with empty volumes
2. `docker-entrypoint.sh` detects missing translation files
3. Runs `npm run translate` (selective translation)
4. Generates translations using DeepL API (~30,000 tokens)
5. Saves files to volume at `./data/translations/`
6. Saves cache to volume at `./data/translation-cache/`
7. Application starts with all languages available

**Cost: ~30,000 DeepL tokens** (one-time)

### Subsequent Container Restarts

1. Container restarts
2. Volumes still contain translation files
3. `docker-entrypoint.sh` detects existing files
4. Skips translation generation
5. Application starts immediately

**Cost: 0 tokens**

### Subsequent Container Rebuilds

1. Rebuild Docker image: `docker compose build --no-cache app`
2. New image built
3. Container starts with same volumes mounted
4. Volumes still contain translation files
5. `docker-entrypoint.sh` detects existing files
6. Skips translation generation
7. Application starts immediately

**Cost: 0 tokens** ✅ This is the key benefit!

### Updating Translations (Adding New Text)

1. Modify `src/lang/en.json` (add new menu items, allergens, etc.)
2. Rebuild Docker image: `docker compose build --no-cache app`
3. Container starts, detects existing translations
4. **Manual update needed**: `docker exec menufic npm run translate`
5. Script uses cache to skip unchanged text
6. Only translates new/modified text

**Cost: Only changed items** (e.g., 5 new items × 5 languages = ~500 tokens)

## Cache Efficiency

The `.translation-cache.json` file stores MD5 hashes of all translations:

```json
{
  "PT:a1b2c3d4": "Guardar",
  "ES:a1b2c3d4": "Guardar",
  "FR:a1b2c3d4": "Enregistrer",
  ...
}
```

### How Cache Saves Costs

**Without Cache:**
- Modify 1 English string
- Re-translate all 34 items × 5 languages = 170 API calls

**With Cache:**
- Modify 1 English string
- Cache hits for 33 unchanged items
- Only 1 item × 5 languages = 5 API calls
- **97% cost savings**

## Managing Volumes

### View Volume Contents

```bash
# List translation files
ls -la data/translations/

# View cache
cat data/translation-cache/.translation-cache.json
```

### Backup Volumes

```bash
# Backup translations
tar -czf translations-backup.tar.gz data/translations/

# Backup cache
tar -czf cache-backup.tar.gz data/translation-cache/
```

### Reset Translations

```bash
# Stop container
docker compose down

# Clear volumes
rm -rf data/translations/*.json
rm -rf data/translation-cache/.translation-cache.json

# Restart (will regenerate)
docker compose up -d
```

### Manually Update Translations

```bash
# Enter running container
docker exec -it menufic bash

# Run translation update
npm run translate

# Exit container
exit

# Restart to apply changes (optional)
docker compose restart menufic
```

## Cost Comparison

### Without Volumes (Old Approach)

| Event | Cost |
|-------|------|
| First build | 30,000 tokens |
| Second build | 30,000 tokens |
| Third build | 30,000 tokens |
| Add 5 new items | 30,000 tokens (full re-translation) |
| **Total (4 events)** | **120,000 tokens** |

### With Volumes (New Approach)

| Event | Cost |
|-------|------|
| First build | 30,000 tokens |
| Second build | 0 tokens ✅ |
| Third build | 0 tokens ✅ |
| Add 5 new items | 500 tokens ✅ (only new items) |
| **Total (4 events)** | **30,500 tokens** |

**Savings: 89,500 tokens (75% reduction)**

## Troubleshooting

### Translations regenerating on every rebuild

**Symptom:** Container logs show "34 translated | 0 from cache" on each rebuild

**Cause:** Volumes not being mounted or persisted

**Solution:**
```bash
# Check if volumes exist
ls -la data/translations/
ls -la data/translation-cache/

# Recreate container with volumes
docker compose down
docker compose up -d
```

### Cache not working

**Symptom:** High API usage even when text hasn't changed

**Cause:** `.translation-cache.json` not persisting

**Solution:**
```bash
# Check if cache file exists
ls -la data/translation-cache/.translation-cache.json

# If missing, regenerate
docker exec menufic npm run translate
```

### Volume permissions issues

**Symptom:** Cannot write to volume directories

**Solution (Linux/Mac):**
```bash
# Fix permissions
sudo chown -R $USER:$USER data/
chmod -R 755 data/
```

**Solution (Windows):**
```powershell
# Ensure Docker Desktop has access to the drive
# Docker Desktop > Settings > Resources > File Sharing
```

## Best Practices

1. **Never delete volumes** unless you want to regenerate everything
2. **Backup volumes** before major changes
3. **Commit generated files to git** for team sharing (optional)
4. **Monitor DeepL usage** via their dashboard
5. **Use selective translation** to minimize API calls

## Summary

Volume-based translation persistence:
- ✅ Translations survive container rebuilds
- ✅ Cache reduces costs by 97% on updates
- ✅ Zero cost for rebuilds after first generation
- ✅ Easy to backup and restore
- ✅ No manual intervention needed

Perfect for production deployments where you rebuild containers frequently!
