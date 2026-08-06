-- schema.prisma declares these as native enum types, but the original Phase 5
-- CREATE TABLE migrations created TEXT columns instead (except partners.type,
-- which was already a "PartnerType" enum). Production applies migrations
-- (prisma db deploy), so the enum types never existed there and any enum-typed
-- query (where status = 'PUBLISHED') failed with
-- `type "public.EventStatus" does not exist` -> HTTP 500 on /events, /partners,
-- and /marketplace. This migration closes the drift.
--
-- Robustness notes (safe on BOTH drifted TEXT-column DBs and fresh replays):
--   * The backfill UPDATEs cast columns to text (::text) so they run whether the
--     column is TEXT or already an enum (comparing an enum column to a lowercase
--     literal like 'university' raises 22P02).
--   * CREATE TYPE is wrapped in DO blocks so it is a no-op when the Phase 5
--     CREATE TABLE migration already created the enum (e.g. partners.type).

-- 1. Backfill legacy lowercase values so the TEXT -> ENUM cast succeeds.
UPDATE "events"
SET "status" = 'DRAFT'
WHERE "status"::text IS NULL OR "status"::text NOT IN ('DRAFT', 'PUBLISHED', 'CANCELLED');
UPDATE "events" SET "status" = UPPER("status"::text)
WHERE "status"::text IN ('draft', 'published', 'cancelled');

UPDATE "partners"
SET "status" = 'ACTIVE'
WHERE "status"::text IS NULL OR "status"::text NOT IN ('ACTIVE', 'INACTIVE');
UPDATE "partners" SET "status" = UPPER("status"::text)
WHERE "status"::text IN ('active', 'inactive');

-- partners.type is already a "PartnerType" enum on fresh replays (created by the
-- Phase 5 CREATE TABLE migration), so only backfill when the column is still TEXT.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'partners'
      AND column_name = 'type'
      AND data_type = 'text'
  ) THEN
    UPDATE "partners"
    SET "type" = 'PUBLISHER'
    WHERE "type" IS NULL OR "type" NOT IN ('UNIVERSITY', 'PUBLISHER', 'ACCELERATOR', 'INCUBATOR', 'STUDIO', 'EVENT_ORGANIZER');
    UPDATE "partners" SET "type" = UPPER("type")
    WHERE "type" IN ('university', 'publisher', 'accelerator', 'incubator', 'studio', 'event_organizer');
  END IF;
END $$;

UPDATE "marketplace_listings"
SET "status" = 'DRAFT'
WHERE "status"::text IS NULL OR "status"::text NOT IN ('DRAFT', 'ACTIVE', 'ARCHIVED');
UPDATE "marketplace_listings" SET "status" = UPPER("status"::text)
WHERE "status"::text IN ('draft', 'active', 'archived');

-- 2. Create the enum types (no-op when the Phase 5 migration already created it).
DO $$
BEGIN
  CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "PartnerStatus" AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "PartnerType" AS ENUM ('UNIVERSITY', 'PUBLISHER', 'ACCELERATOR', 'INCUBATOR', 'STUDIO', 'EVENT_ORGANIZER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "MarketplaceListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Convert columns to the enum types.
ALTER TABLE "events" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "events" ALTER COLUMN "status" TYPE "EventStatus" USING "status"::"EventStatus";
ALTER TABLE "events" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

ALTER TABLE "partners" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "partners" ALTER COLUMN "status" TYPE "PartnerStatus" USING "status"::"PartnerStatus";
ALTER TABLE "partners" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

ALTER TABLE "partners" ALTER COLUMN "type" TYPE "PartnerType" USING "type"::"PartnerType";

ALTER TABLE "marketplace_listings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "marketplace_listings" ALTER COLUMN "status" TYPE "MarketplaceListingStatus" USING "status"::"MarketplaceListingStatus";
ALTER TABLE "marketplace_listings" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
