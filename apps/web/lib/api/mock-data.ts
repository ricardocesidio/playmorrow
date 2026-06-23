/** Shared mock data for frontend development without a backend.
 *  Enable via NEXT_PUBLIC_USE_MOCKS=true in apps/web/.env.local
 *  Also consumed by Playwright E2E fixtures (e2e/fixtures/mocks.ts) */

export const MOCK_USER = {
  id: 'user-1',
  email: 'test@playmorrow.example',
  username: 'testuser',
  displayName: 'Test User',
  role: 'PLAYER',
  accountType: 'PLAYER',
};

export const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-token';

export const MOCK_STUDIO = {
  id: 'studio-1',
  name: 'Test Studio',
  slug: 'test-studio',
  tagline: 'A test studio',
  description: 'Full description',
  logoUrl: null,
  bannerUrl: null,
  websiteUrl: 'https://example.com',
  location: 'Test City',
  foundedYear: 2024,
  isVerified: false,
  membersCount: 1,
  gamesCount: 1,
  followersCount: 5,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

export const MOCK_GAME = {
  id: 'game-1',
  title: 'Neon Warden',
  slug: 'test-game',
  tagline: 'Tactical stealth in a rain-slick cyberpunk city.',
  description: 'Track signals, infiltrate districts, and disappear before the city knows you were there.',
  status: 'BETA',
  releaseDate: null,
  expectedReleaseText: 'Q4 2026',
  priceCents: 1999,
  currency: 'USD',
  isFree: false,
  coverUrl: '/playmorrow/neon-warden.png',
  bannerUrl: '/playmorrow/neon-warden.png',
  isPublished: true,
  followersCount: 12400,
  studio: { id: 'studio-1', name: 'Obsidian Signal', slug: 'test-studio' },
  media: [],
  platformLinks: [
    { id: 'pc', platform: 'PC', url: '#', label: 'PC' },
    { id: 'ps5', platform: 'PS5', url: '#', label: 'PS5' },
    { id: 'xbox', platform: 'XBOX', url: '#', label: 'XBOX' },
  ],
  tags: ['Tactical Stealth', 'Cyberpunk'],
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

export const MOCK_GAMES = [
  MOCK_GAME,
  {
    ...MOCK_GAME,
    id: 'game-2',
    title: 'Starfall Tactics',
    slug: 'starfall-tactics',
    tagline: 'Tactical RPG warfare across a fractured nebula.',
    status: 'IN_DEVELOPMENT',
    coverUrl: '/playmorrow/starfall-tactics.png',
    bannerUrl: '/playmorrow/starfall-tactics.png',
    followersCount: 8700,
    studio: { id: 'studio-2', name: 'Ironlight Studios', slug: 'ironlight-studios' },
    tags: ['Tactical RPG', 'Space Opera'],
  },
  {
    ...MOCK_GAME,
    id: 'game-3',
    title: 'Mossbound',
    slug: 'mossbound',
    status: 'ALPHA',
    coverUrl: '/playmorrow/mossbound.png',
    bannerUrl: '/playmorrow/mossbound.png',
    followersCount: 5100,
    studio: { id: 'studio-3', name: 'Wildbriar', slug: 'wildbriar' },
    tags: ['Adventure', 'Atmospheric'],
  },
  {
    ...MOCK_GAME,
    id: 'game-4',
    title: 'Paper Relics',
    slug: 'paper-relics',
    status: 'PRE_ALPHA',
    coverUrl: '/playmorrow/paper-relics.png',
    bannerUrl: '/playmorrow/paper-relics.png',
    followersCount: 3200,
    studio: { id: 'studio-4', name: 'Second Story Games', slug: 'second-story-games' },
    tags: ['Card Battler', 'Roguelike'],
    platformLinks: [{ id: 'pc', platform: 'PC', url: '#', label: 'PC' }],
  },
  {
    ...MOCK_GAME,
    id: 'game-5',
    title: 'Voidrunner',
    slug: 'voidrunner',
    status: 'ALPHA',
    coverUrl: '/playmorrow/voidrunner.png',
    bannerUrl: '/playmorrow/voidrunner.png',
    followersCount: 6300,
    studio: { id: 'studio-5', name: 'Voidrunner', slug: 'voidrunner-studio' },
    tags: ['Roguelite', 'Twin Stick Shooter'],
  },
  {
    ...MOCK_GAME,
    id: 'game-6',
    title: 'Little Giants',
    slug: 'little-giants',
    status: 'IN_DEVELOPMENT',
    coverUrl: '/playmorrow/little-giants.png',
    bannerUrl: '/playmorrow/little-giants.png',
    followersCount: 4200,
    studio: { id: 'studio-6', name: 'Tiny Forge', slug: 'tiny-forge' },
    tags: ['City Builder', 'Sandbox'],
  },
  {
    ...MOCK_GAME,
    id: 'game-7',
    title: 'Echobloom',
    slug: 'echobloom',
    status: 'ALPHA',
    coverUrl: '/playmorrow/echobloom.png',
    bannerUrl: '/playmorrow/echobloom.png',
    followersCount: 2900,
    studio: { id: 'studio-7', name: 'Lumen Garden', slug: 'lumen-garden' },
    tags: ['Narrative', 'Puzzle'],
    platformLinks: [{ id: 'pc', platform: 'PC', url: '#', label: 'PC' }],
  },
  {
    ...MOCK_GAME,
    id: 'game-8',
    title: 'Northlight',
    slug: 'northlight',
    status: 'PRE_ALPHA',
    coverUrl: '/playmorrow/northlight.png',
    bannerUrl: '/playmorrow/northlight.png',
    followersCount: 3800,
    studio: { id: 'studio-8', name: 'Frostfire Games', slug: 'frostfire-games' },
    tags: ['Survival', 'Open World'],
  },
];

export const MOCK_FEED_ITEM_DEVLOG = {
  id: 'feed-dl-1',
  type: 'DEVLOG',
  createdAt: '2025-03-01T00:00:00.000Z',
  publishedAt: '2025-03-01T00:00:00.000Z',
  title: 'Feed Devlog Title',
  summary: 'A feed devlog summary for testing.',
  game: { id: 'game-1', title: 'Test Game', slug: 'test-game', coverUrl: null },
  studio: { id: 'studio-1', name: 'Test Studio', slug: 'test-studio', logoUrl: null },
  target: { kind: 'DEVLOG', id: 'devlog-1' },
};

export const MOCK_FEED_ITEM_ROADMAP = {
  id: 'feed-rm-1',
  type: 'ROADMAP_ITEM',
  createdAt: '2025-03-02T00:00:00.000Z',
  publishedAt: null,
  title: 'Feed Roadmap Title',
  summary: 'A feed roadmap summary.',
  status: 'PLANNED',
  targetDate: '2026-06-01T00:00:00.000Z',
  game: { id: 'game-1', title: 'Test Game', slug: 'test-game', coverUrl: null },
  studio: { id: 'studio-1', name: 'Test Studio', slug: 'test-studio', logoUrl: null },
  target: { kind: 'ROADMAP_ITEM', id: 'roadmap-1' },
};

export const MOCK_DEVLOG = {
  id: 'devlog-1',
  title: 'Test Devlog',
  slug: 'test-devlog',
  excerpt: 'A test devlog excerpt for testing purposes.',
  body: 'Full devlog body content for testing.\n\nThis is the second paragraph with more detail.',
  coverUrl: null,
  isPublished: true,
  publishedAt: '2025-01-15T00:00:00.000Z',
  game: { id: 'game-1', title: 'Test Game', slug: 'test-game' },
  studio: { id: 'studio-1' },
  author: { id: 'user-1', username: 'testuser', displayName: 'Test User', avatarUrl: null },
  createdAt: '2025-01-15T00:00:00.000Z',
  updatedAt: '2025-01-15T00:00:00.000Z',
};

export const MOCK_ROADMAP_ITEM = {
  id: 'roadmap-1',
  title: 'Test Roadmap Item',
  description: 'A roadmap item description.',
  status: 'PLANNED',
  targetDate: '2026-06-01T00:00:00.000Z',
  position: 1,
  game: { id: 'game-1', title: 'Test Game', slug: 'test-game' },
  studio: { id: 'studio-1', name: 'Test Studio', slug: 'test-studio' },
  createdAt: '2025-02-01T00:00:00.000Z',
  updatedAt: '2025-02-01T00:00:00.000Z',
};

export const MOCK_COMMENT = {
  id: 'comment-1',
  body: 'This is a test comment.',
  parentId: null,
  isDeleted: false,
  deletedAt: null,
  author: { id: 'user-2', username: 'otheruser', displayName: 'Other User', avatarUrl: null },
  createdAt: '2025-03-01T00:00:00.000Z',
  updatedAt: '2025-03-01T00:00:00.000Z',
};

export const MOCK_NOTIFICATION = {
  id: 'notif-1',
  type: 'NEW_FOLLOWER',
  title: 'Test User followed your studio',
  body: null,
  targetType: 'STUDIO',
  targetId: 'studio-1',
  readAt: null,
  createdAt: '2025-03-01T00:00:00.000Z',
  actor: { id: 'user-2', username: 'otheruser', displayName: 'Other User', avatarUrl: null },
};

export function paginated<T>(items: T[], total?: number, page = 1, pageSize = 20) {
  return { items, total: total ?? items.length, page, pageSize, hasMore: page * pageSize < (total ?? items.length) };
}

export function followStatus(targetType: string, targetId: string, isFollowing = false, followerCount = 5) {
  return { targetType, targetId, isFollowing, followerCount };
}
