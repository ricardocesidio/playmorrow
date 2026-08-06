-- schema.prisma declares these as native enum types, but the original Phase 5
-- CREATE TABLE migrations created TEXT columns instead. Production applies
-- migrations (prisma db deploy), so the enum types never existed there and any
-- enum-typed query (where status = 'PUBLISHED') failed with
-- `type "public.EventStatus" does not exist` -> HTTP 500 on /events, /partners,
-- and /marketplace. This migration closes the drift.

-- 1. Backfill legacy lowercase values so the TEXT -> ENUM cast succeeds.
UPDATE "events"
SET "status" = 'DRAFT'
WHERE "status" IS NULL OR "status" NOT IN ('DRAFT', 'PUBLISHED', 'CANCELLED');
UPDATE "events" SET "status" = UPPER("status")
WHERE "status" IN ('draft', 'published', 'cancelled');

UPDATE "partners"
SET "status" = 'ACTIVE'
WHERE "status" IS NULL OR "status" NOT IN ('ACTIVE', 'INACTIVE');
UPDATE "partners" SET "status" = UPPER("status")
WHERE "status" IN ('active', 'inactive');

UPDATE "partners"
SET "type" = 'PUBLISHER'
WHERE "type" IS NULL OR "type" NOT IN ('UNIVERSITY', 'PUBLISHER', 'ACCELERATOR', 'INCUBATOR', 'STUDIO', 'EVENT_ORGANIZER');
UPDATE "partners" SET "type" = UPPER("type")
WHERE "type" IN ('university', 'publisher', 'accelerator', 'incubator', 'studio', 'event_organizer');

UPDATE "marketplace_listings"
SET "status" = 'DRAFT'
WHERE "status" IS NULL OR "status" NOT IN ('DRAFT', 'ACTIVE', 'ARCHIVED');
UPDATE "marketplace_listings" SET "status" = UPPER("status")
WHERE "status" IN ('draft', 'active', 'archived');

-- 2. Create the enum types.
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED');
CREATE TYPE "PartnerStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "PartnerType" AS ENUM ('UNIVERSITY', 'PUBLISHER', 'ACCELERATOR', 'INCUBATOR', 'STUDIO', 'EVENT_ORGANIZER');
CREATE TYPE "MarketplaceListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

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
