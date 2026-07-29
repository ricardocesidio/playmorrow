-- CreateTable: EmailTemplate
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT NOT NULL DEFAULT 'transactional',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    PRIMARY KEY ("id")
);

-- CreateTable: EmailLog
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "templateId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);
CREATE INDEX "email_logs_user_id_idx" ON "email_logs"("userId");
CREATE INDEX "email_logs_created_at_idx" ON "email_logs"("createdAt");
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- CreateTable: EmailPreference
CREATE TABLE "email_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL UNIQUE,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "digestFrequency" TEXT NOT NULL DEFAULT 'weekly',
    "devlogNotifications" BOOLEAN NOT NULL DEFAULT true,
    "wishlistNotifications" BOOLEAN NOT NULL DEFAULT true,
    "releaseNotifications" BOOLEAN NOT NULL DEFAULT true,
    "followNotifications" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribeToken" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    PRIMARY KEY ("id"),
    CONSTRAINT "email_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
