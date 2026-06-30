/**
 * Dev-mode mock API client (#32).
 * When NEXT_PUBLIC_USE_MOCKS=true this client replaces the real fetch-based
 * API, returning deterministic data so the frontend can run without a backend.
 *
 * Mock implementations mirror the shapes returned by the real NestJS API.
 */
import {
  MOCK_USER,
  MOCK_STUDIO,
  MOCK_GAME,
  MOCK_GAMES,
  MOCK_DEVLOG,
  MOCK_ROADMAP_ITEM,
  MOCK_FEED_ITEM_DEVLOG,
  MOCK_FEED_ITEM_ROADMAP,
  MOCK_COMMENT,
  MOCK_NOTIFICATION,
  paginated,
  followStatus,
} from './mock-data';
import type { ReactionStatus } from './client';

/** Small helpers to simulate async delay (remove in production). */
const delay = (ms = 80) => new Promise((r) => setTimeout(r, ms));
let mockSessionUser: typeof MOCK_USER | null = null;

export function createMockApi() {
  const handler = {
    get: <T>(path: string, _token?: string): Promise<T> => handleRequest('GET', path) as Promise<T>,
    post: <T>(path: string, _body?: unknown, _token?: string): Promise<T> => handleRequest('POST', path, _body) as Promise<T>,
    put: <T>(path: string, _body?: unknown, _token?: string): Promise<T> => handleRequest('PUT', path, _body) as Promise<T>,
    patch: <T>(path: string, _body?: unknown, _token?: string): Promise<T> => handleRequest('PATCH', path, _body) as Promise<T>,
    delete: <T>(path: string, _token?: string): Promise<T> => handleRequest('DELETE', path) as Promise<T>,
  };

  return handler;
}

function parsePath(path: string) {
  const segments = path.split('?')[0]!.split('/').filter(Boolean);
  const searchParams = new URLSearchParams(path.split('?')[1] ?? '');
  return { segments, searchParams };
}

async function handleRequest(method: string, path: string, _body?: unknown): Promise<unknown> {
  await delay();

  const { segments, searchParams } = parsePath(path);

  // Auth
  if (path === '/auth/me') return MOCK_USER;
  if (path === '/auth/session/login') {
    const body = _body as Record<string, unknown> | undefined;
    if (!body?.password || !body?.emailOrUsername) {
      throw Object.assign(new Error('All fields required'), { status: 400 });
    }
    mockSessionUser = MOCK_USER;
    return { id: 'user-1', username: 'testuser', displayName: 'Test User', role: 'PLAYER', accountType: 'PLAYER' };
  }
  if (path === '/auth/register') {
    const body = _body as Record<string, unknown> | undefined;
    const at = body?.accountType as string | undefined;
    return {
      requiresEmailVerification: true,
      email: body?.email as string ?? 'test@example.com',
      user: { id: 'user-1', displayName: 'Test User', username: 'testuser', email: body?.email as string ?? 'test@example.com', accountType: at ?? 'PLAYER', emailVerifiedAt: null },
    };
  }
  if (path === '/auth/session/login') {
    mockSessionUser = MOCK_USER;
    return { id: 'user-1', username: 'testuser', displayName: 'Test User', role: 'PLAYER', accountType: 'PLAYER' };
  }
  if (path === '/auth/session/logout') {
    mockSessionUser = null;
    return { ok: true };
  }
  if (path === '/auth/session/me') {
    if (!mockSessionUser) throw Object.assign(new Error('Not authenticated'), { status: 401 });
    return mockSessionUser;
  }
  if (path === '/auth/verify-email') {
    const body = _body as Record<string, unknown> | undefined;
    const code = body?.code as string | undefined;
    if (code === '000000') throw Object.assign(new Error('Invalid verification code'), { status: 400 });
    mockSessionUser = MOCK_USER;
    return { user: MOCK_USER, accessToken: 'mock-token' };
  }
  if (path === '/auth/resend-verification') {
    return { message: 'If this email needs verification, a new code has been sent.' };
  }

  // Feed
  if (segments[0] === 'feed' && segments[1] === 'public') {
    const pageSize = parseInt(searchParams.get('pageSize') ?? '10');
    return paginated([MOCK_FEED_ITEM_DEVLOG, MOCK_FEED_ITEM_ROADMAP], 2, 1, pageSize);
  }
  if (segments[0] === 'me' && segments[1] === 'feed') {
    const page = parseInt(searchParams.get('page') ?? '1');
    const ps = parseInt(searchParams.get('pageSize') ?? '10');
    return paginated([MOCK_FEED_ITEM_DEVLOG, MOCK_FEED_ITEM_ROADMAP], 2, page, ps);
  }

  // Games
  if (segments[0] === 'games' && segments.length === 2 && segments[1] !== 'me') {
    const slug = segments[1]!;
    if (slug === 'test-game') return MOCK_GAME;
  }
  if (path === '/games' || (segments[0] === 'games' && segments.length === 1)) {
    const search = searchParams.get('search')?.toLowerCase();
    const games = search
      ? MOCK_GAMES.filter((game) => game.title.toLowerCase().includes(search))
      : MOCK_GAMES;
    return paginated(games);
  }

  // Studios
  if (segments[0] === 'studios' && segments.length === 2 && segments[1] === 'me') {
    return [MOCK_STUDIO];
  }
  if (segments[0] === 'studios' && segments.length === 2) {
    return MOCK_STUDIO;
  }

  // Studio sub-routes
  if (path.includes('/invitations')) return [];
  if (path.includes('/join-requests')) return [];
  if (path.includes('/audit-logs')) return { items: [], total: 0 };
  if (path.includes('/members')) return {
    members: [{
      id: 'member-1',
      userId: MOCK_USER.id,
      role: 'OWNER',
      title: null,
      joinedAt: '2025-01-01T00:00:00.000Z',
      user: { id: MOCK_USER.id, username: MOCK_USER.username, displayName: MOCK_USER.displayName, avatarUrl: null },
    }],
  };
  if (path.includes('/games')) return paginated([MOCK_GAME]);
  if (path.includes('/follow-status')) return followStatus('STUDIO', 'studio-1', false, 5);
  if (path.includes('/activities')) return { items: [] };
  if (path.includes('/chat')) return method === 'POST' ? { id: 'chat-1', message: (_body as Record<string, unknown>)?.message as string ?? '', author: MOCK_USER, createdAt: new Date().toISOString() } : [];
  if (path.includes('/request-join')) return { status: 'REQUESTED' };
  if (path.includes('/follow')) {
    if (method === 'POST') return followStatus('STUDIO', 'studio-1', true, 6);
    return followStatus('STUDIO', 'studio-1', false, 5);
  }

  // Game sub-routes
  if (path.includes('/devlogs')) return paginated([MOCK_DEVLOG]);
  if (path.includes('/roadmap')) return [MOCK_ROADMAP_ITEM];
  if (path.includes('/press-kit')) throw Object.assign(new Error('Not found'), { status: 404 });

  // Devlogs
  if (segments[0] === 'devlogs' && segments.length === 2) {
    return MOCK_DEVLOG;
  }
  if (path.includes('/comments') && segments[0] === 'games') {
    return { items: [{ ...MOCK_COMMENT, reactions: [], viewerReactions: [] }], total: 1, page: 1, pageSize: 20 };
  }
  if (path.includes('/comments')) return [MOCK_COMMENT];
  if (path.includes('/reactions')) {
    return { targetType: 'DEVLOG', targetId: 'devlog-1', counts: { LIKE: 0, LOVE: 0, HYPE: 0, INSIGHTFUL: 0 }, viewerReactions: [] } as ReactionStatus;
  }

  // Roadmap items
  if (segments[0] === 'roadmap-items') return MOCK_ROADMAP_ITEM;

  // Notifications
  if (segments[0] === 'me' && segments[1] === 'notifications' && segments[2] === 'unread-count') return { unreadCount: 3 };
  if (segments[0] === 'me' && segments[1] === 'notifications') return paginated([MOCK_NOTIFICATION]);
  if (path.includes('/notifications') && method === 'PATCH') return { ...MOCK_NOTIFICATION, readAt: new Date().toISOString() };
  if (path.includes('/read-all')) return { success: true };

  // Users
  if (segments[0] === 'users' && segments.length === 2) {
    return {
      id: 'user-1',
      username: segments[1],
      displayName: segments[1] === 'testuser' ? 'Test User' : segments[1],
      avatarUrl: null,
      bio: 'A test user profile.',
      role: 'PLAYER',
      isVerified: false,
      createdAt: '2025-01-01T00:00:00.000Z',
      studios: [MOCK_STUDIO],
    };
  }

  // Follows
  if (path === '/me/follows') return { studios: [MOCK_STUDIO], games: [MOCK_GAME] };
  if (path === '/me/invitations') return [];

  // Wishlist
  if (path === '/me/wishlist') return { items: [] };
  if (path.includes('/wishlist-status') || path.includes('/wishlist')) {
    if (method === 'POST') return { gameId: 'game-1', gameSlug: segments[1], isWishlisted: true };
    if (method === 'DELETE') return { gameId: 'game-1', gameSlug: segments[1], isWishlisted: false };
    if (path.includes('/wishlist-status')) return { gameId: 'game-1', gameSlug: segments[1], isWishlisted: false };
  }

  // Fallback
  return {};
}
