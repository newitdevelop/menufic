# Venue Refactoring - Restaurant → Venue

This document summarizes the changes made to rebrand the application from "Restaurant" to "Venue" to support a wider range of service businesses.

## Implementation Approach

**Hybrid Approach** - Updated user-facing elements while maintaining internal code structure:
- ✅ All user-visible text changed from "restaurant" to "venue"
- ✅ URL routes changed from `/restaurant` to `/venue`
- ✅ Internal code variables and database schema remain unchanged for stability

## Files Modified

### 1. Translation File
**File:** `src/lang/en.json`

**Changes:**
- Replaced all 73 occurrences of "restaurant"/"Restaurant" with "venue"/"Venue"
- Updated section keys: `dashboard.restaurant` → `dashboard.venue`
- Updated section keys: `dashboard.restaurantManage` → `dashboard.venueManage`

**Examples:**
```json
// Before
"headerTitle": "My Restaurants"
"addNewCardTitle": "Add new restaurant"
"navTitle": "Restaurants"

// After
"headerTitle": "My Venues"
"addNewCardTitle": "Add new venue"
"navTitle": "Venues"
```

### 2. Route Folder Structure
**Changes:**
- Renamed: `src/pages/restaurant/` → `src/pages/venue/`
- Route files remain unchanged:
  - `[restaurantId].tsx` (parameter name kept for API compatibility)
  - `[restaurantId]/edit-menu.tsx`
  - `[restaurantId]/banners.tsx`
  - `index.tsx`

**New URLs:**
```
/restaurant          → /venue
/restaurant/[id]     → /venue/[id]
/restaurant/[id]/edit-menu → /venue/[id]/edit-menu
/restaurant/[id]/banners   → /venue/[id]/banners
```

### 3. Internal Route References
**Files Updated:** 15 TypeScript/TSX files

All hardcoded `/restaurant` paths updated to `/venue`:
- `src/components/LoginOptions/LoginOptions.tsx`
- `src/components/Header/Header.tsx`
- `src/components/PublishButton/PublishButton.tsx`
- `src/components/LandingSections/Hero.tsx`
- `src/components/LandingSections/SampleMenu.tsx`
- `src/pages/venue/*.tsx` (all venue pages)
- `src/pages/auth/signin.tsx`
- `src/pages/auth/signin-test-user.tsx`
- `src/pages/explore.tsx`

**Example:**
```typescript
// Before
router.push("/restaurant")

// After
router.push("/venue")
```

## What Was NOT Changed

### Backend/Database (Intentionally Kept)
- ✅ **Prisma schema:** `Restaurant` model unchanged
- ✅ **API routers:** `restaurant.router.ts` filename unchanged
- ✅ **Type definitions:** `Restaurant` type unchanged
- ✅ **Component names:** `RestaurantForm`, `RestaurantMenu`, etc. unchanged
- ✅ **Variable names:** `restaurant`, `restaurantId`, etc. unchanged in code
- ✅ **Environment variables:** `NEXT_PUBLIC_MAX_RESTAURANTS_PER_USER` unchanged

**Rationale:** Keeping backend names stable avoids:
- Database migrations
- Breaking API contracts
- Import path changes throughout codebase
- Potential runtime errors

## User Experience Changes

### Before
- Page title: "My Restaurants"
- Button: "Add new restaurant"
- URL: `/restaurant`
- Navigation: "Restaurants"

### After
- Page title: "My Venues"
- Button: "Add new venue"
- URL: `/venue`
- Navigation: "Venues"

## Testing Checklist

After deploying these changes, verify:

- [ ] Homepage shows "Digital Menus for your venue"
- [ ] Navigation shows "Venues" instead of "Restaurants"
- [ ] Login redirects to `/venue` instead of `/restaurant`
- [ ] "My Venues" page loads at `/venue`
- [ ] "Add new venue" button works
- [ ] Individual venue page loads at `/venue/[id]`
- [ ] Edit menu page loads at `/venue/[id]/edit-menu`
- [ ] Banners page loads at `/venue/[id]/banners`
- [ ] All error messages reference "venue" not "restaurant"
- [ ] Published menus still work with existing URLs
- [ ] Database queries still work (using Restaurant model)

## Deployment Notes

### Environment Variables
No changes required to environment variables. The following keep their original names:
```bash
NEXT_PUBLIC_MAX_RESTAURANTS_PER_USER=5
NEXT_PUBLIC_MAX_MENUS_PER_RESTAURANT=5
NEXT_PUBLIC_MAX_BANNERS_PER_RESTAURANT=5
```

### Database
No migration required. The `Restaurant` table remains unchanged.

### Build Process
Standard build process - no special steps needed:
```bash
npm run build
docker compose build
```

### Backwards Compatibility
**Old URLs (`/restaurant/*`) will break** and return 404 errors. If you need to support old links:

1. Add redirects in `next.config.js`:
```javascript
async redirects() {
  return [
    {
      source: '/restaurant',
      destination: '/venue',
      permanent: true,
    },
    {
      source: '/restaurant/:path*',
      destination: '/venue/:path*',
      permanent: true,
    },
  ]
}
```

## Future Enhancements

If you want to fully refactor the codebase later:

1. **Rename Prisma model** (requires migration):
   ```prisma
   model Venue {  // was Restaurant
     // ... fields
   }
   ```

2. **Create type alias** for gradual migration:
   ```typescript
   export type Venue = Restaurant;
   ```

3. **Rename API router**:
   `restaurant.router.ts` → `venue.router.ts`

4. **Update component names**:
   - `RestaurantForm` → `VenueForm`
   - `RestaurantMenu` → `VenueMenu`
   - etc.

5. **Rename environment variables**:
   - `NEXT_PUBLIC_MAX_RESTAURANTS_PER_USER` → `NEXT_PUBLIC_MAX_VENUES_PER_USER`
   - etc.

## Summary

This refactoring successfully makes the application terminology more generic to support any service business with a menu (restaurants, cafes, spas, salons, etc.) while maintaining code stability by keeping backend names unchanged.

**Total time investment:** ~2 hours
**Files modified:** 17 files
**Risk level:** Low (no database changes, no API changes)
**User impact:** High (all visible text updated)
