-- AlterTable: Add familyId to RefreshToken for replay attack detection
ALTER TABLE "refresh_tokens" ADD COLUMN "familyId" TEXT;

-- CreateIndex
CREATE INDEX "refresh_tokens_familyId_idx" ON "refresh_tokens"("familyId");
