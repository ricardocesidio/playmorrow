-- CreateTable
CREATE TABLE "studio_chat_messages" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "message" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studio_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "studio_chat_messages_studioId_createdAt_idx" ON "studio_chat_messages"("studioId", "createdAt");

-- AddForeignKey
ALTER TABLE "studio_chat_messages" ADD CONSTRAINT "studio_chat_messages_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_chat_messages" ADD CONSTRAINT "studio_chat_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
