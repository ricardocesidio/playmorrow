const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const USE_MOCKS = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

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

// ── Types ───────────────────────────────────────────────────────────────

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface RegisterResponse {
  requiresEmailVerification: boolean;
  email: string;
  user: {
    id: string;
    displayName: string;
    username: string;
    email: string;
    accountType: string;
    emailVerifiedAt: string | null;
  };
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
  level: number;
  xp: number;
  createdAt: string;
  updatedAt: string;
}

export interface Game {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  readme?: string | null;
  demoStatus?: string | null;
  demoUrl?: string | null;
  edition?: string | null;
  engine?: string | null;
  languages?: string | null;
  genres?: string | null;
  modes?: string | null;
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
  wishlistsCount?: number;
  commentsCount?: number;
  viewsCount?: number;
  featured?: boolean;
  studio: StudioSummary;
  media: { id: string; type: string; url: string; thumbnailUrl: string | null; caption: string | null; position: number }[];
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
  createdAt: string;
  updatedAt: string;
  game: { id: string; title: string; slug: string };
  author: { id: string; username: string; displayName: string; avatarUrl: string | null };
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  targetDate: string | null;
  position: number;
  game: { id: string; title: string; slug: string };
  createdAt: string;
  updatedAt: string;
}

export interface PressKit {
  id: string;
  headline: string | null;
  factSheet: unknown;
  contactEmail: string | null;
  downloadUrl: string | null;
  game: { id: string; title: string; slug: string };
  gameId: string;
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

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  isVerified: boolean;
  level: number;
  xp: number;
  followersCount: number;
  followingCount: number;
  wishlistsCount: number;
  studiosFollowedCount: number;
  commentsCount: number;
  createdAt: string;
  studios: { id: string; name: string; slug: string; logoUrl: string | null; tagline: string | null; role: string }[];
  recentActivity: {
    id: string;
    type: string;
    description: string;
    createdAt: string;
    target?: { kind: string; title: string; slug: string };
  }[];
}

export interface Report {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter: { id: string; username: string; displayName: string };
  resolutionNote?: string | null;
  resolvedBy?: { id: string; username: string; displayName: string } | null;
  resolvedAt?: string | null;
}

export interface CreateReportDto {
  targetType: 'GAME' | 'STUDIO' | 'DEVLOG' | 'COMMENT' | 'USER';
  targetId: string;
  reason: string;
  details?: string;
}

// ── HTTP Client ─────────────────────────────────────────────────────────

function createRealClient() {
  async function request<T>(
    path: string,
    options: { method?: string; body?: unknown } = {},
  ): Promise<T> {
    const { method = 'GET', body } = options;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(res.status, errBody);
    }

    return res.json() as Promise<T>;
  }

  return {
    get: <T>(path: string, _token?: string) => request<T>(path),
    post: <T>(path: string, body?: unknown, _token?: string) => request<T>(path, { method: 'POST', body }),
    put: <T>(path: string, body?: unknown, _token?: string) => request<T>(path, { method: 'PUT', body }),
    patch: <T>(path: string, body?: unknown, _token?: string) => request<T>(path, { method: 'PATCH', body }),
    delete: <T>(path: string, bodyOrToken?: unknown) => {
      const body = bodyOrToken != null && typeof bodyOrToken === 'object' ? bodyOrToken : undefined;
      return request<T>(path, { method: 'DELETE', body });
    },
  };
}

function createMockClient(): ReturnType<typeof createRealClient> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createMockApi } = require('./mock-client') as { createMockApi: () => ReturnType<typeof createRealClient> };
  return createMockApi();
}

// Auth endpoints ALWAYS use the real backend — never mock
function createHybridClient(): ReturnType<typeof createRealClient> {
  const real = createRealClient();
  const mock = createMockClient();
  const isAuth = (path: string) => path.startsWith('/auth/');
  return {
    get: <T>(path: string, token?: string) => isAuth(path) ? real.get<T>(path, token) : mock.get<T>(path, token),
    post: <T>(path: string, body?: unknown, token?: string) => isAuth(path) ? real.post<T>(path, body, token) : mock.post<T>(path, body, token),
    put: <T>(path: string, body?: unknown, token?: string) => isAuth(path) ? real.put<T>(path, body, token) : mock.put<T>(path, body, token),
    patch: <T>(path: string, body?: unknown, token?: string) => isAuth(path) ? real.patch<T>(path, body, token) : mock.patch<T>(path, body, token),
    delete: <T>(path: string, bodyOrToken?: unknown) => isAuth(path) ? real.delete<T>(path, bodyOrToken) : mock.delete<T>(path, bodyOrToken),
  };
}

export const api = USE_MOCKS ? createHybridClient() : createRealClient();
