import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'test@playmorrow.co' },
    update: {},
    create: {
      email: 'test@playmorrow.co',
      username: 'testuser',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$testhash',
      accountType: 'PLAYER',
      isOnboardingCompleted: true,
      emailVerified: true,
    },
  });
  console.log('Seed user:', user.id);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
