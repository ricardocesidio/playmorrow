import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Paginated, type FeedItem, type Game, type Studio, type Devlog, type RoadmapItem, type PressKit, type Comment, type ReactionStatus, type StudioWithMembers } from './client';

// ── Feed ────────────────────────────────────────────────────────────────

export function usePublicFeed(page = 1, pageSize = 10) {
  return useQuery({
    queryKey: ['publicFeed', page, pageSize],
    queryFn: () => api.get<Paginated<FeedItem>>(`/feed/public?page=${page}&pageSize=${pageSize}`),
  });
}

export function usePersonalFeed(type: string, page: number, pageSize: number, token?: string) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (type !== 'all') params.set('type', type);
  return useQuery({
    queryKey: ['personalFeed', type, page, pageSize],
    queryFn: () => api.get<Paginated<FeedItem>>(`/me/feed?${params}`, token),
    enabled: !!token,
    placeholderData: (prev) => prev,
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

export function useDevlogComments(devlogId: string, token?: string) {
  return useQuery({
    queryKey: ['devlogComments', devlogId],
    queryFn: () => api.get<Comment[]>(`/devlogs/${devlogId}/comments`, token),
    enabled: !!devlogId,
  });
}

// ── Reactions ───────────────────────────────────────────────────────────

export function useDevlogReactions(devlogId: string, token?: string) {
  return useQuery({
    queryKey: ['devlogReactions', devlogId],
    queryFn: () => api.get<ReactionStatus>(`/devlogs/${devlogId}/reactions`, token),
    enabled: !!devlogId,
  });
}

export function useReactToDevlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { devlogId: string; type: string; token: string }) =>
      api.post<ReactionStatus>(`/devlogs/${data.devlogId}/reactions`, { type: data.type }, data.token),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['devlogReactions', vars.devlogId] });
    },
  });
}

export function useRemoveDevlogReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { devlogId: string; type: string; token: string }) =>
      api.delete<ReactionStatus>(`/devlogs/${data.devlogId}/reactions?type=${data.type}`, data.token),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['devlogReactions', vars.devlogId] });
    },
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { devlogId: string; body: string; parentId?: string; token: string }) => {
      const { devlogId, token, ...body } = data;
      return api.post<Comment>(`/devlogs/${devlogId}/comments`, body, token);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['devlogComments', vars.devlogId] });
    },
  });
}

export function useUpdateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { commentId: string; body: string; token: string }) =>
      api.patch<Comment>(`/comments/${data.commentId}`, { body: data.body }, data.token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devlogComments'] });
    },
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { commentId: string; token: string }) =>
      api.delete(`/comments/${data.commentId}`, data.token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devlogComments'] });
    },
  });
}

export function useCommentReactions(commentId: string, token?: string) {
  return useQuery({
    queryKey: ['commentReactions', commentId],
    queryFn: () => api.get<ReactionStatus>(`/comments/${commentId}/reactions`, token),
    enabled: !!commentId,
  });
}

export function useReactToComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { commentId: string; type: string; token: string }) =>
      api.post<ReactionStatus>(`/comments/${data.commentId}/reactions`, { type: data.type }, data.token),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['commentReactions', vars.commentId] });
    },
  });
}

export function useRemoveCommentReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { commentId: string; type: string; token: string }) =>
      api.delete<ReactionStatus>(`/comments/${data.commentId}/reactions?type=${data.type}`, data.token),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['commentReactions', vars.commentId] });
    },
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

export function useCreateRoadmapItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      gameSlug: string;
      title: string;
      description?: string;
      status?: string;
      targetDate?: string;
      position?: number;
      token: string;
    }) => {
      const { gameSlug, token, ...body } = data;
      return api.post<RoadmapItem>(`/games/${gameSlug}/roadmap`, body, token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gameRoadmap'] });
    },
  });
}

export function useUpdateRoadmapItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; body: Record<string, unknown>; token: string }) => {
      return api.patch<RoadmapItem>(`/roadmap-items/${data.id}`, data.body, data.token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gameRoadmap'] });
    },
  });
}

export function useReorderRoadmapItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { gameSlug: string; items: { id: string; position: number }[]; token: string }) => {
      return api.patch<{ reordered: number }>(
        `/games/${data.gameSlug}/roadmap/reorder`,
        { items: data.items },
        data.token,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gameRoadmap'] });
    },
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

export function useUpsertPressKit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      gameSlug: string;
      headline: string;
      factSheet?: Record<string, unknown>;
      contactEmail?: string;
      downloadUrl?: string;
      token: string;
    }) => {
      const { gameSlug, token, ...body } = data;
      return api.put<PressKit>(`/games/${gameSlug}/press-kit`, body, token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gamePressKit'] });
    },
  });
}

// ── Notifications ───────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  targetType: string | null;
  targetId: string | null;
  readAt: string | null;
  createdAt: string;
  actor: { id: string; username: string; displayName: string; avatarUrl: string | null } | null;
}

export interface PaginatedNotifications {
  items: NotificationItem[];
  total: number;
  page: number;
  pageSize: number;
}

export function useNotifications(status: string, page: number, pageSize: number, token?: string) {
  return useQuery({
    queryKey: ['notifications', status, page, pageSize],
    queryFn: () =>
      api.get<PaginatedNotifications>(
        `/me/notifications?status=${status}&page=${page}&pageSize=${pageSize}`,
        token,
      ),
    enabled: !!token,
  });
}

export function useUnreadNotificationCount(token?: string) {
  return useQuery({
    queryKey: ['unreadNotificationCount'],
    queryFn: () => api.get<{ unreadCount: number }>('/me/notifications/unread-count', token),
    enabled: !!token,
    refetchInterval: 60_000, // poll every 60s
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; token: string }) =>
      api.patch(`/notifications/${data.id}/read`, undefined, data.token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) =>
      api.patch('/me/notifications/read-all', undefined, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unreadNotificationCount'] });
    },
  });
}

// ── Follows ─────────────────────────────────────────────────────────────

export interface FollowStatus {
  targetType: string;
  targetId: string;
  isFollowing: boolean;
  followerCount: number;
}

export function useStudioFollowStatus(slug: string, token?: string) {
  return useQuery({
    queryKey: ['studioFollow', slug],
    queryFn: () => api.get<FollowStatus>(`/studios/${slug}/follow-status`, token),
    enabled: !!slug,
  });
}

export function useGameFollowStatus(slug: string, token?: string) {
  return useQuery({
    queryKey: ['gameFollow', slug],
    queryFn: () => api.get<FollowStatus>(`/games/${slug}/follow-status`, token),
    enabled: !!slug,
  });
}

export function useFollowStudio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string; token: string }) =>
      api.post<FollowStatus>(`/studios/${data.slug}/follow`, undefined, data.token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['studioFollow'] });
      qc.invalidateQueries({ queryKey: ['myFollows'] });
    },
  });
}

export function useUnfollowStudio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string; token: string }) =>
      api.delete<FollowStatus>(`/studios/${data.slug}/follow`, data.token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['studioFollow'] });
      qc.invalidateQueries({ queryKey: ['myFollows'] });
    },
  });
}

export function useFollowGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string; token: string }) =>
      api.post<FollowStatus>(`/games/${data.slug}/follow`, undefined, data.token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gameFollow'] });
      qc.invalidateQueries({ queryKey: ['myFollows'] });
    },
  });
}

export function useUnfollowGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string; token: string }) =>
      api.delete<FollowStatus>(`/games/${data.slug}/follow`, data.token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gameFollow'] });
      qc.invalidateQueries({ queryKey: ['myFollows'] });
    },
  });
}

export function useMyFollows(token?: string) {
  return useQuery({
    queryKey: ['myFollows'],
    queryFn: () =>
      api.get<{ studios: { id: string; name: string; slug: string; logoUrl: string | null }[]; games: { id: string; title: string; slug: string; coverUrl: string | null; studio: { id: string; name: string; slug: string } }[] }>(
        '/me/follows',
        token,
      ),
    enabled: !!token,
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
