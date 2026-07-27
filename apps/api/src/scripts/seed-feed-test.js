const { PrismaClient } = require('@playmorrow/database');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  const suffix = Date.now().toString();

  const user = await prisma.user.create({
    data: {
      email: `feedtest-${suffix}@example.com`,
      username: `feedtest-${suffix}`,
      usernameLowercase: `feedtest-${suffix}`,
      displayName: 'Feed Test User',
      passwordHash: 'x',
      role: 'PLAYER',
      isOnboardingCompleted: true,
    },
  });
  console.log('User:', user.id);

  const studio = await prisma.studio.create({
    data: {
      name: `Feed Test Studio ${suffix}`,
      slug: `feed-test-studio-${suffix}`,
      description: 'Testing feed pagination',
      ownerId: user.id,
      members: { create: { userId: user.id, role: 'OWNER' } },
    },
  });
  console.log('Studio:', studio.id, studio.slug);

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

  // Create 1200 devlogs in batches of 100
  for (let batch = 0; batch < 12; batch++) {
    const devlogs = [];
    for (let i = 0; i < 100; i++) {
      const idx = batch * 100 + i;
      devlogs.push({
        id: crypto.randomBytes(12).toString('hex'),
        title: `Test Devlog ${idx}`,
        body: `This is test devlog number ${idx} for pagination testing.`,
        gameId: game.id,
        isPublished: true,
        publishedAt: new Date(Date.now() - idx * 3600000),
        createdAt: new Date(Date.now() - idx * 3600000),
        updatedAt: new Date(),
        slug: `test-devlog-${idx}-${suffix}`,
        readingTimeMin: 1,
      });
    }
    await prisma.devlog.createMany({ data: devlogs });
    console.log(`  Batch ${batch + 1}/12 devlogs done`);
  }

  // Create 1200 roadmap items in batches of 100
  for (let batch = 0; batch < 12; batch++) {
    const items = [];
    for (let i = 0; i < 100; i++) {
      const idx = batch * 100 + i;
      items.push({
        id: crypto.randomBytes(12).toString('hex'),
        title: `Test Roadmap ${idx}`,
        description: `Roadmap item ${idx} for pagination testing.`,
        gameId: game.id,
        status: 'PLANNED',
        position: idx,
        createdAt: new Date(Date.now() - idx * 3600000),
        updatedAt: new Date(),
      });
    }
    await prisma.roadmapItem.createMany({ data: items });
    console.log(`  Batch ${batch + 1}/12 roadmap done`);
  }

  await prisma.follow.create({
    data: { userId: user.id, studioId: studio.id },
  });
  console.log('Followed studio');

  console.log('\n=== CREDENTIALS ===');
  console.log(`User ID: ${user.id}`);
  console.log(`Email: feedtest-${suffix}@example.com`);
  console.log(`Studio slug: feed-test-studio-${suffix}`);
  console.log(`Game slug: feed-test-game-${suffix}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
