# Fixes Summary - December 26, 2025 (Part 2)

## Issues Addressed

Based on your screenshot and feedback, four issues were identified and fixed:

---

## ✅ Issue 1: Reservations Text Should Be Translated

**Problem:** The "Reservations" label was not being translated by browser translation features.

**Solution:** Changed `translate` attribute to `"yes"`:

**File:** [src/components/RestaurantMenu/RestaurantMenu.tsx:287](src/components/RestaurantMenu/RestaurantMenu.tsx#L287)

```typescript
<Text size="sm" translate="yes" weight={600} color={theme.colors.primary[6]}>
    {t("reservations")}
</Text>
```

**Result:** Browser translation will now translate "Reservations" → "Reservas" (ES), "Réservations" (FR), etc.

---

## ✅ Issue 2: Reservations Link Should Be Highlighted and On Top

**Problem:**
- Reservations link was buried below phone/email
- Not visually prominent
- Unclear that it's clickable

**Solution:** Three changes made:

### 1. Moved to Top Position
Reservations section now appears BEFORE telephone, email, and message (lines 283-290)

### 2. Added Visual Highlighting
```typescript
<IconCalendar size={16} color={theme.colors.primary[6]} />
<Text size="sm" translate="yes" weight={600} color={theme.colors.primary[6]}>
    {t("reservations")}
</Text>
```

- Icon: Primary color (`theme.colors.primary[6]`)
- Text: Bold weight (`weight={600}`) + Primary color
- Link: Underlined (`style={{ textDecoration: 'underline' }}`)

**Visual Result:**
```
Before:
☎ +351 912 345 678
✉ info@restaurant.pt
📅 Reservations

After:
📅 Reservations  ← Blue, bold, underlined
☎ +351 912 345 678
✉ info@restaurant.pt
```

---

## ✅ Issue 3: Cannot Remove Privacy Policy / Terms URLs

**Problem:** When clearing Privacy Policy or Terms & Conditions URLs in the venue form, the values weren't being removed from the database.

**Root Cause:** Zod validation had `.optional()` before `.transform()`, preventing empty strings from being properly converted to `undefined`.

**Solution:** Reordered Zod validation chain:

**File:** [src/utils/validators.ts:115-126](src/utils/validators.ts#L115-L126)

**Before (Broken):**
```typescript
privacyPolicyUrl: z
    .string()
    .trim()
    .optional()  // ❌ Too early
    .transform((val) => (val === "" ? undefined : val))
    .pipe(z.string().url("Invalid URL").optional()),
```

**After (Fixed):**
```typescript
privacyPolicyUrl: z
    .string()
    .trim()
    .transform((val) => (val === "" ? undefined : val))  // ✅ First transform
    .pipe(z.string().url("Invalid URL").optional())
    .optional(),  // ✅ Then mark optional
```

**Result:** Users can now clear the Privacy Policy and Terms & Conditions URL fields, and the values will be properly removed from the database.

---

## ✅ Issue 4: How to Manually Trigger Translations

**Problem:** No obvious way for users to access browser translation features.

**Solution:** Added TranslateHelper button to the header controls.

**File:** [src/components/RestaurantMenu/RestaurantMenu.tsx:235](src/components/RestaurantMenu/RestaurantMenu.tsx#L235)

```typescript
<Box pos="absolute" right={12} top={10} sx={{ display: "flex", gap: 8, zIndex: 1 }}>
    <LanguageSelector currentLanguage={language} onLanguageChange={handleLanguageChange} />
    <TranslateHelper />  {/* ← New button */}
    <ActionIcon className={classes.themeSwitch} onClick={() => toggleColorScheme()}>
        {colorScheme === "dark" ? <IconSun /> : <IconMoonStars />}
    </ActionIcon>
</Box>
```

**What it does:**
- Displays a language icon (🌐) button in the header
- Clicking opens a modal with translation instructions
- Shows browser-specific instructions for:
  - Chrome/Edge
  - Safari
  - Firefox

**User Experience:**
1. User clicks the 🌐 button
2. Modal appears with title "Translate This Page"
3. Instructions show for each browser:
   - **Chrome/Edge:** "Right-click and select 'Translate to [language]' or click the translate icon in the address bar"
   - **Safari:** "Tap the aA icon in the address bar and select 'Translate to [language]'"
   - **Firefox:** "Install a translation extension from Firefox Add-ons"

---

## Files Modified

1. **[src/components/RestaurantMenu/RestaurantMenu.tsx](src/components/RestaurantMenu/RestaurantMenu.tsx)**
   - Line 32: Added TranslateHelper import
   - Lines 283-290: Moved and highlighted reservations link
   - Line 235: Added TranslateHelper button to header

2. **[src/utils/validators.ts](src/utils/validators.ts)**
   - Lines 115-126: Fixed validation chain for URL fields

---

## Testing Checklist

### Test 1: Reservations Link ✅
- [ ] Open menu page
- [ ] Verify "Reservations" appears at the top (before phone/email)
- [ ] Verify link is blue, bold, and underlined
- [ ] Verify clicking opens the reservations URL in new tab
- [ ] Enable browser translation (Chrome → Translate to Spanish)
- [ ] Verify "Reservations" translates to "Reservas"

### Test 2: Remove Privacy/Terms URLs ✅
- [ ] Go to venue edit page
- [ ] Enter URLs in Privacy Policy and Terms & Conditions fields
- [ ] Save
- [ ] Edit again and clear both URL fields (leave them empty)
- [ ] Save
- [ ] Verify URLs are removed from database
- [ ] Check venue page footer - Privacy/Terms links should not appear

### Test 3: Translation Helper Button ✅
- [ ] Open menu page
- [ ] Verify 🌐 button appears in top-right (next to language selector and theme switch)
- [ ] Click the button
- [ ] Verify modal opens with translation instructions
- [ ] Verify instructions show for Chrome, Safari, and Firefox
- [ ] Close modal and verify it disappears

### Test 4: Menu/Category Names Don't Translate ✅
- [ ] Open menu page with branded names (e.g., "VIVA Porto", "SPA")
- [ ] Enable browser translation (Chrome → Translate to Spanish)
- [ ] Verify menu tab names stay in original language
- [ ] Verify category names stay in original language
- [ ] Verify menu item names and descriptions ARE translated

---

## Deployment Instructions

### ⚠️ IMPORTANT: Before Building Docker Image

There is **one blocking issue** that must be resolved before the Docker build will succeed:

**Error:**
```
./src/types/mantine.d.ts
4:22  Error: An empty interface is equivalent to `{}`.  @typescript-eslint/no-empty-interface
```

**Cause:** The file `src/types/mantine.d.ts` was deleted locally but still exists in your Linux server's build context.

**Fix:**
```bash
cd ~/menufic  # Or wherever your code is located
rm -f src/types/mantine.d.ts
```

### Build and Deploy

Once the file is deleted:

```bash
# Build Docker image
docker build --no-cache -t ghcr.io/newitdevelop/menufic:latest .

# Deploy
docker-compose down
docker-compose up -d
```

---

## Summary

All four issues from your screenshot feedback have been resolved:

1. ✅ "Reservations" text is now translatable
2. ✅ Reservations link moved to top and highlighted (blue, bold, underlined)
3. ✅ Privacy/Terms URLs can now be removed from venue forms
4. ✅ Translation helper button (🌐) added to header with instructions

**Next Step:** Delete `src/types/mantine.d.ts` from your Linux server, then rebuild and deploy.

---

**Date:** 2025-12-26
**Status:** ✅ All fixes implemented
**Blocking Issue:** Docker build requires deleting `src/types/mantine.d.ts`
**Breaking Changes:** None
**Migration Required:** No

---

## Visual Changes Preview

### Reservations Link (Before)
```
Location: Rua das Flores, Porto
Phone: +351 912 345 678
Email: info@restaurant.pt
Message: Fresh ingredients daily
Reservations
```

### Reservations Link (After)
```
Location: Rua das Flores, Porto
📅 Reservations  ← Blue, bold, underlined, at top
☎ +351 912 345 678
✉ info@restaurant.pt
💬 Fresh ingredients daily
```

### Header Controls (After)
```
┌─────────────────────────────────────────────┐
│                                   PT  🌐  🌙 │  ← Language, Translate, Theme
│  Restaurant Banner Image                    │
│                                             │
└─────────────────────────────────────────────┘
```

**Clicking 🌐 opens:**
```
┌──────────────────────────────────┐
│ Translate This Page         ✕    │
├──────────────────────────────────┤
│ You can use your browser's       │
│ built-in translation:            │
│                                  │
│ Chrome / Edge:                   │
│ Right-click and select           │
│ 'Translate to [language]'...     │
│                                  │
│ Safari:                          │
│ Tap the aA icon...               │
│                                  │
│ Firefox:                         │
│ Install a translation extension  │
└──────────────────────────────────┘
```

---

**End of Fixes Summary**
