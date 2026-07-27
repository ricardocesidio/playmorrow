// Full feed pagination test: auth, seed, query
const { PrismaClient } = require('@playmorrow/database');
const http = require('http');

const API = 'http://localhost:4000';
const suffix = Date.now().toString();
const email = `feed-auth-${suffix}@e.com`;
const password = 'Test1234!';

async function fetch(method, path, body, cookie, csrf) {
  const url = new URL(path, API);
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;
  if (csrf) headers['X-CSRF-Token'] = csrf;
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method, headers }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          parsed._status = res.statusCode;
          parsed._headers = res.headers;
          resolve(parsed);
        } catch { resolve({ _raw: data, _status: res.statusCode, _headers: res.headers }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // 1. Register
  console.log('Registering...');
  let r = await fetch('POST', '/api/auth/register', { email, password, acceptedTerms: true, acceptedPrivacy: true });
  if (!r.user) { console.error('Register failed:', r); return; }
  const userId = r.user.id;
  console.log('User:', userId);

  // 2. Verify email via Prisma
  const prisma = new PrismaClient();
  await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });

  // 3. Login via session/login to get CSRF + session
  r = await fetch('POST', '/api/auth/session/login', { emailOrUsername: email, password });
  if (!r.csrfToken) { console.error('Login failed:', r); return; }
  const csrfToken = r.csrfToken;
  const setCookie = r._headers['set-cookie'] || '';
  const sessionMatch = Array.isArray(setCookie) 
    ? setCookie.join(' ').match(/playmorrow_session=([^;]+)/)
    : setCookie.match(/playmorrow_session=([^;]+)/);
  if (!sessionMatch) { console.error('No session cookie:', r); return; }
  const session = 'playmorrow_session=' + sessionMatch[1];
  console.log('Auth OK');

  // 4. Create studio
  r = await fetch('POST', '/api/studios', { name: 'FTS ' + suffix, slug: 'fts-' + suffix }, session, csrfToken);
  if (!r.slug) { console.error('Studio create failed:', r); return; }
  const studioSlug = r.slug;
  console.log('Studio:', studioSlug);

  // 5. Create game
  r = await fetch('POST', `/api/studios/${studioSlug}/games`, { title: 'FTG', slug: 'ftg-' + suffix }, session, csrfToken);
  if (!r.slug) { console.error('Game create failed:', r); return; }
  const gameSlug = r.slug;
  const gameId = r.id;
  console.log('Game:', gameSlug);

  // 6. Follow studio
  r = await fetch('POST', `/api/studios/${studioSlug}/follow`, null, session, csrfToken);
  console.log('Follow:', r._status);

  // 7. Seed 900 recent devlogs + 10 interleaved roadmap items via Prisma
  console.log('Seeding data...');
  const now = Date.now();
  
  // 900 devlogs (one per minute for 900 minutes = 15 hours)
  for (let b = 0; b < 9; b++) {
    const data = [];
    for (let i = 0; i < 100; i++) {
      const idx = b * 100 + i;
      data.push({
        gameId, authorId: userId,
        title: 'Auth DL ' + idx, slug: 'auth-dl-' + idx + '-' + now,
        body: 'Body ' + idx, isPublished: true,
        publishedAt: new Date(now - idx * 60000),
        createdAt: new Date(now - idx * 60000),
        readingTimeMin: 1
      });
    }
    await prisma.devlog.createMany({ data });
  }
  console.log('  900 devlogs');

  // 10 roadmap items (interleaved 3-4 days ago)
  const rd = [];
  for (let i = 0; i < 10; i++) {
    rd.push({
      gameId, title: 'Auth RM ' + i, status: 'PLANNED', position: i,
      createdAt: new Date(now - 3 * 86400000 + i * 3600000),
      updatedAt: new Date(now - 3 * 86400000 + i * 3600000)
    });
  }
  await prisma.roadmapItem.createMany({ data: rd });
  console.log('  10 roadmap items');

  // 8. Test feed pagination
  console.log('\n=== FEED PAGINATION TEST ===');
  const pages = [1, 3, 25, 45, 51];
  for (const page of pages) {
    r = await fetch('GET', `/api/me/feed?page=${page}&pageSize=20`, null, session);
    const items = r.items || [];
    const types = [...new Set(items.map(i => i.type))];
    const titleSample = items.slice(0, 3).map(i => i.title.substring(0, 20));
    console.log(`Page ${page}: ${items.length} items | hasMore=${r.hasMore} | types=[${types}] | truncated=${r.truncated} | samples=${JSON.stringify(titleSample)}`);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
