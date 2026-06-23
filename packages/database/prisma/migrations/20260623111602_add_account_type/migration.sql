-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('PLAYER', 'STUDIO');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'PLAYER';
