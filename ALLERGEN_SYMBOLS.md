# Allergen Symbol Display

## Overview

Allergens are now displayed using **visual symbols (emojis)** instead of text badges in the menu view. This provides a more universal, language-independent way to communicate allergen information.

## Symbol Mapping

The following symbols are used for each allergen:

| Allergen | Symbol | Description |
|----------|--------|-------------|
| Cereals (gluten) | 🌾 | Wheat/grain icon |
| Crustaceans | 🦐 | Shrimp icon |
| Eggs | 🥚 | Egg icon |
| Fish | 🐟 | Fish icon |
| Peanuts | 🥜 | Peanut icon |
| Soybeans | 🫘 | Bean icon |
| Milk | 🥛 | Milk glass icon |
| Nuts | 🌰 | Chestnut icon |
| Celery | 🥬 | Leafy vegetable icon |
| Mustard | 🌭 | Hot dog icon (contains mustard) |
| Sesame | 🫘 | Bean/seed icon |
| Sulphites | 🍷 | Wine icon (contains sulphites) |
| Lupin | 🫘 | Bean icon |
| Molluscs | 🦪 | Oyster icon |
| None | ✓ | Checkmark (no allergens) |

## User Experience

### Public Menu View (venue/*/menu)

- Allergens displayed as **large symbols** (2rem size)
- Hovering over symbol shows **tooltip with allergen name** (translated)
- Cursor changes to "help" pointer to indicate interactivity
- Symbols appear below menu item description

Example:
```
Menu Item Name          €12.50
Description of the dish

Might contain the following allergens:
🌾 🥚 🥛 🐟
```

### Dashboard View (edit menu)

- Allergens displayed as **medium symbols** (1.5rem size)
- Tooltip shows allergen name on hover
- Appears below item description in menu item list

## Implementation

### Code Location

**Symbol Definitions**: [src/utils/validators.ts](src/utils/validators.ts#L27-L44)
```typescript
export const allergenSymbols: Record<(typeof allergenCodes)[number], string> = {
    cereals: "🌾",
    crustaceans: "🦐",
    eggs: "🥚",
    fish: "🐟",
    peanuts: "🥜",
    soybeans: "🫘",
    milk: "🥛",
    nuts: "🌰",
    celery: "🥬",
    mustard: "🌭",
    sesame: "🫘",
    sulphites: "🍷",
    lupin: "🫘",
    molluscs: "🦪",
    none: "✓",
};
```

**Public View**: [src/components/RestaurantMenu/ViewMenuItemModal.tsx](src/components/RestaurantMenu/ViewMenuItemModal.tsx#L76-L88)

**Dashboard View**: [src/components/EditMenu/MenuItems/MenuItemElement.tsx](src/components/EditMenu/MenuItems/MenuItemElement.tsx#L154-L166)

## Benefits

### Language Independence
- ✅ Symbols understood across all languages
- ✅ No translation needed for visual icons
- ✅ Faster visual scanning by customers
- ✅ More accessible for international visitors

### Space Efficiency
- ✅ Symbols take less space than text badges
- ✅ Cleaner, more compact design
- ✅ Mobile-friendly (symbols scale well)

### User Friendliness
- ✅ Tooltips provide text names when needed
- ✅ Hover interaction guides users
- ✅ Consistent with international allergen signage
- ✅ Easier to spot allergens quickly

## Customization

### Changing Symbols

To change an allergen symbol, edit [src/utils/validators.ts](src/utils/validators.ts#L27-L44):

```typescript
export const allergenSymbols: Record<(typeof allergenCodes)[number], string> = {
    cereals: "🌾",  // Change this to your preferred symbol
    // ... other allergens
};
```

### Symbol Size

**Public Menu View** (ViewMenuItemModal.tsx):
```typescript
fontSize: "2rem",  // Change for larger/smaller symbols
```

**Dashboard View** (MenuItemElement.tsx):
```typescript
fontSize: "1.5rem",  // Change for larger/smaller symbols
```

### Tooltip Behavior

Tooltips are automatically translated and show the allergen name in the user's selected language. The tooltip configuration:

```typescript
<Tooltip label={tCommon(`allergens.${allergen}`)} withArrow>
    <Text style={{ fontSize: "2rem", cursor: "help" }}>
        {allergenSymbols[allergen]}
    </Text>
</Tooltip>
```

## Accessibility

### Screen Readers

The current implementation uses emoji symbols which may not be ideal for screen readers. For production accessibility, consider:

1. **Add aria-label**:
```typescript
<Text
    aria-label={tCommon(`allergens.${allergen}`)}
    style={{ fontSize: "2rem", cursor: "help" }}
>
    {allergenSymbols[allergen]}
</Text>
```

2. **Alternative text display mode**:
Add a setting to switch between symbols and text badges for accessibility.

### Color Independence

Symbols do not rely on color to convey meaning (unlike the previous red/orange badges), making them suitable for color-blind users.

## Future Enhancements

### Option 1: SVG Icons
Replace emoji with custom SVG icons for:
- Consistent rendering across all devices
- Better scalability
- More control over appearance

### Option 2: Icon Library
Use icon library like `@tabler/icons` or `react-icons`:
```typescript
import { IconWheat, IconFish, IconEgg } from "@tabler/icons";
```

### Option 3: Mixed Display
Show both symbol and text on hover:
```
🌾 Cereals containing gluten
```

### Option 4: User Preference
Allow users to toggle between:
- Symbols only (default)
- Text only (accessibility)
- Symbols + text (maximum clarity)

## Testing

### Manual Testing

1. Create a menu item with allergens
2. View in public menu (`/venue/*/menu`)
3. Hover over symbols to see tooltips
4. Check symbols render correctly on:
   - Desktop Chrome/Firefox/Safari
   - Mobile iOS Safari
   - Mobile Android Chrome

### Emoji Support

Most modern browsers support emoji natively. Fallback considerations:
- Windows 10+: Full emoji support
- Windows 7-8: Limited emoji, may show black/white symbols
- iOS/Android: Full emoji support
- macOS: Full emoji support

## Summary

The allergen symbol system provides:
- ✅ Universal visual communication
- ✅ Language-independent display
- ✅ Space-efficient design
- ✅ Tooltip text for clarification
- ✅ Translated allergen names on hover
- ✅ Clean, modern appearance
- ✅ Mobile-friendly presentation

Perfect for international restaurant menus where visual communication is key!
