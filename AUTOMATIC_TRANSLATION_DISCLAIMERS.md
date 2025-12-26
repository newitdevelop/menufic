# Automatic Translation of Image Disclaimers

## Overview
Image disclaimers are now automatically translated using DeepL, just like menu item names and descriptions. No manual translation files are needed.

## How It Works

### Source Language: Portuguese (PT)
The disclaimer text is stored in Portuguese (the default content language):
- **AI-generated images**: "Imagem gerada por IA - o prato real pode variar"
- **Manual images**: "A apresentação real pode variar"

### Automatic Translation
When a menu is requested in a different language, the disclaimers are automatically:
1. Cached in the Translation table (same as menu content)
2. Translated via DeepL API
3. Attached to each menu item's image object
4. Displayed in the correct language

### Translation Service
The `getImageDisclaimer()` function in `src/server/services/translation.service.ts`:
- Returns Portuguese text for PT language
- Uses DeepL translation for all other languages
- Caches translations in the database (Translation table)
- Handles both AI-generated and manual image disclaimers

## Implementation Details

### Backend (Server-Side)

#### Translation Service ([translation.service.ts](src/server/services/translation.service.ts))
```typescript
export async function getImageDisclaimer(
    isAiGenerated: boolean,
    targetLang: string
): Promise<string>
```

Provides translated disclaimer based on:
- `isAiGenerated`: Boolean flag indicating AI vs manual image
- `targetLang`: Target language code (EN, ES, FR, DE, etc.)

#### Restaurant Router ([restaurant.router.ts](src/server/api/routers/restaurant.router.ts))
When fetching a restaurant menu:
1. Checks for each menu item with an image
2. Calls `getImageDisclaimer()` with the target language
3. Attaches the translated disclaimer to the image object
4. Returns the complete menu with translated disclaimers

### Frontend (Client-Side)

#### Components
Both `ViewMenuItemModal` and `MenuItemCard` simply display the `disclaimer` field from the image object:

```typescript
{(menuItem?.image as any)?.disclaimer && (
    <Text align="center" color="dimmed" fs="italic" size="xs">
        {(menuItem?.image as any).disclaimer}
    </Text>
)}
```

No client-side translation logic needed - the disclaimer arrives pre-translated from the API.

## Supported Languages

All languages supported by DeepL are automatically supported for disclaimers:
- English (EN-GB, EN-US)
- Portuguese (PT) - source language
- Spanish (ES)
- French (FR)
- German (DE)
- Italian (IT)
- Dutch (NL)
- Polish (PL)
- Russian (RU)
- Japanese (JA)
- Chinese (ZH)

## Database Caching

Disclaimers are cached in the Translation table using:
- **entityType**: "menu"
- **entityId**: "ui-disclaimers" (static ID for UI translations)
- **field**: "aiImageDisclaimer" or "imageDisclaimer"
- **language**: Target language code
- **translated**: The translated disclaimer text

This ensures:
- Fast performance (no repeated API calls)
- Cost efficiency (DeepL charges per character)
- Consistency across all menu items

## Benefits

1. **No Manual Translation**: No need to create/maintain language files
2. **Automatic Updates**: New languages work automatically via DeepL
3. **Consistent System**: Same translation approach as menu content
4. **Performance**: Cached translations for fast response
5. **Cost Efficient**: Disclaimers translated once and cached

## Files Modified

- `src/server/services/translation.service.ts` - Added `getImageDisclaimer()` function
- `src/server/api/routers/restaurant.router.ts` - Added disclaimer translation to menu queries
- `src/components/RestaurantMenu/ViewMenuItemModal.tsx` - Display disclaimer from API
- `src/components/RestaurantMenu/MenuItemCard.tsx` - Display disclaimer from API
- `src/lang/en.json` - Removed manual translation keys (not needed)

## Testing

1. **Portuguese (Source Language)**:
   - Request menu without language parameter or with `?language=PT`
   - Verify AI images show: "Imagem gerada por IA - o prato real pode variar"
   - Verify manual images show: "A apresentação real pode variar"

2. **English**:
   - Request menu with `?language=EN`
   - Verify AI images show translated disclaimer
   - Verify manual images show translated disclaimer

3. **Other Languages** (ES, FR, DE, etc.):
   - Request menu with `?language=XX`
   - Verify disclaimers appear in the requested language
   - Check database Translation table for cached entries

## Migration Notes

The Translation table already supports this feature - no schema changes needed. The `isAiGenerated` field in the Image table (added in previous migration) determines which disclaimer text to use.

Run database migration if you haven't already:
```sql
ALTER TABLE "Image" ADD COLUMN "isAiGenerated" BOOLEAN NOT NULL DEFAULT false;
```

Then regenerate Prisma client:
```bash
npx prisma generate
```
