// Mint a valid playmorrow_session cookie for testing
// Usage: DB_URL=... node scripts/mint-session.js
const { PrismaClient } = require('@playmorrow/database');
const crypto = require('crypto');
const http = require('http');

const API = 'http://localhost:4000';

async function main() {
  const suffix = Date.now().toString();
  const email = `session-test-${suffix}@e.com`;
  const password = 'Test1234!';

  // 1. Register
  const regBody = JSON.stringify({ email, password, acceptedTerms: true, acceptedPrivacy: true });
  const regRes = await fetch(`${API}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: regBody });
  const regData = await regRes.json();
  const userId = regData.user?.id;
  if (!userId) { console.error('Register failed:', regData); process.exit(1); }
  console.log('Registered:', userId);

  // 2. Verify email via Prisma
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) { console.error('DB_URL required'); process.exit(1); }
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });

  // 3. Login via API to get session
  const loginRes = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername: email, password }),
    redirect: 'manual'
  });

  // Extract session cookie directly from Set-Cookie header
  const setCookie = loginRes.headers.get('set-cookie') || '';
  const sessionMatch = setCookie.match(/playmorrow_session=([^;]+)/);
  if (sessionMatch) {
    console.log('Session cookie via login:', sessionMatch[1].substring(0, 20) + '...');
    console.log('Full cookie: playmorrow_session=' + sessionMatch[1]);
  } else {
    console.log('No session cookie from login. Trying direct mint...');
    // 4. Direct mint: create session in DB
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const sessionHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await prisma.session.create({
      data: { userId, sessionHash, expiresAt: new Date(Date.now() + 7 * 86400000) }
    });
    console.log('Minted session cookie: playmorrow_session=' + rawToken);
  }

  console.log('Email:', email);
  console.log('Password:', password);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
