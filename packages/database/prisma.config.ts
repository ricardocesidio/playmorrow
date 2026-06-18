import { defineConfig } from 'prisma/config';

// When a Prisma config file is present, Prisma stops auto-loading `.env`
// ("Prisma config detected, skipping environment variable loading"), so we load
// it ourselves. `process.loadEnvFile` is built into Node (20.12+) — no dotenv
// dependency needed. The file is optional: CI/production supply DATABASE_URL via
// the real environment, so a missing `.env` is not an error.
try {
  process.loadEnvFile();
} catch {
  // No local .env — rely on the ambient environment.
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    // Replaces the deprecated `package.json#prisma.seed` (removed in Prisma 7).
    seed: 'tsx prisma/seed.ts',
  },
});
