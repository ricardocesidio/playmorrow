import type { Page } from '@playwright/test';

export const API_ORIGIN = 'http://localhost:4000';
export const API = 'http://localhost:4000/api';

export const MOCK_USER = {
  id: 'user-1', email: 'test@playmorrow.example', username: 'testuser',
  displayName: 'Test User', role: 'PLAYER', accountType: 'PLAYER',
  avatarUrl: null, bio: null, location: null,
  isOnboardingCompleted: true,
  level: 1, xp: 0,
};
export const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-token';

export const MOCK_STUDIO = {
  id: 'studio-1', name: 'Test Studio', slug: 'test-studio', tagline: 'A test studio',
  description: 'Full description', logoUrl: null, bannerUrl: null,
  websiteUrl: 'https://example.com', location: 'Test City', foundedYear: 2024,
  isVerified: false, membersCount: 1, gamesCount: 1, followersCount: 5,
  createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
};

export const MOCK_GAME = {
  id: 'game-1', title: 'Neon Warden', slug: 'test-game', tagline: 'Tactical stealth in a rain-slick cyberpunk city.',
  description: 'Full game description', status: 'BETA',
  releaseDate: null, expectedReleaseText: 'Q4 2026', priceCents: 1999,
  currency: 'USD', isFree: false, coverUrl: '/playmorrow/neon-warden.png', bannerUrl: '/playmorrow/neon-warden.png',
  isPublished: true, followersCount: 12400,
  studio: { id: 'studio-1', name: 'Obsidian Signal', slug: 'test-studio' },
  media: [], platformLinks: [
    { id: 'pc', platform: 'PC', url: '#', label: 'PC' },
    { id: 'ps5', platform: 'PS5', url: '#', label: 'PS5' },
    { id: 'xbox', platform: 'XBOX', url: '#', label: 'XBOX' },
  ], tags: ['Tactical Stealth', 'Cyberpunk'],
  createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
};

export const MOCK_GAMES = [
  MOCK_GAME,
  { ...MOCK_GAME, id: 'game-2', title: 'Starfall Tactics', slug: 'starfall-tactics', status: 'IN_DEVELOPMENT', coverUrl: '/playmorrow/starfall-tactics.png', bannerUrl: '/playmorrow/starfall-tactics.png', followersCount: 8700, studio: { id: 'studio-2', name: 'Ironlight Studios', slug: 'ironlight-studios' }, tags: ['Tactical RPG', 'Space Opera'] },
  { ...MOCK_GAME, id: 'game-3', title: 'Mossbound', slug: 'mossbound', status: 'ALPHA', coverUrl: '/playmorrow/mossbound.png', bannerUrl: '/playmorrow/mossbound.png', followersCount: 5100, studio: { id: 'studio-3', name: 'Wildbriar', slug: 'wildbriar' }, tags: ['Adventure', 'Atmospheric'] },
  { ...MOCK_GAME, id: 'game-4', title: 'Paper Relics', slug: 'paper-relics', status: 'PRE_ALPHA', coverUrl: '/playmorrow/paper-relics.png', bannerUrl: '/playmorrow/paper-relics.png', followersCount: 3200, studio: { id: 'studio-4', name: 'Second Story Games', slug: 'second-story-games' }, tags: ['Card Battler', 'Roguelike'] },
  { ...MOCK_GAME, id: 'game-5', title: 'Voidrunner', slug: 'voidrunner', status: 'ALPHA', coverUrl: '/playmorrow/voidrunner.png', bannerUrl: '/playmorrow/voidrunner.png', followersCount: 6300, studio: { id: 'studio-5', name: 'Voidrunner', slug: 'voidrunner-studio' }, tags: ['Roguelite', 'Twin Stick Shooter'] },
  { ...MOCK_GAME, id: 'game-6', title: 'Little Giants', slug: 'little-giants', status: 'IN_DEVELOPMENT', coverUrl: '/playmorrow/little-giants.png', bannerUrl: '/playmorrow/little-giants.png', followersCount: 4200, studio: { id: 'studio-6', name: 'Tiny Forge', slug: 'tiny-forge' }, tags: ['City Builder', 'Sandbox'] },
  { ...MOCK_GAME, id: 'game-7', title: 'Echobloom', slug: 'echobloom', status: 'ALPHA', coverUrl: '/playmorrow/echobloom.png', bannerUrl: '/playmorrow/echobloom.png', followersCount: 2900, studio: { id: 'studio-7', name: 'Lumen Garden', slug: 'lumen-garden' }, tags: ['Narrative', 'Puzzle'] },
  { ...MOCK_GAME, id: 'game-8', title: 'Northlight', slug: 'northlight', status: 'PRE_ALPHA', coverUrl: '/playmorrow/northlight.png', bannerUrl: '/playmorrow/northlight.png', followersCount: 3800, studio: { id: 'studio-8', name: 'Frostfire Games', slug: 'frostfire-games' }, tags: ['Survival', 'Open World'] },
];

export async function setupAuth(page: Page) {
  await page.goto('/');
  await page.evaluate((token) => localStorage.setItem('playmorrow_token', token), MOCK_TOKEN);
}

export const MOCK_LISTING = {
  id: 'listing-1', type: 'ASSET', title: 'Neon Audio Pack',
  description: 'Synthwave sound pack for game jams.',
  priceCents: 1999, currency: 'USD', fileUrl: null, thumbnailUrl: null,
  tags: ['music', 'synthwave'], status: 'ACTIVE', studioId: 'studio-1', gameId: null,
  createdAt: '2025-02-01T00:00:00.000Z', updatedAt: '2025-02-01T00:00:00.000Z',
  studio: { id: 'studio-1', name: 'Test Studio', slug: 'test-studio', logoUrl: null },
  game: null,
};

export const MOCK_DRAFT_LISTING = {
  ...MOCK_LISTING, id: 'listing-2', title: 'WIP Shader Pack', type: 'PLUGIN', status: 'DRAFT',
};

export const MOCK_ARCHIVED_LISTING = {
  ...MOCK_LISTING, id: 'listing-3', title: 'Old Sound Kit', status: 'ARCHIVED',
};

export const MOCK_LISTINGS = [MOCK_LISTING, MOCK_DRAFT_LISTING, MOCK_ARCHIVED_LISTING];

export const MOCK_EVENT = {
  id: 'event-1', title: 'Indie Game Jam 2026', slug: 'indie-game-jam-2026',
  description: 'Build a game in 48 hours.', startDate: '2026-09-12T09:00:00.000Z',
  endDate: '2026-09-14T09:00:00.000Z', location: 'Online', virtual: true,
  ticketPriceCents: 0, maxAttendees: 500, bannerUrl: null, organizerId: null,
  status: 'PUBLISHED', createdAt: '2025-06-01T00:00:00.000Z', updatedAt: '2025-06-01T00:00:00.000Z',
};

export const MOCK_PARTNER = {
  id: 'partner-1', type: 'UNIVERSITY', name: 'Northwind University', slug: 'northwind-university',
  description: 'Game design program partner.', websiteUrl: 'https://example.com', logoUrl: null,
  contactName: null, contactEmail: null, status: 'ACTIVE',
  createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
};

export const MOCK_PARTNERS = [
  MOCK_PARTNER,
  { ...MOCK_PARTNER, id: 'partner-2', type: 'PUBLISHER', name: 'Orbit Interactive', slug: 'orbit-interactive', websiteUrl: null },
];

export const MOCK_REVENUE = [
  { studio: { id: 'studio-1', name: 'Test Studio', slug: 'test-studio' }, totalRevenue: 5999, totalFees: 599, netRevenue: 5400, totalSales: 3 },
];

export const MOCK_REFERRAL_CODE = { id: 'ref-1', userId: 'user-1', code: 'PLAYTEST' };
export const MOCK_COMMISSIONS = {
  code: 'PLAYTEST',
  commissions: [
    { id: 'comm-1', createdAt: '2026-07-01T00:00:00.000Z', amountCents: 199 },
    { id: 'comm-2', createdAt: '2026-07-05T00:00:00.000Z', amountCents: 99 },
  ],
  totalEarned: 298,
};

/**
 * Register a centralized API router that dispatches by HTTP method and pathname.
 * Returns a cleanup function to unroute all handlers.
 */
export async function mockApi(page: Page) {
  const apiOrigin = API_ORIGIN;

  // Single catch-all route for the API origin
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());

    // Only handle requests to our API origin
    if (url.origin !== apiOrigin) {
      await route.continue();
      return;
    }

    const method = route.request().method();
    const path = url.pathname; // e.g. /api/games/test-game
    const params = url.searchParams;

    async function json(data: unknown, status = 200) {
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    }

    try {
      // ── Auth ───────────────────────────────────────────────────────
      if (path === '/api/auth/session/me') {
        return await json(MOCK_USER);
      }

      // ── Feed ───────────────────────────────────────────────────────
      if (path === '/api/feed/public') {
        const pageSize = parseInt(params.get('pageSize') ?? '10');
        return await json({
          items: Array.from({ length: Math.min(pageSize, 2) }).map((_, i) => ({
            id: `feed-${i}`, type: i === 0 ? 'DEVLOG' : 'ROADMAP_ITEM',
            createdAt: '2025-03-01T00:00:00.000Z', publishedAt: i === 0 ? '2025-03-01T00:00:00.000Z' : null,
            title: `Feed ${i === 0 ? 'Devlog' : 'Roadmap'} Title`,
            summary: `Feed ${i === 0 ? 'devlog' : 'roadmap'} summary.`,
            ...(i === 0 ? {} : { status: 'PLANNED', targetDate: '2026-06-01T00:00:00.000Z' }),
            game: { id: 'game-1', title: 'Test Game', slug: 'test-game', coverUrl: null },
            studio: { id: 'studio-1', name: 'Test Studio', slug: 'test-studio', logoUrl: null },
            target: { kind: i === 0 ? 'DEVLOG' : 'ROADMAP_ITEM', id: i === 0 ? 'devlog-1' : 'roadmap-1' },
          })),
          total: 2, page: 1, pageSize, hasMore: false,
        });
      }

      // ── Me feed ────────────────────────────────────────────────────
      if (path === '/api/me/feed') {
        // Overridden in tests — return empty default
        const p = parseInt(params.get('page') ?? '1');
        const ps = parseInt(params.get('pageSize') ?? '10');
        return await json({ items: [], total: 0, page: p, pageSize: ps, hasMore: false });
      }

      // ── Games listing (no slug) ─────────────────────────────────────
      if (path === '/api/games') {
        const search = params.get('search') || '';
        const items = search ? [{ ...MOCK_GAME, title: 'Searched Game' }] : MOCK_GAMES;
        return await json({ items, total: items.length, page: 1, pageSize: 20, hasMore: false });
      }

      // ── Game detail (exact /api/games/:slug, no trailing path) ─────
      const gameDetailMatch = path.match(/^\/api\/games\/([^/]+)$/);
      if (gameDetailMatch) {
        const slug = gameDetailMatch[1]!;
        if (slug === 'test-game') return await json(MOCK_GAME);
        return await json({}, 404);
      }

      // ── Game sub-routes ─────────────────────────────────────────────
      if (path.includes('/devlogs')) return await json({ items: [], total: 0, page: 1, pageSize: 20, hasMore: false });
      if (path.includes('/roadmap')) return await json([]);
      if (path.includes('/press-kit')) return await json({ message: 'Not found' }, 404);
      if (path.includes('/follow-status')) return await json({ isFollowing: false, followerCount: 10 });
      if (path === '/api/games/test-game/follow' && method === 'POST') return await json({ isFollowing: true, followerCount: 11 });
      if (path === '/api/games/test-game/follow') return await json({ isFollowing: false, followerCount: 10 });

      // ── Studio detail (exact /api/studios/:slug, no trailing path) ─
      const studioDetailMatch = path.match(/^\/api\/studios\/([^/]+)$/);
      if (studioDetailMatch) {
        const slug = studioDetailMatch[1]!;
        if (slug === 'test-studio') return await json(MOCK_STUDIO);
        // /studios/me is handled elsewhere
        if (slug === 'me') return await json([MOCK_STUDIO]);
        return await json({}, 404);
      }

      // ── Studio sub-routes ───────────────────────────────────────────
      if (path.includes('/members')) return await json({ members: [] });
      if (path.includes('/games')) return await json({ items: [MOCK_GAME], total: 1, page: 1, pageSize: 20, hasMore: false });
      if (path.includes('/follow-status')) return await json({ targetType: 'STUDIO', targetId: 'studio-1', isFollowing: false, followerCount: 5 });
      if (path.includes('/follow')) {
        if (method === 'POST') return await json({ targetType: 'STUDIO', targetId: 'studio-1', isFollowing: true, followerCount: 6 });
        return await json({ targetType: 'STUDIO', targetId: 'studio-1', isFollowing: false, followerCount: 5 });
      }

      // ── Marketplace ─────────────────────────────────────────────────
      if (path === '/api/marketplace') {
        const type = params.get('type');
        const items = type ? MOCK_LISTINGS.filter((l) => l.type === type) : MOCK_LISTINGS;
        return await json({ items, total: items.length, page: 1, pageSize: 20, hasMore: false });
      }

      // Studio listings (must precede the generic /marketplace/:id matcher)
      const studioListingsMatch = path.match(/^\/api\/marketplace\/studio\/([^/]+)$/);
      if (studioListingsMatch) return await json(MOCK_LISTINGS);

      const listingMatch = path.match(/^\/api\/marketplace\/([^/]+)$/);
      if (listingMatch) {
        const id = listingMatch[1]!;
        const listing = MOCK_LISTINGS.find((l) => l.id === id);
        if (!listing) return await json({}, 404);
        if (method === 'PATCH') {
          const body = route.request().postDataJSON() as Record<string, unknown>;
          return await json({ ...listing, ...body, tags: (body.tags as string[]) ?? listing.tags });
        }
        if (method === 'DELETE') return await json({ message: 'Listing archived' });
        return await json(listing);
      }

      // ── Events ──────────────────────────────────────────────────────
      if (path === '/api/events') {
        return await json({ items: [MOCK_EVENT], total: 1, page: 1, pageSize: 20, hasMore: false });
      }
      const eventRegisterMatch = path.match(/^\/api\/events\/([^/]+)\/register$/);
      if (eventRegisterMatch && method === 'POST') return await json({ message: 'Registered' });
      const eventMatch = path.match(/^\/api\/events\/([^/]+)$/);
      if (eventMatch) {
        const slug = eventMatch[1]!;
        if (slug === MOCK_EVENT.slug) return await json(MOCK_EVENT);
        return await json({}, 404);
      }

      // ── Partners ────────────────────────────────────────────────────
      if (path === '/api/partners') {
        const type = params.get('type');
        const items = type ? MOCK_PARTNERS.filter((p) => p.type === type) : MOCK_PARTNERS;
        return await json({ items, total: items.length, page: 1, pageSize: 20, hasMore: false });
      }

      // ── Publisher + Creator ─────────────────────────────────────────
      if (path === '/api/publisher/revenue') return await json(MOCK_REVENUE);
      if (path === '/api/creator/code') return await json(MOCK_REFERRAL_CODE);
      if (path === '/api/creator/commissions') return await json(MOCK_COMMISSIONS);

      // ── Other ───────────────────────────────────────────────────────
      if (path === '/api/me/notifications/unread-count') return await json({ unreadCount: 0 });
      if (path === '/api/me/notifications') return await json({ items: [], total: 0, page: 1, pageSize: 20 });
      if (path === '/api/me/follows') return await json({ studios: [MOCK_STUDIO], games: [MOCK_GAME] });

      // Unhandled — log and continue
      console.log(`Unhandled API: ${method} ${path}`);
      await route.continue();
    } catch (err) {
      console.error(`Mock handler error for ${method} ${path}:`, err);
      await route.continue();
    }
  });
}
