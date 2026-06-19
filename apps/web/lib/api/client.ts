const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

/** Export for direct fetch calls (e.g. file upload). */
export const API = BASE_URL;

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`API ${status}: ${JSON.stringify(body).slice(0, 200)}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

const REFRESH_KEY = 'playmorrow_refresh';
let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem('playmorrow_token');
      return false;
    }
    const data = await res.json();
    localStorage.setItem('playmorrow_token', data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

/** Real HTTP client — makes actual fetch requests to the backend. */
function createRealClient() {
  async function request<T>(
    path: string,
    options: { method?: string; body?: unknown; token?: string } = {},
  ): Promise<T> {
    const { method = 'GET', body, token } = options;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && path !== '/auth/refresh' && token) {
      // Attempt silent refresh once, then retry
      refreshPromise = refreshPromise ?? doRefresh();
      const refreshed = await refreshPromise;
      refreshPromise = null;
      if (refreshed) {
        const newToken = localStorage.getItem('playmorrow_token');
        headers['Authorization'] = `Bearer ${newToken}`;
        const retry = await fetch(`${BASE_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
        if (retry.ok) return retry.json() as Promise<T>;
        const errBody = await retry.json().catch(() => ({ message: retry.statusText }));
        throw new ApiError(retry.status, errBody);
      }
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(res.status, errBody);
    }

    return res.json() as Promise<T>;
  }

  return {
    get: <T>(path: string, token?: string) => request<T>(path, { token }),
    post: <T>(path: string, body?: unknown, token?: string) =>
      request<T>(path, { method: 'POST', body, token }),
    put: <T>(path: string, body?: unknown, token?: string) =>
      request<T>(path, { method: 'PUT', body, token }),
    patch: <T>(path: string, body?: unknown, token?: string) =>
      request<T>(path, { method: 'PATCH', body, token }),
    delete: <T>(path: string, token?: string) => request<T>(path, { method: 'DELETE', token }),
  };
}

/**
 * Dev-mode mock client (#32) — returns deterministic mock data instead of
 * making network requests. Enable via NEXT_PUBLIC_USE_MOCKS=true.
 * See mock-client.ts for implementation.
 */
function createMockClient(): ReturnType<typeof createRealClient> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createMockApi } = require('./mock-client') as { createMockApi: () => ReturnType<typeof createRealClient> };
  return createMockApi();
}

export const api = USE_MOCKS ? createMockClient() : createRealClient();

// ── Response types (matching backend shapes) ────────────────────────────

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface StudioSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface GameSummary {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  studio: StudioSummary;
}

export interface Studio {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  websiteUrl: string | null;
  location: string | null;
  foundedYear: number | null;
  isVerified: boolean;
  membersCount: number;
  gamesCount: number;
  followersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Game {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  status: string;
  releaseDate: string | null;
  expectedReleaseText: string | null;
  priceCents: number | null;
  currency: string | null;
  isFree: boolean;
  coverUrl: string | null;
  bannerUrl: string | null;
  isPublished: boolean;
  followersCount: number;
  studio: StudioSummary;
  media: { id: string; type: string; url: string; caption: string | null; position: number }[];
  platformLinks: { id: string; platform: string; url: string; label: string | null }[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Devlog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  game: { id: string; title: string; slug: string };
  studio: { id: string };
  author: { id: string; username: string; displayName: string; avatarUrl: string | null };
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  targetDate: string | null;
  position: number;
  game: { id: string; title: string; slug: string };
  studio: { id: string; name: string; slug: string };
  createdAt: string;
  updatedAt: string;
}

export interface PressKit {
  id: string;
  headline: string | null;
  factSheet: unknown;
  contactEmail: string | null;
  downloadUrl: string | null;
  isAutoGenerated: boolean;
  game: {
    id: string;
    title: string;
    slug: string;
    tagline: string | null;
    status: string;
    releaseDate: string | null;
    expectedReleaseText: string | null;
    priceCents: number | null;
    currency: string | null;
    isFree: boolean;
    coverUrl: string | null;
    bannerUrl: string | null;
  };
  studio: StudioSummary;
  media: { id: string; type: string; url: string; caption: string | null; position: number }[];
  platformLinks: { id: string; platform: string; url: string; label: string | null }[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FeedItem {
  id: string;
  type: 'DEVLOG' | 'ROADMAP_ITEM';
  createdAt: string;
  publishedAt: string | null;
  title: string;
  summary: string;
  status?: string;
  targetDate?: string | null;
  game: { id: string; title: string; slug: string; coverUrl: string | null };
  studio: { id: string; name: string; slug: string; logoUrl: string | null };
  target: { kind: 'DEVLOG' | 'ROADMAP_ITEM'; id: string };
}

export interface Comment {
  id: string;
  body: string | null;
  parentId: string | null;
  isDeleted?: boolean;
  deletedAt: string | null;
  author: { id: string; username: string; displayName: string; avatarUrl: string | null };
  createdAt: string;
  updatedAt: string;
}

export interface ReactionStatus {
  targetType: 'DEVLOG' | 'COMMENT';
  targetId: string;
  counts: { LIKE: number; LOVE: number; HYPE: number; INSIGHTFUL: number };
  viewerReactions: string[];
}

export interface CommentReactionSummary {
  counts: { LIKE: number; LOVE: number; HYPE: number; INSIGHTFUL: number };
  viewerReactions: string[];
}

// Batch reactions for all comments on a devlog, keyed by comment id (#9 / #24).
export interface DevlogCommentReactions {
  devlogId: string;
  comments: Record<string, CommentReactionSummary>;
}

export interface StudioWithMembers extends Studio {
  members: {
    id: string;
    role: string;
    title: string | null;
    user: { id: string; username: string; displayName: string; avatarUrl: string | null };
  }[];
}

export interface SearchResultGame {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  tagline: string | null;
  studio: { id: string; name: string; slug: string };
}

export interface SearchResultStudio {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  tagline: string | null;
}

export interface SearchResultDevlog {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  publishedAt: string | null;
  game: { id: string; title: string; slug: string };
}

export interface SearchResponse {
  games: { items: SearchResultGame[]; total: number };
  studios: { items: SearchResultStudio[]; total: number };
  devlogs: { items: SearchResultDevlog[]; total: number };
  query: string;
  page: number;
  pageSize: number;
}
