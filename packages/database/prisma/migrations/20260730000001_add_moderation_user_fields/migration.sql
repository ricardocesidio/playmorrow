-- AlterTable: Add moderation fields to User
ALTER TABLE "users" ADD COLUMN "suspendedUntil" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "shadowBanned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "appealCount" INTEGER NOT NULL DEFAULT 0;
