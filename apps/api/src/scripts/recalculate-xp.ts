import { PrismaClient } from '@playmorrow/database';

const prisma = new PrismaClient();

async function recalculateXp() {
  const studios = await prisma.studio.findMany({
    include: {
      games: { include: { devlogs: true, roadmapItems: true } },
      followers: true,
    },
  });

  for (const studio of studios) {
    let totalXp = 0;
    const events: Array<{ type: string; amount: number; sourceId?: string }> = [];

    // Profile completeness
    const fields = [studio.name, studio.tagline, studio.description, studio.logoUrl, studio.bannerUrl, studio.websiteUrl, studio.location];
    if (fields.every(Boolean)) {
      totalXp += 40;
      events.push({ type: 'PROFILE_COMPLETE', amount: 40 });
    }

    // Games
    for (const game of studio.games) {
      totalXp += 50;
      events.push({ type: 'GAME_CREATE', amount: 50, sourceId: game.id });

      if (game.status === 'BETA') {
        totalXp += 50;
        events.push({ type: 'GAME_BETA', amount: 50, sourceId: game.id });
      }
      if (game.status === 'RELEASED') {
        totalXp += 100;
        events.push({ type: 'GAME_RELEASE', amount: 100, sourceId: game.id });
      }

      // Devlogs
      for (const devlog of game.devlogs) {
        if (devlog.isPublished) {
          totalXp += 25;
          events.push({ type: 'DEVLOG_PUBLISH', amount: 25, sourceId: devlog.id });
        }
      }

      // Roadmap items
      for (const item of game.roadmapItems) {
        totalXp += 15;
        events.push({ type: 'ROADMAP_UPDATE', amount: 15, sourceId: item.id });
      }
    }

    // Followers
    totalXp += studio.followersCount * 5;
    if (studio.followersCount >= 100) {
      events.push({ type: 'FOLLOWER_MILESTONE_100', amount: 25 });
      totalXp += 25;
    }
    if (studio.followersCount >= 500) {
      events.push({ type: 'FOLLOWER_MILESTONE_500', amount: 50 });
      totalXp += 50;
    }

    // Calculate level
    const level = Math.max(1, Math.floor((1 + Math.sqrt(1 + (8 * totalXp) / 100)) / 2));

    // Update studio
    await prisma.studio.update({
      where: { id: studio.id },
      data: { xp: totalXp, level },
    });

    // Insert events (skip duplicates for already-existing events)
    for (const event of events) {
      const existing = await prisma.studioXpEvent.findFirst({
        where: { studioId: studio.id, type: event.type, sourceId: event.sourceId ?? null },
      });
      if (!existing) {
        await prisma.studioXpEvent.create({
          data: { studioId: studio.id, type: event.type, amount: event.amount, sourceId: event.sourceId },
        });
      }
    }

    console.log(`Studio ${studio.slug}: Level ${level}, ${totalXp} XP`);
  }

  await prisma.$disconnect();
}

recalculateXp().catch((e) => {
  console.error(e);
  process.exit(1);
});
