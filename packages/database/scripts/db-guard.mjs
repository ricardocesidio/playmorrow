#!/usr/bin/env node
// Database safety guard — prevents destructive Prisma operations against the
// production database. Run before any database command that could damage data:
//
//   node scripts/db-guard.mjs <command>
//
// Supported commands:
//   reset       prisma migrate reset            (destructive)
//   push        prisma db push [--accept-data-loss] (destructive)
//   migrate-dev prisma migrate dev              (destructive/dev-only)
//   seed        prisma db seed / seed script    (writes demo data)
//   studio      prisma studio                   (interactive; warns)
//   deploy      prisma migrate deploy           (SAFE — always allowed)
//   status      prisma migrate status           (SAFE — always allowed)
//   generate    prisma generate                 (SAFE — always allowed)
//   diff        prisma migrate diff             (SAFE — always allowed)
//
// Classification of DATABASE_URL targets:
//   PRODUCTION  — hostname matches PROD_DB_HOST (default ep-orange-bird-abpuzipk…)
//                 or PLAYMORROW_DB_ROLE=production|prod or NODE_ENV=production.
//                 Destructive commands are BLOCKED unless ALLOW_PROD_DB_OPERATIONS=1.
//   KNOWN DEV   — localhost/127.0.0.1/::1, or hostname matches DEV_DB_HOST
//                 (default ep-raspy-sunset-abo6apgc…). Destructive allowed.
//   UNKNOWN     — anything else (any other host, incl. other Neon/RDS/cloud
//                 endpoints). Destructive commands FAIL CLOSED (BLOCKED) because
//                 the environment cannot be proven safe.
//
// Only the host and database name are ever printed — never the full connection
// string or password.
//
// To run a destructive command against a production/unknown database you must
// explicitly set ALLOW_PROD_DB_OPERATIONS=1. Do NOT leave this set in your shell.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PROD_DB_HOST = process.env.PROD_DB_HOST || 'ep-orange-bird-abpuzipk.eu-west-2.aws.neon.tech';
const DEV_DB_HOST = process.env.DEV_DB_HOST || 'ep-raspy-sunset-abo6apgc.eu-west-2.aws.neon.tech';
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

// Remove the -pooler suffix before comparing (same Neon database, pooled host).
const baseHost = (h) => h.replace(/-pooler\.neon\.tech$/, '.neon.tech');

const isProdHost =
  baseHost(hostname) === baseHost(PROD_DB_HOST) ||
  hostname.startsWith('ep-orange-bird-abpuzipk');

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const isLocalHost = LOCAL_HOSTS.has(hostname);

const isKnownDevHost = baseHost(hostname) === baseHost(DEV_DB_HOST) || hostname.startsWith('ep-raspy-sunset-abo6apgc');

const role = process.env.PLAYMORROW_DB_ROLE || '';
const isProdByRole = role === 'production' || role === 'prod' || process.env.NODE_ENV === 'production';
const isDevByRole = role === 'dev' || role === 'development' || role === 'test';

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

// studio is interactive; warn loudly against production/unknown but don't block.
if (command === 'studio') {
  if (isProdHost || isProdByRole) {
    console.warn(`⚠️  DB guard: \`prisma studio\` targets PRODUCTION (${hostname}/${dbName}). Prefer a dev/test database.`);
  } else if (!isLocalHost && !isKnownDevHost && !isDevByRole) {
    console.warn(`⚠️  DB guard: \`prisma studio\` targets an UNKNOWN host (${hostname}/${dbName}). Prefer a known dev/test database.`);
  } else {
    console.log(`✅ DB guard: \`studio\` OK. Target: ${hostname}/${dbName}`);
  }
  process.exit(0);
}

// ── Destructive commands ──────────────────────────────────────────────────
const blocked = (reason) => {
  if (ALLOW) {
    console.warn(`⚠️  DB guard: ALLOW_PROD_DB_OPERATIONS=1 is set — running \`${command}\` against ${hostname}/${dbName} (${reason}).`);
    process.exit(0);
  }
  console.error('🛑 DB guard: BLOCKED.');
  console.error(`   Command \`${command}\` is destructive and would run against: ${hostname}/${dbName}`);
  console.error(`   Classification: ${reason}`);
  console.error('   This is not allowed automatically (fail-closed policy).');
  console.error('   - Point DATABASE_URL at a known development/test database');
  console.error('     (localhost, DEV_DB_HOST, or set PLAYMORROW_DB_ROLE=dev), or');
  console.error('   - If you genuinely intend to modify this database, set');
  console.error('     ALLOW_PROD_DB_OPERATIONS=1 for this one command.');
  process.exit(1);
};

if (isProdHost || isProdByRole) {
  blocked('PRODUCTION');
}

if (isLocalHost || isKnownDevHost || isDevByRole) {
  console.log(`✅ DB guard: \`${command}\` OK. Target: ${hostname}/${dbName}`);
  process.exit(0);
}

// Unknown host — fail closed for destructive commands.
blocked('UNKNOWN ENVIRONMENT (not provably production, but not known dev/test)');
