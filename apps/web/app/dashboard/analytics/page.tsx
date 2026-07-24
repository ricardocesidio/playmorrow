'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BarChart3, Eye, Heart, Target, MessageSquare, Users, Gamepad2,
  TrendingUp, TrendingDown, Globe, ArrowUpRight, MonitorPlay,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';

import { SiteHeader } from '@/components/site-header';
import { DashboardPanel } from '@/components/dashboard/shared';
import { useAuth } from '@/lib/api/auth-context';
import { useMyStudios, useMyGames, useStudioAnalytics } from '@/lib/api/hooks';
import type { Game } from '@/lib/api/client';

const CHART_COLORS = { cyan: '#3ee7ff', coral: '#ff554d', violet: '#a78bfa', amber: '#f59e0b', teal: '#14b8a6', pink: '#ec4899' };
const CHART_COLORS_ARRAY = ['#3ee7ff', '#ff554d', '#a78bfa', '#f59e0b', '#14b8a6', '#ec4899', '#06b6d4', '#f97316'];

export default function StudioAnalyticsPage() {
  const { token } = useAuth();
  const { data: studios } = useMyStudios(token ?? undefined);
  const { data: games } = useMyGames(token ?? undefined);
  const studio = studios?.[0];
  const { data: analytics, isLoading, error } = useStudioAnalytics(studio?.slug ?? '');

  const studioGames = (games ?? []) as Game[];

  if (!studio) {
    return (
      <>
        <SiteHeader />
        <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="relative mx-auto max-w-7xl text-center py-20">
            <BarChart3 className="mx-auto mb-4 size-12 text-muted-foreground/30" />
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Create a studio to view analytics</p>
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

        <div className="relative mx-auto max-w-[1540px]">
          <div className="mb-6 flex items-center gap-3 p-3">
            <BarChart3 className="size-6 text-cyan" />
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Studio Analytics</h1>
            <span className="ml-auto font-mono text-[0.55rem] text-muted-foreground">{studio.name}</span>
          </div>

          {isLoading ? <AnalyticsSkeleton /> : error ? <AnalyticsError /> : analytics ? (
            <>
              <StatCards analytics={analytics} />
              <ChartSection analytics={analytics} />
              <div className="grid gap-3 mt-3 xl:grid-cols-[1fr_1fr]">
                <TrafficSourcesCard sources={analytics.trafficSources} />
                <CountriesCard countries={analytics.countries} />
              </div>
              <TopGamesCard games={analytics.topGames} />
            </>
          ) : (
            <EmptyState />
          )}
        </div>
      </main>
    </>
  );
}

function StatCards({ analytics }: { analytics: { totalViews: number; uniqueVisitors: number; totalWishlists: number; totalFollowers: number; totalComments: number; viewsGrowth: number; wishlistsGrowth: number; followersGrowth: number; totalGames: number; gamesGrowth: number } }) {
  const cards = [
    { icon: <MonitorPlay className="size-5" />, label: 'Total Views', value: analytics.totalViews, growth: analytics.viewsGrowth, tone: 'cyan' as const },
    { icon: <Users className="size-5" />, label: 'Unique Visitors', value: analytics.uniqueVisitors, growth: 0, tone: 'violet' as const },
    { icon: <Heart className="size-5" />, label: 'Followers', value: analytics.totalFollowers, growth: analytics.followersGrowth, tone: 'coral' as const },
    { icon: <Target className="size-5" />, label: 'Wishlists', value: analytics.totalWishlists, growth: analytics.wishlistsGrowth, tone: 'amber' as const },
    { icon: <MessageSquare className="size-5" />, label: 'Comments', value: analytics.totalComments, growth: 0, tone: 'teal' as const },
    { icon: <Gamepad2 className="size-5" />, label: 'Total Games', value: analytics.totalGames, growth: analytics.gamesGrowth, tone: 'cyan' as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 p-3 md:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <AnalyticsStatCard key={card.label} {...card} />
      ))}
    </div>
  );
}

function AnalyticsStatCard({ icon, label, value, growth, tone }: { icon: React.ReactNode; label: string; value: number; growth: number; tone: string }) {
  const toneClass = tone === 'cyan' ? 'text-cyan border-cyan/30' : tone === 'coral' ? 'text-coral border-coral/30' : tone === 'violet' ? 'text-violet border-violet/30' : tone === 'amber' ? 'text-amber border-amber/30' : 'text-teal border-teal/30';
  const iconClass = tone === 'cyan' ? 'text-cyan' : tone === 'coral' ? 'text-coral' : tone === 'violet' ? 'text-violet' : tone === 'amber' ? 'text-amber' : 'text-teal';
  const shadow = tone === 'cyan' ? 'shadow-[0_0_20px_rgb(62_231_255_/_0.12)]' : tone === 'coral' ? 'shadow-[0_0_20px_rgb(255_87_77_/_0.12)]' : '';

  return (
    <div className={`clip-corner border border-border/90 bg-background/55 p-4 transition hover:border-${tone}/50 ${shadow}`}>
      <div className="flex items-center gap-3">
        <span className={iconClass}>{icon}</span>
        <p className="font-display text-2xl font-semibold">{formatValue(value)}</p>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        {growth !== 0 && (
          <span className={`flex items-center gap-1 font-mono text-[0.58rem] ${growth > 0 ? 'text-success' : 'text-coral'}`}>
            {growth > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {Math.abs(growth).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

function ChartSection({ analytics }: { analytics: { dailyViews: { date: string; count: number }[]; totalViews: number } }) {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const data = analytics.dailyViews ?? [];

  const filteredData = range === '7d' ? data.slice(-7) : range === '30d' ? data.slice(-30) : data;

  return (
    <DashboardPanel className="p-4 mx-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-foreground">Daily Views</h2>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 font-mono text-[0.58rem] uppercase tracking-wider transition ${
                range === r ? 'bg-cyan/15 text-cyan border border-cyan/30' : 'text-muted-foreground border border-border/60 hover:text-foreground'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="h-72">
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.cyan} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.cyan} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(62,231,255,0.08)" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
                axisLine={{ stroke: 'rgba(62,231,255,0.15)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#050b0f',
                  border: '1px solid rgba(62,231,255,0.2)',
                  borderRadius: 0,
                  fontSize: 12,
                  fontFamily: 'monospace',
                }}
                labelStyle={{ color: '#3ee7ff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="count" stroke={CHART_COLORS.cyan} fill="url(#viewsGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center text-[0.68rem] text-muted-foreground">No view data available</div>
        )}
      </div>
    </DashboardPanel>
  );
}

function TrafficSourcesCard({ sources }: { sources: { source: string; count: number; percentage: number }[] }) {
  const data = sources.length > 0 ? sources : [];
  const pieData = data.map((s) => ({ name: s.source, value: s.count }));

  return (
    <DashboardPanel className="p-4">
      <h2 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-foreground">Traffic Sources</h2>
      {pieData.length > 0 ? (
        <div className="flex items-center gap-4">
          <div className="h-48 w-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS_ARRAY[i % CHART_COLORS_ARRAY.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#050b0f', border: '1px solid rgba(62,231,255,0.2)', borderRadius: 0, fontSize: 12, fontFamily: 'monospace' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {data.map((s, i) => (
              <div key={s.source} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="size-2.5" style={{ backgroundColor: CHART_COLORS_ARRAY[i % CHART_COLORS_ARRAY.length] }} />
                  <span className="text-xs text-muted-foreground">{s.source}</span>
                </div>
                <span className="font-mono text-[0.62rem] text-foreground">{s.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid h-48 place-items-center text-[0.68rem] text-muted-foreground">No traffic data available</div>
      )}
    </DashboardPanel>
  );
}

function CountriesCard({ countries }: { countries: { country: string; count: number }[] }) {
  const data = countries.length > 0 ? countries.slice(0, 10) : [];
  const maxCount = Math.max(...data.map((c) => c.count), 1);

  return (
    <DashboardPanel className="p-4">
      <h2 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-foreground">Top Countries</h2>
      {data.length > 0 ? (
        <div className="space-y-3">
          {data.map((c) => (
            <div key={c.country} className="flex items-center gap-3">
              <span className="w-24 truncate text-xs text-muted-foreground">{c.country}</span>
              <div className="flex-1 h-4 bg-border/30">
                <div className="h-full bg-gradient-to-r from-cyan to-violet" style={{ width: `${(c.count / maxCount) * 100}%` }} />
              </div>
              <span className="w-12 text-right font-mono text-[0.62rem] text-foreground">{formatValue(c.count)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid h-48 place-items-center text-[0.68rem] text-muted-foreground">No country data available</div>
      )}
    </DashboardPanel>
  );
}

function TopGamesCard({ games }: { games: { gameId: string; title: string; slug: string; views: number; wishlists: number; followers: number }[] }) {
  if (!games.length) {
    return (
      <DashboardPanel className="p-4 mx-3 mt-3">
        <h2 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-foreground">Top Performing Games</h2>
        <div className="grid place-items-center py-12 text-[0.68rem] text-muted-foreground">No game data yet</div>
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel className="p-4 mx-3 mt-3">
      <h2 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-foreground">Top Performing Games</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-[0.62rem]">
          <thead>
            <tr className="border-b border-border/60 text-muted-foreground">
              <th className="pb-3 pr-4 font-medium">Game</th>
              <th className="pb-3 pr-4 font-medium text-right">Views</th>
              <th className="pb-3 pr-4 font-medium text-right">Wishlists</th>
              <th className="pb-3 font-medium text-right">Followers</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g) => (
              <tr key={g.gameId} className="border-b border-border/30 hover:bg-cyan/5 transition-colors">
                <td className="py-3 pr-4">
                  <Link href={`/dashboard/analytics/games/${g.slug}`} className="flex items-center gap-2 text-foreground hover:text-cyan transition-colors">
                    {g.title} <ArrowUpRight className="size-3 shrink-0" />
                  </Link>
                </td>
                <td className="py-3 pr-4 text-right text-cyan">{formatValue(g.views)}</td>
                <td className="py-3 pr-4 text-right text-amber">{formatValue(g.wishlists)}</td>
                <td className="py-3 text-right text-coral">{formatValue(g.followers)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardPanel>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-3 p-3 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="clip-corner border border-border/40 bg-[#050b0f]/40 p-4">
            <div className="h-3 w-16 bg-border/30 mb-3" />
            <div className="h-6 w-12 bg-border/40" />
          </div>
        ))}
      </div>
      <div className="clip-corner border border-border/40 bg-[#050b0f]/40 p-4 h-72" />
    </div>
  );
}

function AnalyticsError() {
  return (
    <div className="grid place-items-center py-20 text-center">
      <BarChart3 className="mx-auto mb-3 size-10 text-coral" />
      <p className="font-mono text-[0.6rem] uppercase tracking-widest text-coral">Failed to load analytics</p>
      <p className="mt-2 text-[0.68rem] text-muted-foreground">Check that the backend analytics endpoints are available</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid place-items-center py-20 text-center">
      <BarChart3 className="mx-auto mb-3 size-10 text-muted-foreground/30" />
      <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">No analytics data yet</p>
      <p className="mt-2 text-[0.68rem] text-muted-foreground">Data will appear once your games start receiving views</p>
    </div>
  );
}

function formatValue(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return String(value);
}
