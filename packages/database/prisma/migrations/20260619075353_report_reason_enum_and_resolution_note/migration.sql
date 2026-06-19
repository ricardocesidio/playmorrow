-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'HATE', 'SEXUAL_CONTENT', 'VIOLENCE', 'COPYRIGHT', 'MISLEADING', 'OTHER');

-- AlterTable: add nullable resolution note
ALTER TABLE "moderation_reports" ADD COLUMN "resolutionNote" TEXT;

-- AlterTable: convert reason from TEXT to the ReportReason enum in place.
-- Existing values already conform to the set (the API validated them via
-- @IsIn(VALID_REPORT_REASONS)), so a straight cast preserves all rows.
ALTER TABLE "moderation_reports"
  ALTER COLUMN "reason" TYPE "ReportReason" USING ("reason"::"ReportReason");
