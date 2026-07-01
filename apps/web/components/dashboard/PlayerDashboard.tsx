'use client';

import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Bell,
  Bookmark,
  Gamepad2,
  Gauge,
  Heart,
  History,
  Library,
  Lock,
  LogOut,
  MessageSquare,
  Radio,
  Settings,
  Signal,
  Trophy,
  UserRound,
  Users,
  Zap,
} from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { useMyFollows, useMyWishlist, useNotifications, useUnreadNotificationCount, usePublicFeed } from '@/lib/api/hooks';
import { useRouter } from 'next/navigation';
import type { FeedItem } from '@/lib/api/client';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const achievements = [
  { id: 'a1', name: 'First Follow', desc: 'Follow your first studio', icon: '🎯', unlocked: true },
  { id: 'a2', name: 'Wishlister', desc: 'Add 5 games to your wishlist', icon: '⭐', unlocked: true },
  { id: 'a3', name: 'Commenter', desc: 'Post your first comment', icon: '💬', unlocked: true },
  { id: 'a4', name: 'Social', desc: 'Follow 10 studios', icon: '👥', unlocked: false },
  { id: 'a5', name: 'Explorer', desc: 'Visit 20 game pages', icon: '🗺️', unlocked: false },
  { id: 'a6', name: 'Supporter', desc: 'Wishlist 10 games', icon: '🏆', unlocked: false },
];

export function PlayerDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: wishlist } = useMyWishlist();
  const { data: follows } = useMyFollows();
  const { data: unreadData } = useUnreadNotificationCount();
  const { data: recentNotifs } = useNotifications('all', 1, 5);
  const { data: feedData } = usePublicFeed(1, 5);

  if (!user) return null;

  const unreadCount = unreadData?.unreadCount ?? 0;
  const wishlistItems = wishlist?.items ?? [];
  const wishlistCount = wishlistItems.length;
  const followingCount = Math.max((follows?.studios?.length ?? 0) + (follows?.games?.length ?? 0), 24);
  const displayName = user.displayName || 'Obsidian Signal';

  const xpForNext = user.level ? user.level * 100 : 100;
  const xpProgress = user.level ? ((user.xp ?? 0) / xpForNext) * 100 : 0;

  const feedItems = (feedData?.items ?? []).map((item) => ({
    studio: item.studio.name,
    body: item.summary || item.title,
    time: timeAgo(item.createdAt),
    icon: item.type === 'DEVLOG' ? BadgeCheck : Activity,
  }));

  const notifItems = (recentNotifs?.items ?? []).map((item) => ({
    title: item.title,
    time: timeAgo(item.createdAt),
    icon: Bell,
    tone: 'violet' as const,
  }));

  return (
    <>
    <SiteHeader />
    <main className="relative overflow-hidden bg-[#020609] px-3 pb-4 pt-3 text-foreground sm:px-5">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.028)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute inset-y-0 right-4 w-px bg-gradient-to-b from-transparent via-coral/40 to-transparent" />

      <div className="relative mx-auto grid max-w-[1540px] gap-3 xl:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <DashboardPanel className="sticky top-20 min-h-[690px] p-3">
            <div className="border-b border-border/70 px-2 pb-3">
              <p className="flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-cyan">
                <Gauge className="size-3.5" /> Player Dashboard
              </p>
            </div>

            <nav className="mt-3 space-y-1">
              <SidebarLink href="/dashboard" icon={<Users className="size-4" />} label="Overview" active />
              <SidebarLink href="/me/wishlist" icon={<Heart className="size-4" />} label="Wishlist" count={wishlistCount} />
              <SidebarLink href="/me/following" icon={<Users className="size-4" />} label="Following" count={followingCount} />
              <SidebarLink href="/dashboard" icon={<Trophy className="size-4" />} label="Achievements" count={12} />
              <SidebarLink href="/feed" icon={<Gamepad2 className="size-4" />} label="Playtests" count={3} />
              <SidebarLink href="/games" icon={<History className="size-4" />} label="Recently Viewed" />
              <SidebarLink href="/games" icon={<Library className="size-4" />} label="Library" />
              <SidebarLink href="/dashboard/notifications" icon={<MessageSquare className="size-4" />} label="Messages" count={unreadCount} />
              <SidebarLink href="/settings/profile" icon={<Settings className="size-4" />} label="Settings" />
              <button
                onClick={() => { logout(); router.push('/'); }}
                className="flex w-full cursor-pointer items-center gap-3 rounded-none px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition hover:bg-coral/10 hover:text-coral"
              >
                <LogOut className="size-3.5" /> Sign out
              </button>
            </nav>

            <div className="mt-5 border-t border-border/70 px-2 pt-4">
              <p className="font-mono text-[0.67rem] uppercase tracking-[0.22em] text-muted-foreground">Level {user.level ?? '--'}</p>
              <p className="mt-1 flex items-center gap-2 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-cyan">
                <Trophy className="size-3" /> Explorer
              </p>
              <ProgressBar value={xpProgress} className="mt-3" />
              <p className="mt-2 text-right font-mono text-[0.62rem] text-muted-foreground">{(user.xp ?? 0).toLocaleString()} / {xpForNext.toLocaleString()} XP</p>
            </div>

            <div className="mt-5 border-t border-border/70 px-2 pt-4">
              <div className="mb-3 flex items-center justify-between font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                <span>Signal Strength</span>
                <span>87%</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 24 }).map((_, index) => (
                  <span key={index} className={`h-2 flex-1 ${index < 21 ? 'bg-cyan shadow-[0_0_8px_rgb(62_231_255_/_0.55)]' : 'bg-border'}`} />
                ))}
              </div>
            </div>

            <div className="mt-5 border-t border-border/70 px-2 pt-4">
              <p className="mb-3 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">Favorite Genres</p>
              {['Tactical RPG', 'Atmospheric Adventure', 'Space Opera'].map((genre) => (
                <p key={genre} className="mb-2 flex items-center gap-2 text-[0.74rem] text-muted-foreground">
                  <span className="size-1 bg-cyan" /> {genre}
                </p>
              ))}
              <button className="mt-2 flex w-full items-center justify-between border border-border/80 bg-background/70 px-3 py-2 text-left text-[0.72rem] text-foreground transition hover:border-cyan/60">
                Update preferences <ArrowRight className="size-3 rotate-90" />
              </button>
            </div>
          </DashboardPanel>

          <DashboardPanel className="mt-3 overflow-hidden p-4">
            <div className="relative min-h-[126px]">
              <img src="/playmorrow/neon-warden.png" alt="" className="absolute inset-y-0 right-[-22px] h-full w-28 object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
              <div className="relative">
                <p className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-violet">Join More Playtests</p>
                <p className="mt-4 max-w-[145px] text-xs leading-5 text-muted-foreground">Get early access to the games you love.</p>
                <Link href="/feed" className="mt-4 inline-flex border border-border-bright px-3 py-2 text-xs text-foreground transition hover:border-cyan hover:text-cyan">
                  View playtests
                </Link>
              </div>
            </div>
          </DashboardPanel>
        </aside>

        <section className="min-w-0 space-y-3">
          <DashboardHero name={displayName} />

          <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_270px]">
            <DashboardPanel className="p-4">
              <SectionHeader title="Your Wishlist" meta="Private" locked href="/me/wishlist" />
              {wishlistItems.length === 0 ? (
                <div className="mt-3 text-center py-8">
                  <Bookmark className="mx-auto mb-2 size-6 text-muted-foreground" />
                  <p className="font-mono text-[0.6rem] text-muted-foreground">No games saved yet</p>
                  <Link href="/games" className="mt-3 inline-flex items-center gap-1 border border-cyan/60 px-4 py-2 font-mono text-[0.55rem] uppercase tracking-wider text-cyan hover:bg-cyan/10">
                    Browse games <ArrowRight className="size-3" />
                  </Link>
                </div>
              ) : (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                {wishlistItems.slice(0, 5).map((item) => (
                  <GameTile key={item.id} game={{
                    title: item.game.title,
                    slug: item.game.slug,
                    studio: item.game.studio?.name ?? '',
                    genre: item.game.tagline ?? '',
                    image: item.game.coverUrl || '/playmorrow/neon-warden.png',
                    score: 'Wishlisted',
                    progress: 50,
                    platforms: [],
                    accent: 'cyan',
                  }} />
                ))}
              </div>
              )}
            </DashboardPanel>

            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-1">
              <DashboardPanel className="p-4">
                <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-foreground">Account Progress</p>
                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <p className="font-mono text-xs text-cyan">Level {user.level ?? '--'}</p>
                    <ProgressBar value={xpProgress} className="mt-3 w-28" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Explorer</p>
                    <p className="mt-3 font-mono text-[0.68rem] text-muted-foreground">{(user.xp ?? 0).toLocaleString()} / {xpForNext.toLocaleString()} XP</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border/70 pt-4">
                  <MiniStat icon={<Trophy className="size-4" />} label="Badges" value="18 / 42" />
                  <MiniStat icon={<Gamepad2 className="size-4" />} label="Playtests Joined" value="7" />
                  <MiniStat icon={<MessageSquare className="size-4" />} label="Comments Made" value="24" />
                  <MiniStat icon={<Users className="size-4" />} label="Devlogs Followed" value="31" />
                </div>
              </DashboardPanel>

              <DashboardPanel className="p-4">
                <SectionHeader title="Notifications" href="/dashboard/notifications" compact />
                <div className="mt-3 space-y-2">
                  {notifItems.length === 0 ? (
                    <div className="py-6 text-center">
                      <Bell className="mx-auto mb-2 size-5 text-muted-foreground" />
                      <p className="font-mono text-[0.6rem] text-muted-foreground">No notifications yet</p>
                    </div>
                  ) : notifItems.slice(0, 5).map((item) => (
                    <NotificationRow key={`${item.title}-${item.time}`} item={item} />
                  ))}
                </div>
              </DashboardPanel>
            </div>
          </div>

          <DashboardPanel className="p-4">
            <SectionHeader title="Achievements" href="/me/achievements" compact />
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {achievements.map((a) => (
                <Link key={a.id} href="/me/achievements" className={`group flex flex-col items-center gap-2 border p-3 text-center transition ${
                  a.unlocked
                    ? 'border-cyan/40 bg-cyan/5 shadow-[0_0_12px_rgb(62_231_255_/_0.15)] hover:border-cyan/60 hover:shadow-[0_0_18px_rgb(62_231_255_/_0.3)]'
                    : 'border-border/60 bg-background/40 opacity-50 hover:opacity-70'
                }`}>
                  <span className="text-xl">{a.icon}</span>
                  <div>
                    <p className={`font-mono text-[0.58rem] uppercase tracking-[0.12em] ${a.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>{a.name}</p>
                    <p className="mt-0.5 text-[0.55rem] text-muted-foreground">{a.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </DashboardPanel>

          <div className="grid gap-3 lg:grid-cols-[1fr_0.9fr_1.3fr_270px]">
            <DashboardPanel className="p-4">
              <SectionHeader title="Recently Viewed" href="/games" compact />
              <div className="mt-3 py-8 text-center">
                <History className="mx-auto mb-2 size-6 text-muted-foreground" />
                <p className="font-mono text-[0.6rem] text-muted-foreground">No recently viewed games</p>
                <Link href="/games" className="mt-3 inline-flex items-center gap-1 border border-cyan/60 px-4 py-2 font-mono text-[0.55rem] uppercase tracking-wider text-cyan hover:bg-cyan/10">
                  Browse games <ArrowRight className="size-3" />
                </Link>
              </div>
            </DashboardPanel>

            <DashboardPanel className="p-4">
              <SectionHeader title="Upcoming Releases" href="/games" compact />
              <div className="mt-3 py-8 text-center">
                <Radio className="mx-auto mb-2 size-6 text-muted-foreground" />
                <p className="font-mono text-[0.6rem] text-muted-foreground">No upcoming releases</p>
                <Link href="/games" className="mt-3 inline-flex items-center gap-1 border border-cyan/60 px-4 py-2 font-mono text-[0.55rem] uppercase tracking-wider text-cyan hover:bg-cyan/10">
                  Browse games <ArrowRight className="size-3" />
                </Link>
              </div>
            </DashboardPanel>

            <DashboardPanel className="p-4">
              <SectionHeader title="Feed From Followed Studios" href="/feed" compact />
              <div className="mt-3 space-y-3">
                {feedItems.length === 0 ? (
                  <div className="py-8 text-center">
                    <Activity className="mx-auto mb-2 size-6 text-muted-foreground" />
                    <p className="font-mono text-[0.6rem] text-muted-foreground">No feed items yet</p>
                    <Link href="/games" className="mt-3 inline-flex items-center gap-1 border border-cyan/60 px-4 py-2 font-mono text-[0.55rem] uppercase tracking-wider text-cyan hover:bg-cyan/10">
                      Follow studios <ArrowRight className="size-3" />
                    </Link>
                  </div>
                ) : feedItems.slice(0, 3).map((item) => (
                  <FeedRow key={`${item.studio}-${item.time}`} item={item} />
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel className="p-4">
              <SectionHeader title="Recent Comments" href="/feed" compact />
              <div className="mt-3 py-8 text-center">
                <MessageSquare className="mx-auto mb-2 size-6 text-muted-foreground" />
                <p className="font-mono text-[0.6rem] text-muted-foreground">No comments yet</p>
                <Link href="/feed" className="mt-3 inline-flex items-center gap-1 border border-cyan/60 px-4 py-2 font-mono text-[0.55rem] uppercase tracking-wider text-cyan hover:bg-cyan/10">
                  Browse feed <ArrowRight className="size-3" />
                </Link>
              </div>
            </DashboardPanel>
          </div>

          <DashboardPanel className="p-4">
            <SectionHeader title="Recent Activity" compact />
            <div className="mt-3 py-8 text-center">
              <Activity className="mx-auto mb-2 size-6 text-muted-foreground" />
              <p className="font-mono text-[0.6rem] text-muted-foreground">No recent activity</p>
            </div>
          </DashboardPanel>

          <div className="grid gap-3 lg:grid-cols-[1fr_1.45fr_270px]">
            <DashboardPanel className="p-4">
              <SectionHeader title="Saved Devlogs" href="/feed" compact />
              <div className="mt-3 py-8 text-center">
                <Bookmark className="mx-auto mb-2 size-6 text-muted-foreground" />
                <p className="font-mono text-[0.6rem] text-muted-foreground">No saved devlogs</p>
                <Link href="/feed" className="mt-3 inline-flex items-center gap-1 border border-cyan/60 px-4 py-2 font-mono text-[0.55rem] uppercase tracking-wider text-cyan hover:bg-cyan/10">
                  Browse devlogs <ArrowRight className="size-3" />
                </Link>
              </div>
            </DashboardPanel>

            <DashboardPanel className="p-4">
              <SectionHeader title="Recommended For You" href="/games" compact />
              <div className="mt-3 py-8 text-center">
                <Heart className="mx-auto mb-2 size-6 text-muted-foreground" />
                <p className="font-mono text-[0.6rem] text-muted-foreground">No recommendations yet</p>
                <Link href="/games" className="mt-3 inline-flex items-center gap-1 border border-cyan/60 px-4 py-2 font-mono text-[0.55rem] uppercase tracking-wider text-cyan hover:bg-cyan/10">
                  Browse games <ArrowRight className="size-3" />
                </Link>
              </div>
            </DashboardPanel>

            <DashboardPanel className="hidden p-4 lg:block">
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-foreground">Signal Relay</p>
              <div className="mt-6 grid place-items-center">
                <div className="relative grid size-32 place-items-center border border-cyan/30">
                  <div className="absolute inset-3 border border-coral/30" />
                  <Signal className="size-12 text-cyan" />
                </div>
              </div>
              <p className="mt-5 text-center font-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Connected</p>
            </DashboardPanel>
          </div>
        </section>
      </div>

      <div className="relative mx-auto mt-6 flex max-w-[1540px] items-center justify-between border border-border/70 bg-background/60 px-5 py-3 font-mono text-[0.58rem] uppercase tracking-[0.26em] text-muted-foreground clip-corner">
        <span className="flex items-center gap-3">Signal Strength <span className="inline-flex gap-1">{Array.from({ length: 9 }).map((_, i) => <span key={i} className="h-2 w-1 bg-cyan" />)}</span></span>
        <span className="hidden sm:inline">34.0522 N, 118.2437 W</span>
        <span className="text-success">Connected</span>
      </div>
    </main>
    </>
  );
}

function DashboardHero({ name }: { name: string }) {
  return (
    <DashboardPanel className="overflow-hidden">
      <div className="relative min-h-[214px]">
        <img src="/playmorrow/neon-warden.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_28%,rgb(255_87_77_/_0.3),transparent_18rem),linear-gradient(90deg,#020609_0%,rgb(2_6_9_/_0.92)_34%,rgb(2_6_9_/_0.38)_100%)]" />
        <div className="absolute right-14 top-9 hidden text-coral drop-shadow-[0_0_20px_rgb(255_87_77_/_0.6)] lg:block">
          <Zap className="size-20 stroke-1" />
        </div>
        <div className="relative z-10 flex min-h-[214px] flex-col justify-between p-5 sm:p-7">
          <div>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-cyan">Welcome Back, {name} /////////</p>
            <h1 className="mt-4 max-w-[960px] font-display text-[clamp(2.35rem,5vw,4.35rem)] font-black uppercase leading-[0.92] text-white">
              Your Player Dashboard
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">Your games, your community, your next adventure.</p>
          </div>

          <div className="mt-7 grid gap-3 border-t border-border/70 pt-3 lg:grid-cols-[140px_repeat(5,1fr)]">
            <p className="flex items-center font-mono text-[0.72rem] uppercase tracking-[0.16em] text-foreground">Quick Actions</p>
            <ActionButton href="/games" icon={<Gamepad2 className="size-4" />} label="Browse games" />
            <ActionButton href="/me/wishlist" icon={<Heart className="size-4" />} label="Open wishlist" />
            <ActionButton href="/me/following" icon={<Users className="size-4" />} label="Manage follows" />
            <ActionButton href="/settings/profile" icon={<UserRound className="size-4" />} label="Update profile" />
            <ActionButton href="/feed" icon={<Radio className="size-4" />} label="Join playtests" />
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
}

function DashboardPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`clip-corner border border-border/90 bg-[#050b0f]/86 shadow-[0_18px_70px_rgb(0_0_0_/_0.36)] ${className}`}>
      {children}
    </div>
  );
}

function SidebarLink({ href, icon, label, count, active }: { href: string; icon: React.ReactNode; label: string; count?: number; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 px-3 py-2.5 text-sm transition ${
        active ? 'border-r-2 border-cyan bg-cyan/10 text-foreground' : 'text-muted-foreground hover:bg-cyan/5 hover:text-foreground'
      }`}
    >
      <span className={active ? 'text-cyan' : 'text-muted-foreground group-hover:text-cyan'}>{icon}</span>
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="grid min-w-5 place-items-center border border-border bg-background px-1.5 py-0.5 font-mono text-[0.62rem] text-muted-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}

function ActionButton({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex min-h-9 items-center gap-3 border border-border/90 bg-background/45 px-4 text-xs text-foreground transition hover:border-cyan/70 hover:bg-cyan/10">
      <span className="text-cyan">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

function SectionHeader({ title, href, meta, locked, compact }: { title: string; href?: string; meta?: string; locked?: boolean; compact?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <h2 className={`truncate font-mono uppercase tracking-[0.16em] text-foreground ${compact ? 'text-[0.72rem]' : 'text-[0.78rem]'}`}>{title}</h2>
        {meta && <span className="text-xs text-muted-foreground">+ {meta}</span>}
        {locked && <Lock className="size-3 text-muted-foreground" />}
      </div>
      {href && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-2 font-mono text-[0.62rem] text-cyan transition hover:text-white">
          View all <span className="hidden sm:inline">5</span> <ArrowRight className="size-3" />
        </Link>
      )}
    </div>
  );
}

function GameTile({ game }: { game: { title: string; slug: string; studio: string; genre: string; image: string; score: string; progress: number; platforms: string[]; accent: string } }) {
  return (
    <Link href={`/games/${game.slug}`} className="group overflow-hidden border border-border/90 bg-background/70 transition hover:-translate-y-0.5 hover:border-cyan/70">
      <div className="relative aspect-[1.15/1] overflow-hidden">
        <img src={game.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/15 to-transparent" />
        <div className="absolute inset-x-3 bottom-3">
          <h3 className="font-display text-[1.35rem] uppercase leading-none text-white drop-shadow-lg">{game.title}</h3>
          <p className="mt-2 text-[0.68rem] text-muted-foreground">{game.genre}</p>
        </div>
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between font-mono text-[0.63rem] text-foreground">
          <span>{game.score}</span>
          <span>{game.progress}%</span>
        </div>
        <ProgressBar value={game.progress} tone={game.accent} />
        <div className="flex items-center gap-1.5">
          <Gamepad2 className="mr-1 size-3.5 text-cyan" />
          {game.platforms.map((platform) => (
            <span key={platform} className="border border-border bg-background px-2 py-1 font-mono text-[0.56rem] text-muted-foreground">{platform}</span>
          ))}
          <Bookmark className="ml-auto size-4 text-cyan" />
        </div>
      </div>
    </Link>
  );
}

function ProgressBar({ value, tone = 'cyan', className = '' }: { value: number; tone?: string; className?: string }) {
  const color = tone === 'violet' ? 'bg-violet' : 'bg-cyan';
  return (
    <div className={`h-1.5 bg-border ${className}`}>
      <div className={`h-full ${color} shadow-[0_0_12px_currentColor]`} style={{ width: `${value}%` }} />
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="font-mono text-[0.55rem] uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
        <p className="mt-1 font-mono text-xs text-foreground">{value}</p>
      </div>
    </div>
  );
}

function FeedRow({ item }: { item: { studio: string; body: string; time: string; icon: React.ComponentType<{ className?: string }> } }) {
  const Icon = item.icon;
  return (
    <Link href="/feed" className="flex items-center gap-3 border-b border-border/60 pb-3 last:border-0">
      <span className="grid size-10 place-items-center border border-cyan/40 bg-cyan/10 text-cyan">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{item.studio} <BadgeCheck className="inline size-3 text-cyan" /></p>
        <p className="truncate text-xs text-muted-foreground">{item.body}</p>
      </div>
      <span className="font-mono text-[0.62rem] text-muted-foreground">{item.time}</span>
    </Link>
  );
}

function NotificationRow({ item }: { item: { title: string; time: string; icon: React.ComponentType<{ className?: string }>; tone: string } }) {
  const Icon = item.icon;
  const tone = item.tone === 'success' ? 'text-success border-success/40 bg-success/10' : item.tone === 'amber' ? 'text-amber border-amber/40 bg-amber/10' : item.tone === 'violet' ? 'text-violet border-violet/40 bg-violet/10' : 'text-coral border-coral/40 bg-coral/10';
  return (
    <Link href="/dashboard/notifications" className="flex items-center gap-3 border-b border-border/60 pb-2 last:border-0">
      <span className={`grid size-8 shrink-0 place-items-center border ${tone}`}>
        <Icon className="size-4" />
      </span>
      <p className="min-w-0 flex-1 text-xs leading-4 text-muted-foreground">{item.title}</p>
      <span className="font-mono text-[0.58rem] text-muted-foreground">{item.time}</span>
    </Link>
  );
}
