-- CreateIndex
CREATE INDEX "follows_userId_targetType_idx" ON "follows"("userId", "targetType");

-- CreateIndex
CREATE INDEX "game_views_gameId_idx" ON "game_views"("gameId");

-- CreateIndex
CREATE INDEX "notifications_recipientId_createdAt_idx" ON "notifications"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "wishlist_items_userId_idx" ON "wishlist_items"("userId");
