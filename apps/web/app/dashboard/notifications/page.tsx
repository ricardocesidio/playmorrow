'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bell, Check, CheckCheck, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/api/auth-context';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
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

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) return null;

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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bell className="size-6 text-primary" />
          <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          disabled={markAllRead.isPending}
        >
          <CheckCheck className="size-3" /> Mark all read
        </Button>
      </div>

      {/* Status tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-border bg-card/20 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatus(tab.key); setPage(1); }}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              status === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 py-12 text-center">
          <p className="text-destructive">Failed to load notifications.</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && data?.items.length === 0 && (
        <div className="rounded-xl border border-border bg-card/20 py-16 text-center">
          <Bell className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">
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
        <div className="space-y-2">
          {data.items.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border p-4 transition-colors ${
                n.readAt
                  ? 'border-border bg-card/20'
                  : 'border-primary/30 bg-card/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                      {n.type}
                    </span>
                    <span>{formatDate(n.createdAt)}</span>
                  </div>
                  {n.targetUrl ? (
                    <Link
                      href={n.targetUrl}
                      onClick={() => { if (!n.readAt) handleMarkRead(n.id); }}
                      className={`mt-1 block text-sm hover:underline ${n.readAt ? 'text-muted-foreground' : 'font-medium text-foreground'}`}
                    >
                      {n.title}
                    </Link>
                  ) : (
                    <p className={`mt-1 text-sm ${n.readAt ? 'text-muted-foreground' : 'font-medium text-foreground'}`}>
                      {n.title}
                    </p>
                  )}
                  {n.body && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                  )}
                  {n.actor && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      by {n.actor.displayName}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!n.readAt && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      disabled={markRead.isPending}
                      className="rounded p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      title="Mark as read"
                    >
                      <Check className="size-4" />
                    </button>
                  )}
                  {n.readAt && (
                    <span className="rounded p-1.5 text-muted-foreground/40" title="Read">
                      <EyeOff className="size-4" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {data.total > data.pageSize && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-input px-3 py-1.5 text-sm transition-colors hover:bg-accent disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {data.page}
              </span>
              <button
                disabled={page * data.pageSize >= data.total}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-input px-3 py-1.5 text-sm transition-colors hover:bg-accent disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
