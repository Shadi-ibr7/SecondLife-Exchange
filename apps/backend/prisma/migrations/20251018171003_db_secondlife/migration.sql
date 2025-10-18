/*
  Warnings:

  - You are about to drop the column `initiatorId` on the `exchanges` table. All the data in the column will be lost.
  - You are about to drop the column `itemId` on the `exchanges` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `exchanges` table. All the data in the column will be lost.
  - You are about to drop the column `receiverId` on the `exchanges` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `exchanges` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `avatar` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `suggested_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `weekly_themes` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[tokenHash]` on the table `refresh_tokens` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `offeredItemTitle` to the `exchanges` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestedItemTitle` to the `exchanges` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requesterId` to the `exchanges` table without a default value. This is not possible if the table is not empty.
  - Added the required column `responderId` to the `exchanges` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenHash` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `displayName` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- AlterEnum
ALTER TYPE "ExchangeStatus" ADD VALUE 'DECLINED';

-- DropForeignKey
ALTER TABLE "exchanges" DROP CONSTRAINT "exchanges_initiatorId_fkey";

-- DropForeignKey
ALTER TABLE "exchanges" DROP CONSTRAINT "exchanges_itemId_fkey";

-- DropForeignKey
ALTER TABLE "exchanges" DROP CONSTRAINT "exchanges_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "items" DROP CONSTRAINT "items_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_exchangeId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_senderId_fkey";

-- DropForeignKey
ALTER TABLE "suggested_items" DROP CONSTRAINT "suggested_items_themeId_fkey";

-- DropIndex
DROP INDEX "refresh_tokens_token_key";

-- DropIndex
DROP INDEX "users_username_key";

-- AlterTable
ALTER TABLE "exchanges" DROP COLUMN "initiatorId",
DROP COLUMN "itemId",
DROP COLUMN "message",
DROP COLUMN "receiverId",
DROP COLUMN "updatedAt",
ADD COLUMN     "offeredItemTitle" TEXT NOT NULL,
ADD COLUMN     "requestedItemTitle" TEXT NOT NULL,
ADD COLUMN     "requesterId" TEXT NOT NULL,
ADD COLUMN     "responderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "refresh_tokens" DROP COLUMN "token",
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "tokenHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "avatar",
DROP COLUMN "bio",
DROP COLUMN "firstName",
DROP COLUMN "isActive",
DROP COLUMN "lastName",
DROP COLUMN "location",
DROP COLUMN "password",
DROP COLUMN "phone",
DROP COLUMN "updatedAt",
DROP COLUMN "username",
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "displayName" TEXT NOT NULL,
ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "roles" "UserRole" NOT NULL DEFAULT 'USER';

-- DropTable
DROP TABLE "items";

-- DropTable
DROP TABLE "messages";

-- DropTable
DROP TABLE "suggested_items";

-- DropTable
DROP TABLE "weekly_themes";

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "location" TEXT,
    "preferencesJson" JSONB,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");

-- CreateIndex
CREATE INDEX "exchanges_requesterId_idx" ON "exchanges"("requesterId");

-- CreateIndex
CREATE INDEX "exchanges_responderId_idx" ON "exchanges"("responderId");

-- CreateIndex
CREATE INDEX "exchanges_status_idx" ON "exchanges"("status");

-- CreateIndex
CREATE INDEX "exchanges_createdAt_idx" ON "exchanges"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_tokenHash_idx" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_responderId_fkey" FOREIGN KEY ("responderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
