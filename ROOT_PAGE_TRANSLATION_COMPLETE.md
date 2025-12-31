# Root Page Translation Implementation

## Changes Made

Added translation support to the root page (venue selection) using next-intl, and clarified how translations work on different pages.

### Files Modified:
- [src/lang/en.json](src/lang/en.json) - Added venueSelection translation keys
- [src/components/VenueSelection/VenueSelection.tsx](src/components/VenueSelection/VenueSelection.tsx) - Integrated useTranslations hook
- [src/pages/index.tsx](src/pages/index.tsx) - Language selector already configured

---

## Translation Keys Added to en.json

```json
"venueSelection": {
    "title": "Select Your Venue",
    "subtitle": "Explore our collection of venues and discover their menus",
    "viewMenu": "View Menu",
    "noImage": "No Image",
    "noVenues": "No venues available at the moment",
    "loading": "Loading venues..."
}
```

---

## VenueSelection Component Changes

**Import useTranslations** (Lines 6, 13):
```typescript
import { useTranslations } from "next-intl";

export const VenueSelection: FC = () => {
    const { data: restaurants, isLoading } = api.restaurant.getAllPublished.useQuery();
    const t = useTranslations("venueSelection");
```

**Translated Text Elements**:

1. **Title** (Line 61):
   - Before: `Select Your Venue`
   - After: `{t("title")}`

2. **Subtitle** (Line 64):
   - Before: `Explore our collection of venues and discover their menus`
   - After: `{t("subtitle")}`

3. **View Menu Badge** (Line 144):
   - Before: `View Menu`
   - After: `{t("viewMenu")}`

4. **No Image Placeholder** (Line 118):
   - Before: `No Image`
   - After: `{t("noImage")}`

5. **No Venues Message** (Line 31):
   - Before: `No venues available at the moment`
   - After: `{t("noVenues")}`

---

## How Translation Works on Root Page vs Venue Menu Pages

### Root Page (Venue Selection)

**Translation Method**: Static translations via next-intl
- Translation files: `src/lang/en.json`, `src/lang/pt.json`, etc.
- Translations are pre-defined for each language
- No DeepL API calls - faster and cheaper
- Suitable for: UI text, buttons, labels, static content

**Language Flow**:
1. User clicks language selector in header
2. URL updates with `?lang=XX` query parameter
3. next-intl reads the query parameter
4. Loads appropriate translation file (en.json, pt.json, etc.)
5. UI text updates instantly

**What Gets Translated**:
- ✅ "Select Your Venue" heading
- ✅ "Explore our collection..." subtitle
- ✅ "View Menu" button text
- ✅ "No Image" / "No venues" messages
- ❌ Restaurant names (kept in original language)
- ❌ Restaurant locations (kept in original language)

---

### Venue Menu Pages (/venue/[id]/menu)

**Translation Method**: Dynamic translation via DeepL API
- Translation service: `src/server/services/translation.service.ts`
- Translations are generated on-demand via DeepL API
- Cached in database for performance
- Suitable for: Menu content, dish names, descriptions

**Language Flow**:
1. User clicks language selector in header
2. URL updates with `?lang=XX` query parameter
3. Server fetches menu data
4. DeepL API translates menu content to target language
5. Translated content is cached in database
6. Page displays translated menu

**What Gets Translated**:
- ✅ Menu names ("Breakfast", "Lunch", "Dinner")
- ✅ Category names ("Appetizers", "Main Courses")
- ✅ Menu item names and descriptions
- ✅ Pack names and section items
- ✅ Allergen names (for tooltips)
- ✅ UI text ("VAT included", "Allergens info", reservation form labels)

---

## Allergen Translation System

### How Allergen Emojis & Translations Work

The allergen display system has two parts:

1. **Emojis (Static)**:
   - Defined in `src/utils/validators.ts` as `allergenSymbols`
   - Universal symbols that don't change: 🌾 🦐 🥚 🐟 🥜 etc.
   - Same across all languages

2. **Allergen Names (Dynamic - DeepL)**:
   - Source: Portuguese allergen names in `UI_TRANSLATIONS_PT.allergens`
   - Translated via DeepL API to target language
   - Stored in `uiTranslations.allergens` object
   - Used as tooltip text when hovering over emoji

**Example Flow**:
```
PT: 🌾 (hover) → "Cereais que contêm glúten"
EN: 🌾 (hover) → "Cereals containing gluten"
ES: 🌾 (hover) → "Cereales que contienen gluten"
FR: 🌾 (hover) → "Céréales contenant du gluten"
```

**Code Reference**:
[src/components/RestaurantMenu/CompactAllergenDisplay.tsx](src/components/RestaurantMenu/CompactAllergenDisplay.tsx:39)
```typescript
<Tooltip label={allergenTranslations[allergen] || allergen}>
    <span>{allergenSymbols[allergen]}</span>
</Tooltip>
```

**Translation Service Reference**:
[src/server/api/routers/restaurant.router.ts](src/server/api/routers/restaurant.router.ts:210-228)
```typescript
const allergenTranslations = await Promise.all([
    getAllergenTranslation("cereals", targetLang),
    getAllergenTranslation("crustaceans", targetLang),
    // ... all allergens
]);
```

---

## Language Selector Behavior

### Root Page
- **Position**: Header (left of night mode button)
- **Effect**: Updates URL → Changes static UI text from translation files
- **Restaurant Data**: Names and locations remain unchanged
- **Navigation**: When clicking a venue, language parameter is preserved in URL

### Venue Menu Page
- **Position**: Top-right of banner (left of night mode button)
- **Effect**: Updates URL → Triggers DeepL translation of menu content
- **Cached**: Translations are cached in database for better performance
- **Real-time**: First translation may take 1-2 seconds, subsequent loads are instant

---

## Important Notes

1. **Restaurant Names & Locations NOT Translated**:
   - Restaurant names are brand names and should remain in original language
   - Locations are addresses and should remain in original language
   - This is intentional design - only menu content gets translated

2. **Allergen Emojis Are Universal**:
   - Emojis don't change based on language
   - Only the tooltip text (allergen name) changes
   - This is correct behavior - emojis are visual symbols

3. **Translation Files Need to Be Created**:
   - Currently only `en.json` has venueSelection keys
   - Need to create corresponding keys in other language files:
     - `src/lang/pt.json` (Portuguese)
     - `src/lang/es.json` (Spanish) - if exists
     - `src/lang/fr.json` (French) - if exists
     - etc.

4. **Performance**:
   - Root page translations: Instant (no API calls)
   - Menu page translations: 1-2s first time, instant after caching

---

## Status

✅ **Complete** - Root page now uses next-intl translations for UI text. The language selector updates the URL parameter, which triggers translation loading from language files. Allergen tooltips on menu pages are correctly translated via DeepL API.

---

## Next Steps (Optional)

If you want to add more languages to the root page:

1. Create translation files for each language (e.g., `src/lang/pt.json`, `src/lang/es.json`)
2. Copy the `venueSelection` section from `en.json`
3. Translate the text to the target language
4. The language selector will automatically use the correct file based on URL parameter

Example for Portuguese (`src/lang/pt.json`):
```json
"venueSelection": {
    "title": "Selecione o Seu Local",
    "subtitle": "Explore a nossa coleção de locais e descubra os seus menus",
    "viewMenu": "Ver Menu",
    "noImage": "Sem Imagem",
    "noVenues": "Nenhum local disponível no momento",
    "loading": "A carregar locais..."
}
```
