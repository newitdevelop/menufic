# Language Selector and Image Fix on Root Page

## Changes Made

Added language selector to the header on root page (positioned to the left of night mode button), fixed venue images to display correctly, cleaned up the subtitle text, and simplified footer to show only copyright.

### Files Modified:
- [src/pages/index.tsx](src/pages/index.tsx) - Added language selector logic and footer customization
- [src/components/Header/Header.tsx](src/components/Header/Header.tsx) - Added language selector prop support
- [src/components/Footer/Footer.tsx](src/components/Footer/Footer.tsx) - Added copyrightOnly prop
- [src/components/VenueSelection/VenueSelection.tsx](src/components/VenueSelection/VenueSelection.tsx) - Fixed image rendering

---

## 1. Language Selector in Header (Left of Night Mode Button)

### src/pages/index.tsx

**Added Language State and Handler** (Lines 12-30):
```typescript
const router = useRouter();
const language = (router.query?.lang as string) || "PT";

const handleLanguageChange = (newLang: string) => {
    const currentQuery = { ...router.query };
    if (newLang === "PT") {
        delete currentQuery.lang;
    } else {
        currentQuery.lang = newLang;
    }
    router.push(
        {
            pathname: router.pathname,
            query: currentQuery,
        },
        undefined,
        { shallow: false }
    );
};
```

**Pass Language Selector to NavHeader** (Lines 40-48):
```typescript
<NavHeader
    showLoginButton
    withShadow
    languageSelector={
        <LanguageSelector
            currentLanguage={language}
            onLanguageChange={handleLanguageChange}
        />
    }
/>
```

### src/components/Header/Header.tsx

**Added languageSelector Prop** (Lines 43-44):
```typescript
interface Props {
    // ... other props
    /** Language selector component to show in header (optional) */
    languageSelector?: React.ReactNode;
}
```

**Render Language Selector Before Theme Switch** (Line 195):
```typescript
<Group align="center" spacing="lg" style={styles}>
    {/* Login button section */}

    {languageSelector}  {/* Positioned left of night mode button */}

    <ActionIcon /* Night mode button */
        aria-label="theme-switch"
        className={classes.themeSwitch}
        onClick={() => toggleColorScheme()}
        size={36}
    >
        {colorScheme === "dark" ? <IconSun size={18} /> : <IconMoonStars size={18} />}
    </ActionIcon>
</Group>
```

**Result**: Language selector now appears in the header, positioned to the left of the night mode button.

---

## 2. Footer - Copyright Only

### src/components/Footer/Footer.tsx

**Added copyrightOnly Prop** (Lines 63-64):
```typescript
interface Props {
    // ... other props
    /** Show only copyright, hide other links */
    copyrightOnly?: boolean;
}
```

**Conditional Link Rendering** (Lines 78-97):
```typescript
// Only show links if copyrightOnly is false
if (!copyrightOnly) {
    // Privacy Policy
    if (privacyUrl) {
        footerLinks.push({ label: t("privacyPolicy"), link: privacyUrl });
    }

    // Terms & Conditions
    if (termsUrl) {
        footerLinks.push({ label: t("terms&Conditions"), link: termsUrl });
    }

    // Complaint Book
    footerLinks.push({ label: t("complaintBook"), link: "https://www.livroreclamacoes.pt/inicio" });
}
```

**Conditional Group Rendering** (Line 111):
```typescript
<Footer className={classes.footer} height={isMobile ? "auto" : 50}>
    <Container className={classes.inner} size="xl">
        <Link className={classes.copyRights} href={env.NEXT_PUBLIC_APP_URL}>
            {t("footerCopyright", { appName: env.NEXT_PUBLIC_APP_NAME, year: currentYear })}
        </Link>
        {!copyrightOnly && <Group className={classes.links}>{items}</Group>}
    </Container>
</Footer>
```

### Usage in index.tsx (Line 51):
```typescript
<Footer copyrightOnly />
```

**Result**: Root page footer now shows only copyright text, no privacy policy, terms, or complaint book links.

---

## 3. Fixed Venue Images - Using ImageKitImage Component

### src/components/VenueSelection/VenueSelection.tsx

**Import Change** (Lines 7-8):
```typescript
import { api } from "src/utils/api";
import { ImageKitImage } from "../ImageKitImage";
```

**Image Rendering** (Lines 96-120):
```typescript
<Card.Section>
    <Box
        sx={{
            aspectRatio: "3 / 2",
            overflow: "hidden",
            position: "relative",
        }}
    >
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
            <Box
                sx={(theme) => ({
                    alignItems: "center",
                    backgroundColor: theme.colors.gray[1],
                    display: "flex",
                    height: "100%",
                    justifyContent: "center",
                    width: "100%",
                })}
            >
                <Text color="dimmed" size="sm">
                    No Image
                </Text>
            </Box>
        )}
    </Box>
</Card.Section>
```

**Before (Incorrect)**:
- Manually constructed URL: `https://ik.imagekit.io/${restaurant.image.path}`
- Used Mantine's `<Image>` component
- Images failed to load with 404 errors

**After (Correct)**:
- Uses `ImageKitImage` component which correctly constructs URL: `${env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/${imagePath}?tr=f-avif,w-600`
- Includes blurhash for progressive loading
- Includes color background for better UX
- Matches the implementation used on venue menu pages

---

## 4. Removed Word "Dining" from Subtitle

**Line 63** - Changed subtitle text in VenueSelection.tsx:

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

---

## Visual Layout

```
┌────────────────────────────────────────────────────────────┐
│  [Logo]              [Login]  [🇵🇹 PT ▼]  [🌙]  [User]     │  ← Header with Language Selector
├────────────────────────────────────────────────────────────┤
│                                                            │
│                    Select Your Venue                       │
│          Explore our collection of venues and              │
│                  discover their menus                      │
│                                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │  Image   │  │  Image   │  │  Image   │                │
│  │          │  │          │  │          │                │
│  │  Venue 1 │  │  Venue 2 │  │  Venue 3 │                │
│  │  📍 Loc  │  │  📍 Loc  │  │  📍 Loc  │                │
│  │  📞 Tel  │  │  📞 Tel  │  │  📞 Tel  │                │
│  └──────────┘  └──────────┘  └──────────┘                │
├────────────────────────────────────────────────────────────┤
│  © 2025 Menufic                                            │  ← Footer (Copyright Only)
└────────────────────────────────────────────────────────────┘
```

---

## Language Selector Features

- **6 Supported Languages**: Portuguese (PT), English (EN), Spanish (ES), French (FR), German (DE), Italian (IT)
- **Visual Indicator**: Shows flag emoji and language code
- **Dropdown Menu**: Click to see all available languages
- **Keyboard Shortcuts**: Press 1-6 to switch languages (1=PT, 2=EN, 3=ES, 4=FR, 5=DE, 6=IT)
- **URL State**: Language is stored in query parameter (`?lang=EN`)
- **Positioned Correctly**: Left of night mode button in header

---

## Current Implementation Note

The language selector on the root page currently updates the URL query parameter (`?lang=XX`). The static content on the venue selection page ("Select Your Venue", "Explore our collection...") is in English and is not yet translated.

To fully implement translation on the root page, you would need to:
1. Add translation keys for static text to language files
2. Use `useTranslations` hook to translate headings and descriptions
3. Optionally translate restaurant names and locations (though these are typically kept in original language)

The language parameter is passed through to venue menu pages when users click on a venue card, so users will see their selected language when they navigate to a venue.

---

## Benefits

- ✅ **Images Display Correctly** - Fixed 404 errors by using proper ImageKitImage component
- ✅ **Progressive Image Loading** - Blurhash provides smooth loading experience
- ✅ **Proper Header Integration** - Language selector in header, positioned left of night mode button
- ✅ **Cleaner Footer** - Only copyright shown on root page
- ✅ **Cleaner Subtitle** - Removed redundant word "dining"
- ✅ **Production Ready** - Clean code without debug statements
- ✅ **URL State Management** - Language persists via query parameters
- ✅ **Better Performance** - ImageKit optimizations with AVIF format and proper transformations

---

## Testing

1. **Image Test** - Verify venue images load correctly without 404 errors
2. **Blurhash Test** - Check that blurred placeholder appears before image loads
3. **Language Selector Position Test** - Verify it appears left of night mode button in header
4. **Language Change Test** - Click language selector, select different language, URL should update
5. **Keyboard Shortcut Test** - Press 1-6 keys to switch languages quickly
6. **Footer Test** - Verify only copyright appears in footer (no privacy policy, terms, complaint book)
7. **Subtitle Test** - Verify text reads "Explore our collection of venues..." (no "dining")
8. **Navigation Test** - Click venue card, verify language parameter carries over to venue page
9. **Responsive Test** - Check that header layout works on mobile/tablet

---

## Status

✅ **Complete** - Images fixed, language selector added to header (left of night mode), footer simplified to copyright only, and subtitle cleaned up.
