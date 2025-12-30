# Deployment Instructions - Reservation System & Bug Fixes

This document provides step-by-step instructions for deploying the new reservation system and fixing the pack creation issue.

## Overview

Three new features/fixes have been implemented:

1. **Reservation System** - Multi-option reservation system with external URL or built-in form
2. **SMTP Email Service** - Email service using standard SMTP for Docker/Linux containers
3. **Pack Allergen Fix** - Fixed missing database field causing pack creation errors

## Database Migrations Required

You need to run **THREE** migration files on your PostgreSQL database in the following order:

### 1. Add Allergens to Menu Items (if not already run)
**File**: [prisma/migrations/20251223_add_allergens_to_menu_item/migration.sql](prisma/migrations/20251223_add_allergens_to_menu_item/migration.sql)

```sql
-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN "isEdible" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MenuItem" ADD COLUMN "allergens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Update existing menu items to have default values
UPDATE "MenuItem" SET "isEdible" = false, "allergens" = ARRAY[]::TEXT[] WHERE "isEdible" IS NULL OR "allergens" IS NULL;
```

### 2. Add Item Allergens to Pack Section
**File**: [prisma/migrations/20251230163000_add_item_allergens_to_pack_section/migration.sql](prisma/migrations/20251230163000_add_item_allergens_to_pack_section/migration.sql)

```sql
-- AlterTable PackSection - Add itemAllergens field
ALTER TABLE "PackSection" ADD COLUMN IF NOT EXISTS "itemAllergens" JSONB DEFAULT '{}';

-- Update existing records to have default empty object
UPDATE "PackSection" SET "itemAllergens" = '{}' WHERE "itemAllergens" IS NULL;
```

### 3. Add Reservation System Fields
**File**: [prisma/migrations/20251230162945_add_reservation_system/migration.sql](prisma/migrations/20251230162945_add_reservation_system/migration.sql)

```sql
-- CreateEnum
CREATE TYPE "ReservationType" AS ENUM ('NONE', 'EXTERNAL', 'FORM');

-- AlterTable Menu - Add new reservation system fields
ALTER TABLE "Menu" ADD COLUMN "reservationType" "ReservationType" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Menu" ADD COLUMN "reservationUrl" TEXT;
ALTER TABLE "Menu" ADD COLUMN "reservationEmail" TEXT;
ALTER TABLE "Menu" ADD COLUMN "reservationStartTime" TEXT;
ALTER TABLE "Menu" ADD COLUMN "reservationEndTime" TEXT;
ALTER TABLE "Menu" ADD COLUMN "reservationMaxPartySize" INTEGER;

-- Create index for reservation queries (optional but recommended)
CREATE INDEX "Menu_reservationType_idx" ON "Menu"("reservationType");
```

## How to Run Migrations

### Option 1: Using psql (Recommended for production)

Connect to your PostgreSQL database and run each migration file:

```bash
# Connect to your database
psql -h your-host -U your-user -d your-database

# Run migrations in order
\i prisma/migrations/20251223_add_allergens_to_menu_item/migration.sql
\i prisma/migrations/20251230163000_add_item_allergens_to_pack_section/migration.sql
\i prisma/migrations/20251230162945_add_reservation_system/migration.sql
```

### Option 2: Using Docker exec

If your PostgreSQL is in a Docker container:

```bash
# Copy migration files to container (if needed)
docker cp prisma/migrations/20251223_add_allergens_to_menu_item/migration.sql postgres-container:/tmp/
docker cp prisma/migrations/20251230163000_add_item_allergens_to_pack_section/migration.sql postgres-container:/tmp/
docker cp prisma/migrations/20251230162945_add_reservation_system/migration.sql postgres-container:/tmp/

# Execute migrations
docker exec -i postgres-container psql -U your-user -d your-database < /tmp/20251223_add_allergens_to_menu_item/migration.sql
docker exec -i postgres-container psql -U your-user -d your-database < /tmp/20251230163000_add_item_allergens_to_pack_section/migration.sql
docker exec -i postgres-container psql -U your-user -d your-database < /tmp/20251230162945_add_reservation_system/migration.sql
```

### Option 3: Using GUI Tools

If using tools like pgAdmin, DBeaver, or TablePlus:

1. Open your database connection
2. Open a new SQL query window
3. Copy and paste each migration file's contents
4. Execute them in order

## Environment Variables Configuration

### Required for Email Functionality

Add these environment variables to your Docker container or `.env` file:

```env
# SMTP Configuration (all required for email functionality)
SMTP_HOST=smtp.gmail.com              # Your SMTP server hostname
SMTP_PORT=587                         # 587 for TLS, 465 for SSL, 25 for unencrypted
SMTP_USER=your-email@example.com      # SMTP username/email
SMTP_PASS=your-app-password           # SMTP password or app-specific password
SMTP_FROM=noreply@menufic.com         # Optional: defaults to SMTP_USER if not set
```

### Example Configurations

#### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-specific-password  # Generate at https://myaccount.google.com/apppasswords
SMTP_FROM=noreply@yourdomain.com
```

#### Office 365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-password
```

#### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

#### Custom SMTP Server
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
```

### Docker Configuration

If using Docker Compose, add to your service:

```yaml
services:
  app:
    environment:
      - SMTP_HOST=smtp.gmail.com
      - SMTP_PORT=587
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - SMTP_FROM=noreply@menufic.com
```

Or mount an `.env` file:

```yaml
services:
  app:
    env_file:
      - .env
```

## Testing

### 1. Test Pack Creation (Verify allergen fix)

After running migrations 1 and 2:

1. Log into your admin panel
2. Navigate to a menu
3. Try creating a new pack with sections
4. The "Unknown arg `itemAllergens`" error should be resolved

### 2. Test Reservation System

After running migration 3 and configuring SMTP:

1. **Admin Side**:
   - Edit a menu
   - Find the "Reservation System" section
   - Set reservation type to "FORM"
   - Configure:
     - Reservation Email: where to receive requests
     - Start Time: e.g., 10:00
     - End Time: e.g., 22:00
     - Max Party Size: e.g., 12
   - Save the menu

2. **Customer Side**:
   - Visit the public menu page
   - Click the "Reserve a Table" button
   - Complete the 4-step form:
     - Step 1: Select a date
     - Step 2: Select a time slot
     - Step 3: Select party size
     - Step 4: Enter email address
   - Submit the reservation

3. **Email Verification**:
   - Check the configured reservation email inbox
   - You should receive a formatted HTML email with reservation details

### 3. Verify SMTP Configuration

Check your application logs for SMTP connection messages:

```bash
# Docker logs
docker logs your-container-name | grep "Email Service"

# You should see:
# [Email Service] SMTP transporter configured: smtp.gmail.com:587
# [Email Service] Email sent successfully: <message-id>
```

## Troubleshooting

### Pack Creation Still Fails

**Error**: `Unknown arg 'itemAllergens'`

**Solution**: Make sure you ran migration #2 (add_item_allergens_to_pack_section)

Verify the field exists:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'PackSection' AND column_name = 'itemAllergens';
```

### Email Not Sending

**Error**: `SMTP not configured`

**Solution**:
- Verify all SMTP environment variables are set correctly
- Check SMTP credentials are valid
- For Gmail: Use app-specific password, not regular password
- Check firewall rules allow SMTP port (587/465)

**Error**: `Authentication failed`

**Solution**:
- Verify SMTP_USER and SMTP_PASS are correct
- For Gmail: Enable "Less secure app access" or use app password
- Check if 2FA requires app-specific password

**Error**: `Connection timeout`

**Solution**:
- Verify SMTP_HOST and SMTP_PORT are correct
- Check network/firewall allows outbound connections on SMTP port
- Try alternative ports (587 vs 465)

### Reservation Form Not Showing

**Issue**: Button doesn't appear on menu page

**Solution**:
- Ensure migration #3 is applied
- Verify menu's `reservationType` is set to 'FORM' (not 'NONE' or 'EXTERNAL')
- Check that `reservationEmail`, `reservationStartTime`, and `reservationEndTime` are configured

## New Features Documentation

### Reservation System Options

Menus now have three reservation options:

1. **NONE** (Default): No reservations available
2. **EXTERNAL**: Link to external reservation platform (TheFork, OpenTable, etc.)
   - Requires: `reservationUrl`
3. **FORM**: Built-in reservation form
   - Requires: `reservationEmail`, `reservationStartTime`, `reservationEndTime`
   - Optional: `reservationMaxPartySize` (defaults to 12)

### API Endpoints

New tRPC endpoint for reservation submissions:

```typescript
// Client usage
const { mutate: submitReservation } = api.reservation.submit.useMutation({
  onSuccess: () => console.log("Reservation submitted!"),
});

submitReservation({
  menuId: "menu-id",
  date: new Date("2025-01-15"),
  time: "19:00",
  partySize: 4,
  email: "customer@example.com",
});
```

### Email Service

New email service at [src/server/services/email.service.ts](src/server/services/email.service.ts):

```typescript
import { sendReservationEmail } from "src/server/services/email.service";

await sendReservationEmail({
  to: "restaurant@example.com",
  restaurantName: "My Restaurant",
  menuName: "Dinner Menu",
  date: new Date(),
  time: "19:00",
  partySize: 4,
  customerEmail: "customer@example.com",
});
```

## Files Modified/Created

### Database
- `prisma/migrations/20251223_add_allergens_to_menu_item/migration.sql` (existing)
- `prisma/migrations/20251230163000_add_item_allergens_to_pack_section/migration.sql` (new)
- `prisma/migrations/20251230162945_add_reservation_system/migration.sql` (new)

### Backend
- `src/server/services/email.service.ts` (new)
- `src/server/api/routers/reservation.router.ts` (new)
- `src/server/api/root.ts` (updated - added reservation router)
- `src/env/schema.mjs` (updated - added SMTP env vars)
- `src/utils/validators.ts` (updated - added reservation validators)

### Frontend
- `src/components/RestaurantMenu/ReservationForm.tsx` (new)
- `src/components/RestaurantMenu/RestaurantMenu.tsx` (updated)
- `src/components/Forms/MenuForm.tsx` (updated)

### Dependencies
- `package.json` (updated - added nodemailer)

## Support

If you encounter issues:

1. Check application logs for error messages
2. Verify all migrations ran successfully
3. Confirm environment variables are set correctly
4. Test SMTP connection separately if email issues persist

For database-specific issues, you can verify the schema matches:

```sql
-- Check Menu table has reservation fields
SELECT column_name FROM information_schema.columns WHERE table_name = 'Menu';

-- Check PackSection has itemAllergens
SELECT column_name FROM information_schema.columns WHERE table_name = 'PackSection';

-- Check MenuItem has allergens
SELECT column_name FROM information_schema.columns WHERE table_name = 'MenuItem';
```
