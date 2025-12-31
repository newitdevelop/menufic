# Language Selector and Image Fix on Root Page

## Changes Made

Added language selector to the venue selection page (root page), fixed venue images to display correctly, and cleaned up the subtitle text.

### File Modified: [src/components/VenueSelection/VenueSelection.tsx](src/components/VenueSelection/VenueSelection.tsx)

## 1. Fixed Venue Images - Using ImageKitImage Component

**Import Change** (Lines 4, 9):
```typescript
// Removed: import { Image } from "@mantine/core";
import { ImageKitImage } from "../ImageKitImage";
```

**Image Rendering** (Lines 108-117):
```typescript
{restaurant.image ? (
    <ImageKitImage
        blurhash={restaurant.image.blurHash}
        color={restaurant.image.color}
        height={400}
        imageAlt={restaurant.name}
        imagePath={restaurant.image.path}
        width={600}
    />
) : (
    <Box>No Image</Box>
)}
```

**Before (Incorrect)**:
- Manually constructed URL: `https://ik.imagekit.io/${restaurant.image.path}`
- Used Mantine's `<Image>` component
- Images failed to load with 404 errors

**After (Correct)**:
- Uses `ImageKitImage` component which correctly constructs URL from `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` env variable
- Includes blurhash for progressive loading
- Includes color background for better UX
- Matches the implementation used on venue menu pages

## 2. Added Language Selector Component

**Import and State Management** (Lines 2, 9, 13):
```typescript
import { useState } from "react";
import { LanguageSelector } from "../LanguageSelector";

// Inside component:
const [language, setLanguage] = useState<string>("PT");
```

**Positioned Language Selector** (Lines 50-59):
```typescript
<Box
    sx={{
        position: "absolute",
        right: 24,
        top: 80,  // Positioned below header (60px) + margin
        zIndex: 10,
    }}
>
    <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />
</Box>
```

The language selector is positioned in the top-right corner of the venue selection page at `top: 80px` to account for the NavHeader height (60px), ensuring it appears below the header.

## 3. Removed Word "Dining" from Subtitle

**Line 74-75** - Changed subtitle text:

**Before**:
```typescript
<Text align="center" color="dimmed" size="xl" sx={{ maxWidth: 600 }}>
    Explore our collection of dining venues and discover their menus
</Text>
```

**After**:
```typescript
<Text align="center" color="dimmed" size="xl" sx={{ maxWidth: 600 }}>
    Explore our collection of venues and discover their menus
</Text>
```

## 3. Cleaned Up Debug Code

Removed the following debug console.log statements:
- Line 13: `console.log("Restaurants data:", restaurants);`
- Line 74: `console.log(\`Restaurant: ${restaurant.name}, Image path: ${restaurant.image?.path}, Full URL: ${imageUrl}\`);`

## Features

### Language Selector Capabilities
- **6 Supported Languages**: Portuguese (PT), English (EN), Spanish (ES), French (FR), German (DE), Italian (IT)
- **Visual Indicator**: Shows flag emoji and language code
- **Dropdown Menu**: Click to see all available languages
- **Keyboard Shortcuts**: Press 1-6 to switch languages (1=PT, 2=EN, 3=ES, 4=FR, 5=DE, 6=IT)
- **Persistent State**: Selected language is stored in component state

### Current Implementation Note

The language selector is currently **display-only** on the root page. Unlike the venue menu pages which use the language parameter to fetch translated content from the server via DeepL, the root page does not yet translate the venue names, locations, or other text.

To fully implement translation on the root page, you would need to:
1. Pass the `language` state to API calls or next-intl translation hooks
2. Add translation keys for "Select Your Venue" and "Explore our collection of venues..."
3. Optionally translate restaurant names and locations (though these are typically kept in original language)

## Visual Layout

```
┌────────────────────────────────────────────────────────────┐
│                                          [🇵🇹 PT ▼]        │  ← Language Selector
│                                                            │
│                    Select Your Venue                       │
│          Explore our collection of venues and              │
│                  discover their menus                      │
│                                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │  Venue 1 │  │  Venue 2 │  │  Venue 3 │                │
│  └──────────┘  └──────────┘  └──────────┘                │
└────────────────────────────────────────────────────────────┘
```

## Benefits

- ✅ **Consistent UX** - Language selector appears in same position as venue menu pages
- ✅ **Cleaner Subtitle** - Removed redundant word "dining" (venues are implicitly dining establishments)
- ✅ **Production Ready** - Removed debug console.log statements
- ✅ **Accessibility** - Users can select their preferred language before viewing venue menus
- ✅ **Future-Proof** - Language state is ready for full translation implementation

## Testing

1. **Visual Test** - Language selector appears in top-right corner with PT flag and code
2. **Interaction Test** - Click language selector to see dropdown with 6 languages
3. **State Test** - Select different language, selector updates to show new selection
4. **Keyboard Test** - Press 1-6 keys to switch languages quickly
5. **Subtitle Test** - Verify text reads "Explore our collection of venues..." (no "dining")
6. **Console Test** - Verify no debug console.log statements appear in browser console

## Status

✅ **Complete** - Language selector added to root page and subtitle cleaned up.
