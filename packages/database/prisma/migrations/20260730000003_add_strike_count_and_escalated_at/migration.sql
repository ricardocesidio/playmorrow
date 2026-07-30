-- AlterTable: Add strikeCount to User
ALTER TABLE "users" ADD COLUMN "strikeCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: Add escalatedAt to ModerationReport
ALTER TABLE "moderation_reports" ADD COLUMN "escalatedAt" TIMESTAMP(3);

-- AlterTable: Add lastStrikeAt to User (companion to strikeCount)
ALTER TABLE "users" ADD COLUMN "lastStrikeAt" TIMESTAMP(3);
