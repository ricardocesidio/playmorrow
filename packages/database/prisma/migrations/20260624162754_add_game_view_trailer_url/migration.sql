-- AlterTable
ALTER TABLE "games" ADD COLUMN     "trailerUrl" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailChangeCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "game_views" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "game_views_gameId_createdAt_idx" ON "game_views"("gameId", "createdAt");

-- AddForeignKey
ALTER TABLE "game_views" ADD CONSTRAINT "game_views_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
