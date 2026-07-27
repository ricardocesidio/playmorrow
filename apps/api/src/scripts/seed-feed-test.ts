import { PrismaClient, StudioRole } from '@playmorrow/database';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const suffix = Date.now().toString();

  // Create user
  const user = await prisma.user.create({
    data: {
      email: `feedtest-${suffix}@example.com`,
      username: `feedtest-${suffix}`,
      usernameLowercase: `feedtest-${suffix}`,
      displayName: 'Feed Test User',
      passwordHash: 'x',
      role: 'PLAYER',
      emailVerified: true,
      isOnboardingCompleted: true,
    },
  });
  console.log('User:', user.id);

  // Create studio
  const studio = await prisma.studio.create({
    data: {
      name: `Feed Test Studio ${suffix}`,
      slug: `feed-test-studio-${suffix}`,
      description: 'Testing feed pagination',
      ownerId: user.id,
      members: { create: { userId: user.id, role: StudioRole.OWNER } },
    },
  });
  console.log('Studio:', studio.id, studio.slug);

  // Create a game
  const game = await prisma.game.create({
    data: {
      title: 'Feed Test Game',
      slug: `feed-test-game-${suffix}`,
      studioId: studio.id,
      description: 'Testing feed pagination boundaries',
      status: 'IN_DEVELOPMENT',
    },
  });
  console.log('Game:', game.id, game.slug);

  // Create 1200 devlogs
  const devlogs: { id: string; title: string; body: string; gameId: string; isPublished: boolean; publishedAt: Date; createdAt: Date; updatedAt: Date; slug: string; readingTimeMin: number }[] = [];
  for (let i = 0; i < 1200; i++) {
    devlogs.push({
      id: randomBytes(12).toString('hex'),
      title: `Test Devlog ${i}`,
      body: `This is test devlog number ${i} for pagination testing.`,
      gameId: game.id,
      isPublished: true,
      publishedAt: new Date(Date.now() - i * 3600000),
      createdAt: new Date(Date.now() - i * 3600000),
      updatedAt: new Date(),
      slug: `test-devlog-${i}-${suffix}`,
      readingTimeMin: 1,
    });
  }
  await prisma.devlog.createMany({ data: devlogs });
  console.log(`Created ${devlogs.length} devlogs`);

  // Create 1200 roadmap items
  const roadmapItems: { id: string; title: string; description: string; gameId: string; status: string; position: number; createdAt: Date; updatedAt: Date }[] = [];
  for (let i = 0; i < 1200; i++) {
    roadmapItems.push({
      id: randomBytes(12).toString('hex'),
      title: `Test Roadmap ${i}`,
      description: `Roadmap item ${i} for pagination testing.`,
      gameId: game.id,
      status: 'PLANNED',
      position: i,
      createdAt: new Date(Date.now() - i * 3600000),
      updatedAt: new Date(),
    });
  }
  await prisma.roadmapItem.createMany({ data: roadmapItems });
  console.log(`Created ${roadmapItems.length} roadmap items`);

  // Follow the studio for the user
  await prisma.follow.create({
    data: {
      userId: user.id,
      studioId: studio.id,
    },
  });
  console.log('Followed studio');

  console.log('\n=== TEST CREDENTIALS ===');
  console.log(`User ID: ${user.id}`);
  console.log(`Email: feedtest-${suffix}@example.com`);
  console.log(`Studio slug: feed-test-studio-${suffix}`);
  console.log(`Game slug: feed-test-game-${suffix}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
