-- AlterTable
ALTER TABLE "games" ADD COLUMN     "demoStatus" TEXT DEFAULT 'NO_DEMO',
ADD COLUMN     "demoUrl" TEXT,
ADD COLUMN     "edition" TEXT,
ADD COLUMN     "engine" TEXT,
ADD COLUMN     "genres" TEXT,
ADD COLUMN     "languages" TEXT,
ADD COLUMN     "modes" TEXT,
ADD COLUMN     "readme" TEXT;
