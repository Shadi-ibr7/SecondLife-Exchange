-- CreateTable
CREATE TABLE "weekly_themes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "startOfWeek" TIMESTAMP(3) NOT NULL,
    "impactText" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggested_items" (
    "id" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "era" TEXT,
    "materials" TEXT,
    "ecoReason" TEXT,
    "repairDifficulty" TEXT,
    "popularity" INTEGER,
    "tags" TEXT[],
    "photoRef" TEXT,
    "aiModel" TEXT,
    "aiPromptHash" TEXT,
    "aiRaw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suggested_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_themes_slug_key" ON "weekly_themes"("slug");

-- CreateIndex
CREATE INDEX "weekly_themes_startOfWeek_idx" ON "weekly_themes"("startOfWeek");

-- CreateIndex
CREATE INDEX "weekly_themes_isActive_idx" ON "weekly_themes"("isActive");

-- CreateIndex
CREATE INDEX "suggested_items_themeId_country_idx" ON "suggested_items"("themeId", "country");

-- CreateIndex
CREATE INDEX "suggested_items_category_idx" ON "suggested_items"("category");

-- CreateIndex
CREATE INDEX "suggested_items_name_idx" ON "suggested_items"("name");

-- AddForeignKey
ALTER TABLE "suggested_items" ADD CONSTRAINT "suggested_items_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "weekly_themes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
