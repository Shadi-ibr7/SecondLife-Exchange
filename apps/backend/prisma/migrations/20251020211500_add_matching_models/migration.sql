-- AlterTable
ALTER TABLE "items" ADD COLUMN     "popularityScore" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "preferences" (
    "userId" TEXT NOT NULL,
    "preferredCategories" TEXT[],
    "dislikedCategories" TEXT[],
    "preferredConditions" TEXT[],
    "locale" TEXT,
    "country" TEXT,
    "radiusKm" INTEGER,

    CONSTRAINT "preferences_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "items_popularityScore_idx" ON "items"("popularityScore");

-- AddForeignKey
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
