-- CreateTable
CREATE TABLE "default_card_settings" (
    "id" TEXT NOT NULL,
    "labels" JSONB NOT NULL,
    "priorities" JSONB NOT NULL,
    "statuses" JSONB NOT NULL,
    "defaultCardColor" TEXT,
    "defaultListColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "default_card_settings_pkey" PRIMARY KEY ("id")
);

