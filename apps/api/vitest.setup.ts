// If TEST_DATABASE_URL is set, use it as DATABASE_URL for tests.
// This allows local development to use a separate DB (e.g. a Neon branch or local Postgres)
// without polluting the dev / prod database.
//
// Prefer the provided helper:
//   pnpm --filter @playmorrow/api test:db:up
//   pnpm --filter @playmorrow/api test:with-db
//
// Or manually:
//   TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/playmorrow_test?schema=public pnpm --filter @playmorrow/api test
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

// === PRODUCTION / SHARED DB SAFETY GUARD ===
// Never allow tests (even by accident) to connect to a production-like Neon instance.
// This was the root cause of 70+ test games + 1600 test users polluting prod.
// Use docker postgres-test (or a dedicated Neon *branch* + TEST_DATABASE_URL).
const dbUrl = process.env.DATABASE_URL || "";
const isLikelyProd = /neon\.tech|playmorrow-prod|ep-aged-darkness/i.test(dbUrl) && !/test|5433|localhost:543/i.test(dbUrl);
if (isLikelyProd && !process.env.ALLOW_PROD_DB_FOR_TESTS) {
  throw new Error(
    "🛑 TEST SAFETY: Refusing to run tests against a production-like DATABASE_URL.\n" +
    "Set TEST_DATABASE_URL to an isolated DB (docker postgres-test on :5433 or Neon branch).\n" +
    "Or set ALLOW_PROD_DB_FOR_TESTS=1 to bypass (NOT recommended)."
  );
}
console.log("[vitest.setup] Using DATABASE_URL for tests (isolated expected)");