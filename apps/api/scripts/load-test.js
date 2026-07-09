#!/usr/bin/env node

/**
 * Load testing baseline script for Playmorrow API.
 * Uses autocannon for HTTP benchmarking.
 *
 * Run with: pnpm --filter @playmorrow/api loadtest
 *
 * Targets key read-heavy endpoints from the audit:
 * - GET /api/games (homepage)
 * - GET /api/feed (feed)
 * - GET /api/devlogs (devlogs)
 *
 * Establish baseline p95 latency and RPS.
 * See PRODUCTION.md and audit for details.
 */

// Use npx to avoid local install issues; autocannon will be downloaded on first run if needed.
const { spawnSync } = require('child_process');

const BASE_URL = process.env.LOADTEST_URL || 'http://localhost:4000/api';
const DURATION = process.env.LOADTEST_DURATION || '10'; // seconds
const CONNECTIONS = process.env.LOADTEST_CONNECTIONS || '100';

console.log(`Starting load test against ${BASE_URL}`);
console.log(`Duration: ${DURATION}s, Connections: ${CONNECTIONS}`);

const endpoints = [
  { title: 'Games (homepage)', path: '/games' },
  { title: 'Feed', path: '/feed/public' },
  { title: 'Devlogs', path: '/devlogs' },
];

function runTest({ title, path }) {
  console.log(`\n=== Testing ${title} (${path}) ===`);
  const url = `${BASE_URL}${path}`;
  const args = [
    'autocannon',
    '--connections', CONNECTIONS,
    '--duration', DURATION,
    url
  ];
  const result = spawnSync('npx', args, { encoding: 'utf8', stdio: 'inherit' });
  if (result.error) {
    console.error('Failed to run autocannon:', result.error);
  }
  return result;
}

function main() {
  for (const ep of endpoints) {
    runTest(ep);
  }

  console.log('\n=== Load test complete ===');
  console.log('Baseline established (see output above). Update PRODUCTION.md with p95/RPS results for each endpoint.');
  console.log('For production: set LOADTEST_URL=https://playmorrow-api-production.up.railway.app/api and run (use with caution, low duration).');
}

main();