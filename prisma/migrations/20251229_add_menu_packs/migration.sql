-- CreateTable: Pack
CREATE TABLE IF NOT EXISTS "Pack" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT '€',
    "vatRate" INTEGER NOT NULL DEFAULT 23,
    "vatIncluded" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "menuId" TEXT,
    "imageId" TEXT,

    CONSTRAINT "Pack_pkey" PRIMARY KEY ("id","userId")
);

-- CreateTable: PackSection
CREATE TABLE IF NOT EXISTS "PackSection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "items" TEXT[],
    "position" INTEGER NOT NULL,
    "packId" TEXT,

    CONSTRAINT "PackSection_pkey" PRIMARY KEY ("id","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Pack_id_key" ON "Pack"("id");
CREATE UNIQUE INDEX IF NOT EXISTS "Pack_imageId_key" ON "Pack"("imageId");
CREATE INDEX IF NOT EXISTS "Pack_menuId_idx" ON "Pack"("menuId");

CREATE UNIQUE INDEX IF NOT EXISTS "PackSection_id_key" ON "PackSection"("id");
CREATE INDEX IF NOT EXISTS "PackSection_packId_idx" ON "PackSection"("packId");
