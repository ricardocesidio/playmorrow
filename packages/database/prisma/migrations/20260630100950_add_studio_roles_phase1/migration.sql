-- CreateEnum
CREATE TYPE "StudioInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'STUDIO_INVITATION';
ALTER TYPE "NotificationType" ADD VALUE 'INVITATION_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'MEMBER_JOINED';
ALTER TYPE "NotificationType" ADD VALUE 'MEMBER_LEFT';
ALTER TYPE "NotificationType" ADD VALUE 'ROLE_CHANGED';
ALTER TYPE "NotificationType" ADD VALUE 'MEMBER_REMOVED';
ALTER TYPE "NotificationType" ADD VALUE 'JOIN_REQUEST';

-- AlterEnum
ALTER TYPE "StudioRole" ADD VALUE 'MODERATOR';

-- AlterTable
ALTER TABLE "games" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "publishedBy" TEXT,
ADD COLUMN     "updatedBy" TEXT;

-- AlterTable
ALTER TABLE "studio_members" ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastActiveAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "studio_invitations" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "email" TEXT,
    "userId" TEXT,
    "role" "StudioRole" NOT NULL,
    "token" TEXT NOT NULL,
    "status" "StudioInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studio_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "studio_invitations_token_key" ON "studio_invitations"("token");

-- CreateIndex
CREATE INDEX "studio_invitations_studioId_status_idx" ON "studio_invitations"("studioId", "status");

-- CreateIndex
CREATE INDEX "studio_invitations_email_idx" ON "studio_invitations"("email");

-- CreateIndex
CREATE INDEX "studio_invitations_userId_idx" ON "studio_invitations"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_studioId_createdAt_idx" ON "audit_logs"("studioId", "createdAt");

-- AddForeignKey
ALTER TABLE "studio_invitations" ADD CONSTRAINT "studio_invitations_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_invitations" ADD CONSTRAINT "studio_invitations_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studio_invitations" ADD CONSTRAINT "studio_invitations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
