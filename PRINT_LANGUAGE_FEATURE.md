# Print Menu with Language Selection

## Feature Overview

When clicking the print button next to a menu in the admin panel, a modal now appears allowing you to select the language for printing. This ensures the menu is printed in the correct language with proper translations.

## How It Works

1. **Click Print Icon** - Next to any menu in the edit-menu page
2. **Select Language** - A modal appears with language options:
   - 🇵🇹 Português (PT)
   - 🇬🇧 English (EN)
   - 🇪🇸 Español (ES)
   - 🇫🇷 Français (FR)
   - 🇩🇪 Deutsch (DE)
   - 🇮🇹 Italiano (IT)

3. **Print Opens** - The menu page opens in a new window with:
   - The selected language parameter (`?lang=XX`)
   - The specific menu ID (`&menuId=xxx`)
   - Print dialog automatically triggered

## Files Created/Modified

### New Files
- `src/components/PrintLanguageModal/PrintLanguageModal.tsx` - Language selection modal component
- `src/components/PrintLanguageModal/index.ts` - Export file

### Modified Files
- `src/components/EditMenu/Menus/MenuElement.tsx` - Added language modal integration
- `src/lang/en.json` - Added translation keys for the modal

## Technical Details

### URL Structure

The print URL is constructed as:
```
/venue/{restaurantId}/menu?lang={languageCode}&menuId={menuId}
```

For Portuguese (default language), the `lang` parameter is omitted:
```
/venue/{restaurantId}/menu?menuId={menuId}
```

### Modal Component

The `PrintLanguageModal` component:
- Displays language options with flag emojis
- Constructs the correct URL based on selected language
- Opens the menu page in a new window
- Triggers print dialog after page loads (1 second delay)

### Translation Integration

The modal uses the DeepL-powered translation system:
- Content stored in Portuguese (PT) in the database
- On-demand translation to selected language
- Cached translations for better performance

## Print Styles

The menu page includes comprehensive print CSS:
- A4 paper size with 1.5cm margins
- Hides navigation, footer, and images
- Black text for good contrast
- Page break controls for readability

## User Experience

1. Admin clicks print icon
2. Modal appears with language choices
3. Admin selects desired language (e.g., English)
4. New window opens with English translation
5. Print dialog appears automatically
6. Menu prints in selected language

## Example Usage

**Scenario**: Restaurant wants to print menu in English for tourists

1. Go to edit-menu page
2. Click printer icon next to "Menu Principal"
3. Select "🇬🇧 English"
4. Menu opens translated to English
5. Print dialog appears
6. Print menu

## Language Support

Currently supports 6 languages:
- Portuguese (PT) - Source language
- English (EN)
- Spanish (ES)
- French (FR)
- German (DE)
- Italian (IT)

Additional languages can be added by:
1. Adding to `LANGUAGES` array in `PrintLanguageModal.tsx`
2. Ensuring DeepL API supports the language
3. Testing translation quality

## Dependencies

- **DeepL API** - Must be configured for translations to work
- **Mantine UI** - For modal and button components
- **next-intl** - For UI translation (modal title/description)

## Future Improvements

Possible enhancements:
1. Remember last selected language per user
2. Show preview before printing
3. Add custom print settings (margins, orientation)
4. Batch print multiple menus
5. Export to PDF instead of printing
