-- Create FeedEventType enum
DO $$ BEGIN
  CREATE TYPE "FeedEventType" AS ENUM ('DEVLOG_PUBLISHED', 'GAME_PUBLISHED', 'ROADMAP_UPDATED', 'TRAILER_UPDATED', 'PRESS_KIT_UPDATED', 'STUDIO_CREATED', 'STUDIO_VERIFIED', 'ROLE_CHANGED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create devlog_screenshots table
CREATE TABLE IF NOT EXISTS "devlog_screenshots" (
    "id" TEXT NOT NULL,
    "devlogId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,

    CONSTRAINT "devlog_screenshots_pkey" PRIMARY KEY ("id")
);

-- Create devlog_likes table
CREATE TABLE IF NOT EXISTS "devlog_likes" (
    "id" TEXT NOT NULL,
    "devlogId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devlog_likes_pkey" PRIMARY KEY ("id")
);

-- Create feed_events table
CREATE TABLE IF NOT EXISTS "feed_events" (
    "id" TEXT NOT NULL,
    "type" "FeedEventType" NOT NULL,
    "studioId" TEXT NOT NULL,
    "gameId" TEXT,
    "actorId" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_events_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "devlog_screenshots" ADD CONSTRAINT "devlog_screenshots_devlogId_fkey" FOREIGN KEY ("devlogId") REFERENCES "devlogs"("id") ON DELETE CASCADE;
ALTER TABLE "devlog_likes" ADD CONSTRAINT "devlog_likes_devlogId_fkey" FOREIGN KEY ("devlogId") REFERENCES "devlogs"("id") ON DELETE CASCADE;

-- Add unique constraints
ALTER TABLE "devlog_likes" ADD CONSTRAINT "devlog_likes_devlogId_userId_key" UNIQUE ("devlogId", "userId");

-- Add indexes
CREATE INDEX IF NOT EXISTS "feed_events_createdAt_idx" ON "feed_events"("createdAt");
CREATE INDEX IF NOT EXISTS "feed_events_studioId_idx" ON "feed_events"("studioId");
CREATE INDEX IF NOT EXISTS "feed_events_gameId_idx" ON "feed_events"("gameId");
