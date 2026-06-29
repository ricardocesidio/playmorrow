-- AlterTable
ALTER TABLE "studios" ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "country" TEXT,
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "isOnboardingCompleted" SET DEFAULT false;

-- CreateTable
CREATE TABLE "studio_xp_events" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studio_xp_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "studio_xp_events_studioId_idx" ON "studio_xp_events"("studioId");

-- CreateIndex
CREATE INDEX "studio_xp_events_studioId_createdAt_idx" ON "studio_xp_events"("studioId", "createdAt");

-- AddForeignKey
ALTER TABLE "studio_xp_events" ADD CONSTRAINT "studio_xp_events_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
