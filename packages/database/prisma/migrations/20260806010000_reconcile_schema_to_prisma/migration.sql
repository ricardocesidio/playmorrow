-- Reconciliation migration: bring the schema produced by the full migration
-- set into exact parity with prisma/schema.prisma.
--
-- The historical migration set never created these objects (they existed only
-- via `prisma db push` on the dev database), so any environment built purely
-- from migrations (CI, a fresh test DB, or a fresh production deploy) was
-- missing them. Conversely, some objects the migration set created are not
-- part of schema.prisma and are dropped here.

-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "VerificationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WELCOME';

-- AlterEnum
ALTER TYPE "SupportDepartment" ADD VALUE IF NOT EXISTS 'FEATURE_REQUEST';
ALTER TYPE "SupportDepartment" ADD VALUE IF NOT EXISTS 'DMCA';
ALTER TYPE "SupportDepartment" ADD VALUE IF NOT EXISTS 'COPYRIGHT';
ALTER TYPE "SupportDepartment" ADD VALUE IF NOT EXISTS 'LEGAL';
ALTER TYPE "SupportDepartment" ADD VALUE IF NOT EXISTS 'SECURITY';

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_actorId_fkey";

-- DropForeignKey
ALTER TABLE "devlog_likes" DROP CONSTRAINT "devlog_likes_devlogId_fkey";

-- DropForeignKey
ALTER TABLE "devlog_screenshots" DROP CONSTRAINT "devlog_screenshots_devlogId_fkey";

-- DropForeignKey
ALTER TABLE "email_preferences" DROP CONSTRAINT "email_preferences_userId_fkey";

-- DropForeignKey
ALTER TABLE "marketplace_listings" DROP CONSTRAINT "marketplace_listings_studioId_fkey";

-- DropForeignKey
ALTER TABLE "purchased_licenses" DROP CONSTRAINT "purchased_licenses_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "studio_chat_messages" DROP CONSTRAINT "studio_chat_messages_authorId_fkey";

-- DropForeignKey
ALTER TABLE "studio_invitations" DROP CONSTRAINT "studio_invitations_invitedById_fkey";

-- DropIndex
DROP INDEX IF EXISTS "referral_codes_userId_idx";

-- AlterTable (data-safe: convert TEXT column to enum without data loss)
ALTER TABLE "studio_verification_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "studio_verification_requests" ALTER COLUMN "status" TYPE "VerificationRequestStatus" USING ("status"::"VerificationRequestStatus");
ALTER TABLE "studio_verification_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"VerificationRequestStatus";

-- AlterTable
ALTER TABLE "comments" ALTER COLUMN "type" SET DEFAULT 'POST';

-- AlterTable (orphan column that never existed in schema.prisma)
ALTER TABLE "devlogs" DROP COLUMN "coverUrl";

-- AlterTable
ALTER TABLE "email_templates" ALTER COLUMN "variables" DROP DEFAULT;

-- AlterTable
ALTER TABLE "marketplace_listings" ALTER COLUMN "tags" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ReferralUsage" (
    "id" TEXT NOT NULL,
    "referralCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferralUsage_referralCodeId_userId_key" ON "ReferralUsage"("referralCodeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_userId_key" ON "achievements"("userId");

-- CreateIndex
CREATE INDEX "devlog_likes_devlogId_idx" ON "devlog_likes"("devlogId");

-- CreateIndex
CREATE INDEX "devlog_likes_userId_idx" ON "devlog_likes"("userId");

-- CreateIndex
CREATE INDEX "devlog_screenshots_devlogId_idx" ON "devlog_screenshots"("devlogId");

-- CreateIndex
CREATE INDEX "feed_events_type_createdAt_idx" ON "feed_events"("type", "createdAt");

-- CreateIndex
CREATE INDEX "moderation_reports_reporterId_idx" ON "moderation_reports"("reporterId");

-- CreateIndex
CREATE INDEX "reactions_userId_idx" ON "reactions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex (status column is converted to enum above; recreate the index on the enum column)
DROP INDEX IF EXISTS "studio_verification_requests_status_idx";
CREATE INDEX "studio_verification_requests_status_idx" ON "studio_verification_requests"("status");

-- CreateIndex
CREATE INDEX "studios_name_idx" ON "studios"("name");

-- CreateIndex
CREATE INDEX "studios_createdAt_idx" ON "studios"("createdAt");

-- CreateIndex
CREATE INDEX "studios_followersCount_idx" ON "studios"("followersCount");

-- AddForeignKey
ALTER TABLE "studio_invitations" ADD CONSTRAINT "studio_invitations_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_chat_messages" ADD CONSTRAINT "studio_chat_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devlog_screenshots" ADD CONSTRAINT "devlog_screenshots_devlogId_fkey" FOREIGN KEY ("devlogId") REFERENCES "devlogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devlog_likes" ADD CONSTRAINT "devlog_likes_devlogId_fkey" FOREIGN KEY ("devlogId") REFERENCES "devlogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_events" ADD CONSTRAINT "feed_events_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_events" ADD CONSTRAINT "feed_events_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_events" ADD CONSTRAINT "feed_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_preferences" ADD CONSTRAINT "email_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralUsage" ADD CONSTRAINT "ReferralUsage_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "referral_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralUsage" ADD CONSTRAINT "ReferralUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX IF EXISTS "email_logs_created_at_idx" RENAME TO "email_logs_createdAt_idx";

-- RenameIndex
ALTER INDEX IF EXISTS "email_logs_user_id_idx" RENAME TO "email_logs_userId_idx";
