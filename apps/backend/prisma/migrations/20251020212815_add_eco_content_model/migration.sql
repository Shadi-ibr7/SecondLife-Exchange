-- CreateTable
CREATE TABLE "eco_content" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "locale" TEXT,
    "tags" TEXT[],
    "source" TEXT,
    "summary" TEXT,
    "kpis" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eco_content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "eco_content_kind_idx" ON "eco_content"("kind");

-- CreateIndex
CREATE INDEX "eco_content_locale_idx" ON "eco_content"("locale");

-- CreateIndex
CREATE INDEX "eco_content_tags_idx" ON "eco_content"("tags");

-- CreateIndex
CREATE INDEX "eco_content_publishedAt_idx" ON "eco_content"("publishedAt");
