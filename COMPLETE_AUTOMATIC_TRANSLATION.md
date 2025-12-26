# Complete Automatic Translation System

## Overview
The entire application now uses **automatic DeepL translation** for all user-facing text. No manual translation files needed - everything is translated server-side and cached in the database.

## What Gets Translated

### 1. Menu Content
- Menu names
- Menu available times
- Menu messages
- Category names
- Menu item names
- Menu item descriptions

### 2. Image Disclaimers
- AI-generated image disclaimer
- Manual image disclaimer

### 3. UI Text
- "IVA incluído" (VAT included)
- "Pode conter os seguintes alergénios" (Might contain the following allergens)
- All 14 allergen names

## Source Language: Portuguese (PT)

All content is created in Portuguese and automatically translated to other languages via DeepL.

## How It Works

### Backend (Server-Side)

#### 1. Translation Service ([translation.service.ts](src/server/services/translation.service.ts))

**Functions:**
- `getOrCreateTranslation()` - Core translation function with database caching
- `translateMenuItem()` - Translate menu item name & description
- `translateCategory()` - Translate category name
- `translateMenu()` - Translate menu name, availableTime, message
- `getImageDisclaimer()` - Get translated image disclaimer
- `getUITranslation()` - Get translated UI text (VAT, allergens info)
- `getAllergenTranslation()` - Get translated allergen name

**Portuguese Source Text:**
```typescript
const UI_TRANSLATIONS_PT = {
    vatIncluded: "IVA incluído",
    allergensInfo: "Pode conter os seguintes alergénios",
    allergens: {
        cereals: "Cereais que contêm glúten",
        crustaceans: "Crustáceos",
        eggs: "Ovos",
        fish: "Peixe",
        peanuts: "Amendoins",
        soybeans: "Soja",
        milk: "Leite",
        nuts: "Frutos de casca rija",
        celery: "Aipo",
        mustard: "Mostarda",
        sesame: "Sementes de sésamo",
        sulphites: "Dióxido de enxofre e sulfitos",
        lupin: "Tremoço",
        molluscs: "Moluscos",
        none: "Nenhum",
    },
};
```

#### 2. Restaurant Router ([restaurant.router.ts](src/server/api/routers/restaurant.router.ts))

When fetching a restaurant menu:
1. Gets UI translations (VAT text, allergen names, etc.)
2. Translates all menu content (names, descriptions)
3. Adds translated disclaimers to images
4. Attaches `uiTranslations` object to each menu item

**Response Structure:**
```typescript
{
    ...restaurant,
    menus: [
        {
            ...menu,
            categories: [
                {
                    ...category,
                    items: [
                        {
                            ...item,
                            image: {
                                ...image,
                                disclaimer: "translated disclaimer text"
                            },
                            uiTranslations: {
                                vatIncluded: "translated VAT text",
                                allergensInfo: "translated allergens text",
                                allergens: {
                                    cereals: "translated cereals",
                                    milk: "translated milk",
                                    ...
                                }
                            }
                        }
                    ]
                }
            ]
        }
    ]
}
```

### Frontend (Client-Side)

#### ViewMenuItemModal & MenuItemCard

Components simply extract and use the pre-translated text:

```typescript
// Get UI translations from menu item (server-side translated)
const uiTranslations = (menuItem as any)?.uiTranslations || {
    vatIncluded: "IVA incluído",  // fallback to Portuguese
    allergensInfo: "Pode conter os seguintes alergénios",
    allergens: {},
};

// Use in JSX
<Text>{uiTranslations.vatIncluded}</Text>
<Text>{uiTranslations.allergensInfo}</Text>
<Text>{uiTranslations.allergens[allergenCode]}</Text>
<Text>{(menuItem?.image as any)?.disclaimer}</Text>
```

No client-side translation logic - everything arrives pre-translated from the API.

## Database Caching

All translations are cached in the `Translation` table:

| Field | Purpose | Example |
|-------|---------|---------|
| entityType | Type of entity | "menu", "menuItem", "category" |
| entityId | ID of entity or static key | Item ID, "ui-text", "ui-allergens", "ui-disclaimers" |
| language | Target language | "EN", "ES", "FR", "DE", etc. |
| field | Field being translated | "name", "description", "vatIncluded", "cereals" |
| translated | Translated text | The actual translation |

**Static Entity IDs for UI:**
- `"ui-text"` - UI text like "vatIncluded", "allergensInfo"
- `"ui-allergens"` - Allergen names
- `"ui-disclaimers"` - Image disclaimers

## Supported Languages

All DeepL-supported languages work automatically:
- Portuguese (PT) - source language
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

## Benefits

✅ **Zero manual translation** - No language files to maintain
✅ **Automatic for all languages** - Any DeepL language works instantly
✅ **Consistent system** - All text uses same translation approach
✅ **Performance optimized** - Database caching for speed
✅ **Cost efficient** - Each translation cached and reused
✅ **Easy to add new languages** - Just pass different language parameter

## Files Modified

**Backend:**
- `src/server/services/translation.service.ts` - Added UI translation functions
- `src/server/api/routers/restaurant.router.ts` - Added UI translations to menu response

**Frontend:**
- `src/components/RestaurantMenu/ViewMenuItemModal.tsx` - Use uiTranslations from API
- `src/components/RestaurantMenu/MenuItemCard.tsx` - Use uiTranslations from API

## Testing

1. **Portuguese (Source)**:
   ```
   GET /api/restaurant/{id}?language=PT
   ```
   Verify UI text appears in Portuguese

2. **English**:
   ```
   GET /api/restaurant/{id}?language=EN
   ```
   Verify all text translated to English

3. **Other Languages** (ES, FR, DE, etc.):
   ```
   GET /api/restaurant/{id}?language=XX
   ```
   Verify all text translated to target language

4. **Database Cache**:
   Check `Translation` table for cached entries with:
   - `entityId = "ui-text"`
   - `entityId = "ui-allergens"`
   - `entityId = "ui-disclaimers"`

## Migration

No database migration needed - uses existing `Translation` table.

Ensure you've run the previous migration for `isAiGenerated`:
```sql
ALTER TABLE "Image" ADD COLUMN "isAiGenerated" BOOLEAN NOT NULL DEFAULT false;
```

Then regenerate Prisma client:
```bash
npx prisma generate
```
