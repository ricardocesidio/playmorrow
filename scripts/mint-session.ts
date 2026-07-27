import { createHash, randomBytes } from 'crypto';

const API_BASE = process.env.API_URL || 'http://localhost:4000/api';
const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL required — run with: pnpm tsx scripts/mint-session.ts');
    process.exit(1);
  }

  // 1. Register a user via API
  const email = `test-${Date.now()}@playmorrow-test.com`;
  const password = 'TestPass123!';

  const registerRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, acceptedTerms: true, acceptedPrivacy: true }),
  });

  if (!registerRes.ok) {
    const body = await registerRes.text();
    console.error(`Register failed (${registerRes.status}):`, body);
    process.exit(1);
  }

  const { id: userId } = await registerRes.json();
  console.log('User ID:', userId);

  // 2. Verify email directly via Prisma
  const { PrismaClient } = await import('@playmorrow/database');
  const prisma = new PrismaClient({ datasourceUrl: DATABASE_URL });
  await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date(), isVerified: true } });
  console.log('Email verified');

  // 3. Create a session — generate raw token and store SHA-256 hash
  const raw = randomBytes(32).toString('base64url');
  const sessionHash = createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { sessionHash, userId, expiresAt },
  });

  console.log('\nSession cookie value (use as playmorrow_session):');
  console.log(raw);
  console.log(`\ncurl -b 'playmorrow_session=${raw}' ${API_BASE}/auth/session/me`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
