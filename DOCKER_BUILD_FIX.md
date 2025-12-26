# Docker Build Fix - Empty Interface Error

## Problem

Docker build is failing with:
```
./src/types/mantine.d.ts
4:22  Error: An empty interface is equivalent to `{}`.  @typescript-eslint/no-empty-interface
```

## Root Cause

The file `src/types/mantine.d.ts` was created earlier for custom Mantine breakpoints but is no longer needed (we switched to hardcoded media queries). The file has been deleted locally but still exists in your Docker build context.

## Solution

Delete the file from your build context before building:

```bash
# On your server (Linux):
cd ~/menufic
rm -f src/types/mantine.d.ts

# Then rebuild:
docker build --no-cache -t ghcr.io/newitdevelop/menufic:latest .
```

## Alternative: Quick Fix Without Deleting

If you can't access the server filesystem, you can suppress the ESLint error temporarily by modifying `.eslintrc.cjs`:

```javascript
// Add to rules section:
rules: {
  // ... existing rules
  "@typescript-eslint/no-empty-interface": "warn", // Downgrade from error to warning
}
```

However, **deleting the file is the proper solution**.

## Verification

After deleting the file, verify it's gone:

```bash
ls -la src/types/
# Should NOT show mantine.d.ts
```

Then build should succeed:

```bash
docker build --no-cache -t ghcr.io/newitdevelop/menufic:latest .
```

---

**Status:** Ready to fix
**Action Required:** Delete `src/types/mantine.d.ts` from build context
