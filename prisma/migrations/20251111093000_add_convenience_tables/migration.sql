-- CreateTable
CREATE TABLE "convenience_categories" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "convenience_categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "convenience_categories_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "convenience_categories_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "convenience_entries" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "convenience_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "convenience_entries_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "convenience_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "convenience_entries_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "convenience_entries_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "convenience_entry_urls" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "convenience_entry_urls_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "convenience_entry_urls_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "convenience_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "convenience_categories_tenantId_position_idx" ON "convenience_categories"("tenantId", "position");

-- CreateIndex
CREATE INDEX "convenience_entries_categoryId_position_idx" ON "convenience_entries"("categoryId", "position");

-- CreateIndex
CREATE INDEX "convenience_entry_urls_entryId_position_idx" ON "convenience_entry_urls"("entryId", "position");








