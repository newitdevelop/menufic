-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN "privacyPolicyUrl" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN "termsAndConditionsUrl" TEXT;

-- AlterTable
ALTER TABLE "Menu" ADD COLUMN "reservations" TEXT;
