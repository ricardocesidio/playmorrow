import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Paginated, type FeedItem, type Game, type Studio, type Devlog, type RoadmapItem, type PressKit, type Comment, type StudioWithMembers } from './client';

// ── Feed ────────────────────────────────────────────────────────────────

export function usePublicFeed(page = 1, pageSize = 10) {
  return useQuery({
    queryKey: ['publicFeed', page, pageSize],
    queryFn: () => api.get<Paginated<FeedItem>>(`/feed/public?page=${page}&pageSize=${pageSize}`),
  });
}

// ── Games ───────────────────────────────────────────────────────────────

export function useGames(page = 1, pageSize = 20, search?: string) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) params.set('search', search);
  return useQuery({
    queryKey: ['games', page, pageSize, search],
    queryFn: () => api.get<Paginated<Game>>(`/games?${params}`),
  });
}

export function useGame(slug: string) {
  return useQuery({
    queryKey: ['game', slug],
    queryFn: () => api.get<Game>(`/games/${slug}`),
    enabled: !!slug,
  });
}

// ── Studios ─────────────────────────────────────────────────────────────

export function useStudio(slug: string) {
  return useQuery({
    queryKey: ['studio', slug],
    queryFn: () => api.get<Studio>(`/studios/${slug}`),
    enabled: !!slug,
  });
}

export function useStudioMembers(slug: string) {
  return useQuery({
    queryKey: ['studioMembers', slug],
    queryFn: () => api.get<StudioWithMembers>(`/studios/${slug}/members`),
    enabled: !!slug,
  });
}

// ── Studio Games ────────────────────────────────────────────────────────

export function useStudioGames(studioSlug: string) {
  return useQuery({
    queryKey: ['studioGames', studioSlug],
    queryFn: () => api.get<Paginated<Game>>(`/studios/${studioSlug}/games`),
    enabled: !!studioSlug,
  });
}

// ── Devlogs ─────────────────────────────────────────────────────────────

export function useGameDevlogs(gameSlug: string, token?: string, includeDrafts?: boolean) {
  const params = new URLSearchParams();
  if (includeDrafts) params.set('includeDrafts', 'true');
  const qs = params.toString() ? `?${params}` : '';
  return useQuery({
    queryKey: ['gameDevlogs', gameSlug, includeDrafts],
    queryFn: () => api.get<Paginated<Devlog>>(`/games/${gameSlug}/devlogs${qs}`, token),
    enabled: !!gameSlug,
  });
}

export function useDevlog(id: string) {
  return useQuery({
    queryKey: ['devlog', id],
    queryFn: () => api.get<Devlog>(`/devlogs/${id}`),
    enabled: !!id,
  });
}

export function useDevlogComments(devlogId: string) {
  return useQuery({
    queryKey: ['devlogComments', devlogId],
    queryFn: () => api.get<Comment[]>(`/devlogs/${devlogId}/comments`),
    enabled: !!devlogId,
  });
}

// ── Roadmap ─────────────────────────────────────────────────────────────

export function useGameRoadmap(gameSlug: string) {
  return useQuery({
    queryKey: ['gameRoadmap', gameSlug],
    queryFn: () => api.get<RoadmapItem[]>(`/games/${gameSlug}/roadmap`),
    enabled: !!gameSlug,
  });
}

// ── Press Kit ───────────────────────────────────────────────────────────

export function useGamePressKit(gameSlug: string) {
  return useQuery({
    queryKey: ['gamePressKit', gameSlug],
    queryFn: () => api.get<PressKit>(`/games/${gameSlug}/press-kit`),
    enabled: !!gameSlug,
  });
}

// ── My Studios ──────────────────────────────────────────────────────────

export function useMyStudios(token?: string) {
  return useQuery({
    queryKey: ['myStudios'],
    queryFn: () => api.get<Studio[]>('/studios/me', token),
    enabled: !!token,
  });
}

export function useCreateStudio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; slug: string; tagline?: string; description?: string; location?: string; websiteUrl?: string; logoUrl?: string; bannerUrl?: string; token: string }) => {
      const { token, ...body } = data;
      return api.post<Studio>('/studios', body, token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myStudios'] });
      qc.invalidateQueries({ queryKey: ['studios'] });
    },
  });
}

export function useUpdateStudio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string; body: Record<string, unknown>; token: string }) => {
      return api.patch<Studio>(`/studios/${data.slug}`, data.body, data.token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myStudios'] });
      qc.invalidateQueries({ queryKey: ['studio'] });
      qc.invalidateQueries({ queryKey: ['studios'] });
    },
  });
}

// ── My Devlogs ──────────────────────────────────────────────────────────

export function useMyDevlogs(token?: string) {
  return useQuery({
    queryKey: ['myDevlogs', token],
    queryFn: async () => {
      const studios = await api.get<Studio[]>('/studios/me', token);
      const results = await Promise.all(
        studios.map((s) => api.get<Paginated<Game>>(`/studios/${s.slug}/games`, token)),
      );
      const games = results.flatMap((r) => r.items);
      const devlogResults = await Promise.all(
        games.map((g) =>
          api.get<Paginated<Devlog>>(`/games/${g.slug}/devlogs?includeDrafts=true`, token),
        ),
      );
      return devlogResults.flatMap((r) => r.items);
    },
    enabled: !!token,
  });
}

export function useCreateDevlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      gameSlug: string;
      title: string;
      slug: string;
      body: string;
      coverUrl?: string;
      isPublished?: boolean;
      publishedAt?: string;
      token: string;
    }) => {
      const { gameSlug, token, ...body } = data;
      return api.post<Devlog>(`/games/${gameSlug}/devlogs`, body, token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myDevlogs'] });
      qc.invalidateQueries({ queryKey: ['gameDevlogs'] });
      qc.invalidateQueries({ queryKey: ['devlogs'] });
    },
  });
}

export function useUpdateDevlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; body: Record<string, unknown>; token: string }) => {
      return api.patch<Devlog>(`/devlogs/${data.id}`, data.body, data.token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myDevlogs'] });
      qc.invalidateQueries({ queryKey: ['gameDevlogs'] });
      qc.invalidateQueries({ queryKey: ['devlog'] });
    },
  });
}

// ── My Games ────────────────────────────────────────────────────────────

export function useMyGames(token?: string) {
  return useQuery({
    queryKey: ['myGames', token],
    queryFn: async () => {
      const studios = await api.get<Studio[]>('/studios/me', token);
      const results = await Promise.all(
        studios.map((s) => api.get<Paginated<Game>>(`/studios/${s.slug}/games`, token)),
      );
      return results.flatMap((r, i) =>
        r.items.map((g) => ({ ...g, studio: studios[i] })),
      );
    },
    enabled: !!token,
  });
}

export function useCreateGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      studioSlug: string;
      title: string;
      slug: string;
      tagline?: string;
      description?: string;
      status?: string;
      releaseDate?: string;
      expectedReleaseText?: string;
      priceCents?: number;
      currency?: string;
      isFree?: boolean;
      coverUrl?: string;
      bannerUrl?: string;
      platformLinks?: { platform: string; url: string; label?: string }[];
      media?: { type: string; url: string; caption?: string; sortOrder?: number }[];
      tags?: string[];
      token: string;
    }) => {
      const { studioSlug, token, ...body } = data;
      return api.post<Game>(`/studios/${studioSlug}/games`, body, token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myGames'] });
      qc.invalidateQueries({ queryKey: ['games'] });
      qc.invalidateQueries({ queryKey: ['studioGames'] });
    },
  });
}

export function useUpdateGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string; body: Record<string, unknown>; token: string }) => {
      return api.patch<Game>(`/games/${data.slug}`, data.body, data.token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myGames'] });
      qc.invalidateQueries({ queryKey: ['games'] });
      qc.invalidateQueries({ queryKey: ['game'] });
    },
  });
}
