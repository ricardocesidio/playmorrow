import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, type Paginated, type FeedItem, type Game, type Studio, type Devlog, type RoadmapItem, type PressKit, type Comment, type ReactionStatus, type DevlogCommentReactions, type StudioWithMembers, type UserProfile, type Report, type CreateReportDto } from './client';

// ── Infinite scroll helpers ─────────────────────────────────────────────

export function useIntersectionObserver(onIntersect: () => void, enabled: boolean) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onIntersect();
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, onIntersect]);

  return sentinelRef;
}

// ── Users ───────────────────────────────────────────────────────────────

export function useUserProfile(username: string) {
  return useQuery({
    queryKey: ['userProfile', username],
    queryFn: () => api.get<UserProfile>(`/users/${username}`),
    enabled: !!username,
  });
}

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

export function useInfinitePersonalFeed(type: string, pageSize: number, token?: string) {
  return useInfiniteQuery({
    queryKey: ['infinitePersonalFeed', type, pageSize],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ page: String(pageParam), pageSize: String(pageSize) });
      if (type !== 'all') params.set('type', type);
      return api.get<Paginated<FeedItem>>(`/me/feed?${params}`, token);
    },
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    initialPageParam: 1,
    enabled: !!token,
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

export function useInfiniteGames(pageSize = 20, search?: string) {
  return useInfiniteQuery({
    queryKey: ['infiniteGames', pageSize, search],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ page: String(pageParam), pageSize: String(pageSize) });
      if (search) params.set('search', search);
      return api.get<Paginated<Game>>(`/games?${params}`);
    },
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    initialPageParam: 1,
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
  });
}

export function useStudios(page = 1, pageSize = 20, search?: string) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) params.set('search', search);
  return useQuery({
    queryKey: ['studios', page, pageSize, search],
    queryFn: () => api.get<Paginated<Studio>>(`/studios?${params}`),
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

// Single batched query for every comment's reactions on a devlog (#9 / #24).
// Replaces the previous per-comment `useCommentReactions` N+1 fan-out.
export function useDevlogCommentReactions(devlogId: string, token?: string) {
  return useQuery({
    queryKey: ['devlogCommentReactions', devlogId],
    queryFn: () => api.get<DevlogCommentReactions>(`/devlogs/${devlogId}/comments/reactions`, token),
    enabled: !!devlogId,
  });
}

export function useReactToComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { commentId: string; devlogId: string; type: string; token: string }) =>
      api.post<ReactionStatus>(`/comments/${data.commentId}/reactions`, { type: data.type }, data.token),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['devlogCommentReactions', vars.devlogId] });
    },
  });
}

export function useRemoveCommentReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { commentId: string; devlogId: string; type: string; token: string }) =>
      api.delete<ReactionStatus>(`/comments/${data.commentId}/reactions?type=${data.type}`, data.token),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['devlogCommentReactions', vars.devlogId] });
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

export function useDeleteRoadmapItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; token: string }) =>
      api.delete(`/roadmap-items/${data.id}`, data.token),
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
  targetUrl: string | null;
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
  });
}

export function useUnreadNotificationCount() {
  const qc = useQueryClient();
  const queryKey = ['unreadNotificationCount'];

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const eventSource = new EventSource(`${apiUrl}/me/notifications/stream`, { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (typeof data.unreadCount === 'number') {
          qc.setQueryData(queryKey, { unreadCount: data.unreadCount });
        }
      } catch { /* ignore */ }
    };

    eventSource.onerror = () => { eventSource.close(); };

    return () => eventSource.close();
  }, [qc]);

  return useQuery({
    queryKey,
    queryFn: () => api.get<{ unreadCount: number }>('/me/notifications/unread-count'),
    refetchInterval: 60_000,
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

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; token: string }) =>
      api.delete(`/notifications/${data.id}`, data.token),
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
      toast.success(`Following studio`);
    },
    onError: () => toast.error('Failed to follow studio'),
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
      toast.success('Unfollowed studio');
    },
    onError: () => toast.error('Failed to unfollow studio'),
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
      toast.success('Following game');
    },
    onError: () => toast.error('Failed to follow game'),
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
      toast.success('Unfollowed game');
    },
    onError: () => toast.error('Failed to unfollow game'),
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
  });
}

// ── My Studios ──────────────────────────────────────────────────────────

export function useMyStudios(token?: string) {
  return useQuery({
    queryKey: ['myStudios'],
    queryFn: () => api.get<Studio[]>('/studios/me', token),
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
    mutationFn: (data: { slug: string; body: Record<string, unknown> }) => {
      return api.patch<Studio>(`/studios/${data.slug}`, data.body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myStudios'] });
      qc.invalidateQueries({ queryKey: ['studio'] });
      qc.invalidateQueries({ queryKey: ['studios'] });
    },
  });
}

export function useDeleteStudio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string }) =>
      api.delete(`/studios/${data.slug}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myStudios'] });
      qc.invalidateQueries({ queryKey: ['studios'] });
      qc.invalidateQueries({ queryKey: ['myGames'] });
      qc.invalidateQueries({ queryKey: ['myDevlogs'] });
      toast.success('Studio deleted');
    },
    onError: () => toast.error('Failed to delete studio'),
  });
}

// ── My Devlogs ──────────────────────────────────────────────────────────

export function useMyDevlogs(token?: string) {
  return useQuery({
    queryKey: ['myDevlogs', token],
    queryFn: () => api.get<Devlog[]>('/me/devlogs', token),
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

export function useDeleteDevlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; token: string }) =>
      api.delete(`/devlogs/${data.id}`, data.token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myDevlogs'] });
      qc.invalidateQueries({ queryKey: ['gameDevlogs'] });
      qc.invalidateQueries({ queryKey: ['devlogs'] });
      toast.success('Devlog deleted');
    },
    onError: () => toast.error('Failed to delete devlog'),
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
      readme?: string;
      demoStatus?: string;
      demoUrl?: string;
      edition?: string;
      engine?: string;
      languages?: string;
      genres?: string;
      modes?: string;
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

export function useDeleteGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string; token: string }) =>
      api.delete(`/games/${data.slug}`, data.token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myGames'] });
      qc.invalidateQueries({ queryKey: ['games'] });
      qc.invalidateQueries({ queryKey: ['myDevlogs'] });
      toast.success('Game deleted');
    },
    onError: () => toast.error('Failed to delete game'),
  });
}

// ── Reports (admin) ──────────────────────────────────────────────────────

export function useCreateReport() {
  return useMutation({
    mutationFn: (data: CreateReportDto & { token?: string }) => {
      const { token: _t, ...body } = data;
      return api.post<Report>('/reports', body);
    },
  });
}

export function useAdminReports(page = 1, pageSize = 20, status?: string) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (status && status !== 'all') params.set('status', status);
  return useQuery({
    queryKey: ['adminReports', page, pageSize, status],
    queryFn: () => api.get<Paginated<Report>>(`/admin/reports?${params}`),
  });
}

export function useAdminReport(id: string) {
  return useQuery({
    queryKey: ['adminReport', id],
    queryFn: () => api.get<Report>(`/admin/reports/${id}`),
    enabled: !!id,
  });
}

export function useUpdateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; body: Record<string, unknown> }) =>
      api.patch<Report>(`/admin/reports/${data.id}`, data.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminReports'] });
      qc.invalidateQueries({ queryKey: ['adminReport'] });
    },
  });
}

// ── Wishlist ────────────────────────────────────────────────────────────

export interface WishlistStatus {
  gameId: string;
  gameSlug: string;
  isWishlisted: boolean;
}

export interface WishlistItem {
  id: string;
  createdAt: string;
  game: {
    id: string;
    title: string;
    slug: string;
    tagline: string | null;
    coverUrl: string | null;
    status: string;
    studio: { id: string; name: string; slug: string };
  };
}

export interface WishlistResponse {
  items: WishlistItem[];
}

export function useGameWishlistStatus(slug: string) {
  return useQuery({
    queryKey: ['gameWishlistStatus', slug],
    queryFn: () => api.get<WishlistStatus>(`/games/${slug}/wishlist-status`),
    enabled: !!slug,
  });
}

export function useAddGameToWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string }) => api.post<WishlistStatus>(`/games/${data.slug}/wishlist`),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['gameWishlistStatus', vars.slug] });
      qc.invalidateQueries({ queryKey: ['myWishlist'] });
    },
  });
}

export function useRemoveGameFromWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string }) => api.delete<WishlistStatus>(`/games/${data.slug}/wishlist`),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['gameWishlistStatus', vars.slug] });
      qc.invalidateQueries({ queryKey: ['myWishlist'] });
    },
  });
}

export function useMyWishlist() {
  return useQuery({
    queryKey: ['myWishlist'],
    queryFn: () => api.get<WishlistResponse>('/me/wishlist'),
  });
}

// ── Game Comments ──────────────────────────────────────────────────────────

export function useGameComments(slug: string) {
  return useQuery({
    queryKey: ['gameComments', slug],
    queryFn: () => api.get<{ items: Comment[]; total: number }>(`/games/${slug}/comments`),
  });
}

export function useCreateGameComment(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.post(`/games/${slug}/comments`, { body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gameComments', slug] }),
  });
}

export function useReactToGameComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, type }: { commentId: string; type: string }) =>
      api.post(`/game-comments/${commentId}/reactions`, { type }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gameComments'] }),
  });
}

export function useRemoveGameCommentReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, type }: { commentId: string; type: string }) =>
      api.delete(`/game-comments/${commentId}/reactions`, { type }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gameComments'] }),
  });
}

// ── Team Management ──

export interface Invitation {
  id: string;
  studioId: string;
  studio: { id: string; name: string; slug: string };
  inviterId: string;
  inviter: { id: string; username: string; displayName: string; avatarUrl: string | null };
  email: string | null;
  userId: string | null;
  user: { id: string; username: string; displayName: string; avatarUrl: string | null } | null;
  role: string;
  status: string;
  message: string | null;
  expiresAt: string;
  createdAt: string;
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string; userId: string; role?: string; title?: string }) =>
      api.patch(`/studios/${data.slug}/members/${data.userId}`, { role: data.role, title: data.title }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['studio'] }); },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string; userId: string }) =>
      api.delete(`/studios/${data.slug}/members/${data.userId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['studio'] }); },
  });
}

export function useLeaveStudio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => api.post(`/studios/${slug}/members/leave`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['myStudios'] }); },
  });
}

export function useTransferOwnership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string; targetUserId: string }) =>
      api.post(`/studios/${data.slug}/transfer`, { targetUserId: data.targetUserId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['studio'] }); },
  });
}

export function useCreateInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string; email?: string; userId?: string; role: string; message?: string }) =>
      api.post(`/studios/${data.slug}/invitations`, { email: data.email, userId: data.userId, role: data.role, message: data.message }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['studioInvitations'] }); },
  });
}

export function useCancelInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string; invitationId: string }) =>
      api.delete(`/studios/${data.slug}/invitations/${data.invitationId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['studioInvitations'] }); },
  });
}

export function useStudioInvitations(slug: string) {
  return useQuery({
    queryKey: ['studioInvitations', slug],
    queryFn: () => api.get<Invitation[]>(`/studios/${slug}/invitations?status=PENDING`),
    enabled: !!slug,
  });
}

export function useMyInvitations() {
  return useQuery({
    queryKey: ['myInvitations'],
    queryFn: () => api.get<Invitation[]>('/me/invitations'),
  });
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actor: { id: string; displayName: string; username: string; avatarUrl: string | null } | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export function useStudioAuditLogs(slug: string) {
  return useQuery({
    queryKey: ['auditLogs', slug],
    queryFn: () => api.get<{ items: AuditLogEntry[]; total: number }>(`/studios/${slug}/audit-logs`),
    enabled: !!slug,
  });
}

export function useRequestJoin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => api.post(`/studios/${slug}/request-join`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['studio'] }); },
  });
}

export function useApproveJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string; userId: string }) =>
      api.post(`/studios/${data.slug}/join-requests/${data.userId}/approve`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['studioInvitations'] }); },
  });
}

export function useRejectJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string; userId: string }) =>
      api.post(`/studios/${data.slug}/join-requests/${data.userId}/reject`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['studioInvitations'] }); },
  });
}
