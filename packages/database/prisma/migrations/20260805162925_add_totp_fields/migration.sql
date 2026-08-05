-- AlterTable
ALTER TABLE "users" ADD COLUMN "totpSecret" TEXT;
ALTER TABLE "users" ADD COLUMN "totpEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "recoveryCodes" TEXT[] DEFAULT ARRAY[]::TEXT[];
