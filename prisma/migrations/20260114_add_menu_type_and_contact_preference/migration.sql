-- CreateEnum for MenuType
CREATE TYPE "MenuType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum for ContactPreference
CREATE TYPE "ContactPreference" AS ENUM ('PHONE', 'WHATSAPP', 'EMAIL');

-- AlterTable Menu - Add new columns (defaults to EXTERNAL)
ALTER TABLE "Menu" ADD COLUMN "menuType" "MenuType" NOT NULL DEFAULT 'EXTERNAL';
ALTER TABLE "Menu" ADD COLUMN "externalUrl" TEXT;
