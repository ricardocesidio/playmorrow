-- Add DevlogStatus enum (if not already existing from prisma db push)
DO $$ BEGIN
  CREATE TYPE "DevlogStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add missing columns to devlogs table
ALTER TABLE "devlogs" ADD COLUMN IF NOT EXISTS "subtitle" TEXT;
ALTER TABLE "devlogs" ADD COLUMN IF NOT EXISTS "readingTimeMin" INTEGER;
ALTER TABLE "devlogs" ADD COLUMN IF NOT EXISTS "status" "DevlogStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "devlogs" ADD COLUMN IF NOT EXISTS "scheduledFor" TIMESTAMP(3);
ALTER TABLE "devlogs" ADD COLUMN IF NOT EXISTS "editedAt" TIMESTAMP(3);
ALTER TABLE "devlogs" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "devlogs" ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT '{}';

-- Add index for (gameId, status, publishedAt) if not already exists
CREATE INDEX IF NOT EXISTS "devlogs_gameId_status_publishedAt_idx" ON "devlogs"("gameId", "status", "publishedAt");
