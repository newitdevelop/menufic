# Reservation Button Not Showing - Checklist

## Issue
After selecting "Built-in Reservation Form" in the menu editor, the reservation button doesn't appear on the public page.

## Root Cause
The reservation settings are being collected by the form but not saved to the database because:

1. ✅ **Menu router updated** - We added the reservation fields to create/update mutations
2. ❌ **Docker not rebuilt** - The running container has old code
3. ❌ **Database migration not applied** - The `reservationType` column doesn't exist in the database yet
4. ❌ **Prisma client not regenerated** - The TypeScript types don't know about new fields

## What Needs to Happen

### Step 1: Apply Database Migration

The reservation system migration adds these fields to the Menu table:
- `reservationType` (enum: NONE/EXTERNAL/FORM)
- `reservationUrl`
- `reservationEmail`
- `reservationStartTime`
- `reservationEndTime`
- `reservationMaxPartySize`

**Apply the migration**:
```bash
# Option A: Direct SQL
docker exec -i menufic-db psql -U menufic -d menufic_db < prisma/migrations/20251230162945_add_reservation_system/migration.sql

# Option B: Or use the combined migration file
docker exec -i menufic-db psql -U menufic -d menufic_db < apply-critical-migrations.sql
```

### Step 2: Rebuild Docker Image

This will:
- Include the updated menu.router.ts with reservation field saving
- Regenerate Prisma client with new schema
- Include all new code (ReservationForm, email service, etc.)

```bash
docker-compose down
docker-compose build --no-cache menufic
docker-compose up -d
```

### Step 3: Verify Migration Applied

```sql
-- Connect to database
docker exec -it menufic-db psql -U menufic -d menufic_db

-- Check if columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Menu'
AND column_name LIKE 'reservation%';

-- Expected output:
--     column_name          |   data_type
-- -------------------------+---------------
--  reservationType         | USER-DEFINED
--  reservationUrl          | text
--  reservationEmail        | text
--  reservationStartTime    | text
--  reservationEndTime      | text
--  reservationMaxPartySize | integer

-- Check enum values
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'ReservationType';

-- Expected output:
--  enumlabel
-- -----------
--  NONE
--  EXTERNAL
--  FORM

\q
```

### Step 4: Test Reservation Button

After rebuilding:

1. **Edit a menu** in admin panel
2. **Set Reservation Type** to "Built-in Reservation Form"
3. **Configure**:
   - Reservation Email: `restaurant.porto@neyahotels.com`
   - Start Time: `19:00`
   - End Time: `22:00`
   - Max Party Size: `12`
4. **Save the menu**
5. **Visit public page**: `https://menu.neyahotels.com/venue/{restaurantId}/menu`
6. ✅ **Verify**: "Reserve a Table" button appears below menu name/contact info
7. **Click button** → 4-step reservation form should open
8. **Complete form** and submit
9. ✅ **Verify**: Email arrives at configured address

## Why Button Wasn't Showing

The code checks for `(menuDetails as any).reservationType === "FORM"` on line 435 of RestaurantMenu.tsx.

But if:
- Migration not applied → database doesn't have `reservationType` column
- Container not rebuilt → menu.router.ts isn't saving the field
- Result: `menuDetails.reservationType` is always `undefined`
- So the condition is never true
- Button never renders

## Current Status

### ✅ Code is Ready
- `MenuForm.tsx` - Collects reservation settings
- `menu.router.ts` - Saves reservation settings to database
- `RestaurantMenu.tsx` - Displays reservation button when type=FORM
- `ReservationForm.tsx` - 4-step reservation wizard
- `reservation.router.ts` - API endpoint for submissions
- `email.service.ts` - SMTP email sending

### ❌ Not Yet Deployed
- Database migration not run
- Docker image not rebuilt
- Prisma client not regenerated

### 🔄 Next Action
**Run Steps 1 & 2 above** to deploy all changes

## Additional Notes

### Start Date Logic ✅ Already Correct

The start date logic is working correctly:

```typescript
if (input.startDate) {
    const startOfStartDate = new Date(input.startDate);
    startOfStartDate.setHours(0, 0, 0, 0);
    if (now < startOfStartDate) {
        isWithinDateRange = false; // Not started yet
    }
}
```

**Behavior**:
- Start Date: December 23, 2025
- Menu becomes visible: December 23, 2025 at 00:00:00
- If today is before Dec 23 → menu inactive
- If today is Dec 23 or later → menu active (assuming within end date)

This is correct! The menu SHOULD be visible starting from the start date.

### End Date Logic ✅ Fixed

```typescript
if (input.endDate) {
    const endOfEndDate = new Date(input.endDate);
    endOfEndDate.setHours(23, 59, 59, 999); // End of the day
    if (now > endOfEndDate) {
        isWithinDateRange = false; // Already ended
    }
}
```

**Behavior**:
- End Date: December 31, 2025
- Menu stays visible: Until December 31, 2025 at 23:59:59.999
- January 1, 2026 at 00:00:00 → menu becomes inactive automatically

Perfect! This matches your requirement.

### Combined Logic

```typescript
const finalIsActive = userActiveState && isWithinDateRange;
```

Menu is active when **BOTH**:
1. User has "Menu is Active" checkbox checked
2. Current date is within start/end range (if temporary menu)

## Testing Checklist

After deployment:

- [ ] Database migration applied
- [ ] Docker image rebuilt
- [ ] Menu editor shows reservation options
- [ ] Saving menu with "Form" type works
- [ ] Reopening menu shows saved settings
- [ ] Public page shows "Reserve a Table" button
- [ ] Clicking button opens 4-step form
- [ ] Completing form sends email
- [ ] Email arrives with correct details
- [ ] Temporary menu dates work correctly
- [ ] Menu becomes inactive after end date
- [ ] Menu stays inactive if user unchecks "Active"
