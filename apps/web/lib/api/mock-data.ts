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
  logoUrl: '/demo/games/neon-warden/hero.svg',
  bannerUrl: '/demo/games/neon-warden/hero.svg',
  websiteUrl: 'https://example.com',
  location: 'Test City',
  foundedYear: 2024,
  isVerified: false,
  level: 1,
  xp: 0,
  membersCount: 1,
  gamesCount: 1,
  followersCount: 5,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

export const MOCK_GAME = {
  id: 'game-1',
  title: 'Neon Warden',
  slug: 'neon-warden',
  tagline: 'Tactical stealth in a rain-slick cyberpunk city.',
  description: 'Track signals, infiltrate districts, and disappear before the city knows you were there.',
  status: 'BETA',
  releaseDate: null,
  expectedReleaseText: 'Q4 2026',
  priceCents: 1999,
  currency: 'USD',
  isFree: false,
  coverUrl: '/demo/games/neon-warden/hero.svg',
  bannerUrl: '/demo/games/neon-warden/hero.svg',
  isPublished: true,
  followersCount: 12400,
  wishlistsCount: 312,
  commentsCount: 48,
  viewsCount: 9100,
  studio: { id: 'studio-1', name: 'Obsidian Signal', slug: 'obsidian-signal' },
  trailerUrl: '/demo/games/neon-warden/trailer.svg',
  media: [
    { id: 'nw-1', type: 'SCREENSHOT', url: '/demo/games/neon-warden/screenshot-1.svg', thumbnailUrl: '/demo/games/neon-warden/screenshot-1.svg', caption: 'Grid Assault', position: 1 },
    { id: 'nw-2', type: 'SCREENSHOT', url: '/demo/games/neon-warden/screenshot-2.svg', thumbnailUrl: '/demo/games/neon-warden/screenshot-2.svg', caption: 'City Center', position: 2 },
    { id: 'nw-3', type: 'SCREENSHOT', url: '/demo/games/neon-warden/screenshot-3.svg', thumbnailUrl: '/demo/games/neon-warden/screenshot-3.svg', caption: 'Stealth Ops', position: 3 },
    { id: 'nw-4', type: 'SCREENSHOT', url: '/demo/games/neon-warden/screenshot-4.svg', thumbnailUrl: '/demo/games/neon-warden/screenshot-4.svg', caption: 'Night Run', position: 4 },
    { id: 'nw-t', type: 'TRAILER', url: '/demo/games/neon-warden/trailer.svg', thumbnailUrl: '/demo/games/neon-warden/trailer.svg', caption: 'Official Trailer', position: 0 },
  ],
  platformLinks: [
    { id: 'pc', platform: 'PC', url: '#', label: 'STEAM' },
    { id: 'epic', platform: 'EPIC', url: '#', label: 'EPIC' },
    { id: 'web', platform: 'WEB', url: '#', label: 'WEBSITE' },
  ],
  tags: ['Stealth', 'Cyberpunk', 'Tactical', 'Strategy', 'Sci-Fi', 'Singleplayer'],
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
    description: 'Lead a crew through a dying galaxy where every choice leaves a scar.',
    status: 'ALPHA',
    coverUrl: '/demo/games/starfall-tactics/hero.svg',
    bannerUrl: '/demo/games/starfall-tactics/hero.svg',
    followersCount: 8700,
    wishlistsCount: 214,
    commentsCount: 31,
    viewsCount: 6200,
    studio: { id: 'studio-2', name: 'Ironlight Studios', slug: 'ironlight-studios' },
    trailerUrl: '/demo/games/starfall-tactics/trailer.svg',
    media: [
      { id: 'st-1', type: 'SCREENSHOT', url: '/demo/games/starfall-tactics/screenshot-1.svg', thumbnailUrl: '/demo/games/starfall-tactics/screenshot-1.svg', caption: 'Asteroid Belt', position: 1 },
      { id: 'st-2', type: 'SCREENSHOT', url: '/demo/games/starfall-tactics/screenshot-2.svg', thumbnailUrl: '/demo/games/starfall-tactics/screenshot-2.svg', caption: 'Sector Omega', position: 2 },
      { id: 'st-3', type: 'SCREENSHOT', url: '/demo/games/starfall-tactics/screenshot-3.svg', thumbnailUrl: '/demo/games/starfall-tactics/screenshot-3.svg', caption: 'Fleet Command', position: 3 },
      { id: 'st-4', type: 'SCREENSHOT', url: '/demo/games/starfall-tactics/screenshot-4.svg', thumbnailUrl: '/demo/games/starfall-tactics/screenshot-4.svg', caption: 'Deep Space', position: 4 },
      { id: 'st-t', type: 'TRAILER', url: '/demo/games/starfall-tactics/trailer.svg', thumbnailUrl: '/demo/games/starfall-tactics/trailer.svg', caption: 'Official Trailer', position: 0 },
    ],
    tags: ['Tactical', 'RPG', 'Space', 'Strategy', 'Sci-Fi', 'Singleplayer'],
  },
  {
    ...MOCK_GAME,
    id: 'game-3',
    title: 'Mossbound',
    slug: 'mossbound',
    tagline: 'Adventure • Atmospheric',
    description: 'A tiny traveler. An ancient forest. Secrets grow in the dark.',
    status: 'PRE_ALPHA',
    coverUrl: '/demo/games/mossbound/hero.svg',
    bannerUrl: '/demo/games/mossbound/hero.svg',
    followersCount: 5100,
    wishlistsCount: 128,
    commentsCount: 22,
    viewsCount: 4300,
    studio: { id: 'studio-3', name: 'Wildbriar', slug: 'wildbriar' },
    trailerUrl: '/demo/games/mossbound/trailer.svg',
    media: [
      { id: 'mb-1', type: 'SCREENSHOT', url: '/demo/games/mossbound/screenshot-1.svg', thumbnailUrl: '/demo/games/mossbound/screenshot-1.svg', caption: 'Ancient Grove', position: 1 },
      { id: 'mb-2', type: 'SCREENSHOT', url: '/demo/games/mossbound/screenshot-2.svg', thumbnailUrl: '/demo/games/mossbound/screenshot-2.svg', caption: 'Moonlit Path', position: 2 },
      { id: 'mb-3', type: 'SCREENSHOT', url: '/demo/games/mossbound/screenshot-3.svg', thumbnailUrl: '/demo/games/mossbound/screenshot-3.svg', caption: 'Deep Roots', position: 3 },
      { id: 'mb-4', type: 'SCREENSHOT', url: '/demo/games/mossbound/screenshot-4.svg', thumbnailUrl: '/demo/games/mossbound/screenshot-4.svg', caption: 'Forgotten Temple', position: 4 },
      { id: 'mb-t', type: 'TRAILER', url: '/demo/games/mossbound/trailer.svg', thumbnailUrl: '/demo/games/mossbound/trailer.svg', caption: 'Official Trailer', position: 0 },
    ],
    platformLinks: [
      { id: 'pc', platform: 'PC', url: '#', label: 'STEAM' },
      { id: 'web', platform: 'WEB', url: '#', label: 'WEBSITE' },
    ],
    tags: ['Adventure', 'Atmospheric', 'Exploration', 'Fantasy', 'Singleplayer'],
  },
  {
    ...MOCK_GAME,
    id: 'game-4',
    title: 'Paper Relics',
    slug: 'paper-relics',
    tagline: 'Card Battler • Roguelike',
    description: 'Fold the past. Play the present. Rewrite your fate.',
    status: 'PRE_ALPHA',
    coverUrl: '/demo/games/paper-relics/hero.svg',
    bannerUrl: '/demo/games/paper-relics/hero.svg',
    followersCount: 3200,
    wishlistsCount: 89,
    commentsCount: 15,
    viewsCount: 2800,
    studio: { id: 'studio-4', name: 'Second Story Games', slug: 'second-story-games' },
    trailerUrl: '/demo/games/paper-relics/trailer.svg',
    media: [
      { id: 'pr-1', type: 'SCREENSHOT', url: '/demo/games/paper-relics/screenshot-1.svg', thumbnailUrl: '/demo/games/paper-relics/screenshot-1.svg', caption: 'Card Battle', position: 1 },
      { id: 'pr-2', type: 'SCREENSHOT', url: '/demo/games/paper-relics/screenshot-2.svg', thumbnailUrl: '/demo/games/paper-relics/screenshot-2.svg', caption: 'The Fold', position: 2 },
      { id: 'pr-3', type: 'SCREENSHOT', url: '/demo/games/paper-relics/screenshot-3.svg', thumbnailUrl: '/demo/games/paper-relics/screenshot-3.svg', caption: 'Relic Forge', position: 3 },
      { id: 'pr-4', type: 'SCREENSHOT', url: '/demo/games/paper-relics/screenshot-4.svg', thumbnailUrl: '/demo/games/paper-relics/screenshot-4.svg', caption: 'Ancient Deck', position: 4 },
      { id: 'pr-t', type: 'TRAILER', url: '/demo/games/paper-relics/trailer.svg', thumbnailUrl: '/demo/games/paper-relics/trailer.svg', caption: 'Official Trailer', position: 0 },
    ],
    platformLinks: [
      { id: 'pc', platform: 'PC', url: '#', label: 'STEAM' },
      { id: 'itch', platform: 'ITCH', url: '#', label: 'ITCH.IO' },
    ],
    tags: ['Card Game', 'Roguelike', 'Strategy', 'Fantasy', 'Singleplayer', 'Deckbuilding'],
  },
  {
    ...MOCK_GAME,
    id: 'game-5',
    title: 'Voidrunner',
    slug: 'voidrunner',
    tagline: 'Action • Sci-Fi • Speed',
    description: 'Outrun the void. Every second matters.',
    status: 'CONCEPT',
    priceCents: 0,
    isFree: true,
    coverUrl: '/demo/games/voidrunner/hero.svg',
    bannerUrl: '/demo/games/voidrunner/hero.svg',
    followersCount: 6300,
    wishlistsCount: 176,
    commentsCount: 27,
    viewsCount: 5400,
    studio: { id: 'studio-5', name: 'Voidrunner Dev', slug: 'voidrunner-dev' },
    trailerUrl: '/demo/games/voidrunner/trailer.svg',
    media: [
      { id: 'vr-1', type: 'SCREENSHOT', url: '/demo/games/voidrunner/screenshot-1.svg', thumbnailUrl: '/demo/games/voidrunner/screenshot-1.svg', caption: 'Speed Run', position: 1 },
      { id: 'vr-2', type: 'SCREENSHOT', url: '/demo/games/voidrunner/screenshot-2.svg', thumbnailUrl: '/demo/games/voidrunner/screenshot-2.svg', caption: 'Void Chase', position: 2 },
      { id: 'vr-3', type: 'SCREENSHOT', url: '/demo/games/voidrunner/screenshot-3.svg', thumbnailUrl: '/demo/games/voidrunner/screenshot-3.svg', caption: 'Neon Dash', position: 3 },
      { id: 'vr-4', type: 'SCREENSHOT', url: '/demo/games/voidrunner/screenshot-4.svg', thumbnailUrl: '/demo/games/voidrunner/screenshot-4.svg', caption: 'Final Rush', position: 4 },
      { id: 'vr-t', type: 'TRAILER', url: '/demo/games/voidrunner/trailer.svg', thumbnailUrl: '/demo/games/voidrunner/trailer.svg', caption: 'Official Trailer', position: 0 },
    ],
    platformLinks: [
      { id: 'pc', platform: 'PC', url: '#', label: 'STEAM' },
      { id: 'web', platform: 'WEB', url: '#', label: 'WEBSITE' },
    ],
    tags: ['Action', 'Sci-Fi', 'Runner', 'Singleplayer', 'Fast-Paced'],
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
