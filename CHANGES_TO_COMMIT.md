# Changes to Commit

All the venue refactoring work is complete in your local files. You now need to commit and push these changes to git so your remote server can pull them.

## Files Changed in This Session

### Translation Key Fixes (Just Fixed)
1. **src/pages/venue/[restaurantId].tsx** - Line 29: `restaurantFetchError` → `venueFetchError`
2. **src/pages/venue/[restaurantId]/banners.tsx** - Line 83: `restaurantFetchError` → `venueFetchError`
3. **src/pages/venue/[restaurantId]/edit-menu.tsx** - Line 35: `restaurantFetchError` → `venueFetchError`

### Files Changed in Previous Sessions (Already Fixed)
- **Dockerfile** - Added CACHEBUST argument with RUN echo for cache invalidation
- **tsconfig.json** - Added `"noImplicitAny": false`
- **src/lang/en.json** - All 73 occurrences of "restaurant" changed to "venue"
- **src/env/schema.mjs** - Added NEXT_PUBLIC_PRIVACY_POLICY_URL and NEXT_PUBLIC_TERMS_CONDITIONS_URL
- **src/components/Footer/Footer.tsx** - Dynamic year and configurable links
- **Multiple form files** - Added type annotations (err: unknown, data: any)
- **src/components/LandingSections/Pricing.tsx** - Updated translation keys
- **src/components/RestaurantMenu/RestaurantMenu.tsx** - Updated translation key
- **src/pages/venue/index.tsx** - Updated translation keys
- **src/components/Forms/RestaurantForm.tsx** - Updated translation key
- **All tRPC context calls** - Added `as any` type casts

## What to Commit

Since this is a fresh download and not a git repository, you need to:

1. **Initialize git** (if the original source has a git repo, clone it instead):
   ```bash
   cd c:\Users\eric.herji\Downloads\menufic-main
   git init
   git remote add origin <your-repository-url>
   ```

2. **Stage all changes**:
   ```bash
   git add .
   ```

3. **Create a commit**:
   ```bash
   git commit -m "Complete venue refactoring

- Rename all user-facing text from restaurant to venue
- Update routes from /restaurant to /venue
- Fix all translation keys (restaurant* → venue*)
- Add TypeScript type annotations for error handlers
- Configure noImplicitAny: false in tsconfig
- Fix Docker cache busting with CACHEBUST argument
- Update Footer with dynamic year and env variables

Fixes #[issue-number] if applicable"
   ```

4. **Push to remote**:
   ```bash
   git push origin main
   ```

   Or if pushing for the first time:
   ```bash
   git push -u origin main
   ```

## After Pushing

Once you've pushed these changes, run your deployment command on the server:

```bash
docker-compose down && git pull origin main && docker build --build-arg CACHEBUST=$(date +%s) -t ghcr.io/newitdevelop/menufic:latest . && docker-compose up -d
```

The `git pull` will now get your latest changes and the build should succeed!

## Verification

After deployment, check that:
1. The build completes without TypeScript errors
2. The application routes work at `/venue` (not `/restaurant`)
3. All user-facing text shows "venue" instead of "restaurant"
