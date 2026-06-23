'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, ExternalLink, Users, MessageSquare, Flame, Heart } from 'lucide-react';
import { useNotifications, useUnreadNotificationCount, type NotificationItem } from '@/lib/api/hooks';

const TYPE_ICONS: Record<string, typeof Heart> = {
  NEW_FOLLOWER: Users,
  NEW_COMMENT: MessageSquare,
  NEW_REPLY: MessageSquare,
  NEW_REACTION: Heart,
};

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function NotificationRow({ item }: { item: NotificationItem }) {
  const Icon = TYPE_ICONS[item.type] ?? Flame;
  const href = item.targetUrl ? `/dashboard/notifications` : '/dashboard/notifications';

  return (
    <Link
      href={href}
      className="grid grid-cols-[auto_1fr_auto] items-start gap-3 border-l-2 border-transparent px-4 py-3 text-sm transition hover:border-cyan hover:bg-cyan/5"
    >
      <span className={`grid size-7 place-items-center rounded-none border text-[10px] ${
        item.readAt ? 'border-border text-muted-foreground' : 'border-cyan text-cyan'
      }`}>
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0">
        <p className={`truncate text-sm ${item.readAt ? 'text-muted-foreground' : 'text-foreground'}`}>
          {item.body || item.title}
        </p>
        <p className="text-xs text-muted-foreground/60">{timeAgo(item.createdAt)}</p>
      </div>
      {!item.readAt && (
        <span className="mt-1.5 size-1.5 rounded-none bg-cyan shadow-[0_0_6px_rgb(62_231_255_/_0.8)]" />
      )}
    </Link>
  );
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: unreadData } = useUnreadNotificationCount();
  const { data: notifData, isLoading } = useNotifications('all', 1, 5);

  const unreadCount = unreadData?.unreadCount ?? 0;
  const notifications = notifData?.items ?? [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative grid size-8 place-items-center text-muted-foreground hover:text-cyan cursor-pointer"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-none bg-coral text-[9px] font-bold text-coral-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="panel absolute right-0 top-full z-50 mt-3 w-[380px] border border-border/90 bg-background shadow-[0_0_40px_rgb(0_0_0_/_0.6)]"
          style={{
            clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
            <span className="pm-display text-xs uppercase tracking-widest text-foreground">Notifications</span>
            <span className="pm-micro text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All clear'}
            </span>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="size-5 animate-spin border border-cyan border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                <Bell className="size-8 text-border" />
                <p className="pm-micro text-muted-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground/50">Follow studios and games to get updates.</p>
              </div>
            ) : (
              notifications.map((n) => <NotificationRow key={n.id} item={n} />)
            )}
          </div>

          {/* Footer */}
          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between border-t border-cyan/30 bg-cyan/5 px-4 py-3 text-sm text-cyan transition hover:bg-cyan/10"
          >
            <span className="pm-display text-[10px] uppercase tracking-widest">View all</span>
            <ExternalLink className="size-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
