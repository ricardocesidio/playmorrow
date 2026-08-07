#!/usr/bin/env node
// Database safety guard — prevents destructive Prisma operations against the
// production database. Run before any database command that could damage data:
//
//   node scripts/db-guard.mjs <command>
//
// Supported commands (destructive = blocked against production unless
// ALLOW_PROD_DB_OPERATIONS=1 is explicitly set):
//   reset       prisma migrate reset            (destructive)
//   push        prisma db push [--accept-data-loss] (destructive)
//   migrate-dev prisma migrate dev              (destructive/dev-only)
//   seed        prisma db seed / seed script    (writes demo data)
//   studio      prisma studio                   (interactive; warns)
//   deploy      prisma migrate deploy           (SAFE — always allowed)
//   status      prisma migrate status           (SAFE — always allowed)
//   generate    prisma generate                 (SAFE — always allowed)
//
// Production is detected by DATABASE_URL hostname (PROD_DB_HOST, overridable)
// or by PLAYMORROW_DB_ROLE=production / NODE_ENV=production. Only the host and
// database name are ever printed — never the full connection string.
//
// To run a destructive command against production you must explicitly set:
//   ALLOW_PROD_DB_OPERATIONS=1
// Do NOT leave this set in your shell.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PROD_DB_HOST = process.env.PROD_DB_HOST || 'ep-orange-bird-abpuzipk.eu-west-2.aws.neon.tech';
const ALLOW = process.env.ALLOW_PROD_DB_OPERATIONS === '1';

const DESTRUCTIVE = new Set(['reset', 'push', 'migrate-dev', 'seed']);
const ALLOWED_ANYWHERE = new Set(['deploy', 'status', 'generate', 'diff']);
const INTERACTIVE = new Set(['studio']);
const VALID = new Set([...DESTRUCTIVE, ...ALLOWED_ANYWHERE, ...INTERACTIVE]);

function loadEnvFile(path) {
  try {
    const content = readFileSync(path, 'utf8');
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2];
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    /* file not found — rely on ambient env */
  }
}

// Mirror the API: fall back to apps/api/.env when DATABASE_URL is not in the
// ambient environment (e.g. bare `prisma` CLI runs from packages/database).
loadEnvFile(join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'apps', 'api', '.env'));
loadEnvFile(join(dirname(fileURLToPath(import.meta.url)), '..', '.env'));

const url = process.env.DATABASE_URL || '';
if (!url) {
  console.error('🛑 DB guard: DATABASE_URL is not set. Refusing to continue.');
  process.exit(1);
}

let hostname = '';
let dbName = '';
try {
  const parsed = new URL(url);
  hostname = parsed.hostname;
  dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
} catch {
  console.error('🛑 DB guard: DATABASE_URL is not a valid URL. Refusing to continue.');
  process.exit(1);
}

const hostForProd = (h) => h === PROD_DB_HOST || h === PROD_DB_HOST.replace('.neon.tech', '-pooler.neon.tech') || h.startsWith('ep-orange-bird-abpuzipk');
const isProdHost = hostForProd(hostname);
const role = process.env.PLAYMORROW_DB_ROLE || '';
const isProdByRole = role === 'production' || role === 'prod' || process.env.NODE_ENV === 'production';

const command = process.argv[2];
if (!command || !VALID.has(command)) {
  console.error('🛑 DB guard: unknown or missing command. Usage: node scripts/db-guard.mjs <reset|push|migrate-dev|seed|studio|deploy|status|generate|diff>');
  process.exit(1);
}

// Safe commands can always proceed.
if (ALLOWED_ANYWHERE.has(command)) {
  console.log(`✅ DB guard: \`${command}\` is non-destructive. Target: ${hostname}/${dbName}`);
  process.exit(0);
}

// studio is interactive; warn loudly against production but don't block.
if (command === 'studio') {
  if (isProdHost || isProdByRole) {
    console.warn(`⚠️  DB guard: \`prisma studio\` targets PRODUCTION (${hostname}/${dbName}). Prefer a dev/test database.`);
  } else {
    console.log(`✅ DB guard: \`studio\` OK. Target: ${hostname}/${dbName}`);
  }
  process.exit(0);
}

if (isProdHost || isProdByRole) {
  if (ALLOW) {
    console.warn(`⚠️  DB guard: ALLOW_PROD_DB_OPERATIONS=1 is set — running \`${command}\` against ${hostname}/${dbName} (PRODUCTION).`);
    process.exit(0);
  }
  console.error('🛑 DB guard: BLOCKED.');
  console.error(`   Command \`${command}\` is destructive and would run against the PRODUCTION database:`);
  console.error(`   host: ${hostname}  database: ${dbName}`);
  console.error('   This is not allowed automatically.');
  console.error('   - Point DATABASE_URL at a development/test database (or set PLAYMORROW_DB_ROLE=dev), or');
  console.error('   - If you genuinely intend to modify production, set ALLOW_PROD_DB_OPERATIONS=1 for this one command.');
  process.exit(1);
}

console.log(`✅ DB guard: \`${command}\` OK. Target: ${hostname}/${dbName}`);
process.exit(0);
