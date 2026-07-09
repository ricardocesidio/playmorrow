-- Drop coverUrl column from devlogs table (removed from Prisma schema)
ALTER TABLE "devlogs" DROP COLUMN IF EXISTS "coverUrl";
