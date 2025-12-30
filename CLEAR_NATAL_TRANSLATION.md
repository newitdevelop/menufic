# How to Clear "Natal" Translation Issue

## The Problem

"Natal" is not being translated because:
1. It's a short word (5 characters) - passes validation
2. It doesn't contain Portuguese-specific accents (ãõçá etc.) - passes validation
3. Without these checks failing, the system thinks "Natal" is a valid translation and caches it

## Solution: Clear Invalid Translations via API

I've added a new API endpoint to clear invalid translations. Here are 3 ways to use it:

### Method 1: Browser Console (Easiest - No Deployment Needed)

1. **In production**, open your browser console (F12) while logged into the admin panel
2. Run this code:

```javascript
// Clear ALL invalid translations (recommended)
fetch('/api/trpc/translation.clearInvalidTranslations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({})
})
.then(res => res.json())
.then(data => console.log('✅ Cleared translations:', data))
.catch(err => console.error('❌ Error:', err));
```

3. Wait for the response
4. Reload the menu page with `?lang=EN` - "Natal" should now translate to "Christmas"

### Method 2: Clear Specific Category Translation

If you know the category ID for "Natal":

```javascript
// Replace 'category-id-here' with the actual category ID
fetch('/api/trpc/translation.clearCache', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    entityType: 'category',
    entityId: 'category-id-here'
  })
})
.then(res => res.json())
.then(data => console.log('✅ Cleared:', data))
.catch(err => console.error('❌ Error:', err));
```

### Method 3: Add a Button to the Admin Panel (After Deployment)

After you deploy the changes, you can add a "Clear Invalid Translations" button anywhere in your admin panel:

```tsx
import { api } from "src/utils/api";
import { Button } from "@mantine/core";
import { showSuccessToast, showErrorToast } from "src/utils/helpers";

function ClearTranslationsButton() {
  const { mutate: clearTranslations, isLoading } = api.translation.clearInvalidTranslations.useMutation({
    onSuccess: (data) => {
      showSuccessToast("Success", `Cleared ${data.count} invalid translations`);
    },
    onError: (error) => {
      showErrorToast("Error", error.message);
    },
  });

  return (
    <Button
      onClick={() => clearTranslations()}
      loading={isLoading}
      color="orange"
    >
      Clear Invalid Translations
    </Button>
  );
}
```

## What Changed

I've added a new tRPC router with 3 endpoints:

1. **`translation.clearInvalidTranslations`** - Clears all non-PT translations that contain Portuguese characters
2. **`translation.clearCache`** - Clears all translations for a specific entity (menu/category/item)
3. **`translation.getByEntity`** - Lists all translations for debugging

## Files Modified

- `src/server/api/routers/translation.router.ts` (NEW) - Translation management endpoints
- `src/server/api/root.ts` - Added translation router to API

## Why "Natal" Wasn't Detected as Invalid

The validation logic checks for:
1. Words longer than 10 characters that match the original
2. Words with Portuguese accents (ãõçáéíóúâêôà)

"Natal" is:
- Only 5 characters (< 10) ✗
- Has no accents ✗

So it passes validation and gets cached as a "valid" translation even though it's Portuguese.

## After Clearing

Once you clear the invalid translations:
1. The cache is empty for "Natal" → English
2. Next time someone views in English, it will call DeepL API
3. DeepL will translate "Natal" → "Christmas"
4. The correct translation gets cached

## Prevention

To prevent this in the future, you could:
1. Improve validation to check for common Portuguese words
2. Add a manual translation override feature
3. Periodically run `clearInvalidTranslations` as a maintenance task

## Need Help?

If this doesn't work:
1. Check that DEEPL_API_KEY is set in production `.env`
2. Check server logs for translation errors
3. Verify you're logged in as an admin when calling the API
4. Try the SQL query method from the other file
