# TypeScript Build Fix - Smart TV Breakpoints

## Problem

When adding custom Smart TV breakpoints (`tv` and `4k`) to Mantine's theme, TypeScript compilation failed because:

1. Mantine's type definitions don't allow custom breakpoint names
2. TypeScript strictly enforces known properties in `MantineSizes` interface

**Error Messages:**
```
Type error: Property 'tv' does not exist on type 'MantineSizes'
Type error: Object literal may only specify known properties, and 'tv' does not exist in type 'DeepPartial<MantineSizes>'
```

## Solution

Instead of extending Mantine's theme with custom breakpoints, we use **hardcoded media query strings** directly in component styles.

### Approach

**Before (TypeScript error):**
```typescript
// theme.ts
breakpoints: {
    tv: 1920,
    "4k": 3840,
}

// Component styles
[`@media (min-width: ${theme.breakpoints.tv}px)`]: { fontSize: "28px" }
```

**After (Working):**
```typescript
// theme.ts
// No custom breakpoints - comment explains approach

// Component styles
"@media (min-width: 120em)": { fontSize: "28px" } // 1920px Smart TV
"@media (min-width: 240em)": { fontSize: "48px" } // 3840px 4K TV
```

### Why This Works

1. **No TypeScript errors**: Not modifying Mantine's type definitions
2. **Same functionality**: Media queries still trigger at correct breakpoints
3. **More explicit**: Clear what each breakpoint represents (120em = 1920px)
4. **No runtime overhead**: Hardcoded strings are more performant

### Conversion Chart

| Breakpoint | Pixels | Em Units | Usage |
|------------|--------|----------|-------|
| Smart TV (Full HD) | 1920px | 120em | `"@media (min-width: 120em)"` |
| 4K TV | 3840px | 240em | `"@media (min-width: 240em)"` |

*Note: 1em = 16px (browser default), so 1920px ÷ 16 = 120em*

## Files Modified

### 1. [src/styles/theme.ts](src/styles/theme.ts)
- Removed custom breakpoints from theme
- Added comment explaining hardcoded approach

### 2. [src/components/Footer/Footer.tsx](src/components/Footer/Footer.tsx)
```typescript
copyRights: {
    "@media (min-width: 120em)": { fontSize: "20px" }, // 1920px Smart TV
    "@media (min-width: 240em)": { fontSize: "32px" }, // 3840px 4K TV
}
```

### 3. [src/components/RestaurantMenu/RestaurantMenu.tsx](src/components/RestaurantMenu/RestaurantMenu.tsx)
```typescript
carousalTitleText: {
    "@media (min-width: 120em)": { fontSize: 64 }, // 1920px Smart TV
    "@media (min-width: 240em)": { fontSize: 96 }, // 3840px 4K TV
}
```

### 4. [src/components/RestaurantMenu/MenuItemCard.tsx](src/components/RestaurantMenu/MenuItemCard.tsx)
```typescript
cardImage: {
    "@media (min-width: 120em)": { height: 240, width: 240 }, // 1920px Smart TV
    "@media (min-width: 240em)": { height: 360, width: 360 }, // 3840px 4K TV
}

// Also in sx props:
sx={{
    "@media (min-width: 120em)": { fontSize: "28px" }, // 1920px Smart TV
    "@media (min-width: 240em)": { fontSize: "42px" }, // 3840px 4K TV
}}
```

## Benefits

### ✅ Advantages
- **No TypeScript errors**: Clean compilation
- **No type extensions**: Simpler, less brittle
- **Better documentation**: Comments explain each breakpoint
- **Maintainable**: Easy to understand and modify
- **No runtime cost**: Slightly faster than dynamic theme access

### ⚠️ Trade-offs
- **Manual updates**: If breakpoints change, update in each file
- **Less DRY**: Breakpoint values repeated across files

## Testing

The functionality remains **identical** - this is purely a TypeScript compatibility fix:

- ✅ Media queries still trigger at 1920px and 3840px
- ✅ Smart TV scaling works exactly the same
- ✅ No visual changes
- ✅ No runtime behavior changes

## Alternative Approaches Considered

### 1. TypeScript Module Augmentation
```typescript
// NOT USED - Would require modifying Mantine's types
declare module "@mantine/core" {
    interface MantineSizes {
        tv: number;
        "4k": number;
    }
}
```
**Why not:** Complex, brittle, could break with Mantine updates

### 2. CSS Variables
```typescript
// NOT USED - Would require CSS-in-JS workarounds
"--breakpoint-tv": "1920px"
```
**Why not:** Mantine's createStyles doesn't support CSS variables well

### 3. Constants File
```typescript
// NOT USED - Still requires hardcoding in media queries
export const BREAKPOINTS = {
    TV: "120em",
    "4K": "240em",
}
```
**Why not:** Doesn't solve TypeScript issue, adds extra import

## Conclusion

Using **hardcoded media query strings** is the cleanest solution that:
- Avoids TypeScript complexity
- Maintains full functionality
- Provides clear, self-documenting code
- Has zero runtime overhead

---

**Date:** 2025-12-26
**Status:** ✅ Fixed - All TypeScript/ESLint Errors Resolved
**Impact:** Build now compiles successfully

## Additional Fix: ESLint consistent-return

### Issue
After implementing Smart TV navigation hook, ESLint reported:
```
./src/hooks/useSmartTVNavigation.ts
136:9  Error: Arrow function expected no return value.  consistent-return
```

### Root Cause
The `useEffect` hook had inconsistent return types:
- Early return when disabled: `return;` (returns `undefined`)
- Normal execution: `return () => { ... };` (returns cleanup function)

### Solution
Changed early return to return an empty cleanup function:
```typescript
// Before (ERROR):
useEffect(() => {
    if (!enabled) return; // Returns undefined

    // ... setup code ...

    return () => {  // Returns cleanup function
        // ... cleanup code ...
    };
}, [dependencies]);

// After (FIXED):
useEffect(() => {
    if (!enabled) {
        return () => {}; // Returns empty cleanup function
    }

    // ... setup code ...

    return () => {
        // ... cleanup code ...
    };
}, [dependencies]);
```

### Why This Works
- Both code paths now return a function (consistent return type)
- When disabled, returns empty cleanup (no-op, no performance impact)
- When enabled, returns actual cleanup function
- ESLint's `consistent-return` rule is satisfied

---

**Date:** 2025-12-26
**Status:** ✅ All Build Errors Fixed
**Impact:** TypeScript compiles successfully, ESLint passes, ready for Docker build
