import type { Page } from '@playwright/test';

export const API = 'http://localhost:4000/api';

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
  tags: ['adventure', 'exploration'],
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const MOCK_DEVLOG = {
  id: 'devlog-1',
  title: 'Test Devlog',
  slug: 'test-devlog',
  excerpt: 'A test devlog excerpt',
  body: 'Full devlog body content for testing.',
  coverUrl: null,
  isPublished: true,
  publishedAt: '2025-01-15T00:00:00.000Z',
  game: { id: 'game-1', title: 'Test Game', slug: 'test-game' },
  studio: { id: 'studio-1' },
  author: { id: 'user-1', username: 'testuser', displayName: 'Test User', avatarUrl: null },
  createdAt: '2025-01-15T00:00:00.000Z',
  updatedAt: '2025-01-15T00:00:00.000Z',
};

const MOCK_ROADMAP_ITEM = {
  id: 'roadmap-1',
  title: 'Test Roadmap Item',
  description: 'A roadmap item description',
  status: 'PLANNED',
  targetDate: '2026-06-01T00:00:00.000Z',
  position: 1,
  game: { id: 'game-1', title: 'Test Game', slug: 'test-game' },
  studio: { id: 'studio-1', name: 'Test Studio', slug: 'test-studio' },
  createdAt: '2025-02-01T00:00:00.000Z',
  updatedAt: '2025-02-01T00:00:00.000Z',
};

const FEED_ITEM_DEVLOG = {
  id: 'feed-devlog-1',
  type: 'DEVLOG',
  createdAt: '2025-03-01T00:00:00.000Z',
  publishedAt: '2025-03-01T00:00:00.000Z',
  title: 'Feed Devlog Title',
  summary: 'A feed devlog summary for testing.',
  game: { id: 'game-1', title: 'Test Game', slug: 'test-game', coverUrl: null },
  studio: { id: 'studio-1', name: 'Test Studio', slug: 'test-studio', logoUrl: null },
  target: { kind: 'DEVLOG', id: 'devlog-1' },
};

const FEED_ITEM_ROADMAP = {
  id: 'feed-roadmap-1',
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

export async function setupAuth(page: Page) {
  await page.goto('/');
  await page.evaluate((token) => localStorage.setItem('playmorrow_token', token), MOCK_TOKEN);
}

export async function mockApi(page: Page) {
  const apiUrl = API;

  // Auth endpoints
  await page.route(`${apiUrl}/auth/me`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_USER) });
  });

  // Feed endpoints
  await page.route(`${apiUrl}/feed/public*`, async (route) => {
    const url = new URL(route.request().url());
    const pageSize = parseInt(url.searchParams.get('pageSize') ?? '10');
    const items = Array.from({ length: Math.min(pageSize, 2) }).map((_, i) => ({
      ...(i === 0 ? FEED_ITEM_DEVLOG : FEED_ITEM_ROADMAP),
      id: `feed-${i}`,
    }));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items, total: 2, page: 1, pageSize, hasMore: false }),
    });
  });

  // Games: specific slugs first, then listing with wildcard
  await page.route(`${apiUrl}/games/test-game`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_GAME) });
  });
  await page.route(`${apiUrl}/games*`, async (route) => {
    const url = new URL(route.request().url());
    const search = url.searchParams.get('search') || '';
    const items = search
      ? [{ ...MOCK_GAME, title: 'Searched Game' }]
      : [{ ...MOCK_GAME }, { ...MOCK_GAME, id: 'game-2', slug: 'test-game-2', title: 'Test Game 2' }];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items, total: items.length, page: 1, pageSize: 20, hasMore: false }),
    });
  });

  // Studio endpoints
  await page.route(`${apiUrl}/studios/test-studio`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_STUDIO) });
  });

  await page.route(`${apiUrl}/studios/test-studio/members`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'studio-1', name: 'Test Studio', slug: 'test-studio', members: [] }),
    });
  });

  await page.route(`${apiUrl}/studios/test-studio/games`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [MOCK_GAME], total: 1, page: 1, pageSize: 20, hasMore: false }),
    });
  });

  // Follow status
  await page.route(`${apiUrl}/studios/test-studio/follow-status`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ targetType: 'STUDIO', targetId: 'studio-1', isFollowing: false, followerCount: 5 }),
    });
  });

  await page.route(`${apiUrl}/games/test-game/follow-status`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ targetType: 'GAME', targetId: 'game-1', isFollowing: false, followerCount: 10 }),
    });
  });

  // Follow actions
  await page.route(`${apiUrl}/studios/*/follow`, async (route, request) => {
    if (request.method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ targetType: 'STUDIO', targetId: 'studio-1', isFollowing: true, followerCount: 6 }),
      });
    } else if (request.method() === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ targetType: 'STUDIO', targetId: 'studio-1', isFollowing: false, followerCount: 5 }),
      });
    } else {
      await route.fulfill({ status: 404 });
    }
  });

  await page.route(`${apiUrl}/games/*/follow`, async (route, request) => {
    if (request.method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ targetType: 'GAME', targetId: 'game-1', isFollowing: true, followerCount: 11 }),
      });
    } else if (request.method() === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ targetType: 'GAME', targetId: 'game-1', isFollowing: false, followerCount: 10 }),
      });
    } else {
      await route.fulfill({ status: 404 });
    }
  });

  // Devlogs
  await page.route(`${apiUrl}/games/test-game/devlogs*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [MOCK_DEVLOG], total: 1, page: 1, pageSize: 20, hasMore: false }),
    });
  });

  await page.route(`${apiUrl}/devlogs/devlog-1`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_DEVLOG) });
  });

  await page.route(`${apiUrl}/devlogs/devlog-1/comments`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.route(`${apiUrl}/devlogs/devlog-1/reactions`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        targetType: 'DEVLOG', targetId: 'devlog-1',
        counts: { LIKE: 0, LOVE: 0, HYPE: 0, INSIGHTFUL: 0 },
        viewerReactions: [],
      }),
    });
  });

  // Roadmap
  await page.route(`${apiUrl}/games/test-game/roadmap`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([MOCK_ROADMAP_ITEM]),
    });
  });

  // Press kit
  await page.route(`${apiUrl}/games/test-game/press-kit`, async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'Press kit not found' }) });
  });

  // My studios
  await page.route(`${apiUrl}/studios/me`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([MOCK_STUDIO]) });
  });

  // Notifications
  await page.route(`${apiUrl}/me/notifications*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], total: 0, page: 1, pageSize: 20 }),
    });
  });

  await page.route(`${apiUrl}/me/notifications/unread-count`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ unreadCount: 0 }) });
  });

  // Follows
  await page.route(`${apiUrl}/me/follows`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ studios: [MOCK_STUDIO], games: [MOCK_GAME] }),
    });
  });

}

/** Helper: assert no page errors occurred during a test */
export async function assertNoPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}
