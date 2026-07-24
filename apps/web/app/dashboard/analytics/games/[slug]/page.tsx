'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Eye, Heart, Target, MessageSquare, MonitorPlay,
  TrendingUp, TrendingDown, Globe, Calendar,
} from 'lucide-react';
import {
  LineChart, Line, Area, AreaChart, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

import { SiteHeader } from '@/components/site-header';
import { DashboardPanel } from '@/components/dashboard/shared';
import { useGame } from '@/lib/api/hooks';
import { useGameAnalytics, useGameAnalyticsTimeSeries, useGameAnalyticsTraffic, useGameAnalyticsCountries } from '@/lib/api/hooks';

const CHART_COLORS = { cyan: '#3ee7ff', coral: '#ff554d', violet: '#a78bfa', amber: '#f59e0b', teal: '#14b8a6' };
const CHART_COLORS_ARRAY = ['#3ee7ff', '#ff554d', '#a78bfa', '#f59e0b', '#14b8a6', '#06b6d4', '#f97316', '#ec4899'];

export default function GameAnalyticsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: game, isLoading: gameLoading } = useGame(slug);
  const [days, setDays] = useState(30);
  const { data: analytics, isLoading, error } = useGameAnalytics(slug);
  const { data: timeSeries } = useGameAnalyticsTimeSeries(slug, 'view', days);
  const { data: traffic } = useGameAnalyticsTraffic(slug);
  const { data: countries } = useGameAnalyticsCountries(slug);

  const chartData = timeSeries ?? analytics?.dailyViews ?? [];

  return (
    <>
      <SiteHeader />
      <main className="relative overflow-hidden bg-[#020609] px-3 pb-4 pt-3 text-foreground sm:px-5">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

        <div className="relative mx-auto max-w-[1540px]">
          <div className="mb-4 flex items-center gap-3 p-3">
            <Link href="/dashboard/analytics" className="text-muted-foreground hover:text-cyan transition-colors">
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <h1 className="font-display text-2xl font-black uppercase tracking-tight text-white">
                {gameLoading ? 'Loading...' : game?.title ?? 'Game Analytics'}
              </h1>
              <p className="font-mono text-[0.55rem] text-muted-foreground">{slug}</p>
            </div>
          </div>

          {isLoading && !analytics ? <GameAnalyticsSkeleton /> : error ? <GameAnalyticsError /> : analytics ? (
            <>
              <GameStatCards analytics={analytics} />
              <GameChartSection data={chartData} days={days} onDaysChange={setDays} />
              <div className="grid gap-3 mt-3 xl:grid-cols-[1fr_1fr]">
                <GameTrafficCard traffic={traffic ?? analytics.trafficSources} />
                <GameCountriesCard countries={countries ?? analytics.countries} />
              </div>
            </>
          ) : (
            <GameAnalyticsEmpty />
          )}
        </div>
      </main>
    </>
  );
}

function GameStatCards({ analytics }: { analytics: { totalViews: number; uniqueVisitors: number; totalWishlists: number; totalFollowers: number; totalComments: number; viewsGrowth: number; wishlistsGrowth: number; followersGrowth: number } }) {
  const cards = [
    { icon: <MonitorPlay className="size-5" />, label: 'Total Views', value: analytics.totalViews, growth: analytics.viewsGrowth, tone: 'cyan' as const },
    { icon: <Eye className="size-5" />, label: 'Unique Visitors', value: analytics.uniqueVisitors, growth: 0, tone: 'violet' as const },
    { icon: <Heart className="size-5" />, label: 'Followers', value: analytics.totalFollowers, growth: analytics.followersGrowth, tone: 'coral' as const },
    { icon: <Target className="size-5" />, label: 'Wishlists', value: analytics.totalWishlists, growth: analytics.wishlistsGrowth, tone: 'amber' as const },
    { icon: <MessageSquare className="size-5" />, label: 'Comments', value: analytics.totalComments, growth: 0, tone: 'teal' as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 p-3 md:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => (
        <GameStatCard key={card.label} {...card} />
      ))}
    </div>
  );
}

function GameStatCard({ icon, label, value, growth, tone }: { icon: React.ReactNode; label: string; value: number; growth: number; tone: string }) {
  const iconClass = tone === 'cyan' ? 'text-cyan' : tone === 'coral' ? 'text-coral' : tone === 'violet' ? 'text-violet' : tone === 'amber' ? 'text-amber' : 'text-teal';
  const shadow = tone === 'cyan' ? 'shadow-[0_0_20px_rgb(62_231_255_/_0.12)]' : tone === 'coral' ? 'shadow-[0_0_20px_rgb(255_87_77_/_0.12)]' : '';

  return (
    <div className={`clip-corner border border-border/90 bg-background/55 p-4 ${shadow}`}>
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

function GameChartSection({ data, days, onDaysChange }: { data: { date: string; count: number }[]; days: number; onDaysChange: (d: number) => void }) {
  const filtered = days === 90 ? data : data.slice(-days);

  return (
    <DashboardPanel className="p-4 mx-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-foreground">Views Over Time</h2>
        <div className="flex gap-2">
          {([7, 30, 90] as const).map((d) => (
            <button
              key={d}
              onClick={() => onDaysChange(d)}
              className={`px-3 py-1 font-mono text-[0.58rem] uppercase tracking-wider transition ${
                days === d ? 'bg-cyan/15 text-cyan border border-cyan/30' : 'text-muted-foreground border border-border/60 hover:text-foreground'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>
      <div className="h-72">
        {filtered.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filtered} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gameViewsGradient" x1="0" y1="0" x2="0" y2="1">
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
              <YAxis tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#050b0f', border: '1px solid rgba(62,231,255,0.2)', borderRadius: 0, fontSize: 12, fontFamily: 'monospace' }}
                labelStyle={{ color: '#3ee7ff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="count" stroke={CHART_COLORS.cyan} fill="url(#gameViewsGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center text-[0.68rem] text-muted-foreground">No view data available for this period</div>
        )}
      </div>
    </DashboardPanel>
  );
}

function GameTrafficCard({ traffic }: { traffic: { source: string; count: number; percentage: number }[] }) {
  const data = traffic.length > 0 ? traffic : [];
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
        <div className="grid h-48 place-items-center text-[0.68rem] text-muted-foreground">No traffic data</div>
      )}
    </DashboardPanel>
  );
}

function GameCountriesCard({ countries }: { countries: { country: string; count: number }[] }) {
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
        <div className="grid h-48 place-items-center text-[0.68rem] text-muted-foreground">No country data</div>
      )}
    </DashboardPanel>
  );
}

function GameAnalyticsSkeleton() {
  return (
    <div className="space-y-3 p-3 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
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

function GameAnalyticsError() {
  return (
    <div className="grid place-items-center py-20 text-center">
      <Eye className="mx-auto mb-3 size-10 text-coral" />
      <p className="font-mono text-[0.6rem] uppercase tracking-widest text-coral">Failed to load game analytics</p>
    </div>
  );
}

function GameAnalyticsEmpty() {
  return (
    <div className="grid place-items-center py-20 text-center">
      <Eye className="mx-auto mb-3 size-10 text-muted-foreground/30" />
      <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">No analytics data yet</p>
    </div>
  );
}

function formatValue(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return String(value);
}
