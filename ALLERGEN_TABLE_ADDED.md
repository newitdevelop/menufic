# Pack Allergen Table - Implementation Complete

## What Was Added

### 1. New Component: PackAllergenTable

**File**: [src/components/RestaurantMenu/PackAllergenTable.tsx](src/components/RestaurantMenu/PackAllergenTable.tsx)

**Purpose**: Display a summary table of all allergens found in a pack menu

**Features**:
- ✅ Collects all unique allergens from all sections in a pack
- ✅ Displays in a yellow-highlighted warning table
- ✅ Shows allergen codes and translated names
- ✅ Tri-lingual disclaimer (English, Portuguese, French)
- ✅ Warning icon for visibility
- ✅ Hover effects on rows
- ✅ Automatically hides if no allergens found

**Visual Design**:
- Yellow background (warning color) - `theme.colors.yellow[0]`
- Warning icon - `IconAlertTriangle`
- Striped table with hover effects
- Allergen codes in monospace font
- Responsive padding and spacing

### 2. Integration into RestaurantMenu

**File**: [src/components/RestaurantMenu/RestaurantMenu.tsx](src/components/RestaurantMenu/RestaurantMenu.tsx)

**Changes**:
- Line 34: Imported `PackAllergenTable` component
- Lines 508-511: Added allergen table after each pack card

**Result**: Allergen table appears immediately after each pack menu on public pages

## How It Works

### Data Flow

1. **Pack has sections** → Each section can have `itemAllergens` mapping
2. **PackAllergenTable** collects all allergens from all sections
3. **Deduplicates** allergen codes
4. **Sorts alphabetically** by translated name
5. **Displays in table** with code + translation

### Example

If a pack has:
- **Section 1 (Cold Dishes)**:
  - "Crevettes" → ["crustaceans", "fish"]
- **Section 2 (Hot Dishes)**:
  - "Camarão" → ["crustaceans"]
  - "Peixe grelhado" → ["fish"]

**Allergen Table Shows**:
| Code | Allergen |
|------|----------|
| crustaceans | Crustáceos / Crustacés |
| fish | Peixe / Poisson |

## Addressing the Issues

### Issue 1: Allergen Icon Not Showing Consistently

**Current Behavior**: Allergen icons show in PT version but not FR version

**Root Cause**: The `itemAllergens` data might not be populated for all packs or the allergen detection wasn't run for that specific pack.

**Solutions**:

1. **Check if allergens are in database**:
   ```sql
   SELECT id, title, "itemAllergens"
   FROM "PackSection"
   WHERE "packId" = 'your-pack-id';
   ```

2. **Re-run allergen detection**: When you edit a pack, the OpenAI allergen detection should run automatically if `OPENAI_API_KEY` is set.

3. **Manual fix**: Edit the pack in admin panel, which will trigger allergen detection again.

### Issue 2: Need Allergen Table

**Status**: ✅ **IMPLEMENTED**

The `PackAllergenTable` component now displays after each pack, showing:
- All allergens found in the entire pack
- Allergen codes and translations
- Multi-language disclaimers
- Warning styling for visibility

## Deployment

To see the new allergen table:

```bash
# Rebuild Docker image
docker-compose down
docker-compose build --no-cache menufic
docker-compose up -d
```

Or wait for your next deployment cycle.

## Verification

After deployment, visit any menu with packs:

1. **Navigate to a pack menu page**
2. **Scroll to a pack** (e.g., "Menu Natal")
3. **Look below the pack** - you should see a yellow allergen table
4. **Table will show all allergens** from all sections combined
5. **If no allergens**, table won't display (clean UX)

## Example Output

```
┌────────────────────────────────────────────────────────────┐
│ ⚠️  Allergen Information / Informações sobre Alergénios   │
├──────────────┬─────────────────────────────────────────────┤
│ Code         │ Allergen / Alergénio / Allergène            │
├──────────────┼─────────────────────────────────────────────┤
│ crustaceans  │ Crustáceos / Crustacés                      │
│ fish         │ Peixe / Poisson                             │
│ gluten       │ Glúten / Gluten                             │
│ molluscs     │ Moluscos / Mollusques                       │
└──────────────┴─────────────────────────────────────────────┘

This pack contains dishes with the allergens listed above...
Este pack contém pratos com os alergénios listados acima...
Ce pack contient des plats avec les allergènes listés ci-dessus...
```

## Styling Details

**Color Scheme**:
- Background: Yellow[0] (light mode) / Dark[6] (dark mode)
- Border: Yellow[4] (warning)
- Header text: Yellow[9]
- Table header bg: Yellow[1]
- Allergen codes: Yellow[9], monospace font

**Responsive**:
- Padding adjusts with theme spacing
- Font sizes: 0.875rem for table, xs for disclaimers
- Hover effects on table rows

## Files Modified/Created

**Created**:
- `src/components/RestaurantMenu/PackAllergenTable.tsx` ✨

**Modified**:
- `src/components/RestaurantMenu/RestaurantMenu.tsx` (import + integration)

**Dependencies**:
- Uses existing allergen translation mechanism
- Integrates with existing pack data structure
- Compatible with current styling system

## Next Steps (Optional Enhancements)

1. **Print-friendly version**: Add special styling for printed menus
2. **Allergen legend**: Add a separate page explaining all allergen symbols
3. **Dietary filters**: Allow filtering packs by allergen presence/absence
4. **Custom disclaimers**: Per-restaurant allergen disclaimers
5. **Icons in table**: Add allergen emoji symbols to table rows

## Troubleshooting

### Table not showing

**Check**:
1. Pack has sections with `itemAllergens` data
2. At least one allergen is present
3. Rebuild completed successfully
4. No JavaScript errors in browser console

### Allergens missing for some items

**Solution**:
1. Verify `OPENAI_API_KEY` is set in `.env`
2. Re-save the pack in admin panel to trigger allergen detection
3. Check pack sections have items with text (not empty)

### Translations not showing

**Solution**:
1. Check `uiTranslations.allergens` is populated in pack data
2. Verify DeepL translation service is working
3. Regenerate translations: `npm run translate`
