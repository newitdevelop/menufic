-- Create Reservation table to persist submitted reservation requests
CREATE TABLE IF NOT EXISTS "Reservation" (
    "id"                TEXT NOT NULL,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "menuId"            TEXT NOT NULL,
    "restaurantId"      TEXT NOT NULL,
    "restaurantName"    TEXT NOT NULL,
    "menuName"          TEXT NOT NULL,
    "serviceNames"      TEXT[] DEFAULT ARRAY[]::TEXT[],
    "date"              TIMESTAMP(3) NOT NULL,
    "time"              TEXT NOT NULL,
    "partySize"         INTEGER NOT NULL,
    "email"             TEXT NOT NULL,
    "phone"             TEXT NOT NULL,
    "contactPreference" "ContactPreference" NOT NULL DEFAULT 'PHONE',
    "marketingConsent"  BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Reservation_restaurantId_idx" ON "Reservation"("restaurantId");
CREATE INDEX IF NOT EXISTS "Reservation_date_idx"         ON "Reservation"("date");
CREATE INDEX IF NOT EXISTS "Reservation_createdAt_idx"    ON "Reservation"("createdAt");
