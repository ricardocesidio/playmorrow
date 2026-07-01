-- CreateTable
CREATE TABLE "player_xp_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_xp_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("userId","achievementId")
);

-- CreateIndex
CREATE INDEX "player_xp_events_userId_createdAt_idx" ON "player_xp_events"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "achievements_userId_idx" ON "achievements"("userId");

-- AddForeignKey
ALTER TABLE "player_xp_events" ADD CONSTRAINT "player_xp_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
