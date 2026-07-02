'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowDown,
  ArrowRight,
  Bookmark,
  CircleDot,
  Flame,
  Hexagon,
  MessageCircle,
  Play,
  Radio,
  Users,
  Zap,
} from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { CircuitFrame, HudPanel, HudStatusRail } from '@/components/playmorrow/hud';
import { usePublicFeed } from '@/lib/api/hooks';
import type { FeedItem } from '@/lib/api/client';

type Transmission = {
  id: string;
  href: string;
  time: string;
  type: 'DEVLOG' | 'ROADMAP' | 'MILESTONE' | 'RELEASE';
  studio: string;
  game: string;
  title: string;
  summary: string;
  image: string;
  accent: 'cyan' | 'violet' | 'amber' | 'coral';
  metric?: string;
  video?: boolean;
  stats: [number, number, number, number] | null;
};

export default function FeedPage() {
  const { data, isLoading, error } = usePublicFeed(1, 20);
  const rawItems = Array.isArray(data?.items) ? data.items : undefined;
  const isExplicitEmpty = !!rawItems && rawItems.length === 0 && data?.total === 0;
  const transmissions = rawItems ? rawItems.map(feedItemToTransmission) : [];

  return (
    <>
      <SiteHeader />
      <main className="relative flex-1 overflow-hidden px-5 pb-28 pt-4 sm:px-8 lg:px-10">
        <CircuitFrame className="opacity-65" />
        <div className="relative z-10 mx-auto max-w-[1480px]">
          <header className="mb-3 grid gap-3 lg:grid-cols-[auto_1fr] lg:items-end">
            <div className="flex items-center gap-4">
              <span className="relative grid size-10 place-items-center rounded-full border border-coral/60 bg-coral/10 text-coral shadow-[0_0_24px_rgb(255_87_77_/_0.35)]">
                <span className="absolute size-5 rounded-full border border-coral/45" />
                <CircleDot className="size-4 fill-coral" />
              </span>
              <span className="pm-display text-lg text-coral">Live</span>
            </div>
            <div className="relative">
              <h1 className="font-display text-[2.7rem] font-black uppercase leading-none text-foreground sm:text-6xl lg:text-[3.35rem]">
                Live from development
              </h1>
              <p className="mt-1 text-base text-muted-foreground">
                Updates directly from the studios building what's next.
              </p>
              <div className="pointer-events-none absolute right-0 top-1/2 hidden h-px w-[48%] bg-gradient-to-r from-cyan/45 via-border to-transparent lg:block" />
            </div>
          </header>

          <div className="grid gap-5 xl:grid-cols-[1fr_430px]">
            <section>
              <HudPanel className="overflow-hidden p-0" accent="muted">
                <SignalTabs />

                {error && !isLoading && <div className="p-6"><ErrorState message="Could not load feed." /></div>}

                {!isLoading && !error && isExplicitEmpty && (
                  <div className="p-6">
                    <EmptyState icon={<Radio className="size-10" />} title="No activity yet" />
                  </div>
                )}

                {!error && !isExplicitEmpty && (
                  <div className="relative">
                    <div className="absolute bottom-0 left-[94px] top-0 hidden w-px bg-cyan/35 shadow-[0_0_12px_rgb(62_231_255_/_0.4)] md:block" />
                    <div className="grid">
                      {transmissions.map((item) => (
                        <TransmissionRow key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )}
              </HudPanel>

              {!error && !isExplicitEmpty && (
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    className="clip-corner inline-flex h-10 min-w-[320px] items-center justify-center gap-3 border border-cyan/70 bg-cyan/5 px-8 pm-display text-xs text-cyan transition hover:bg-cyan hover:text-cyan-foreground"
                  >
                    Load more transmissions <ArrowDown className="size-4" />
                  </button>
                </div>
              )}
            </section>

            <aside className="grid gap-5">
              <YourSignalPanel />
            </aside>
          </div>
        </div>
        <HudStatusRail />
      </main>
    </>
  );
}

function SignalTabs() {
  const [activeTab, setActiveTab] = useState('All signals');
  const [followingOnly, setFollowingOnly] = useState(false);

  return (
    <div className="grid border-b border-border/80 bg-background/55 text-muted-foreground md:grid-cols-[150px_1fr_1fr_1fr_1fr_190px]">
      {['All signals', 'Devlogs', 'Roadmap', 'Releases', 'Milestones'].map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`relative h-12 cursor-pointer border-b border-r border-border/55 px-4 pm-micro transition md:border-b-0 ${
              isActive
                ? 'bg-cyan/8 text-cyan after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-cyan after:shadow-[0_0_12px_rgb(62_231_255_/_0.85)]'
                : 'hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => setFollowingOnly(!followingOnly)}
        className="flex h-12 cursor-pointer items-center justify-center gap-3 px-4 pm-micro hover:text-foreground"
      >
        <span className={`relative h-4 w-8 rounded-full border transition-colors ${
          followingOnly
            ? 'border-cyan bg-cyan/20'
            : 'border-border-bright bg-background'
        }`}>
          <span className={`absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full transition-all ${
            followingOnly
              ? 'left-[18px] bg-cyan shadow-[0_0_6px_rgb(62_231_255_/_0.8)]'
              : 'left-1 bg-muted-foreground'
          }`} />
        </span>
        Following only
      </button>
    </div>
  );
}

function TransmissionRow({ item }: { item: Transmission }) {
  const accent = accentClasses(item.accent);

  return (
    <article className="grid border-b border-border/70 last:border-b-0 md:h-[150px] md:grid-cols-[112px_1fr]">
      <div className="relative hidden px-6 py-6 md:block">
        <div className="text-start text-sm text-muted-foreground">{item.time}</div>
        <span className="absolute right-[10px] top-9 size-3 rounded-full border border-cyan bg-elevated shadow-[0_0_12px_rgb(62_231_255_/_0.75)]" />
      </div>

      <Link href={item.href} className="group relative grid gap-4 overflow-hidden p-4 transition hover:bg-cyan/[0.025] md:h-full md:grid-cols-[1fr_46%] md:p-4">
        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <span className={`grid size-9 shrink-0 place-items-center border bg-background/70 ${accent.border}`}>
              {iconForAccent(item.accent)}
            </span>
            <div className="min-w-0">
              <p className="pm-display text-xs text-foreground">
                {item.studio} <span className="text-muted-foreground">●</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {verbForType(item.type)} for <span className="uppercase">{item.game}</span>
              </p>
            </div>
          </div>

          <h2 className={`mt-2 line-clamp-2 text-xs leading-5 ${item.metric ? 'text-foreground' : 'text-foreground'}`}>
            {item.metric ?? item.title}
          </h2>
          {item.metric && <h3 className="sr-only">{item.title}</h3>}
          {item.summary && <p className="mt-2 line-clamp-2 max-w-[520px] leading-5 text-muted-foreground md:line-clamp-1">{item.summary}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-5 border-t border-border/50 pt-2 text-xs text-muted-foreground md:absolute md:bottom-3 md:left-4 md:right-[calc(46%+1rem)] md:mt-0 md:bg-elevated/70 md:pt-2">
            {item.stats && (
              <>
                <Stat icon={<MessageCircle className="size-4" />} value={item.stats[0]} />
                <Stat icon={<Flame className="size-4 text-coral" />} value={item.stats[1]} />
                <Stat icon={<Activity className="size-4 text-cyan" />} value={item.stats[2]} />
                <Stat icon={<Bookmark className="size-4" />} value={item.stats[3]} />
              </>
            )}
          </div>
        </div>

        <div className="relative min-h-[120px] overflow-hidden border border-border-bright/65 bg-muted md:h-full md:min-h-0">
          {item.image ? (
            <img src={item.image} alt={`${item.game} key art`} className="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-[1.03]" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/10" />{item.video && (
            <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-foreground/30 bg-background/55 text-foreground backdrop-blur-sm">
              <Play className="ml-1 size-6 fill-current" />
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: number | null }) {
  if (value === null) return null;
  return (
    <span className="inline-flex items-center gap-2 text-xs">
      {icon} {value}
    </span>
  );
}

function feedItemToTransmission(item: FeedItem): Transmission {
  return {
    id: item.id,
    href: item.type === 'DEVLOG' ? `/devlogs/${item.target.id}` : `/games/${item.game.slug}`,
    time: relativeTime(item.createdAt),
    type: item.type === 'DEVLOG' ? 'DEVLOG' : 'ROADMAP',
    studio: item.studio.name,
    game: item.game.title,
    title: item.title,
    summary: item.summary,
    image: item.game.coverUrl ?? '',
    accent: item.type === 'DEVLOG' ? 'cyan' : 'amber',
    stats: null,
  };
}

function YourSignalPanel() {
  return (
    <HudPanel className="p-7" accent="muted">
      <h2 className="pm-micro mb-6 flex items-center gap-4 text-foreground">
        Your signal <span className="h-px flex-1 bg-border-bright/35" />
      </h2>
      <div className="grid grid-cols-[88px_1fr] items-center gap-5">
        <div className="grid size-20 place-items-center border border-cyan/55 text-cyan shadow-[0_0_22px_rgb(62_231_255_/_0.12)]">
          <Hexagon className="size-11" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Follow studios and games</p>
          <p className="mt-2 font-display text-2xl font-black uppercase tracking-[0.18em] text-foreground">Stay tuned</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Get updates from the games you care about.</p>
        </div>
      </div>
      <PanelLink href="/dashboard/feed">Manage following</PanelLink>
    </HudPanel>
  );
}

function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="mt-5 flex items-center justify-end gap-3 pm-micro text-coral transition hover:text-foreground">
      {children} <ArrowRight className="size-4" />
    </Link>
  );
}

function relativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'now';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function verbForType(type: Transmission['type']) {
  if (type === 'DEVLOG') return 'posted a devlog';
  if (type === 'ROADMAP') return 'moved the roadmap';
  if (type === 'MILESTONE') return 'reached a milestone';
  return 'opened playtest signups';
}

function iconForAccent(accent: Transmission['accent']) {
  if (accent === 'violet') return <Zap className="size-5 text-violet" />;
  if (accent === 'amber') return <Hexagon className="size-5 text-amber" />;
  if (accent === 'coral') return <Flame className="size-5 text-coral" />;
  return <Activity className="size-5 text-foreground" />;
}

function accentClasses(accent: Transmission['accent']) {
  if (accent === 'violet') return { text: 'text-violet', border: 'border-violet/65' };
  if (accent === 'amber') return { text: 'text-amber', border: 'border-amber/65' };
  if (accent === 'coral') return { text: 'text-coral', border: 'border-coral/65' };
  return { text: 'text-cyan', border: 'border-border-bright/70' };
}
