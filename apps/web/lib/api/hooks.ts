import { useQuery } from '@tanstack/react-query';
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

export function useGameDevlogs(gameSlug: string) {
  return useQuery({
    queryKey: ['gameDevlogs', gameSlug],
    queryFn: () => api.get<Paginated<Devlog>>(`/games/${gameSlug}/devlogs`),
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
