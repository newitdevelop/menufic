# Translation Behavior Guide

## Overview

This document explains which content gets translated and which content stays in the original language when users use their browser's translation feature.

---

## Content That SHOULD Be Translated (translate="yes")

### 1. Restaurant Location
```tsx
<Text translate="yes">{restaurant?.location}</Text>
```
**Example:** "Rua das Flores, Porto" → "Flowers Street, Porto"
**Why:** Helps users understand the location better

### 2. Menu Availability Time
```tsx
<Text translate="yes">{menu.availableTime}</Text>
```
**Example:** "Almoço (12:00-15:00)" → "Lunch (12:00-15:00)"
**Why:** Users need to know when the menu is available

### 3. Menu Item Names
```tsx
<Text translate="yes">{menuItem.name}</Text>
```
**Example:** "Bacalhau à Brás" → "Shredded Cod with Potatoes"
**Why:** Users want to know what the dish is

### 4. Menu Item Descriptions
```tsx
<Text translate="yes">{menuItem.description}</Text>
```
**Example:** "Bacalhau desfiado com batata palha" → "Shredded cod with straw potatoes"
**Why:** Users need to understand what's in the dish

### 5. Custom Messages
```tsx
<Text translate="yes">{menuDetails.message}</Text>
```
**Example:** "Pratos preparados com ingredientes frescos" → "Dishes prepared with fresh ingredients"
**Why:** Important information for customers

### 6. UI Labels and Buttons
```tsx
<Text translate="yes">{t("reservations")}</Text>
```
**Example:** "Reservas" → "Reservations"
**Why:** Static UI elements should adapt to user's language

---

## Content That SHOULD NOT Be Translated (translate="no")

### 1. Restaurant Name
```tsx
<Text translate="no">{restaurant?.name}</Text>
```
**Example:** "VIVA Porto" → "VIVA Porto" (unchanged)
**Why:** Brand names and proper nouns should stay in original language

### 2. Menu Names (Tabs)
```tsx
<Text translate="no">{menu.name}</Text>
```
**Example:** "SPA" → "SPA" (unchanged)
**Example:** "VIVA Porto" → "VIVA Porto" (unchanged)
**Why:** These are branded menu names or proper nouns, not generic categories

### 3. Category Names
```tsx
<Text translate="no">{category.name}</Text>
```
**Example:** "Entradas VIVA" → "Entradas VIVA" (unchanged)
**Why:** Often contain branded elements or specific naming conventions

### 4. Phone Numbers
```tsx
<Text translate="no">{restaurant?.contactNo}</Text>
```
**Example:** "+351 912 345 678" → "+351 912 345 678" (unchanged)
**Why:** Numbers should never be translated

### 5. Email Addresses
```tsx
<Text translate="no">{menuDetails.email}</Text>
```
**Example:** "info@restaurant.pt" → "info@restaurant.pt" (unchanged)
**Why:** Email addresses are technical identifiers

### 6. Prices
```tsx
<Text translate="no">{menuItem.currency}{displayPrice}</Text>
```
**Example:** "€12.50" → "€12.50" (unchanged)
**Why:** Prices and currency symbols should stay as-is

### 7. Allergen Codes
```tsx
<Text translate="no">{allergen.code}</Text>
```
**Example:** "A1" → "A1" (unchanged)
**Why:** Standardized codes should not be translated

---

## Summary Table

| Content Type | Translate? | Example Original | Example Translated |
|--------------|-----------|-----------------|-------------------|
| Restaurant name | ❌ NO | "VIVA Porto" | "VIVA Porto" |
| Restaurant location | ✅ YES | "Rua das Flores" | "Flowers Street" |
| Menu name (tab) | ❌ NO | "SPA" | "SPA" |
| Menu availability | ✅ YES | "Almoço" | "Lunch" |
| Category name | ❌ NO | "Entradas VIVA" | "Entradas VIVA" |
| Menu item name | ✅ YES | "Bacalhau à Brás" | "Shredded Cod..." |
| Item description | ✅ YES | "Bacalhau desfiado..." | "Shredded cod..." |
| Price | ❌ NO | "€12.50" | "€12.50" |
| Phone number | ❌ NO | "+351 912..." | "+351 912..." |
| Email | ❌ NO | "info@..." | "info@..." |
| Custom messages | ✅ YES | "Ingredientes frescos" | "Fresh ingredients" |
| UI buttons | ✅ YES | "Reservas" | "Reservations" |
| Allergen codes | ❌ NO | "A1, D3" | "A1, D3" |
| Allergen names | ✅ YES | "Cereais com glúten" | "Cereals with gluten" |

---

## Implementation Details

### How `translate` Attribute Works

The `translate` attribute is a standard HTML5 attribute that tells browsers whether content should be translated:

```tsx
// Content that WILL be translated by browser:
<Text translate="yes">Bacalhau à Brás</Text>

// Content that WILL NOT be translated by browser:
<Text translate="no">VIVA Porto</Text>
```

### Browser Support

The `translate` attribute is supported by:
- ✅ Chrome (with built-in Google Translate)
- ✅ Safari (with built-in translation)
- ✅ Edge (with built-in Microsoft Translator)
- ✅ Firefox (with add-ons)

### User Experience

When a user enables browser translation:

1. **Visit Menu Page:**
   ```
   https://menufic.com/venue/abc123/menu?lang=ES
   ```

2. **Activate Browser Translation:**
   - Chrome: Click translate icon → "Translate to Spanish"
   - Safari: Tap aA → "Translate to Spanish"

3. **Result:**
   - Restaurant name: "VIVA Porto" (unchanged)
   - Menu tab: "SPA" (unchanged)
   - Category: "Entradas VIVA" (unchanged)
   - Menu item: "Bacalhau à Brás" → "Bacalao a la Brás"
   - Description: "Bacalhau desfiado..." → "Bacalao deshilachado..."
   - Price: "€12.50" (unchanged)

---

## Files Modified

### [src/components/RestaurantMenu/RestaurantMenu.tsx](src/components/RestaurantMenu/RestaurantMenu.tsx)

**Line 207:** Restaurant name
```tsx
<Text translate="no">{restaurant?.name}</Text>
```

**Line 218:** Location (should translate)
```tsx
<Text translate="yes">{restaurant?.location}</Text>
```

**Line 225:** Phone number
```tsx
<Text translate="no">{restaurant?.contactNo}</Text>
```

**Line 242:** Mobile restaurant name
```tsx
<Text translate="no">{restaurant?.name}</Text>
```

**Line 252:** Mobile location
```tsx
<Text translate="yes">{restaurant?.location}</Text>
```

**Line 259:** Mobile phone
```tsx
<Text translate="no">{restaurant?.contactNo}</Text>
```

**Line 269:** Menu name (tab) - **CHANGED to translate="no"**
```tsx
<Text translate="no">{menu.name}</Text>
```

**Line 272:** Menu availability time
```tsx
<Text translate="yes">{menu.availableTime}</Text>
```

**Line 285:** Menu telephone
```tsx
<Text translate="no">{menuDetails.telephone}</Text>
```

**Line 293:** Menu email
```tsx
<Text translate="no">{menuDetails.email}</Text>
```

**Line 301:** Reservations label
```tsx
<Text translate="yes">{t("reservations")}</Text>
```

**Line 308:** Custom message
```tsx
<Text translate="yes">{menuDetails.message}</Text>
```

**Line 318:** Category name - **CHANGED to translate="no"**
```tsx
<Text translate="no">{category.name}</Text>
```

---

## Rationale for Menu and Category Names

### Why Menu Names Should NOT Be Translated

1. **Branded Names:** "VIVA Porto", "SPA", "Sunset Lounge"
   - These are brand identities, not generic words
   - Translating "SPA" to "Balneario" would be incorrect

2. **Proper Nouns:** Restaurant-specific naming
   - Often mix languages: "Brunch & Breakfast"
   - Translation would lose the intended meaning

3. **Marketing Identity:** Part of the restaurant's brand
   - "VIVA Porto" is the menu's identity
   - Should remain recognizable across languages

### Why Category Names Should NOT Be Translated

1. **Often Branded:** "Entradas VIVA", "Pratos Signature"
   - Part of the restaurant's menu structure
   - Translation would lose branding

2. **Consistency:** Users see these in menus and signage
   - Physical menus show "VIVA Porto"
   - Digital should match physical

3. **Mixed Languages:** Common in restaurant menus
   - "Tapas & Petiscos"
   - "Starters & Entradas"
   - Direct translation would create awkward results

### What SHOULD Be Translated

Content should be translated if it:
- Helps users understand the food (item names, descriptions)
- Provides functional information (opening hours, availability)
- Assists navigation (UI labels, buttons)
- Explains policies or messages (custom messages)

Content should NOT be translated if it's:
- A brand name or identity
- A proper noun
- Technical data (prices, phone numbers, codes)
- Already language-neutral (numbers, symbols)

---

## Testing

### Manual Test: Browser Translation

1. **Open menu page:**
   ```
   http://localhost:3000/venue/abc123/menu
   ```

2. **Enable Chrome translation:**
   - Click translate icon
   - Select "Translate to Spanish"

3. **Verify behavior:**
   - ✅ Restaurant name stays in original language
   - ✅ Menu tab names stay in original language
   - ✅ Category names stay in original language
   - ✅ Menu item names get translated
   - ✅ Descriptions get translated
   - ✅ Prices stay in euros
   - ✅ Phone numbers unchanged

### Automated Test: Inspect HTML

```bash
# Open browser DevTools (F12)
# Inspect a category name element

# Should see:
<p class="..." translate="no">VIVA Porto</p>

# Not:
<p class="..." translate="yes">VIVA Porto</p>
```

---

## Future Enhancements

### Option: Smart Translation Detection

Could add logic to detect if a name is likely a brand:

```typescript
function shouldTranslateName(name: string): boolean {
  // Check if name contains brand keywords
  const brandKeywords = ['VIVA', 'SPA', 'Signature', 'Premium'];
  const hasBrand = brandKeywords.some(kw => name.includes(kw));

  // Check if name is all uppercase (likely a brand)
  const isAllCaps = name === name.toUpperCase();

  // Check if name contains special characters (branding)
  const hasSpecialChars = /[&@#]/.test(name);

  return !(hasBrand || isAllCaps || hasSpecialChars);
}
```

### Option: Configuration per Restaurant

Allow restaurant owners to mark which content should be translated:

```typescript
interface Menu {
  name: string;
  shouldTranslateName: boolean; // Owner decision
}

// In component:
<Text translate={menu.shouldTranslateName ? "yes" : "no"}>
  {menu.name}
</Text>
```

---

## Best Practices

### For Restaurant Owners

1. **Use generic names** for generic menus:
   - "Lunch" → Will be translated
   - "Dinner" → Will be translated

2. **Use branded names** for branded menus:
   - "VIVA Experience" → Won't be translated
   - "Chef's Special" → Won't be translated

3. **Be consistent** across physical and digital:
   - If physical menu says "SPA", digital should too
   - If physical menu says "Almoço", digital should too

### For Developers

1. **Default to translate="no"** for names:
   - Menu names are usually branded
   - Category names often contain branding
   - When in doubt, don't translate

2. **Use translate="yes"** for descriptions:
   - Item descriptions should always translate
   - Availability times should translate
   - Custom messages should translate

3. **Never translate technical data:**
   - Prices, phone numbers, emails, codes
   - Always use translate="no"

---

**Last Updated:** 2025-12-26
**Status:** ✅ Implemented
**Impact:** Menu and category names now preserved in original language
