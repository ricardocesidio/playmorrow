'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Heart,
  Users,
  Bell,
  Rss,
  Gamepad2,
  Bookmark,
  Settings,
  LayoutDashboard,
  ExternalLink,
  LogOut,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/lib/api/auth-context';
import { useMyWishlist, useMyFollows, useUnreadNotificationCount, useNotifications } from '@/lib/api/hooks';
import { HudPanel } from '@/components/playmorrow/hud';

export function PlayerDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: wishlist } = useMyWishlist();
  const { data: follows } = useMyFollows();
  const { data: unreadData } = useUnreadNotificationCount();
  const { data: recentNotifs } = useNotifications('all', 1, 3);

  if (!user) return null;

  const unreadCount = unreadData?.unreadCount ?? 0;
  const wishlistCount = wishlist?.items?.length ?? 0;
  const followingCount = (follows?.studios?.length ?? 0) + (follows?.games?.length ?? 0);

  return (
    <div className="mx-auto grid max-w-[1500px] gap-6 px-5 pb-12 pt-6 lg:grid-cols-[220px_1fr] lg:px-8">
      {/* ── Sidebar ── */}
      <aside className="hidden lg:block">
        <div className="panel border-border/80 bg-background/60 p-4">
          <div className="mb-5 flex items-center gap-3 border-b border-border/60 pb-4">
            <span className="grid size-10 place-items-center rounded-none border border-cyan/60 bg-cyan/10 text-cyan shadow-[0_0_14px_rgb(62_231_255_/_0.18)]">
              {user.displayName.slice(0, 1)}
            </span>
            <div>
              <p className="pm-display text-sm text-foreground">{user.displayName}</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">@{user.username}</p>
              <span className="inline-block mt-1 border border-cyan/30 bg-cyan/8 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-cyan">Player account</span>
            </div>
          </div>

          <nav className="space-y-1">
            <SidebarLink href="/dashboard" icon={<LayoutDashboard className="size-3.5" />} label="Overview" active />
            <SidebarLink href="/me/wishlist" icon={<Heart className="size-3.5" />} label="Wishlist" count={wishlistCount} />
            <SidebarLink href="/me/following" icon={<Users className="size-3.5" />} label="Following" count={followingCount} />
            <SidebarLink href="/feed" icon={<Rss className="size-3.5" />} label="Live Feed" />
            <SidebarLink href="/dashboard/notifications" icon={<Bell className="size-3.5" />} label="Notifications" count={unreadCount} />
            <SidebarLink href="/settings/profile" icon={<Settings className="size-3.5" />} label="Settings" />
          </nav>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="grid gap-5">
        {/* Hero Header */}
        <div className="panel relative min-h-[180px] overflow-hidden border-border/90 bg-gradient-to-br from-background via-background to-cyan/5 p-6 sm:p-8">
          <div className="absolute right-0 top-0 size-64 translate-x-16 -translate-y-16 rounded-full border border-cyan/10" />
          <div className="absolute bottom-0 left-1/3 size-32 rounded-full border border-coral/8" />
          <div className="relative z-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan">Welcome back</p>
            <h1 className="mt-2 font-display text-3xl font-black uppercase leading-none text-foreground sm:text-4xl">{user.displayName}</h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
              Your games, your community, your next adventure.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <QuickAction href="/games" label="Browse games" />
              <QuickAction href="/settings/profile" label="Update profile" variant="secondary" />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={<Heart className="size-4" />} value={wishlistCount} label="Wishlisted" href="/me/wishlist" />
          <StatCard icon={<Users className="size-4" />} value={followingCount} label="Following" href="/me/following" />
          <StatCard icon={<Bell className="size-4" />} value={unreadCount} label="Notifications" href="/dashboard/notifications" />
          <StatCard icon={<Rss className="size-4" />} value="—" label="Feed" href="/feed" />
        </div>

        {/* Wishlist + Following Row */}
        <div className="grid gap-5 lg:grid-cols-2">
          <DashboardSection title="Your Wishlist" icon={<Bookmark className="size-3.5" />} isEmpty={wishlistCount === 0} emptyMsg="Your wishlist is empty." cta={{ href: '/games', label: 'Browse games' }}>
            {wishlist?.items?.slice(0, 4).map((item) => (
              <Link key={item.id} href={`/games/${item.game.slug}`} className="group flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-sm transition hover:border-cyan hover:bg-cyan/5">
                <span className="grid size-8 shrink-0 place-items-center rounded-none border border-border bg-background/60 text-xs text-foreground">
                  {item.game.title.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground group-hover:text-cyan">{item.game.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.game.tagline || item.game.status}</p>
                </div>
              </Link>
            ))}
          </DashboardSection>

          <DashboardSection title="Following" icon={<Users className="size-3.5" />} isEmpty={followingCount === 0} emptyMsg="Not following anything yet." cta={{ href: '/studios', label: 'Explore studios' }}>
            {[
              ...(follows?.studios ?? []).slice(0, 3).map((s) => ({ type: 'studio' as const, slug: s.slug, name: s.name, img: s.logoUrl })),
              ...(follows?.games ?? []).slice(0, 3).map((g) => ({ type: 'game' as const, slug: g.slug, name: g.title, img: g.coverUrl })),
            ].map((item) => (
              <Link key={`${item.type}-${item.slug}`} href={item.type === 'studio' ? `/studios/${item.slug}` : `/games/${item.slug}`} className="group flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-sm transition hover:border-cyan hover:bg-cyan/5">
                <span className="grid size-8 shrink-0 place-items-center rounded-none border border-border bg-background/60 text-[10px] text-muted-foreground">
                  {item.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground group-hover:text-cyan">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.type === 'studio' ? 'Studio' : 'Game'}</p>
                </div>
              </Link>
            ))}
          </DashboardSection>
        </div>

        {/* Feed + Notifications Row */}
        <div className="grid gap-5 lg:grid-cols-2">
          <DashboardSection title="Live Feed" icon={<Rss className="size-3.5" />} isEmpty={false} emptyMsg="" cta={{ href: '/feed', label: 'Open feed' }}>
            <Link href="/feed" className="flex items-center justify-between px-3 py-3 text-sm text-muted-foreground transition hover:text-foreground">
              <span>Your personalized activity feed</span>
              <ArrowRight className="size-4" />
            </Link>
          </DashboardSection>

          <DashboardSection title="Notifications" icon={<Bell className="size-3.5" />} isEmpty={unreadCount === 0} emptyMsg="No notifications yet." cta={{ href: '/dashboard/notifications', label: 'View all' }}>
            {recentNotifs?.items?.slice(0, 2).map((n) => (
              <div key={n.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="grid size-6 place-items-center rounded-none border border-border text-[10px] text-muted-foreground">
                  <Bell className="size-3" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-muted-foreground">{n.title}</p>
                </div>
              </div>
            ))}
          </DashboardSection>
        </div>

        {/* Upcoming Releases */}
        <DashboardSection title="Upcoming Releases" icon={<Clock className="size-3.5" />} isEmpty={false} emptyMsg="" cta={{ href: '/games', label: 'Browse all' }}>
          <Link href="/games" className="flex items-center justify-between px-3 py-3 text-sm text-muted-foreground transition hover:text-foreground">
            <span>Discover upcoming games from studios you follow</span>
            <ArrowRight className="size-4" />
          </Link>
        </DashboardSection>

        {/* Studio Onboarding Card (subtle) */}
        <div className="border border-border/60 bg-background/40 px-5 py-4">
          <p className="text-xs text-muted-foreground">
            Want to publish a game?{' '}
            <Link href="/studios/new" className="text-cyan underline underline-offset-4 hover:text-cyan/80">
              Create a studio account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function SidebarLink({ href, icon, label, count, active }: { href: string; icon: React.ReactNode; label: string; count?: number; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-none px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition ${
        active ? 'bg-cyan/10 text-cyan' : 'text-muted-foreground hover:bg-cyan/5 hover:text-foreground'
      }`}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="grid size-4 place-items-center rounded-none bg-coral text-[8px] text-coral-foreground">{count > 9 ? '9+' : count}</span>
      )}
    </Link>
  );
}

function QuickAction({ href, label, variant = 'primary' }: { href: string; label: string; variant?: 'primary' | 'secondary' }) {
  return (
    <Link
      href={href}
      className={`inline-flex cursor-pointer items-center gap-2 border px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition ${
        variant === 'primary'
          ? 'border-coral bg-coral/10 text-coral hover:bg-coral hover:text-coral-foreground'
          : 'border-border text-muted-foreground hover:border-cyan hover:text-cyan'
      }`}
    >
      {label} <ArrowRight className="size-3" />
    </Link>
  );
}

function StatCard({ icon, value, label, href }: { icon: React.ReactNode; value: number | string; label: string; href: string }) {
  return (
    <Link href={href} className="group border border-border/70 bg-background/50 px-4 py-3 transition hover:border-cyan/60">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground group-hover:text-cyan">{icon}</span>
        <span className="font-display text-xl font-bold text-foreground">{value}</span>
      </div>
      <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </Link>
  );
}

function DashboardSection({ title, icon, children, isEmpty, emptyMsg, cta }: { title: string; icon: React.ReactNode; children: React.ReactNode; isEmpty: boolean; emptyMsg: string; cta: { href: string; label: string } }) {
  return (
    <div className="border border-border/80 bg-background/40">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-foreground">
          {icon} {title}
        </span>
        <Link href={cta.href} className="font-mono text-[9px] uppercase tracking-widest text-cyan hover:text-cyan/80">
          {cta.label} →
        </Link>
      </div>
      <div className="py-2">
        {isEmpty ? (
          <p className="px-4 py-4 text-center text-xs text-muted-foreground">{emptyMsg}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
