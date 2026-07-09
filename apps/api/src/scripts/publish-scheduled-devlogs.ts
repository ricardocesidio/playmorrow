import { PrismaClient } from '@playmorrow/database';

const prisma = new PrismaClient();

async function publishScheduledDevlogs() {
  const now = new Date();

  const scheduled = await prisma.devlog.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledFor: { lte: now },
      isPublished: false,
    },
    include: {
      game: { select: { id: true, title: true, slug: true, studioId: true } },
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  console.log(`Found ${scheduled.length} devlogs to publish`);

  for (const devlog of scheduled) {
    await prisma.devlog.update({
      where: { id: devlog.id },
      data: {
        isPublished: true,
        status: 'PUBLISHED',
        publishedAt: now,
      },
    });

    await prisma.feedEvent.create({
      data: {
        type: 'DEVLOG_PUBLISHED',
        studioId: devlog.game.studioId,
        gameId: devlog.game.id,
        actorId: devlog.authorId,
        payload: {
          devlogId: devlog.id,
          devlogTitle: devlog.title,
          devlogSlug: devlog.slug,
          gameTitle: devlog.game.title,
        },
      },
    });

    try {
      await prisma.comment.create({
        data: {
          gameId: devlog.game.id,
          authorId: devlog.authorId,
          body: `📰 **${devlog.game.title} — ${devlog.title}**\n\nA new devlog was published. [Read more](/devlogs/${devlog.slug})`,
          parentId: null,
        },
      });
    } catch {
      console.error(`Failed to create community post for devlog ${devlog.id}`);
    }

    console.log(`Published: ${devlog.title} (${devlog.slug})`);
  }

  await prisma.$disconnect();
  console.log('Done');
}

publishScheduledDevlogs().catch((e) => {
  console.error(e);
  process.exit(1);
});
