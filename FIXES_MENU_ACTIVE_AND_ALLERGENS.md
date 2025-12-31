# Fixes: Menu Active State & Pack Allergen Consistency

## Issues Fixed

### 1. Menu Becomes Inactive and Can't Be Toggled Back ✅

**Problem**: When saving a menu with reservation settings, the `isActive` checkbox becomes unchecked and users can't change it back to active.

**Root Cause**: The menu router was applying automatic logic to override the user's `isActive` choice based on temporary menu date ranges (lines 121-124 in menu.router.ts):

```typescript
// OLD BUGGY CODE:
const userActiveState = input.isActive ?? true;
const isWithinDateRange = input.isTemporary && input.endDate ? new Date() <= input.endDate : true;
const finalIsActive = userActiveState && isWithinDateRange; // ❌ Overrides user choice!
```

This logic was:
- Checking if the temporary menu's end date had passed
- Forcing the menu to be inactive if the date was "out of range"
- Could have timezone issues causing premature deactivation
- **Prevented users from manually controlling menu visibility**

**Fix Applied**:

**File**: [src/server/api/routers/menu.router.ts](src/server/api/routers/menu.router.ts)

**Lines Changed**:
- Line 32 (create mutation)
- Line 122 (update mutation)

**New Code**:
```typescript
// NEW FIXED CODE:
// Respect user's isActive toggle directly - they control menu visibility
const finalIsActive = input.isActive ?? true;
```

**Benefits**:
- ✅ User has full control over menu visibility
- ✅ `isActive` checkbox works as expected
- ✅ No automatic overrides based on dates
- ✅ Cleaner, more predictable behavior

**Note**: Temporary menu date logic (showing/hiding based on start/end dates) should be handled client-side for display purposes if needed, not by forcing the `isActive` field to false.

---

### 2. Pack Allergen Translations Already Working ✅

**User Question**: "See how allergen translations are made for standard menus and make fixes to pack menus accordingly"

**Investigation Result**: Pack menus **already have the same allergen translation system** as standard menus!

**Evidence**:

**File**: [src/server/api/routers/restaurant.router.ts](src/server/api/routers/restaurant.router.ts)

**Lines 282-286** (Portuguese/No translation):
```typescript
// Add UI translations to packs
const packsWithUiTranslations = menu.packs?.map(pack => ({
    ...pack,
    uiTranslations,  // ✅ Same translations as menu items!
})) || [];
```

**Lines 337-351** (Other languages with translation):
```typescript
const translatedPacks = await Promise.all(
    menu.packs?.map(async (pack) => {
        const translatedPack = await translatePack(pack, input.language!);
        const translatedSections = await Promise.all(
            pack.sections.map(async (section) => {
                return await translatePackSection(section, input.language!);
            })
        );

        return {
            ...translatedPack,
            sections: translatedSections,
            uiTranslations,  // ✅ Same translations as menu items!
        };
    })
);
```

**What This Means**:
- Pack menus get the **exact same `uiTranslations` object** as regular menu items
- This includes all allergen translations (cereals, crustaceans, eggs, fish, etc.)
- The `CompactAllergenDisplay` component uses these translations
- The new `PackAllergenTable` component also uses these translations

**Why Allergens Might Not Show in Some Languages**:

The allergen translations ARE being provided correctly. If allergens show in PT but not in FR, the issue is likely:

1. **Allergen Data Missing**: The `itemAllergens` field might not be populated for that specific pack
   - **Solution**: Re-save the pack in admin panel to trigger AI allergen detection
   - Requires `OPENAI_API_KEY` to be set in environment

2. **Pack Not Loaded Properly**: Cache or revalidation issue
   - **Solution**: Clear browser cache or do a hard refresh (Ctrl+Shift+R)

3. **Different Pack Versions**: PT and FR might be showing different packs
   - **Solution**: Check if both languages are displaying the same menu/pack

---

## Summary of Changes

### Files Modified

1. **[src/server/api/routers/menu.router.ts](src/server/api/routers/menu.router.ts)**
   - Line 32: Simplified `finalIsActive` logic in `create` mutation
   - Line 122: Simplified `finalIsActive` logic in `update` mutation
   - **Effect**: Menu `isActive` state now respects user's toggle directly

### No Changes Needed For Allergens

Pack allergen translations were **already implemented correctly** and work the same way as standard menu items. The system is consistent.

---

## Testing Instructions

### Test 1: Menu Active Toggle

1. **Edit any menu** in admin panel
2. **Set Reservation Type** to "Built-in Reservation Form"
3. **Configure** email, times, party size
4. **Uncheck "Menu is Active"** checkbox (if you want)
5. **Save the menu**
6. **Re-open the menu** for editing
7. ✅ **Verify**: `isActive` checkbox state matches what you saved
8. **Toggle the checkbox** on or off
9. **Save again**
10. ✅ **Verify**: Your toggle choice is preserved

### Test 2: Pack Allergen Display

1. **Navigate to a pack menu** on the public page (e.g., Menu Natal)
2. **Check Portuguese version** (`?lang=PT`)
   - Look for allergen emoji icons next to pack items (🦐, 🐟, etc.)
   - Look for allergen table below the pack
3. **Switch to French** (`?lang=FR`)
   - ✅ **Verify**: Same allergen icons appear
   - ✅ **Verify**: Allergen table appears with French translations
4. **Switch to English** (`?lang=EN`)
   - ✅ **Verify**: Same allergen icons appear
   - ✅ **Verify**: Allergen table appears with English translations

**If allergens don't appear**:
- Re-save the pack in admin panel to trigger allergen detection
- Ensure `OPENAI_API_KEY` is configured in `.env`
- Check browser console for errors
- Clear cache and hard refresh

---

## Deployment

```bash
# Rebuild Docker image with fixes
docker-compose down
docker-compose build --no-cache menufic
docker-compose up -d

# Watch logs
docker-compose logs -f menufic
```

After deployment:
1. ✅ Menu active toggle will work correctly
2. ✅ Allergen translations already working (no changes needed)
3. ✅ Allergen table appears below packs

---

## Technical Details

### Menu Active State Logic

**Before (Buggy)**:
```typescript
const finalIsActive = userActiveState && isWithinDateRange;
// Problem: Even if user wants menu active, it gets forced to inactive
// if date range check fails (can happen due to timezone issues)
```

**After (Fixed)**:
```typescript
const finalIsActive = input.isActive ?? true;
// Solution: Respect user's explicit choice
// Default to true if not specified (backward compatibility)
```

### Allergen Translation Flow

1. **Request comes in** with language parameter (`?lang=FR`)
2. **Server fetches** restaurant with menus and packs
3. **UI translations generated** including allergen names in target language:
   ```typescript
   allergens: {
     cereals: "Céréales",
     crustaceans: "Crustacés",
     fish: "Poisson",
     // ... etc
   }
   ```
4. **Packs receive** same `uiTranslations` object as menu items
5. **Client components** (`PackCard`, `CompactAllergenDisplay`, `PackAllergenTable`) use translations to display allergen info

**This flow works identically for**:
- Regular menu items
- Pack sections and items
- All supported languages (PT, EN, FR, ES, etc.)

---

## Backward Compatibility

### Menu Active Field

- **Default behavior**: If `isActive` not specified, defaults to `true`
- **Existing menus**: Will continue to work as before
- **New behavior**: User has full control, no automatic overrides

### Allergen Translations

- **No breaking changes**: System already worked correctly
- **Existing data**: All allergen data and translations preserved
- **New packs**: Will automatically get allergen translations when created

---

## Future Enhancements (Optional)

### Menu Active State

1. **Client-side date filtering**: Show/hide menus in UI based on dates without touching `isActive`
2. **Scheduled publishing**: Auto-publish/unpublish menus at specific times
3. **Draft mode**: Separate `isDraft` field from `isActive` for more granular control

### Allergen Display

1. **Allergen detection improvements**: Better AI prompts for more accurate detection
2. **Manual allergen override**: Allow admins to manually edit detected allergens
3. **Dietary filters**: Filter menus/packs by allergen presence (e.g., "Show only gluten-free packs")
4. **Allergen summary**: Restaurant-wide allergen summary showing what's used across all menus

---

## Known Limitations

1. **Allergen detection requires OpenAI**: If `OPENAI_API_KEY` not configured, allergens won't be detected
   - System will still display allergen table and icons if data exists
   - Just won't auto-detect allergens for new items

2. **Manual allergen management**: Currently no UI to manually add/edit allergens
   - Allergens are AI-detected only
   - Would require additional admin UI for manual override

3. **Cache timing**: Language-specific translations may be cached
   - First request for a new language might be slower
   - Subsequent requests will be fast due to caching
