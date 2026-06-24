-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "gameId" TEXT,
ALTER COLUMN "devlogId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "comments_gameId_idx" ON "comments"("gameId");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
