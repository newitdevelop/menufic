# Translation System Documentation

## Overview

Menufic uses a **dual translation system**:

1. **Static UI Text** (buttons, labels, etc.) - Translated via JSON files
2. **Dynamic Content** (menu items, categories) - Translated via DeepL API with database caching

## 1. Static UI Text Translation

### How It Works

Static text is stored in JSON files in `src/lang/`:
- `en.json` - English (source)
- `pt.json` - Portuguese
- `es.json` - Spanish
- `fr.json` - French
- `de.json` - German
- `it.json` - Italian

### When to Use

For any text that is:
- Part of the user interface (buttons, labels, headers)
- The same across all restaurants
- Defined at build time

Examples:
- Button labels: "Save", "Cancel", "Delete"
- Form labels: "Name", "Price", "Description"
- Allergen names: "Cereals containing gluten", "Fish", "Nuts"
- Footer links: "Privacy Policy", "Terms & Conditions"

### Generating Translations

After modifying `en.json`, regenerate all language files:

```bash
# Set your DeepL API key
export DEEPL_API_KEY=your_key_here

# Generate translations
npm run translate
```

This will automatically:
1. Read `en.json`
2. Translate to all supported languages
3. Save translated JSON files
4. Preserve placeholders like `{name}`, `{year}`

### Rebuild Docker Container

After generating new translations, rebuild the container:

```bash
docker compose build --no-cache app
docker compose up -d
```

## 2. Dynamic Content Translation

### How It Works

Restaurant content (menu items, categories, menus) is translated on-demand:
- First request → DeepL API call → Cache in database
- Subsequent requests → Retrieve from cache
- Content updates → Cache invalidated

### When to Use

For any text that is:
- User-generated content
- Specific to each restaurant
- Dynamic/editable

Examples:
- Menu item names: "Grilled Salmon", "Chocolate Cake"
- Menu item descriptions: "Fresh Atlantic salmon with herbs..."
- Category names: "Appetizers", "Main Courses"
- Menu details: "Available 12:00-15:00"

### Database Schema

```sql
CREATE TABLE Translation (
    id            TEXT PRIMARY KEY,
    entityType    TEXT NOT NULL,      -- 'menuItem', 'category', or 'menu'
    entityId      TEXT NOT NULL,      -- ID of the menu item/category/menu
    language      TEXT NOT NULL,      -- 'ES', 'FR', 'DE', etc.
    field         TEXT NOT NULL,      -- 'name', 'description', etc.
    translated    TEXT NOT NULL,      -- The translated text
    createdAt     TIMESTAMP DEFAULT NOW()
);
```

### API Usage

The translation happens automatically in the backend:

```typescript
// src/server/api/routers/menu.router.ts
const menuData = await translateMenu(menu, language);
const categories = await Promise.all(
    menu.categories.map(async (category) => {
        const translatedCategory = await translateCategory(category, language);
        const items = await Promise.all(
            category.items.map((item) => translateMenuItem(item, language))
        );
        return { ...translatedCategory, items };
    })
);
```

### Cache Invalidation

When content is updated, the cache is automatically cleared:

```typescript
// On menu item update
await invalidateTranslations('menuItem', menuItemId);
```

## 3. Workflow for Adding New Features

When adding new UI text (like allergen labels):

### Step 1: Add English Text

Edit `src/lang/en.json`:

```json
{
    "common": {
        "allergens": {
            "cereals": "Cereals containing gluten",
            "fish": "Fish",
            "nuts": "Nuts"
        }
    }
}
```

### Step 2: Use in Components

```typescript
import { useTranslations } from "next-intl";

const tCommon = useTranslations("common");

<Badge>{tCommon(`allergens.${allergenCode}`)}</Badge>
```

### Step 3: Generate Translations

```bash
export DEEPL_API_KEY=your_key_here
npm run translate
```

This creates/updates:
- `pt.json` with "Cereais que contêm glúten", "Peixe", "Nozes"
- `es.json` with "Cereales que contienen gluten", "Pescado", "Nueces"
- `fr.json` with "Céréales contenant du gluten", "Poisson", "Noix"
- etc.

### Step 4: Rebuild & Deploy

```bash
docker compose build --no-cache app
docker compose up -d
```

## 4. Language Detection

The system detects language from the URL:

```
/venue/{restaurantId}/menu?lang=ES    → Spanish
/venue/{restaurantId}/menu?lang=FR    → French
/venue/{restaurantId}/menu?lang=PT    → Portuguese (default)
/venue/{restaurantId}/menu            → Portuguese (default)
```

## 5. Supported Languages

| Code | Language | Status |
|------|----------|--------|
| PT   | Portuguese | ✅ Default |
| ES   | Spanish | ✅ Full support |
| FR   | French | ✅ Full support |
| DE   | German | ✅ Full support |
| IT   | Italian | ✅ Full support |

## 6. Best Practices

### DO ✅
- Always edit `en.json` as the source of truth
- Run `npm run translate` after any `en.json` changes
- Use descriptive translation keys: `allergens.cereals` not just `cereals`
- Preserve placeholders: `{name}`, `{year}`, `{count}`
- Rebuild Docker after translation changes

### DON'T ❌
- Don't manually edit `pt.json`, `es.json`, etc. - they're auto-generated
- Don't hardcode text in components - always use translation keys
- Don't forget to rebuild after generating translations
- Don't commit changes without testing all languages

## 7. Testing Translations

### Manual Testing

Visit your menu with different language codes:
```
https://menufic.com/venue/abc123/menu?lang=ES
https://menufic.com/venue/abc123/menu?lang=FR
https://menufic.com/venue/abc123/menu?lang=DE
```

### Automated Testing

Check that all translation files exist:
```bash
ls src/lang/*.json
# Should show: en.json, pt.json, es.json, fr.json, de.json, it.json
```

## 8. Cost Management

### DeepL Pricing
- **Free tier**: 500,000 characters/month
- **Pro**: $5.49/month for 1M characters
- **Advanced**: $28.99/month for 5M characters

### Optimization Tips
- Only translate when `en.json` changes
- Use translation memory (cached in JSON files)
- Don't re-run translation unnecessarily
- Consider manual review for critical text

## 9. Troubleshooting

### Translations Not Showing

1. **Check JSON files exist**
   ```bash
   ls src/lang/
   ```

2. **Verify Docker rebuild**
   ```bash
   docker compose build --no-cache app
   ```

3. **Check browser console** for missing translation keys

4. **Verify language parameter** in URL: `?lang=ES`

### DeepL API Errors

- **"Quota exceeded"**: Upgrade plan or wait for monthly reset
- **"Invalid API key"**: Check environment variable
- **"Unsupported language"**: Verify language code

### Dynamic Content Not Translating

1. Check DeepL API key in server environment
2. Verify database has Translation table
3. Check server logs for API errors
4. Clear translation cache: `DELETE FROM Translation WHERE entityId = 'xxx'`

## 10. Future Enhancements

Potential improvements:
- Add more languages (Arabic, Chinese, Japanese)
- Implement translation glossary for technical terms
- Add A/B testing for translation quality
- Automated translation on git push
- Translation quality review workflow
- Fallback language chain (PT → ES → EN)
