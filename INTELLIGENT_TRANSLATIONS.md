# Intelligent Automatic Re-Translation

## Overview

The translation system now automatically detects content changes and re-translates content in all languages when updates occur.

## How It Works

### Before (Manual Re-translation Required)
❌ Change "teste" → "frango de caril com arroz"
❌ Translations remain cached with old content
❌ Users see outdated translations
❌ Manual cache clearing needed

### After (Automatic Re-translation)
✅ Change "teste" → "frango de caril com arroz"
✅ System automatically detects the change
✅ Cached translations invalidated immediately
✅ Next page load triggers fresh translations
✅ All languages updated automatically

## Implementation

### Menu Items ([src/server/api/routers/menuItem.router.ts:141-144](src/server/api/routers/menuItem.router.ts#L141-L144))

```typescript
// Invalidate translations when name or description changes
if (input.name !== currentItem.name || input.description !== currentItem.description) {
    promiseList.push(invalidateTranslations("menuItem", input.id));
}
```

**Triggers re-translation when:**
- Menu item **name** changes
- Menu item **description** changes

### Categories ([src/server/api/routers/category.router.ts:95-96](src/server/api/routers/category.router.ts#L95-L96))

```typescript
// Invalidate translations if name changed
input.name !== currentCategory.name ? invalidateTranslations("category", input.id) : Promise.resolve(),
```

**Triggers re-translation when:**
- Category **name** changes

### Menus ([src/server/api/routers/menu.router.ts:97-116](src/server/api/routers/menu.router.ts#L97-L116))

```typescript
// Check if any translatable field changed
const shouldInvalidate =
    input.name !== currentMenu.name ||
    input.availableTime !== currentMenu.availableTime ||
    input.message !== currentMenu.message;

// Invalidate translations if any translatable field changed
shouldInvalidate ? invalidateTranslations("menu", input.id) : Promise.resolve(),
```

**Triggers re-translation when:**
- Menu **name** changes
- Menu **availableTime** changes
- Menu **message** changes

## Translation Flow

### 1. User Edits Content
```
User changes: "teste" → "frango de caril com arroz"
```

### 2. System Detects Change
```typescript
if (input.name !== currentItem.name) {
    // Content changed!
}
```

### 3. Invalidate Cached Translations
```typescript
await invalidateTranslations("menuItem", itemId);
// Deletes ALL cached translations for this item
```

### 4. Next Page Load Re-translates
```typescript
// User views menu in French
const translation = await getOrCreateTranslation(
    "menuItem",
    itemId,
    "name",
    "frango de caril com arroz",
    "FR"
);
// Fresh translation: "poulet au curry avec riz blanc"
```

## Performance Optimizations

### Smart Change Detection
✅ Only invalidates when content **actually changes**
✅ Skips invalidation for non-translatable fields (price, VAT, etc.)
✅ Runs in parallel with database update (no blocking)

### Batch Operations
```typescript
await Promise.all([
    ctx.prisma.menu.update({ ... }),
    shouldInvalidate ? invalidateTranslations(...) : Promise.resolve(),
]);
```

### Lazy Re-translation
✅ Translations deleted immediately
✅ Re-translation only happens when requested
✅ No unnecessary API calls to DeepL
✅ Translations cached again after regeneration

## Example Scenario

### User Action
1. Edit menu item "Grilled Chicken"
2. Change name to "Spicy Grilled Chicken"
3. Change description to add "with chili sauce"
4. Click Save

### System Response
```typescript
// 1. Detect changes
const nameChanged = "Spicy Grilled Chicken" !== "Grilled Chicken"  // true
const descChanged = "... chili sauce" !== "..."  // true

// 2. Update database + invalidate translations (parallel)
await Promise.all([
    prisma.menuItem.update({ ... }),
    invalidateTranslations("menuItem", itemId)  // Deletes all cached translations
]);

// 3. User views in Spanish
// System auto-translates fresh content:
// - Name: "Pollo a la Parrilla Picante"
// - Description: "... con salsa de chile"
```

## Benefits

### For Users
✅ **Always see current content** - No stale translations
✅ **Seamless experience** - Updates happen automatically
✅ **Accurate translations** - Fresh DeepL translations every time content changes

### For Administrators
✅ **No manual intervention** - System handles everything
✅ **No cache management** - Automatic invalidation
✅ **Efficient** - Only re-translates when needed

### For Performance
✅ **Database efficiency** - Parallel operations
✅ **API efficiency** - Lazy re-translation
✅ **Cost efficiency** - Only calls DeepL when content changes

## Technical Details

### invalidateTranslations Function
**Location**: [src/server/services/translation.service.ts:72-79](src/server/services/translation.service.ts#L72-L79)

```typescript
export async function invalidateTranslations(entityType: EntityType, entityId: string): Promise<void> {
    await prisma.translation.deleteMany({
        where: {
            entityType,
            entityId,
        },
    });
}
```

**How it works:**
1. Deletes ALL translations for the entity
2. Removes entries for all languages (EN, FR, ES, DE, etc.)
3. Clears all translatable fields (name, description, etc.)
4. Next request triggers fresh translation via DeepL

### Translation Cache Table
```sql
CREATE TABLE Translation (
    id           String   @id @default(cuid())
    entityType   String   -- "menuItem", "category", or "menu"
    entityId     String   -- ID of the entity
    language     String   -- "EN", "FR", "ES", etc.
    field        String   -- "name", "description", etc.
    translated   String   -- Cached translation
    createdAt    DateTime @default(now())

    @@unique([entityType, entityId, language, field])
)
```

## Files Modified

### Backend Routers
- [src/server/api/routers/menuItem.router.ts](src/server/api/routers/menuItem.router.ts) - Auto-invalidate on menu item update
- [src/server/api/routers/category.router.ts](src/server/api/routers/category.router.ts) - Auto-invalidate on category update
- [src/server/api/routers/menu.router.ts](src/server/api/routers/menu.router.ts) - Auto-invalidate on menu update

### Translation Service
- [src/server/services/translation.service.ts](src/server/services/translation.service.ts) - invalidateTranslations() function (already existed, now used)

## Testing

### Test Case 1: Menu Item Name Change
```
1. Edit menu item name: "Pizza" → "Margherita Pizza"
2. Save
3. View in French
4. Expected: "Pizza Margherita" (fresh translation)
5. NOT: "Pizza" (old cached translation)
```

### Test Case 2: Multiple Field Changes
```
1. Edit menu item:
   - Name: "Soup" → "Tomato Soup"
   - Description: "Hot soup" → "Fresh tomato soup with basil"
2. Save
3. View in German
4. Expected: Both fields freshly translated
```

### Test Case 3: No Translation When Content Unchanged
```
1. Edit menu item price only (not translatable)
2. Save
3. Check translations
4. Expected: Old translations still cached (no DeepL API call)
```

## Migration

**No database migration required** - Uses existing translation table and functions.

## Deployment

1. Pull latest code
2. Build application
3. Deploy

**That's it!** The intelligent translation system will automatically activate.

---

**Date:** 2025-12-26
**Status:** ✅ Implemented
**Impact:** Major improvement in translation accuracy and user experience
