-- M23 Hardening (2026-08-09)
--
-- Additive-only migration. No data backfill required.
--  1. User.personalizationEnabled — explicit consent flag (default false:
--     personalization is opt-in per AI Constitution Art. 5 / Principle 3).
--  2. User.personalizationEnabledAt — consent audit trail.
--  3. RecommendationFeedbackAction gains 'IMPRESSION' (CTR denominator).

ALTER TABLE "users" ADD COLUMN "personalizationEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "personalizationEnabledAt" TIMESTAMPTZ;

-- Postgres 12+ supports ALTER TYPE ... ADD VALUE. Safe on fresh + existing DBs.
ALTER TYPE "RecommendationFeedbackAction" ADD VALUE IF NOT EXISTS 'IMPRESSION';
