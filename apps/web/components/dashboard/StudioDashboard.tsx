'use client';

import Link from 'next/link';
import { DashboardPanel, SidebarLink } from './shared';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Boxes,
  CalendarDays,
  Download,
  FileText,
  Gamepad2,
  Gauge,
  Heart,
  LineChart,
  MessageSquare,
  MonitorPlay,
  PanelLeft,
  Rocket,
  Settings,
  ShieldCheck,
  Target,
  Trophy,
  UploadCloud,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { GameCard } from '@/components/game-card';
import { useAuth } from '@/lib/api/auth-context';
import { type Game, type Studio } from '@/lib/api/client';
import { useMyDevlogs, useMyGames, useMyStudios, useNotifications, useUnreadNotificationCount, useStudioDashboard, useGameRoadmap, useStudioAuditLogs } from '@/lib/api/hooks';
import type { RoadmapItem } from '@/lib/api/client';

export function StudioDashboard() {
  const { user, token } = useAuth();
  const { data: studios, isLoading: studiosLoading } = useMyStudios(token ?? undefined);
  const { data: games, isLoading: gamesLoading } = useMyGames(token ?? undefined);
  const { data: devlogs } = useMyDevlogs(token ?? undefined);
  const { data: notifications } = useNotifications('all', 1, 5, token ?? undefined);
  const { data: unreadData } = useUnreadNotificationCount();

  const studio = studios?.[0];
  const studioGames = (games ?? []) as Game[];
  const firstGame = studioGames[0];

  const { data: dashboard } = useStudioDashboard(studio?.slug ?? '');
  const { data: roadmapItems } = useGameRoadmap(firstGame?.slug ?? '');
  const { data: auditLogs } = useStudioAuditLogs(studio?.slug ?? '');

  if (!user) return null;

  const ds = dashboard;
  const publishedGames = ds?.games.published ?? studioGames.filter((game) => game.isPublished || game.status === 'PUBLISHED').length;
  const inDevelopmentGames = ds?.games.inDevelopment ?? studioGames.filter((game) => !game.isPublished || game.status !== 'PUBLISHED').length;
  const followers = studio?.followersCount ?? studioGames.reduce((sum, game) => sum + game.followersCount, 0);
  const wishlists = ds?.stats.totalWishlists ?? studioGames.reduce((sum, game) => sum + (game.wishlistsCount ?? 0), 0);
  const views = ds?.stats.totalViews ?? studioGames.reduce((sum, game) => sum + (game.viewsCount ?? 0), 0);
  const comments = ds?.stats.totalComments ?? studioGames.reduce((sum, game) => sum + (game.commentsCount ?? 0), 0);
  const unreadCount = unreadData?.unreadCount ?? 0;
  const studioName = studio?.name ?? user.displayName;
  const studioTagline = studio?.tagline ?? 'Build. Create. Impact the future of gaming.';
  const studioSlug = studio?.slug;

  if (studiosLoading) {
    return (
      <>
        <SiteHeader />
        <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="relative mx-auto max-w-7xl">
            {/* Skeleton for studio header */}
            <div className="mb-8 animate-pulse">
              <div className="h-8 w-64 bg-border/40 mb-2" />
              <div className="h-4 w-96 bg-border/30" />
            </div>
            {/* Stats skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="clip-corner border border-border/40 bg-[#050b0f]/40 p-4">
                  <div className="h-3 w-20 bg-border/30 mb-3" />
                  <div className="h-6 w-12 bg-border/40" />
                </div>
              ))}
            </div>
            {/* Games / Devlogs skeleton */}
            <div className="grid md:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="clip-corner border border-border/40 bg-[#050b0f]/40 p-4">
                  <div className="h-4 w-32 bg-border/30 mb-4" />
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="h-12 bg-border/20 rounded" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!studio) {
    return (
      <>
        <SiteHeader />
        <main className="relative grid min-h-[calc(100vh-4rem)] place-items-center overflow-hidden bg-[#020609] px-6 text-center">
          <div className="panel max-w-xl p-8">
            <ShieldCheck className="mx-auto mb-5 size-10 text-cyan" />
            <h1 className="font-display text-3xl font-black uppercase">Create Your Studio</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Studio tools are only available after you create or join a studio workspace.
            </p>
            <Link href="/studios/new" className="clip-corner mt-6 inline-flex border border-coral bg-coral px-5 py-3 pm-display text-xs text-coral-foreground">
              Create studio <ArrowRight className="size-4" />
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="relative overflow-hidden bg-[#020609] px-3 pb-4 pt-3 text-foreground sm:px-5">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-coral/20 to-transparent" />

        <div className="relative mx-auto grid max-w-[1540px] xl:grid-cols-[220px_minmax(0,1fr)]">
          <StudioSidebar unreadCount={unreadCount} studioSlug={studio.slug} />

          <section className="min-w-0">
            <StudioHero studio={studio} studioName={studioName} studioTagline={studioTagline} />

            <div className="grid grid-cols-2 gap-3 p-3 md:grid-cols-4 2xl:grid-cols-8">
              <StatCard icon={<Gamepad2 className="size-5" />} label="Games Published" value={publishedGames} tone="violet" />
              <StatCard icon={<Boxes className="size-5" />} label="In Development" value={inDevelopmentGames} tone="amber" />
              <StatCard icon={<Heart className="size-5" />} label="Followers" value={formatNumber(followers)} delta={ds ? formatDelta(ds.stats.followsThisWeek) : undefined} tone="coral" />
              <StatCard icon={<Target className="size-5" />} label="Total Wishlists" value={formatNumber(wishlists)} delta={ds ? formatDelta(ds.stats.wishlistsThisWeek) : undefined} tone="cyan" />
              <StatCard icon={<MonitorPlay className="size-5" />} label="Total Views" value={formatNumber(views)} delta={ds ? formatDelta(ds.stats.viewsThisWeek) : undefined} tone="violet" />
              <StatCard icon={<MessageSquare className="size-5" />} label="Comments" value={formatNumber(comments)} delta={ds ? formatDelta(ds.stats.commentsThisMonth) : undefined} tone="cyan" />
              <StatCard icon={<Users className="size-5" />} label="Team Members" value={studio?.membersCount ?? '-'} tone="muted" />
              <StatCard icon={<CalendarDays className="size-5" />} label="Since Joined" value={formatMonthYear(studio.createdAt)} tone="muted" />
            </div>

            {/* E1: Basic studio analytics stub */}
            <DashboardPanel className="p-3 mb-3">
              <p className="mb-3 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-foreground">Analytics (Beta Stub)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>Followers this week: <span className="text-cyan">{ds?.stats.followsThisWeek ?? 0}</span></div>
                <div>Views this week: <span className="text-cyan">{ds?.stats.viewsThisWeek ?? 0}</span></div>
                <div>Wishlists this week: <span className="text-cyan">{ds?.stats.wishlistsThisWeek ?? 0}</span></div>
                <div>Engagement: <span className="text-cyan">{`+${ds?.stats.commentsThisMonth ?? 0}`}</span> comments/mo</div>
              </div>
              <p className="mt-2 text-[0.5rem] text-muted-foreground">Full analytics coming soon. Data from studio dashboard.</p>
            </DashboardPanel>

            <DashboardPanel className="p-3">
              <p className="mb-3 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-foreground">Quick Actions</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ActionCard href="/dashboard/games/new" icon={<Rocket className="size-5" />} title="Create Game" body="Start a new project" />
                <ActionCard href="/dashboard/devlogs/new" icon={<FileText className="size-5" />} title="New Devlog" body="Share development" />
                <ActionCard href="/dashboard/media" icon={<UploadCloud className="size-5" />} title="Upload Media" body="Images, videos, files" />
                <ActionCard href="/dashboard/roadmap" icon={<Workflow className="size-5" />} title="Update Roadmap" body="Plan your progress" />
                <ActionCard href={studioSlug ? `/dashboard/studios/${studioSlug}/team` : '/studios/new'} icon={<Users className="size-5" />} title="Invite Team" body="Add members" />
                <ActionCard href="/dashboard/reports" icon={<BarChart3 className="size-5" />} title="Studio Reports" body="View performance" />
                <ActionCard href={studioSlug ? `/dashboard/studios/${studioSlug}` : '/studios/new'} icon={<Settings className="size-5" />} title="Studio Settings" body="Manage studio" />
              </div>
            </DashboardPanel>

            <div className="grid gap-3 2xl:grid-cols-[minmax(0,1.5fr)_0.7fr_0.7fr]">
              <DashboardPanel className="p-4">
                <SectionHeader title="My Games" href="/dashboard/games/new" linkLabel="Create game" />
                {gamesLoading ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-48 animate-pulse border border-border bg-muted/30" />)}
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {(studioGames.length ? studioGames : []).slice(0, 4).map((game) => (
                      <GameCard key={game.id} game={game} variant="studio" />
                    ))}
                    {studioGames.length === 0 && (
                      <Link href="/dashboard/games/new" className="col-span-full grid min-h-44 place-items-center border border-dashed border-border text-sm text-muted-foreground hover:border-cyan hover:text-cyan">
                        Create your first game
                      </Link>
                    )}
                  </div>
                )}
              </DashboardPanel>

              <DashboardPanel className="p-4">
                <SectionHeader title="Studio Activity" href="/dashboard/notifications" />
                <div className="mt-4 space-y-3">
                  {(notifications?.items?.length
                    ? notifications.items.map((n) => ({
                        title: n.title,
                        body: n.body ?? 'Notification',
                        time: relativeDays(n.createdAt),
                      }))
                    : buildActivity(studioGames, devlogs ?? [], auditLogs?.items ?? [])
                  ).slice(0, 5).map((item, index) => (
                    <ActivityRow key={`${item.title}-${index}`} title={item.title} body={item.body} time={item.time} />
                  ))}
                </div>
              </DashboardPanel>

              <DashboardPanel className="p-4">
                <SectionHeader title="Studio Progress" href="/dashboard/feed" linkLabel="Full analytics" />
                {ds && (
                  <div className="mt-5 grid place-items-center">
                    <div className="relative grid size-32 place-items-center rounded-full border-8 border-cyan/20">
                      <div className="absolute inset-[-8px] rounded-full border-8 border-transparent border-l-cyan border-t-cyan shadow-[0_0_24px_rgb(62_231_255_/_0.35)]" />
                      <div className="text-center">
                        <p className="font-display text-3xl">{ds.studioGrowth}%</p>
                        <p className="font-mono text-[0.58rem] text-muted-foreground">Studio Growth</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-5 space-y-3">
                  <ProgressItem label="Profile Complete" value={100} />
                  <ProgressItem label="Games Published" value={Math.min(100, (publishedGames / 20) * 100)} meta={`${publishedGames} / 20`} />
                  <ProgressItem label="Followers" value={Math.min(100, (followers / 50000) * 100)} meta={`${formatNumber(followers)} / 50K`} />
                  <ProgressItem label="Views This Month" value={ds ? Math.min(100, (ds.stats.viewsThisWeek / Math.max(1000, ds.stats.totalViews)) * 100) : 0} meta={ds ? `${formatNumber(ds.stats.viewsThisWeek)} / ${formatNumber(Math.max(1000, ds.stats.totalViews))}` : undefined} />
                </div>
              </DashboardPanel>
            </div>

            <div className="grid gap-3 xl:grid-cols-[1fr_1fr]">
              <AnalyticsPanel viewsByDay={ds?.viewsByDay} totalViews={views} wishlists={wishlists} />
              <RoadmapPanel items={roadmapItems ?? []} />
            </div>
          </section>
        </div>

        <div className="relative mx-auto mt-4 flex max-w-[1540px] items-center justify-between border border-border/70 bg-background/60 px-5 py-3 font-mono text-[0.58rem] uppercase tracking-[0.26em] text-muted-foreground clip-corner">
          <span className="flex items-center gap-3">Playmorrow Studio Console <span className="inline-flex gap-1">{Array.from({ length: 8 }).map((_, i) => <span key={i} className="h-2 w-1 bg-cyan" />)}</span></span>
          <span className="hidden sm:inline text-muted-foreground">{studio?.name || 'Studio'}</span>
          <span className="text-success">Connected</span>
        </div>
      </main>
    </>
  );
}

function StudioSidebar({ unreadCount, studioSlug }: { unreadCount: number; studioSlug: string }) {
  return (
    <aside className="hidden xl:block">
      <DashboardPanel className="sticky top-20 min-h-full p-3">
        <div className="border-b border-border/70 px-2 pb-3">
          <p className="flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-cyan">
            <Gauge className="size-3.5" /> Studio Dashboard
          </p>
        </div>
        <nav className="mt-3 space-y-1">
          <SidebarLink href="/dashboard" icon={<PanelLeft className="size-4" />} label="Overview" active />
          <SidebarLink href="/dashboard/games" icon={<Gamepad2 className="size-4" />} label="My Games" />
          <SidebarLink href="/dashboard/devlogs" icon={<FileText className="size-4" />} label="Devlogs" />
          <SidebarLink href="/dashboard/roadmap" icon={<Workflow className="size-4" />} label="Roadmap" />
          <SidebarLink href="/dashboard/reports" icon={<LineChart className="size-4" />} label="Reports" />
          <SidebarLink href="/dashboard/notifications" icon={<MessageSquare className="size-4" />} label="Activity" count={unreadCount} />
          <SidebarLink href={`/dashboard/studios/${studioSlug}/team`} icon={<ShieldCheck className="size-4" />} label="Team" />
          <SidebarLink href={`/dashboard/studios/${studioSlug}`} icon={<Settings className="size-4" />} label="Settings" />
        </nav>
        <div className="mt-5 overflow-hidden border border-border/70 p-3">
          <div className="relative min-h-24">
            <img src="/demo/games/neon-warden/hero.svg" alt="" className="absolute inset-y-0 right-[-20px] h-full w-24 object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
            <div className="relative">
              <p className="font-mono text-xs font-semibold text-violet">Need more power?</p>
              <p className="mt-1 max-w-[130px] text-[0.68rem] text-muted-foreground">Upgrade your studio tier</p>
              <Link href={`/dashboard/studios/${studioSlug}`} className="mt-3 inline-flex border border-coral/70 px-3 py-1.5 text-[0.68rem] text-coral">Upgrade Studio</Link>
            </div>
          </div>
        </div>
      </DashboardPanel>
    </aside>
  );
}

function StudioHero({ studio, studioName, studioTagline }: { studio: Studio; studioName: string; studioTagline: string }) {
  return (
    <div className="clip-corner border-b border-border/90 bg-[#050b0f]/88 shadow-[0_18px_70px_rgb(0_0_0_/_0.36)] overflow-hidden">
      <div className="relative min-h-[160px]">
        <img src={studio.bannerUrl || '/demo/games/neon-warden/hero.svg'} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_24%,rgb(255_87_77_/_0.06),transparent_18rem),linear-gradient(90deg,#020609_0%,rgb(2_6_9_/_0.35)_34%,rgb(2_6_9_/_0.08)_100%)]" />
        <div className="pointer-events-none absolute right-0 top-0 size-64 translate-x-32 -translate-y-32 rounded-full border border-cyan/10" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 size-32 rounded-full border border-coral/5" />
        <div className="absolute right-16 top-8 hidden text-coral drop-shadow-[0_0_20px_rgb(255_87_77_/_0.6)] lg:block">
          <Zap className="size-20 stroke-1" />
        </div>
        <div className="relative z-10 flex min-h-[160px] flex-col justify-between p-5 sm:p-7">
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-cyan">Welcome back,</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="font-display text-[clamp(2rem,4vw,3.1rem)] font-black uppercase leading-none text-white">{studioName}</h1>
              {studio.isVerified && <BadgeCheck className="size-6 fill-cyan text-background" />}
            </div>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">{studioTagline}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge icon={<ShieldCheck className="size-3" />} label={studio.isVerified ? 'Verified Studio' : 'Studio Account'} />
              <Badge icon={<Trophy className="size-3" />} label="Founder" />
            </div>
          </div>
          <Link href={`/dashboard/studios/${studio.slug}`} className="self-start border border-border-bright bg-background/60 px-4 py-2 text-xs text-foreground transition hover:border-cyan hover:text-cyan lg:self-end">
            Edit Studio Profile <ArrowRight className="inline size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, delta, tone }: { icon: React.ReactNode; label: string; value: string | number; delta?: string; tone: 'cyan' | 'coral' | 'violet' | 'amber' | 'muted' }) {
  const toneClass = tone === 'coral' ? 'text-coral' : tone === 'violet' ? 'text-violet' : tone === 'amber' ? 'text-amber' : tone === 'muted' ? 'text-muted-foreground' : 'text-cyan';
  const shadow = tone === 'cyan' ? 'shadow-[0_0_20px_rgb(62_231_255_/_0.12)]' : tone === 'coral' ? 'shadow-[0_0_20px_rgb(255_87_77_/_0.12)]' : '';
  return (
    <div className={`clip-corner border border-border/90 bg-background/55 p-4 transition hover:border-${tone}/50 ${shadow}`}>
      <div className="flex items-center gap-3">
        <span className={`${toneClass} drop-shadow-[0_0_8px_var(--tw-shadow-color)]`}>{icon}</span>
        <p className="font-display text-2xl font-semibold">{value}</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      {delta && <p className="mt-1 font-mono text-[0.58rem] text-success">{delta}</p>}
    </div>
  );
}

function ActionCard({ href, icon, title, body }: { href: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 border border-border/90 bg-background/45 px-4 py-3 transition hover:-translate-y-0.5 hover:border-cyan/70 hover:bg-cyan/10">
      <span className="text-cyan">{icon}</span>
      <span className="min-w-0">
        <span className="block truncate text-xs text-foreground">{title}</span>
        <span className="block truncate text-[0.68rem] text-muted-foreground">{body}</span>
      </span>
    </Link>
  );
}

function SectionHeader({ title, href, linkLabel = 'View all' }: { title: string; href: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="truncate font-mono text-[0.72rem] uppercase tracking-[0.18em] text-foreground">{title}</h2>
      <Link href={href} className="inline-flex shrink-0 items-center gap-2 font-mono text-[0.62rem] text-cyan hover:text-white">
        {linkLabel} <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}

function ActivityRow({ title, body, time }: { title: string; body: string; time: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-border/60 pb-3 last:border-0">
      <span className="grid size-9 place-items-center border border-cyan/40 bg-cyan/10 text-cyan"><Activity className="size-4" /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-foreground">{title}</p>
        <p className="truncate text-[0.68rem] text-muted-foreground">{body}</p>
      </div>
      <span className="font-mono text-[0.58rem] text-muted-foreground">{time}</span>
    </div>
  );
}

function AnalyticsPanel({ viewsByDay, totalViews, wishlists }: { viewsByDay?: { date: string; count: number }[]; totalViews: number; wishlists: number }) {
  const chartData = viewsByDay?.length ? viewsByDay : [];
  const maxCount = Math.max(...chartData.map(d => d.count), 1);
  return (
    <DashboardPanel className="p-4">
      <SectionHeader title="Game Analytics" href="/dashboard/feed" linkLabel="Open analytics" />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniMetric icon={<MonitorPlay className="size-4" />} label="Views" value={formatNumber(totalViews)} />
        <MiniMetric icon={<Heart className="size-4" />} label="Wishlists" value={formatNumber(wishlists)} />
        <MiniMetric icon={<Download className="size-4" />} label="Export Ready" value="CSV" />
      </div>
      <div className="mt-5 h-48 border border-border/80 bg-background/50 p-4">
        {chartData.length > 0 ? (
          <div className="flex h-full items-end gap-[3px]">
            {chartData.map((d) => (
              <span key={d.date} className="flex-1 bg-cyan/70 shadow-[0_0_12px_rgb(62_231_255_/_0.28)]" style={{ height: `${(d.count / maxCount) * 100}%` }} title={`${d.date}: ${d.count} views`} />
            ))}
          </div>
        ) : (
          <div className="grid h-full place-items-center text-[0.68rem] text-muted-foreground">No view data available</div>
        )}
      </div>
    </DashboardPanel>
  );
}

function RoadmapPanel({ items }: { items: RoadmapItem[] }) {
  const columns = [
    { status: 'PLANNED', title: 'Planning' },
    { status: 'IN_PROGRESS', title: 'In Development' },
    { status: 'DONE', title: 'Released' },
    { status: 'CANCELLED', title: 'Cancelled' },
  ] as const;

  if (!items.length) {
    return (
      <DashboardPanel className="p-4">
        <SectionHeader title="Game Roadmap" href="/dashboard/roadmap" linkLabel="Open roadmap" />
        <div className="mt-4 grid place-items-center py-12 text-[0.68rem] text-muted-foreground">
          No roadmap items yet. <Link href="/dashboard/roadmap" className="text-cyan hover:underline">Create one</Link>
        </div>
      </DashboardPanel>
    );
  }

  const knownStatuses = new Set<string>(columns.map(c => c.status));
  const otherItems = items.filter(i => !knownStatuses.has(i.status));
  const grouped = [
    ...columns.map((col) => ({
      ...col,
      items: items.filter((i) => i.status === col.status),
    })),
    ...(otherItems.length ? [{ status: 'OTHER', title: 'Other', items: otherItems }] : []),
  ];

  return (
    <DashboardPanel className="p-4">
      <SectionHeader title="Game Roadmap" href="/dashboard/roadmap" linkLabel="Open roadmap" />
      <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(grouped.length, 5)}, minmax(0, 1fr))` }}>
        {grouped.map((column) => (
          <div key={column.status} className="min-h-36 border border-border/80 bg-background/45 p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-foreground">{column.title}</p>
              <span className="text-[0.62rem] text-muted-foreground">{column.items.length}</span>
            </div>
            <div className="space-y-2">
              {column.items.slice(0, 5).map((item) => (
                <Link key={item.id} href="/dashboard/roadmap" className="block border border-border/70 bg-muted/20 p-2 text-[0.68rem] text-muted-foreground transition hover:border-cyan hover:text-foreground">
                  <span className="block truncate text-foreground">{item.title}</span>
                  {item.targetDate && <span>{new Date(item.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}

function MiniMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border border-border/80 bg-background/45 p-3">
      <p className="flex items-center gap-2 text-cyan">{icon}<span className="font-display text-xl text-foreground">{value}</span></p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ProgressItem({ label, value, meta }: { label: string; value: number; meta?: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[0.68rem]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-cyan">{meta ?? `${Math.round(value)}%`}</span>
      </div>
      <ProgressBar value={Math.max(0, Math.min(100, value))} />
    </div>
  );
}

function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return <div className={`h-1.5 bg-border ${className}`}><div className="h-full bg-cyan shadow-[0_0_12px_rgb(62_231_255_/_0.55)]" style={{ width: `${value}%` }} /></div>;
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <span className="inline-flex items-center gap-2 border border-border-bright bg-background/60 px-3 py-1.5 font-mono text-[0.62rem] text-foreground">{icon}{label}</span>;
}

function buildActivity(games: Game[], devlogs: { title: string }[], auditLogs: { action: string; createdAt: string }[]) {
  const items: { title: string; body: string; time: string }[] = [];
  if (games[0]) {
    items.push({ title: `${games[0].title}`, body: `${formatNumber(games[0].followersCount)} followers`, time: relativeDays(games[0].createdAt) });
  }
  if (devlogs[0]) {
    items.push({ title: `Devlog: ${devlogs[0].title}`, body: 'Development update published', time: 'Recently' });
  }
  for (const log of auditLogs.slice(0, 3)) {
    items.push({ title: log.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()), body: 'Studio activity', time: relativeDays(log.createdAt) });
  }
  if (!items.length) {
    items.push({ title: 'Welcome to your studio', body: 'Start creating games and sharing devlogs', time: '' });
  }
  return items;
}

function formatDelta(value: number): string {
  if (value <= 0) return '';
  return `+${formatNumber(value)} this week`;
}

function formatNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return String(value);
}

function formatMonthYear(date: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(date));
}

function relativeDays(date: string) {
  const diff = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 86_400_000));
  return `${diff}d ago`;
}
