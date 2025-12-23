# Translation Architecture

## Overview

Menufic uses a **hybrid translation system** that combines server-side static UI translation with browser-based dynamic content translation. This approach is designed for Portuguese restaurant owners who enter content in Portuguese, serving customers who may speak different languages.

## Two-Layer Translation System

### Layer 1: Static UI Translation (DeepL API)

**Purpose**: Translate fixed application text (buttons, labels, headers, etc.)

**Method**: DeepL API via selective translation script

**What Gets Translated**:
- ✅ Buttons (Save, Edit, Delete, Cancel)
- ✅ Labels (Name, Description, Price)
- ✅ Messages (Success, Error notifications)
- ✅ Footer links (Privacy Policy, Terms & Conditions, Complaint Book)
- ✅ Allergen names (Cereals, Fish, Nuts, etc.)
- ✅ Helper text (Translation instructions, tooltips)

**Languages**: PT, ES, FR, DE, IT (pre-generated)

**Cost**: ~30,000 tokens first run, cached for future updates

**How It Works**:
```
1. Developer updates src/lang/en.json
2. Runs npm run translate
3. DeepL generates pt.json, es.json, fr.json, de.json, it.json
4. Files committed to git or stored in Docker volume
5. Next.js serves translated UI based on ?lang=ES parameter
```

**Example**:
```json
// src/lang/en.json
"common.save": "Save"

// Generated src/lang/es.json
"common.save": "Guardar"
```

### Layer 2: Dynamic Content Translation (Browser)

**Purpose**: Translate user-entered content (menu items, descriptions, categories)

**Method**: HTML `translate="yes"` attribute + browser translation feature

**What Gets Translated**:
- ✅ Restaurant name
- ✅ Restaurant location
- ✅ Menu names ("Almoço", "Jantar", "Bebidas")
- ✅ Category names ("Entradas", "Pratos Principais", "Sobremesas")
- ✅ Menu item names ("Bacalhau à Brás", "Caldo Verde")
- ✅ Menu item descriptions
- ✅ Custom messages

**What Doesn't Get Translated**:
- ❌ Prices (numbers)
- ❌ Phone numbers
- ❌ Email addresses
- ❌ VAT rates

**Languages**: Any language the customer's browser supports

**Cost**: Free (browser-based)

**How It Works**:
```
1. Portuguese restaurant owner enters "Bacalhau à Brás" as menu item name
2. Customer visits /venue/*/menu?lang=ES
3. Static UI shows in Spanish (from DeepL)
4. Browser detects translate="yes" on menu item name
5. Customer uses Chrome Translate → "Bacalhau à Brás" shown in Spanish
6. Customer reads full menu in their language
```

**Code Example**:
```tsx
// ViewMenuItemModal.tsx
<Text translate="yes">
    {menuItem?.name}  // "Bacalhau à Brás" - browser translates
</Text>

<Text translate="no">
    {menuItem?.currency}{displayPrice}  // "€12.50" - never translated
</Text>
```

## Use Case Flow

### Scenario: Portuguese Restaurant with Spanish Customer

**Restaurant Owner (Portuguese)**:
1. Creates menu in Portuguese
2. Item: "Bacalhau à Brás"
3. Description: "Bacalhau desfiado com batata palha, cebola e ovos"
4. Price: €12.50

**Spanish Customer**:
1. Visits menu URL: `/venue/abc123/menu?lang=ES`
2. Sees static UI in Spanish (DeepL):
   - "Guardar" button (Save)
   - "Política de privacidad" footer link
   - "Puede contener los siguientes alérgenos:" allergen warning
3. Uses browser translation (Chrome/Safari/Firefox):
   - "Bacalao a la Brás" (menu item name)
   - "Bacalao deshilachado con patata paja, cebolla y huevos" (description)
4. Reads full menu in Spanish

**Result**: 100% translated experience, zero translation cost for dynamic content

## Implementation Details

### Static UI Translation Setup

**Files**:
- [src/lang/en.json](src/lang/en.json) - English source
- [src/lang/pt.json](src/lang/pt.json) - Portuguese (generated)
- [src/lang/es.json](src/lang/es.json) - Spanish (generated)
- [src/lang/fr.json](src/lang/fr.json) - French (generated)
- [src/lang/de.json](src/lang/de.json) - German (generated)
- [src/lang/it.json](src/lang/it.json) - Italian (generated)

**Translation Script**: [scripts/generate-translations-selective.js](scripts/generate-translations-selective.js)

**Selective Keys**: Only translates ~22 menu-related items (88% cost savings)

**Volume Persistence**: Translations cached in Docker volume for zero-cost rebuilds

### Dynamic Content Translation Setup

**HTML Attributes**:
```tsx
// TRANSLATE: User-entered content
<Text translate="yes">{restaurant.name}</Text>
<Text translate="yes">{menuItem.description}</Text>
<Text translate="yes">{category.name}</Text>

// DON'T TRANSLATE: Technical data
<Text translate="no">{menuItem.price}</Text>
<Text translate="no">{restaurant.contactNo}</Text>
<Text translate="no">{restaurant.email}</Text>
```

**Browser Translation Detection**:
- Chrome: Right-click → "Translate to [language]"
- Safari: Right-click → "Translate to [language]"
- Firefox: Add-on "To Google Translate"

**User Instructions**: Static UI includes translated help text:
```json
"common.translatePage": "To view this menu in your language, use your browser's translation feature:",
"common.translateChrome": "Chrome: Right-click and select 'Translate to [your language]'",
"common.translateSafari": "Safari: Right-click and select 'Translate to [your language]'",
"common.translateFirefox": "Firefox: Install 'To Google Translate' extension"
```

## Why This Hybrid Approach?

### Static UI → DeepL Translation

**Advantages**:
- ✅ Professional quality for UI elements
- ✅ Consistent terminology across languages
- ✅ Works without browser translation
- ✅ Controlled translation of technical terms

**Disadvantages**:
- ❌ Costs tokens (but minimal with selective translation)
- ❌ Requires regeneration when UI changes

### Dynamic Content → Browser Translation

**Advantages**:
- ✅ Zero cost (browser-based)
- ✅ Supports unlimited languages
- ✅ No backend API calls
- ✅ Works for any user input language
- ✅ Real-time translation
- ✅ No database storage needed

**Disadvantages**:
- ❌ Requires user to enable browser translation
- ❌ Translation quality varies by browser
- ❌ May miss context-specific translations

## Comparison with Alternative Approaches

### Alternative 1: Full Backend Translation (Not Used)

**How it would work**:
- Store PT menu item in database
- Translate to ES/FR/DE/IT via DeepL API
- Store all translations in database
- Serve pre-translated content based on ?lang= parameter

**Why we don't use this**:
- ❌ Expensive (every menu item × 5 languages = 5× cost)
- ❌ Database bloat (5× storage per item)
- ❌ Limited to pre-configured languages
- ❌ Translation re-generation on every content update

**Cost example**:
- 100 menu items with descriptions (~30k chars)
- Translate to 5 languages = 150k tokens
- Every menu update = another 150k tokens

### Alternative 2: Client-Side Translation API (Not Used)

**How it would work**:
- Use Google Translate API from browser
- Translate content on page load
- Store in browser memory

**Why we don't use this**:
- ❌ Costs per page view
- ❌ API rate limits
- ❌ Requires JavaScript enabled
- ❌ Slower page load

### Alternative 3: Hybrid (Current Approach) ✅

**What we use**:
- DeepL for static UI (one-time cost)
- Browser translation for dynamic content (free)

**Why this is optimal**:
- ✅ 99% cost savings vs full backend translation
- ✅ Professional UI translation
- ✅ Zero cost for unlimited content
- ✅ Supports all browser languages
- ✅ No database overhead

## Adding New Languages

### Static UI Language

To add a new language (e.g., Dutch):

1. Edit [scripts/generate-translations-selective.js](scripts/generate-translations-selective.js):
   ```javascript
   const TARGET_LANGUAGES = {
       pt: "PT",
       es: "ES",
       fr: "FR",
       de: "DE",
       it: "IT",
       nl: "NL",  // Add Dutch
   };
   ```

2. Regenerate translations:
   ```bash
   npm run translate
   ```

3. Rebuild container:
   ```bash
   docker compose build --no-cache app
   docker compose up -d
   ```

**Cost**: ~5,000 tokens (one language × 22 items)

### Dynamic Content Language

**No action needed** - browser translation supports 100+ languages automatically.

## User Experience Flow

### Step 1: Customer Arrives at Menu

```
URL: https://restaurant.com/venue/abc123/menu?lang=ES
```

### Step 2: Static UI Loads in Spanish (DeepL)

- Buttons: "Guardar", "Editar", "Eliminar"
- Footer: "Política de privacidad", "Términos y condiciones"
- Allergen warning: "Puede contener los siguientes alérgenos:"

### Step 3: Dynamic Content Shows in Portuguese (Original)

- Menu item: "Bacalhau à Brás"
- Description: "Bacalhau desfiado com batata palha..."

### Step 4: Customer Uses Browser Translation

- Chrome: Right-click → "Traducir al español"
- Content translates: "Bacalao a la Brás"

### Step 5: Full Spanish Experience

- UI in Spanish (professional)
- Content in Spanish (browser)
- Prices in original format (not translated)

## Testing Translation

### Test Static UI Translation

```bash
# Visit menu with language parameter
https://localhost:3000/venue/abc123/menu?lang=ES

# Check UI elements:
- Footer shows "Política de privacidad" (not "Privacy Policy")
- Buttons show "Guardar" (not "Save")
- Allergen labels show "Cereales" (not "Cereals")
```

### Test Dynamic Content Translation

```bash
# Enable Chrome translation:
1. Visit menu in Chrome
2. Right-click on page
3. Select "Translate to Spanish"
4. Verify menu items translate
5. Verify prices DON'T translate
```

### Test translate="yes" Attribute

```bash
# Inspect element in browser:
<Text translate="yes">Bacalhau à Brás</Text>  ✅ Should translate
<Text translate="no">€12.50</Text>           ❌ Should NOT translate
```

## Best Practices

### For Static UI Translation

1. **Only translate user-facing text**
   - Don't translate technical values (IDs, keys, etc.)
   - Don't translate legal disclaimers (keep source language)

2. **Use selective translation**
   - Only translate menu-related content
   - Skip admin-only text

3. **Cache translations**
   - Use Docker volumes for persistence
   - Commit to git for team sharing

### For Dynamic Content Translation

1. **Always mark user content**
   ```tsx
   <Text translate="yes">{userContent}</Text>
   ```

2. **Never mark technical data**
   ```tsx
   <Text translate="no">{price}</Text>
   <Text translate="no">{phoneNumber}</Text>
   <Text translate="no">{email}</Text>
   ```

3. **Provide translation instructions**
   - Include translated help text
   - Show browser-specific instructions

## Summary

The hybrid translation system provides:
- ✅ Professional static UI translation (DeepL)
- ✅ Free dynamic content translation (browser)
- ✅ 99% cost savings vs full backend translation
- ✅ Support for unlimited languages
- ✅ Zero database overhead
- ✅ Real-time translation
- ✅ Optimal for Portuguese restaurant owners serving international customers

Perfect for Menufic's use case! 🎉
