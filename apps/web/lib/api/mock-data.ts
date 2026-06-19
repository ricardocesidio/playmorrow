/** Shared mock data for frontend development without a backend.
 *  Enable via NEXT_PUBLIC_USE_MOCKS=true in apps/web/.env.local
 *  Also consumed by Playwright E2E fixtures (e2e/fixtures/mocks.ts) */

export const MOCK_USER = {
  id: 'user-1',
  email: 'test@playmorrow.example',
  username: 'testuser',
  displayName: 'Test User',
  role: 'PLAYER',
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
  title: 'Test Game',
  slug: 'test-game',
  tagline: 'A test game',
  description: 'Full game description',
  status: 'IN_DEVELOPMENT',
  releaseDate: null,
  expectedReleaseText: 'Q4 2026',
  priceCents: 1999,
  currency: 'USD',
  isFree: false,
  coverUrl: null,
  bannerUrl: null,
  isPublished: true,
  followersCount: 10,
  studio: { id: 'studio-1', name: 'Test Studio', slug: 'test-studio' },
  media: [],
  platformLinks: [],
  tags: ['adventure'],
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

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
