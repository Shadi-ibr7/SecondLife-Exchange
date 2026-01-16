-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM ('MESSAGE', 'EXCHANGE_REQUEST', 'EXCHANGE_STATUS', 'ADMIN_ACTION', 'ECO_CONTENT_PUBLISHED', 'MATCH_FOUND', 'WEEKLY_THEME', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- AlterTable notification_tokens (add new columns for WebPush)
ALTER TABLE "notification_tokens" ADD COLUMN IF NOT EXISTS "endpoint" TEXT;
ALTER TABLE "notification_tokens" ADD COLUMN IF NOT EXISTS "p256dh" TEXT;
ALTER TABLE "notification_tokens" ADD COLUMN IF NOT EXISTS "auth" TEXT;
ALTER TABLE "notification_tokens" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;

-- Drop old unique constraint if exists and create new one
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notification_tokens_userId_provider_key') THEN
        ALTER TABLE "notification_tokens" DROP CONSTRAINT "notification_tokens_userId_provider_key";
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");
CREATE INDEX IF NOT EXISTS "notification_tokens_endpoint_idx" ON "notification_tokens"("endpoint");

-- Create unique constraint with endpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notification_tokens_userId_provider_endpoint_key') THEN
        -- First handle null endpoints by making them unique per user/provider
        ALTER TABLE "notification_tokens" ADD CONSTRAINT "notification_tokens_userId_provider_endpoint_key" UNIQUE ("userId", "provider", "endpoint");
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- If constraint exists or cannot be created, ignore
    NULL;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_userId_fkey') THEN
        ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
