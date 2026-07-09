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

const autocannon = require('autocannon');
const { execSync } = require('child_process');

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

async function runTest({ title, path }) {
  console.log(`\n=== Testing ${title} (${path}) ===`);
  const result = await autocannon({
    url: `${BASE_URL}${path}`,
    connections: parseInt(CONNECTIONS),
    duration: parseInt(DURATION),
    pipelining: 1,
  });

  console.log(autocannon.printResult(result));
  return result;
}

async function main() {
  const results = [];
  for (const ep of endpoints) {
    const res = await runTest(ep);
    results.push({ ...ep, latency: res.latency, requests: res.requests });
  }

  console.log('\n=== Summary ===');
  results.forEach(r => {
    console.log(`${r.title}: p95=${r.latency.p95}ms, RPS=${Math.round(r.requests.average)}`);
  });

  console.log('\nBaseline established. Update PRODUCTION.md with results.');
  console.log('For production: set LOADTEST_URL=https://... and run against live (with caution).');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});