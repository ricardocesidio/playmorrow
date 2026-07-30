-- Catch-up migration: all tables, enums, and columns added via prisma db push but missing from migrations

-- Enums (safe to run even if already exist — PostgreSQL ignores duplicate CREATE TYPE IF NOT EXISTS)
DO $$ BEGIN
  CREATE TYPE "StudioVerificationStatus" AS ENUM ('UNVERIFIED', 'EMAIL_VERIFIED', 'BASIC_VERIFIED', 'OFFICIAL_STUDIO', 'PARTNER_STUDIO', 'FEATURED_STUDIO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'WAITING_SUPPORT', 'WAITING_CUSTOMER', 'INVESTIGATING', 'ESCALATED', 'RESOLVED', 'CLOSED', 'ARCHIVED', 'SPAM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'SECURITY', 'EMERGENCY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SupportDepartment" AS ENUM ('GENERAL', 'TECHNICAL', 'ACCOUNTS', 'STUDIO', 'PUBLISHING', 'MODERATION', 'COMMUNITY', 'BUG_REPORT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Columns missing from studios table
ALTER TABLE "studios" ADD COLUMN IF NOT EXISTS "verificationStatus" "StudioVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED';
ALTER TABLE "studios" ADD COLUMN IF NOT EXISTS "trustScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "studios" ADD COLUMN IF NOT EXISTS "legalName" TEXT;
ALTER TABLE "studios" ADD COLUMN IF NOT EXISTS "companySize" TEXT;
ALTER TABLE "studios" ADD COLUMN IF NOT EXISTS "businessEmail" TEXT;
ALTER TABLE "studios" ADD COLUMN IF NOT EXISTS "supportEmail" TEXT;
ALTER TABLE "studios" ADD COLUMN IF NOT EXISTS "pressContact" TEXT;
ALTER TABLE "studios" ADD COLUMN IF NOT EXISTS "mission" TEXT;
ALTER TABLE "studios" ADD COLUMN IF NOT EXISTS "vision" TEXT;
ALTER TABLE "studios" ADD COLUMN IF NOT EXISTS "discord" TEXT;
ALTER TABLE "studios" ADD COLUMN IF NOT EXISTS "twitter" TEXT;
ALTER TABLE "studios" ADD COLUMN IF NOT EXISTS "github" TEXT;
ALTER TABLE "studios" ADD COLUMN IF NOT EXISTS "linkedin" TEXT;
ALTER TABLE "studios" ADD COLUMN IF NOT EXISTS "steamUrl" TEXT;
ALTER TABLE "studios" ADD COLUMN IF NOT EXISTS "epicUrl" TEXT;
ALTER TABLE "studios" ADD COLUMN IF NOT EXISTS "itchUrl" TEXT;
ALTER TABLE "studios" ADD COLUMN IF NOT EXISTS "engine" TEXT;
ALTER TABLE "studios" ADD COLUMN IF NOT EXISTS "platforms" TEXT;
ALTER TABLE "studios" ADD COLUMN IF NOT EXISTS "businessDesc" TEXT;

-- CreateTable: studio_verification_requests
CREATE TABLE IF NOT EXISTS "studio_verification_requests" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "requestedLevel" "StudioVerificationStatus" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "documents" JSONB,
    "notes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_verification_requests_pkey" PRIMARY KEY ("id")
);
-- CreateTable: brand_kits
CREATE TABLE IF NOT EXISTS "brand_kits" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "primaryLogo" TEXT,
    "darkLogo" TEXT,
    "lightLogo" TEXT,
    "colors" JSONB,
    "typography" TEXT,
    "brandRules" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_kits_pkey" PRIMARY KEY ("id")
);
-- CreateTable: studio_press_kits
CREATE TABLE IF NOT EXISTS "studio_press_kits" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "headline" TEXT,
    "factSheet" JSONB,
    "awards" TEXT,
    "pressContacts" JSONB,
    "history" TEXT,
    "logos" JSONB,
    "keyArt" TEXT,
    "trailerUrl" TEXT,
    "downloads" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_press_kits_pkey" PRIMARY KEY ("id")
);
-- CreateTable: activity_events
CREATE TABLE IF NOT EXISTS "activity_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorId" TEXT,
    "targetId" TEXT,
    "targetType" TEXT,
    "studioId" TEXT,
    "gameId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_events_pkey" PRIMARY KEY ("id")
);
-- CreateTable: studio_goals
CREATE TABLE IF NOT EXISTS "studio_goals" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "requirement" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_goals_pkey" PRIMARY KEY ("id")
);
-- CreateTable: studio_achievements
CREATE TABLE IF NOT EXISTS "studio_achievements" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studio_achievements_pkey" PRIMARY KEY ("id")
);
-- CreateTable: studio_health_scores
CREATE TABLE IF NOT EXISTS "studio_health_scores" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "breakdown" JSONB,
    "recommendations" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studio_health_scores_pkey" PRIMARY KEY ("id")
);
-- CreateTable: studio_weekly_reports
CREATE TABLE IF NOT EXISTS "studio_weekly_reports" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "isDelivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studio_weekly_reports_pkey" PRIMARY KEY ("id")
);
-- CreateTable: analytics_events
CREATE TABLE IF NOT EXISTS "analytics_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "gameId" TEXT,
    "studioId" TEXT,
    "userId" TEXT,
    "sessionId" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "country" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "locale" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);
-- CreateTable: analytics_daily_aggregates
CREATE TABLE IF NOT EXISTS "analytics_daily_aggregates" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "gameId" TEXT,
    "studioId" TEXT,
    "eventType" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "uniqueCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_daily_aggregates_pkey" PRIMARY KEY ("id")
);
-- CreateTable: help_categories
CREATE TABLE IF NOT EXISTS "help_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "help_categories_pkey" PRIMARY KEY ("id")
);
-- CreateTable: help_articles
CREATE TABLE IF NOT EXISTS "help_articles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "body" TEXT NOT NULL,
    "categoryId" TEXT,
    "tags" TEXT[],
    "authorId" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "readingTimeMin" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "help_articles_pkey" PRIMARY KEY ("id")
);
-- CreateTable: help_article_feedback
CREATE TABLE IF NOT EXISTS "help_article_feedback" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "helpful" BOOLEAN NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "help_article_feedback_pkey" PRIMARY KEY ("id")
);
-- CreateTable: support_categories
CREATE TABLE IF NOT EXISTS "support_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "department" "SupportDepartment" NOT NULL DEFAULT 'GENERAL',
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_categories_pkey" PRIMARY KEY ("id")
);
-- CreateTable: support_tickets
CREATE TABLE IF NOT EXISTS "support_tickets" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "SupportTicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "department" "SupportDepartment" NOT NULL DEFAULT 'GENERAL',
    "categoryId" TEXT,
    "authorId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "reopenedAt" TIMESTAMP(3),
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);
-- CreateTable: support_replies
CREATE TABLE IF NOT EXISTS "support_replies" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "isStaff" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_replies_pkey" PRIMARY KEY ("id")
);
-- CreateTable: support_attachments
CREATE TABLE IF NOT EXISTS "support_attachments" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT,
    "replyId" TEXT,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_attachments_pkey" PRIMARY KEY ("id")
);
-- CreateTable: support_ticket_history
CREATE TABLE IF NOT EXISTS "support_ticket_history" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_ticket_history_pkey" PRIMARY KEY ("id")
);
-- CreateTable: api_keys
CREATE TABLE IF NOT EXISTS "api_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "studio_verification_requests" ADD CONSTRAINT "studio_verification_requests_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_verification_requests" ADD CONSTRAINT "studio_verification_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "brand_kits" ADD CONSTRAINT "brand_kits_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_press_kits" ADD CONSTRAINT "studio_press_kits_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_goals" ADD CONSTRAINT "studio_goals_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_achievements" ADD CONSTRAINT "studio_achievements_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_health_scores" ADD CONSTRAINT "studio_health_scores_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "studio_weekly_reports" ADD CONSTRAINT "studio_weekly_reports_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "help_articles" ADD CONSTRAINT "help_articles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "help_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "help_articles" ADD CONSTRAINT "help_articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "help_article_feedback" ADD CONSTRAINT "help_article_feedback_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "help_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "help_article_feedback" ADD CONSTRAINT "help_article_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "support_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_replies" ADD CONSTRAINT "support_replies_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_replies" ADD CONSTRAINT "support_replies_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_attachments" ADD CONSTRAINT "support_attachments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_attachments" ADD CONSTRAINT "support_attachments_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "support_replies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_ticket_history" ADD CONSTRAINT "support_ticket_history_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_ticket_history" ADD CONSTRAINT "support_ticket_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "studio_verification_requests_studioId_idx" ON "studio_verification_requests"("studioId");
CREATE INDEX "studio_verification_requests_status_idx" ON "studio_verification_requests"("status");
CREATE UNIQUE INDEX "brand_kits_studioId_key" ON "brand_kits"("studioId");
CREATE UNIQUE INDEX "studio_press_kits_studioId_key" ON "studio_press_kits"("studioId");
CREATE INDEX "activity_events_actorId_createdAt_idx" ON "activity_events"("actorId", "createdAt");
CREATE INDEX "activity_events_studioId_createdAt_idx" ON "activity_events"("studioId", "createdAt");
CREATE INDEX "activity_events_gameId_createdAt_idx" ON "activity_events"("gameId", "createdAt");
CREATE INDEX "activity_events_eventType_createdAt_idx" ON "activity_events"("eventType", "createdAt");
CREATE INDEX "activity_events_createdAt_idx" ON "activity_events"("createdAt");
CREATE INDEX "studio_goals_studioId_isCompleted_idx" ON "studio_goals"("studioId", "isCompleted");
CREATE UNIQUE INDEX "studio_goals_studioId_goalId_key" ON "studio_goals"("studioId", "goalId");
CREATE INDEX "studio_achievements_studioId_idx" ON "studio_achievements"("studioId");
CREATE UNIQUE INDEX "studio_achievements_studioId_achievementId_key" ON "studio_achievements"("studioId", "achievementId");
CREATE INDEX "studio_health_scores_studioId_calculatedAt_idx" ON "studio_health_scores"("studioId", "calculatedAt");
CREATE INDEX "studio_weekly_reports_studioId_weekStart_idx" ON "studio_weekly_reports"("studioId", "weekStart");
CREATE INDEX "analytics_events_eventType_idx" ON "analytics_events"("eventType");
CREATE INDEX "analytics_events_gameId_eventType_timestamp_idx" ON "analytics_events"("gameId", "eventType", "timestamp");
CREATE INDEX "analytics_events_studioId_eventType_timestamp_idx" ON "analytics_events"("studioId", "eventType", "timestamp");
CREATE INDEX "analytics_events_timestamp_idx" ON "analytics_events"("timestamp");
CREATE INDEX "analytics_events_gameId_timestamp_idx" ON "analytics_events"("gameId", "timestamp");
CREATE INDEX "analytics_events_studioId_timestamp_idx" ON "analytics_events"("studioId", "timestamp");
CREATE INDEX "analytics_daily_aggregates_gameId_date_idx" ON "analytics_daily_aggregates"("gameId", "date");
CREATE INDEX "analytics_daily_aggregates_studioId_date_idx" ON "analytics_daily_aggregates"("studioId", "date");
CREATE INDEX "analytics_daily_aggregates_eventType_date_idx" ON "analytics_daily_aggregates"("eventType", "date");
CREATE UNIQUE INDEX "analytics_daily_aggregates_date_gameId_studioId_eventType_key" ON "analytics_daily_aggregates"("date", "gameId", "studioId", "eventType");
CREATE UNIQUE INDEX "help_categories_slug_key" ON "help_categories"("slug");
CREATE INDEX "help_categories_position_idx" ON "help_categories"("position");
CREATE UNIQUE INDEX "help_articles_slug_key" ON "help_articles"("slug");
CREATE INDEX "help_articles_categoryId_idx" ON "help_articles"("categoryId");
CREATE INDEX "help_articles_authorId_idx" ON "help_articles"("authorId");
CREATE INDEX "help_articles_isPublished_idx" ON "help_articles"("isPublished");
CREATE INDEX "help_articles_isFeatured_idx" ON "help_articles"("isFeatured");
CREATE INDEX "help_articles_publishedAt_idx" ON "help_articles"("publishedAt");
CREATE UNIQUE INDEX "help_article_feedback_articleId_userId_key" ON "help_article_feedback"("articleId", "userId");
CREATE UNIQUE INDEX "support_categories_slug_key" ON "support_categories"("slug");
CREATE UNIQUE INDEX "support_tickets_ticketNumber_key" ON "support_tickets"("ticketNumber");
CREATE INDEX "support_tickets_authorId_idx" ON "support_tickets"("authorId");
CREATE INDEX "support_tickets_assignedToId_idx" ON "support_tickets"("assignedToId");
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");
CREATE INDEX "support_tickets_priority_idx" ON "support_tickets"("priority");
CREATE INDEX "support_tickets_department_idx" ON "support_tickets"("department");
CREATE INDEX "support_tickets_createdAt_idx" ON "support_tickets"("createdAt");
CREATE INDEX "support_tickets_ticketNumber_idx" ON "support_tickets"("ticketNumber");
CREATE INDEX "support_replies_ticketId_idx" ON "support_replies"("ticketId");
CREATE INDEX "support_replies_authorId_idx" ON "support_replies"("authorId");
CREATE INDEX "support_replies_createdAt_idx" ON "support_replies"("createdAt");
CREATE INDEX "support_attachments_ticketId_idx" ON "support_attachments"("ticketId");
CREATE INDEX "support_attachments_replyId_idx" ON "support_attachments"("replyId");
CREATE INDEX "support_ticket_history_ticketId_idx" ON "support_ticket_history"("ticketId");
CREATE INDEX "support_ticket_history_actorId_idx" ON "support_ticket_history"("actorId");
CREATE INDEX "support_ticket_history_createdAt_idx" ON "support_ticket_history"("createdAt");
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");
CREATE INDEX "api_keys_keyHash_idx" ON "api_keys"("keyHash");
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");
