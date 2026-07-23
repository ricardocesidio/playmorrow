'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bell, Check, CheckCheck, EyeOff, X } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '@/lib/api/hooks';
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
] as const;

export default function NotificationsPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useNotifications(status, page, 20, token ?? undefined);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const dismiss = useDeleteNotification();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    );
  }

  const handleMarkRead = async (id: string) => {
    if (!token) return;
    try { await markRead.mutateAsync({ id, token }); } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try { await markAllRead.mutateAsync(token); } catch {
      // ignore
    }
  };

  const handleDismiss = async (id: string) => {
    if (!token) return;
    try { await dismiss.mutateAsync({ id, token }); } catch {
      // ignore
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      {/* Top accent line */}
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

      <div className="relative mx-auto max-w-3xl">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan"
      >
        <ArrowLeft className="size-3" /> Back to dashboard
      </Link>

      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bell className="size-6 text-cyan" />
          <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Notifications</h1>
        </div>
        <Button
          onClick={handleMarkAllRead}
          disabled={markAllRead.isPending}
        >
          <CheckCheck className="size-3" /> Mark all read
        </Button>
      </div>

      {/* Status tabs */}
      <div className="mb-6 flex gap-4 border-b border-border/40" role="tablist" aria-label="Notification filters">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatus(tab.key); setPage(1); }}
            role="tab"
            aria-selected={status === tab.key}
            aria-controls={`notifications-${tab.key}`}
            className={`pb-2 font-mono text-[0.6rem] uppercase tracking-widest transition-colors ${
              status === tab.key
                ? 'border-b-2 border-cyan text-cyan'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3" aria-label="Loading notifications">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="clip-corner border border-border/40 bg-[#050b0f]/30 p-4 animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-16 bg-border/30 rounded" />
                <div className="h-3 w-12 bg-border/20 rounded" />
              </div>
              <div className="h-4 w-3/4 bg-border/30 rounded mb-1" />
              <div className="h-3 w-1/2 bg-border/20 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="clip-corner border border-coral/40 bg-coral/5 py-12 text-center">
          <p className="font-mono text-[0.65rem] text-coral">Failed to load notifications.</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && data?.items.length === 0 && (
        <div className="clip-corner border border-border/40 bg-[#050b0f]/30 py-16 text-center">
          <Bell className="mx-auto mb-3 size-10 text-muted-foreground/30" />
          <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
            {status === 'all'
              ? 'No notifications yet.'
              : status === 'unread'
                ? 'No unread notifications.'
                : 'No read notifications.'}
          </p>
        </div>
      )}

      {/* List */}
      {data && data.items.length > 0 && (
        <div id={`notifications-${status}`} className="space-y-2" role="tabpanel" aria-label="Notifications list">
          {data.items.map((n) => (
            <div
              key={n.id}
              className={`clip-corner border p-4 transition-colors ${
                n.readAt
                  ? 'border-border/60 bg-[#050b0f]/50'
                  : 'border-cyan/30 bg-[#050b0f]/70'
              }`}
              role="article"
              aria-label={`Notification: ${n.title}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!n.readAt && <span className="bg-cyan size-2 rounded-full shrink-0" />}
                    <span className="font-mono text-[0.5rem] uppercase tracking-wider text-muted-foreground/60 border border-border/40 px-1.5 py-0.5">
                      {n.type}
                    </span>
                    <span className="font-mono text-[0.5rem] text-muted-foreground/50">{formatDate(n.createdAt)}</span>
                  </div>
                  {n.targetUrl ? (
                    <Link
                      href={n.targetUrl}
                      onClick={() => { if (!n.readAt) handleMarkRead(n.id); }}
                      className={`mt-1.5 block font-mono text-[0.6rem] font-semibold hover:underline ${n.readAt ? 'text-muted-foreground' : 'text-foreground'}`}
                    >
                      {n.title}
                    </Link>
                  ) : (
                    <p className={`mt-1.5 font-mono text-[0.6rem] font-semibold ${n.readAt ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {n.title}
                    </p>
                  )}
                  {n.body && (
                    <p className="mt-1 font-mono text-[0.55rem] text-muted-foreground">{n.body}</p>
                  )}
                  {n.actor && (
                    <p className="mt-1 font-mono text-[0.5rem] text-muted-foreground/50">
                      by {n.actor.displayName}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!n.readAt && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      disabled={markRead.isPending}
                      className="rounded p-1.5 text-muted-foreground hover:text-cyan transition-colors"
                      title="Mark as read"
                    >
                      <Check className="size-3.5" />
                    </button>
                  )}
                  {n.readAt && (
                    <span className="rounded p-1.5 text-muted-foreground/30" title="Read">
                      <EyeOff className="size-3.5" />
                    </span>
                  )}
                  <button
                    onClick={() => handleDismiss(n.id)}
                    disabled={dismiss.isPending}
                    className="rounded p-1.5 text-muted-foreground hover:text-coral transition-colors"
                    title="Dismiss"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {data.total > data.pageSize && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                variant="outline" size="sm"
              >
                Previous
              </Button>
              <span className="font-mono text-[0.55rem] text-muted-foreground/60">
                Page {data.page}
              </span>
              <Button
                disabled={page * data.pageSize >= data.total}
                onClick={() => setPage((p) => p + 1)}
                variant="outline" size="sm"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
    </main>
    </>
  );
}
