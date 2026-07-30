import type { Game, Studio, Devlog, SearchResult, Collection, PaginatedResponse } from './types';

export class PlaymorrowClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(options: { apiKey?: string; baseUrl?: string }) {
    this.baseUrl = options.baseUrl || 'https://playmorrow-api-aged-mountain-9542.fly.dev/api';
    this.apiKey = options.apiKey;
  }

  private async request<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(opts.headers as Record<string, string> || {}),
    };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    const res = await fetch(`${this.baseUrl}${path}`, { ...opts, headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(body.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // ── Games ────────────────────────────────────────────────────────

  async getGames(params?: { page?: number; pageSize?: number; search?: string; genre?: string; status?: string; sort?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.search) query.set('search', params.search);
    if (params?.genre) query.set('genre', params.genre);
    if (params?.status) query.set('status', params.status);
    if (params?.sort) query.set('sortBy', params.sort);
    return this.request<PaginatedResponse<Game>>(`/games?${query}`);
  }

  async getGame(slug: string) {
    return this.request<Game>(`/games/${slug}`);
  }

  // ── Studios ──────────────────────────────────────────────────────

  async getStudios(params?: { page?: number; pageSize?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    return this.request<PaginatedResponse<Studio>>(`/studios?${query}`);
  }

  async getStudio(slug: string) {
    return this.request<Studio>(`/studios/${slug}`);
  }

  // ── Search ───────────────────────────────────────────────────────

  async search(q: string, params?: { genre?: string; status?: string; sort?: string }) {
    const query = new URLSearchParams({ q });
    if (params?.genre) query.set('genre', params.genre);
    if (params?.status) query.set('status', params.status);
    if (params?.sort) query.set('sort', params.sort);
    return this.request<SearchResult>(`/search?${query}`);
  }

  // ── Recommendations ──────────────────────────────────────────────

  async getTrending(limit = 6) {
    return this.request<{ items: { gameId: string; score: number; reasons: string[] }[]; hasMore: boolean }>(
      `/recommendations?type=trending&limit=${limit}`,
    );
  }

  async getSimilarGames(gameId: string, limit = 6) {
    return this.request<{ items: { gameId: string; score: number }[] }>(
      `/recommendations?type=similar-games&gameId=${gameId}&limit=${limit}`,
    );
  }

  // ── Collections ──────────────────────────────────────────────────

  async getCollections() {
    return this.request<Collection[]>('/collections');
  }

  async getCollection(slug: string, params?: { page?: number; pageSize?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    return this.request<PaginatedResponse<Game>>(`/collections/${slug}?${query}`);
  }
}
