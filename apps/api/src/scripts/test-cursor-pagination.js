// Test cursor-based pagination: verify ALL 900 devlogs are reachable
const { PrismaClient } = require('@playmorrow/database');
const http = require('http');

const API = 'http://localhost:4000';
const DB_URL = process.env.DB_URL || "postgresql://nataliawindelboth@localhost:5432/playmorrow";
if (!DB_URL) { console.error('DB_URL required'); process.exit(1); }
const suffix = Date.now().toString();
const email = `cursor-test-${suffix}@e.com`;
const password = 'Test1234!';
process.env.DATABASE_URL = DB_URL;
const prisma = new PrismaClient();

async function fetch(method, path, body, cookie, csrf) {
  return new Promise((resolve, reject) => {
    const u = new URL(path, API);
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (cookie) opts.headers['Cookie'] = cookie;
    if (csrf) opts.headers['X-CSRF-Token'] = csrf;
    const req = http.request(u, opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          parsed._status = res.statusCode;
          parsed._headers = res.headers;
          resolve(parsed);
        } catch { resolve({ _raw: data, _status: res.statusCode }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // 1. Register + verify email
  let r = await fetch('POST', '/api/auth/register', { email, password, acceptedTerms: true, acceptedPrivacy: true });
  if (!r.user) { console.error('Register failed'); return; }
  const userId = r.user.id;
  await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });

  // 2. Login
  r = await fetch('POST', '/api/auth/session/login', { emailOrUsername: email, password });
  if (!r.csrfToken) { console.error('Login failed'); return; }
  const csrfToken = r.csrfToken;
  const h = r._headers['set-cookie'] || '';
  const sc = (Array.isArray(h) ? h.join(' ') : h).match(/playmorrow_session=([^;]+)/);
  if (!sc) { console.error('No session'); return; }
  const session = 'playmorrow_session=' + sc[1];

  // 3. Create studio + game + follow
  r = await fetch('POST', '/api/studios', { name: 'CS ' + suffix, slug: 'cs-' + suffix }, session, csrfToken);
  if (!r.slug) { console.error('Studio failed'); return; }
  r = await fetch('POST', `/api/studios/${r.slug}/games`, { title: 'CG', slug: 'cg-' + suffix }, session, csrfToken);
  if (!r.slug) { console.error('Game failed'); return; }
  const gameId = r.id;
  await fetch('POST', `/api/studios/${r.slug}/follow`, null, session, csrfToken);

  // 4. Seed 900 devlogs + 10 roadmaps
  const now = Date.now();
  for (let b = 0; b < 9; b++) {
    const data = [];
    for (let i = 0; i < 100; i++) {
      const idx = b * 100 + i;
      data.push({ gameId, authorId: userId, title: 'Cursor DL ' + idx, slug: 'cdl-' + idx + '-' + now, body: 'B' + idx, isPublished: true, tags: [], publishedAt: new Date(now - idx * 60000), createdAt: new Date(now - idx * 60000), readingTimeMin: 1 });
    }
    await prisma.devlog.createMany({ data });
  }
  const rd = [];
  for (let i = 0; i < 10; i++) rd.push({ gameId, title: 'Cursor RM ' + i, status: 'PLANNED', position: i, createdAt: new Date(now - 3 * 86400000 + i * 3600000), updatedAt: new Date(now - 3 * 86400000 + i * 3600000) });
  await prisma.roadmapItem.createMany({ data: rd });
  console.log('Seeded 900 devlogs + 10 roadmaps');

  // 5. PAGE-BASED (legado) — should miss data
  console.log('\n=== PAGE-BASED (legado) ===');
  let totalPageItems = 0;
  for (let p = 1; p <= 60; p++) {
    r = await fetch('GET', `/api/me/feed?page=${p}&pageSize=20`, null, session);
    totalPageItems += r.items?.length || 0;
    if (!r.items?.length) break;
  }
  console.log('Total items via page-based:', totalPageItems, '(expect ~510 — 400 lost)');

  // 6. CURSOR-BASED — should reach ALL data
  console.log('\n=== CURSOR-BASED ===');
  let totalCursorItems = 0;
  let pages = 0;
  let cursor = null;
  const MAX_PAGES = 100;

  while (pages < MAX_PAGES) {
    const params = new URLSearchParams({ pageSize: '20' });
    if (cursor) params.set('cursor', JSON.stringify(cursor));
    r = await fetch('GET', '/api/me/feed/cursor?' + params.toString(), null, session);
    const items = r.items || [];
    totalCursorItems += items.length;
    pages++;

    if (!r.nextCursor) break;
    cursor = r.nextCursor;
  }

  console.log('Pages fetched:', pages);
  console.log('Total items via cursor:', totalCursorItems, '(expected: 910 = 900 devlogs + 10 roadmaps)');
  console.log('BUG FIXED?', totalCursorItems >= 900 ? 'YES ✅ — all data reachable!' : 'NO ❌ — still losing data');
  console.log('Total reachable:', ((totalCursorItems / 910) * 100).toFixed(1) + '%');

  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
