# Reservation Button Styling - Fixed

## Changes Made

### 1. Button Width Increased

**File**: [src/components/RestaurantMenu/RestaurantMenu.tsx](src/components/RestaurantMenu/RestaurantMenu.tsx)

**Line**: 441

**Change**:
- Removed `compact` prop
- Added `sx={{ minWidth: '200px' }}` to make button wider
- This gives the button a more prominent appearance matching the user's preferred width from the screenshot

**Before**:
```typescript
<Button
    leftIcon={<IconCalendar size={16} />}
    variant="filled"
    color="primary"
    onClick={() => setReservationModalOpened(true)}
    compact
>
    {t("reservations")}
</Button>
```

**After**:
```typescript
<Button
    leftIcon={<IconCalendar size={16} />}
    variant="filled"
    color="primary"
    onClick={() => setReservationModalOpened(true)}
    sx={{ minWidth: '200px' }}
>
    {t("reservations")}
</Button>
```

## Phone Field Investigation

The user requested making the phone field optional in the reservation modal. However, upon reviewing the code in [ReservationForm.tsx](src/components/RestaurantMenu/ReservationForm.tsx), **there is no phone field in the form**.

### Current Form Fields (Step 4 - Contact Info)

The final step of the reservation form only collects:
- **Email Address** (required)

**Code** (lines 302-308):
```typescript
<TextInput
    label="Email Address"
    placeholder="your.email@example.com"
    type="email"
    withAsterisk
    {...getInputProps("email")}
/>
```

### Conclusion

No changes needed for phone field since it doesn't exist in the form. If the user wants to add an optional phone field in the future, it can be added to:
1. Form schema (line 74-79)
2. Initial values (line 67-72)
3. Step 4 UI (after email field, line 309)
4. Submission handler (line 108-114)
5. API validator in `src/utils/validators.ts`

## Why Button Was Showing as Link

The user reported seeing the reservation button as an underlined link (external URL style) instead of a button. This is happening because:

### Root Cause

1. **Docker image not rebuilt** - The running container has old code
2. **Database migration not applied** - The `reservationType` column doesn't exist yet
3. **Result**: `menuDetails.reservationType` is `undefined`
4. **Fallback**: Code falls through to legacy reservation link (lines 447-454)

### Evidence from RestaurantMenu.tsx

```typescript
// Lines 435-445: Form button (NEW SYSTEM)
{(menuDetails as any).reservationType === "FORM" && (
    <Button>...</Button>  // This won't render if reservationType is undefined
)}

// Lines 447-454: Legacy link (OLD SYSTEM)
{!(menuDetails as any).reservationType && (menuDetails as any).reservations && (
    <a style={{ textDecoration: 'underline' }}>  // This renders instead!
        <Text>{t("reservations")}</Text>
    </a>
)}
```

### What's Happening

1. Menu doesn't have `reservationType` field because migration not applied
2. Condition `reservationType === "FORM"` is false (undefined !== "FORM")
3. Button doesn't render
4. Legacy link shows instead (if `reservations` URL exists)
5. User sees underlined link style instead of button

## Deployment Required

To see the button with correct styling, you must:

### Step 1: Apply Database Migration

```bash
# Option A: Direct SQL
docker exec -i menufic-db psql -U menufic -d menufic_db < prisma/migrations/20251230162945_add_reservation_system/migration.sql

# Option B: Combined migration file
docker exec -i menufic-db psql -U menufic -d menufic_db < apply-critical-migrations.sql
```

### Step 2: Rebuild Docker Image

This will include the updated button styling code:

```bash
docker-compose down
docker-compose build --no-cache menufic
docker-compose up -d
```

### Step 3: Configure Menu

After rebuilding:

1. **Edit your menu** in admin panel
2. **Set Reservation Type** to "Built-in Reservation Form"
3. **Configure** email, start time, end time, max party size
4. **Save the menu**

### Step 4: Verify on Public Page

1. Visit the public menu page
2. ✅ **Expected**: Reservation button appears as a filled button with calendar icon
3. ✅ **Expected**: Button has minimum width of 200px (wider than compact style)
4. ✅ **Expected**: Clicking opens the 4-step reservation wizard

## Button Design Comparison

### External URL Style (Link)
```
┌─────────────────────────────┐
│ 📅 Reservations             │  ← Underlined link style
└─────────────────────────────┘
```

### Built-in Form Style (Button)
```
┌─────────────────────────────┐
│  📅  Reserve a Table        │  ← Filled button style (200px min width)
└─────────────────────────────┘
```

The button now uses only the filled button design (not the underlined link style) with a wider minimum width as requested.

## Testing Checklist

After deployment:

- [ ] Database migration applied successfully
- [ ] Docker image rebuilt
- [ ] Menu has `reservationType` set to "FORM"
- [ ] Public page shows button (not underlined link)
- [ ] Button has wider width (~200px)
- [ ] Button has filled style with calendar icon
- [ ] Clicking button opens reservation modal
- [ ] Form has 4 steps (Date, Time, Guests, Contact)
- [ ] Form only asks for email (no phone field)
- [ ] Submitting form sends email successfully

## Current Status

### ✅ Code Changes Complete

- Button styling updated with `minWidth: '200px'`
- Removed `compact` prop for better visibility
- Phone field confirmed not present (no changes needed)

### ❌ Deployment Pending

- Database migration not run
- Docker image not rebuilt
- Changes won't be visible until deployed

### 🔄 Next Action

**Run deployment steps above** to see the updated button styling on the public page.
