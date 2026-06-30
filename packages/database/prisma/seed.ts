import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const GAMES_DATA = [
  {
    title: 'Neon Warden',
    slug: 'neon-warden',
    tagline: 'Tactical Stealth • Cyberpunk',
    description: 'Track signals, infiltrate districts, and disappear before the city knows you were there.',
    status: 'BETA' as const,
    featured: true,
    priceCents: 1999,
    currency: 'USD',
    expectedReleaseText: 'Q4 2026',
    followersCount: 12400,
    wishlistsCount: 312,
    commentsCount: 48,
    viewsCount: 9100,
    tags: ['Stealth', 'Cyberpunk', 'Tactical', 'Strategy', 'Sci-Fi', 'Singleplayer', 'Story Rich', 'Atmospheric'],
    platforms: [
      { kind: 'STEAM', url: 'https://example.com/neon-warden/steam' },
      { kind: 'EPIC', url: 'https://example.com/neon-warden/epic' },
      { kind: 'WEBSITE', url: 'https://example.com/neon-warden' },
      { kind: 'DISCORD', url: 'https://example.com/neon-warden/discord' },
    ],
    roadmap: [
      { title: 'Prototype', description: 'Core stealth mechanics', status: 'DONE' as const, position: 0, targetDate: new Date('2025-06-30') },
      { title: 'Alpha', description: 'Mission systems & hubs', status: 'DONE' as const, position: 1, targetDate: new Date('2025-09-30') },
      { title: 'Beta', description: 'Full missions & story', status: 'IN_PROGRESS' as const, position: 2, targetDate: new Date('2025-12-31') },
      { title: 'Release', description: 'Launch & post-launch support', status: 'PLANNED' as const, position: 3, targetDate: new Date('2026-12-31') },
    ],
  },
  {
    title: 'Starfall Tactics',
    slug: 'starfall-tactics',
    tagline: 'Tactical RPG • Space Opera',
    description: 'Lead a crew through a dying galaxy where every choice leaves a scar.',
    status: 'ALPHA' as const,
    featured: false,
    priceCents: 2499,
    currency: 'USD',
    expectedReleaseText: 'Q1 2027',
    followersCount: 8700,
    wishlistsCount: 214,
    commentsCount: 31,
    viewsCount: 6200,
    tags: ['Tactical', 'RPG', 'Space', 'Strategy', 'Sci-Fi', 'Story Rich', 'Singleplayer'],
    platforms: [
      { kind: 'STEAM', url: 'https://example.com/starfall-tactics/steam' },
      { kind: 'ITCH', url: 'https://example.com/starfall-tactics/itch' },
      { kind: 'WEBSITE', url: 'https://example.com/starfall-tactics' },
      { kind: 'DISCORD', url: 'https://example.com/starfall-tactics/discord' },
    ],
    roadmap: [
      { title: 'Concept', description: 'Core design & prototype', status: 'DONE' as const, position: 0, targetDate: new Date('2025-03-31') },
      { title: 'Pre-Alpha', description: 'Ship systems & combat', status: 'DONE' as const, position: 1, targetDate: new Date('2025-06-30') },
      { title: 'Alpha', description: 'Crew management & story', status: 'IN_PROGRESS' as const, position: 2, targetDate: new Date('2025-12-31') },
      { title: 'Beta', description: 'Full campaign & polish', status: 'PLANNED' as const, position: 3, targetDate: new Date('2026-06-30') },
      { title: 'Release', description: 'Launch', status: 'PLANNED' as const, position: 4, targetDate: new Date('2027-03-31') },
    ],
  },
  {
    title: 'Mossbound',
    slug: 'mossbound',
    tagline: 'Adventure • Atmospheric',
    description: 'A tiny traveler. An ancient forest. Secrets grow in the dark.',
    status: 'PRE_ALPHA' as const,
    featured: false,
    priceCents: 1499,
    currency: 'USD',
    expectedReleaseText: 'Q3 2027',
    followersCount: 5100,
    wishlistsCount: 128,
    commentsCount: 22,
    viewsCount: 4300,
    tags: ['Adventure', 'Atmospheric', 'Exploration', 'Singleplayer', 'Story Rich', 'Fantasy'],
    platforms: [
      { kind: 'STEAM', url: 'https://example.com/mossbound/steam' },
      { kind: 'WEBSITE', url: 'https://example.com/mossbound' },
      { kind: 'DISCORD', url: 'https://example.com/mossbound/discord' },
    ],
    roadmap: [
      { title: 'Prototype', description: 'Movement & environment', status: 'DONE' as const, position: 0, targetDate: new Date('2025-06-30') },
      { title: 'Vertical Slice', description: 'Forest hub & core loop', status: 'IN_PROGRESS' as const, position: 1, targetDate: new Date('2025-12-31') },
      { title: 'Early Access', description: 'First three biomes', status: 'PLANNED' as const, position: 2, targetDate: new Date('2026-09-30') },
      { title: 'Full Release', description: 'Complete story & biomes', status: 'PLANNED' as const, position: 3, targetDate: new Date('2027-09-30') },
    ],
  },
  {
    title: 'Paper Relics',
    slug: 'paper-relics',
    tagline: 'Card Battler • Roguelike',
    description: 'Fold the past. Play the present. Rewrite your fate.',
    status: 'PRE_ALPHA' as const,
    featured: false,
    priceCents: 999,
    currency: 'USD',
    expectedReleaseText: 'Q2 2027',
    followersCount: 3200,
    wishlistsCount: 89,
    commentsCount: 15,
    viewsCount: 2800,
    tags: ['Card Game', 'Roguelike', 'Strategy', 'Fantasy', 'Singleplayer', 'Deckbuilding'],
    platforms: [
      { kind: 'STEAM', url: 'https://example.com/paper-relics/steam' },
      { kind: 'ITCH', url: 'https://example.com/paper-relics/itch' },
      { kind: 'WEBSITE', url: 'https://example.com/paper-relics' },
    ],
    roadmap: [
      { title: 'Prototype', description: 'Card system prototype', status: 'DONE' as const, position: 0, targetDate: new Date('2025-06-30') },
      { title: 'Pre-Alpha', description: 'Core loop & first relics', status: 'IN_PROGRESS' as const, position: 1, targetDate: new Date('2025-12-31') },
      { title: 'Alpha', description: 'Full relic system & bosses', status: 'PLANNED' as const, position: 2, targetDate: new Date('2026-06-30') },
      { title: 'Release', description: 'Launch', status: 'PLANNED' as const, position: 3, targetDate: new Date('2027-06-30') },
    ],
  },
  {
    title: 'Voidrunner',
    slug: 'voidrunner',
    tagline: 'Action • Sci-Fi • Speed',
    description: 'Outrun the void. Every second matters.',
    status: 'CONCEPT' as const,
    featured: false,
    priceCents: 0,
    currency: 'USD',
    isFree: true,
    expectedReleaseText: 'TBA',
    followersCount: 8900,
    wishlistsCount: 176,
    commentsCount: 27,
    viewsCount: 5400,
    tags: ['Action', 'Sci-Fi', 'Runner', 'Singleplayer', 'Fast-Paced'],
    platforms: [
      { kind: 'STEAM', url: 'https://example.com/voidrunner/steam' },
      { kind: 'WEBSITE', url: 'https://example.com/voidrunner' },
      { kind: 'DISCORD', url: 'https://example.com/voidrunner/discord' },
    ],
    roadmap: [
      { title: 'Concept', description: 'Core mechanic prototype', status: 'IN_PROGRESS' as const, position: 0, targetDate: undefined },
      { title: 'Vertical Slice', description: 'One complete level', status: 'PLANNED' as const, position: 1, targetDate: undefined },
      { title: 'Early Access', description: 'First world release', status: 'PLANNED' as const, position: 2, targetDate: undefined },
      { title: 'Full Release', description: 'Complete game', status: 'PLANNED' as const, position: 3, targetDate: undefined },
    ],
  },
];

const STUDIOS_DATA = [
  { name: 'Obsidian Signal', slug: 'obsidian-signal', tagline: 'Independent Studio', description: 'Crafting immersive cyberpunk experiences.', isVerified: true, followersCount: 28400, gamesCount: 2 },
  { name: 'Ironlight Studios', slug: 'ironlight-studios', tagline: 'Independent Studio', description: 'Building tactical worlds for strategic minds.', isVerified: true, followersCount: 15600, gamesCount: 1 },
  { name: 'Wildbriar', slug: 'wildbriar', tagline: 'Independent Studio', description: 'Creating atmospheric adventures from the wild.', isVerified: true, followersCount: 9200, gamesCount: 1 },
  { name: 'Second Story Games', slug: 'second-story-games', tagline: 'Independent Studio', description: 'Telling stories through innovative gameplay.', isVerified: true, followersCount: 7400, gamesCount: 1 },
  { name: 'Voidrunner Dev', slug: 'voidrunner-dev', tagline: 'Independent Studio', description: 'Fast-paced action games for thrill seekers.', isVerified: true, followersCount: 11300, gamesCount: 1 },
];

const ALL_TAGS = [
  { slug: 'stealth', name: 'Stealth', kind: 'genre' },
  { slug: 'cyberpunk', name: 'Cyberpunk', kind: 'setting' },
  { slug: 'tactical', name: 'Tactical', kind: 'genre' },
  { slug: 'strategy', name: 'Strategy', kind: 'genre' },
  { slug: 'sci-fi', name: 'Sci-Fi', kind: 'setting' },
  { slug: 'singleplayer', name: 'Singleplayer', kind: 'feature' },
  { slug: 'story-rich', name: 'Story Rich', kind: 'feature' },
  { slug: 'atmospheric', name: 'Atmospheric', kind: 'mood' },
  { slug: 'rpg', name: 'RPG', kind: 'genre' },
  { slug: 'space', name: 'Space', kind: 'setting' },
  { slug: 'adventure', name: 'Adventure', kind: 'genre' },
  { slug: 'exploration', name: 'Exploration', kind: 'feature' },
  { slug: 'fantasy', name: 'Fantasy', kind: 'setting' },
  { slug: 'card-game', name: 'Card Game', kind: 'genre' },
  { slug: 'roguelike', name: 'Roguelike', kind: 'genre' },
  { slug: 'action', name: 'Action', kind: 'genre' },
  { slug: 'runner', name: 'Runner', kind: 'genre' },
  { slug: 'fast-paced', name: 'Fast-Paced', kind: 'feature' },
  { slug: 'deckbuilding', name: 'Deckbuilding', kind: 'feature' },
];

async function main() {
  console.log('🌱 Seeding Playmorrow with 5 demo games…');

  // Create tags
  for (const tag of ALL_TAGS) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }
  console.log('  ✅ Tags created');

  // Create demo user
  const passwordHash = await argon2.hash('Demo123!@');
  const user = await prisma.user.upsert({
    where: { email: 'dev@playmorrow.example' },
    update: {},
    create: {
      email: 'dev@playmorrow.example',
      username: 'playmorrowdev',
      displayName: 'PlayMorrow Dev',
      passwordHash,
      role: 'PLAYER',
      accountType: 'STUDIO',
      isVerified: true,
      emailVerifiedAt: new Date(),
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
      communityGuidelinesAcceptedAt: new Date(),
      termsVersion: '2026-06-23',
      privacyVersion: '2026-06-23',
      communityGuidelinesVersion: '2026-06-23',
    },
  });
  console.log('  ✅ Demo user created');

  // Create studios
  const studios: Record<string, string> = {};
  for (const data of STUDIOS_DATA) {
    const studio = await prisma.studio.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    });
    studios[data.slug] = studio.id;

    // Make demo user an OWNER member
    await prisma.studioMember.upsert({
      where: { studioId_userId: { studioId: studio.id, userId: user.id } },
      update: {},
      create: { studioId: studio.id, userId: user.id, role: 'OWNER' },
    });
  }
  console.log('  ✅ Studios created');

  // Create games
  const gameIds: string[] = [];
  for (const gameData of GAMES_DATA) {
    const slug = gameData.slug;
    let studioSlug = '';
    if (slug === 'neon-warden') studioSlug = 'obsidian-signal';
    else if (slug === 'starfall-tactics') studioSlug = 'ironlight-studios';
    else if (slug === 'mossbound') studioSlug = 'wildbriar';
    else if (slug === 'paper-relics') studioSlug = 'second-story-games';
    else if (slug === 'voidrunner') studioSlug = 'voidrunner-dev';

    const game = await prisma.game.upsert({
      where: { slug },
      update: {},
      create: {
        title: gameData.title,
        slug,
        studioId: studios[studioSlug],
        tagline: gameData.tagline,
        description: gameData.description,
        status: gameData.status,
        priceCents: gameData.priceCents,
        currency: gameData.currency,
        isFree: 'isFree' in gameData ? (gameData as any).isFree : false,
        expectedReleaseText: gameData.expectedReleaseText,
        followersCount: gameData.followersCount,
        wishlistsCount: gameData.wishlistsCount,
        commentsCount: gameData.commentsCount,
        viewsCount: gameData.viewsCount,
        featured: gameData.featured,
        coverUrl: `/demo/games/${slug}/hero.svg`,
        bannerUrl: `/demo/games/${slug}/hero.svg`,
        isPublished: true,
      },
    });
    gameIds.push(game.id);

    // Create platform links
    for (let i = 0; i < gameData.platforms.length; i++) {
      const p = gameData.platforms[i];
      await prisma.platformLink.create({
        data: { gameId: game.id, kind: p.kind as any, url: p.url, position: i },
      });
    }

    // Create tags
    for (const tagSlug of gameData.tags) {
      const tag = await prisma.tag.findUnique({ where: { slug: tagSlug.toLowerCase().replace(/\s+/g, '-') } });
      if (tag) {
        await prisma.gameTag.upsert({
          where: { gameId_tagId: { gameId: game.id, tagId: tag.id } },
    update: {},
          create: { gameId: game.id, tagId: tag.id },
        });
      }
    }

    // Create roadmap items
    for (let i = 0; i < gameData.roadmap.length; i++) {
      const r = gameData.roadmap[i];
      await prisma.roadmapItem.create({
        data: {
          gameId: game.id,
          title: r.title,
          description: r.description,
          status: r.status,
          position: r.position,
          targetDate: r.targetDate ?? null,
        },
      });
    }

    // Create demo devlog for Neon Warden
    if (slug === 'neon-warden') {
      await prisma.devlog.upsert({
        where: { gameId_slug: { gameId: game.id, slug: 'shadows-dont-sleep' } },
        update: {},
        create: {
          gameId: game.id,
          authorId: user.id,
          title: "Shadows Don't Sleep: Infiltration in Neon Warden",
          slug: 'shadows-dont-sleep',
          body: 'A deep dive into stealth systems, enemy perception, and the city that never rests.',
          isPublished: true,
          publishedAt: new Date('2025-06-01'),
        },
      });

      // Create some game comments
      await prisma.comment.create({
        data: {
          gameId: game.id,
          authorId: user.id,
          body: 'The cyberpunk atmosphere in this is incredible! Can\'t wait for the full release.',
        },
      });
      await prisma.comment.create({
        data: {
          gameId: game.id,
          authorId: user.id,
          body: 'The stealth mechanics feel really polished for a beta.',
        },
      });
    }

    // Create demo press kit
    await prisma.pressKit.upsert({
      where: { gameId: game.id },
      update: {},
      create: {
        gameId: game.id,
        headline: `${gameData.title} — Press Kit`,
        contactEmail: 'press@playmorrow.example',
        downloadUrl: '#',
      },
    });
  }
  console.log('  ✅ Games created with media, roadmap, devlogs, comments');

  // Create demo follow relationships
  for (const gameId of gameIds) {
    await prisma.follow.upsert({
      where: { userId_gameId: { userId: user.id, gameId } },
      update: {},
      create: { userId: user.id, targetType: 'GAME', gameId },
    });
  }
  console.log('  ✅ Demo follows created');

  console.log('🌱 Seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
