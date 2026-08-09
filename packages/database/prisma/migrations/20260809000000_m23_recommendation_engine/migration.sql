-- M23 — Recommendation Engine (2026-08-09)
--
-- Additive-only migration. Safe on fresh replays and existing databases.
--  1. Enables the pgvector extension (Neon supports pgvector; idempotent).
--  2. Creates game_embeddings — persisted per-game embedding vectors used by
--     the hybrid recommendation engine (semantic candidates). Raw-SQL table
--     (vector type is not representable in schema.prisma), mirroring the
--     existing ai_documents pattern.
--  3. Creates recommendation_feedback — user feedback on recommendations
--     (CLICKED / DISMISSED / WISHLISTED) driving CTR + dismissal exclusion
--     (AI Constitution Article 12). Matches the schema.prisma model below.

-- ── 1. pgvector ──────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ── 2. game_embeddings (raw SQL, no Prisma model) ────────────────────────
CREATE TABLE IF NOT EXISTS "game_embeddings" (
  "id"         TEXT PRIMARY KEY,
  "game_id"    TEXT NOT NULL REFERENCES "games"("id") ON DELETE CASCADE,
  "embedding"  vector(1536) NOT NULL,
  "model"      TEXT NOT NULL,
  "dimensions" INTEGER NOT NULL DEFAULT 1536,
  "version"    INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "game_embeddings_game_id_key"
  ON "game_embeddings"("game_id");

-- HNSW cosine index for fast similarity search on 1536-dim vectors.
CREATE INDEX IF NOT EXISTS "game_embeddings_embedding_hnsw_idx"
  ON "game_embeddings" USING hnsw ("embedding" vector_cosine_ops);

-- ── 3. recommendation_feedback (matches schema.prisma model) ─────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RecommendationFeedbackAction') THEN
    CREATE TYPE "RecommendationFeedbackAction" AS ENUM ('CLICKED', 'DISMISSED', 'WISHLISTED');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "recommendation_feedback" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "gameId"    TEXT NOT NULL,
  "action"    "RecommendationFeedbackAction" NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "recommendation_feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "recommendation_feedback_userId_idx"
  ON "recommendation_feedback"("userId");
CREATE INDEX IF NOT EXISTS "recommendation_feedback_gameId_idx"
  ON "recommendation_feedback"("gameId");
CREATE INDEX IF NOT EXISTS "recommendation_feedback_action_idx"
  ON "recommendation_feedback"("action");

-- FKs (idempotent adds; Prisma migration would emit these constraint names)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recommendation_feedback_userId_fkey') THEN
    ALTER TABLE "recommendation_feedback"
      ADD CONSTRAINT "recommendation_feedback_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recommendation_feedback_gameId_fkey') THEN
    ALTER TABLE "recommendation_feedback"
      ADD CONSTRAINT "recommendation_feedback_gameId_fkey"
      FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;
