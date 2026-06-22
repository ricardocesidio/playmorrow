'use client';

import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Bookmark,
  Check,
  Flame,
  Radio,
  SquarePlay,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { StatusBadge } from '@/components/status-badge';
import { CircuitFrame, HudPanel, HudStatusRail } from '@/components/playmorrow/hud';
import { usePublicFeed, useGames } from '@/lib/api/hooks';
import type { Game } from '@/lib/api/client';

const fallbackGames = [
  {
    id: 'home-starfall',
    title: 'Starfall Tactics',
    slug: 'starfall-tactics',
    status: 'IN_DEVELOPMENT',
    coverUrl: '/playmorrow/starfall-tactics.png',
    followersCount: 8700,
    studio: { name: 'Ironlight Studios', slug: 'ironlight-studios' },
    tags: ['Tactical RPG', 'Space Opera'],
  },
  {
    id: 'home-mossbound',
    title: 'Mossbound',
    slug: 'mossbound',
    status: 'ALPHA',
    coverUrl: '/playmorrow/mossbound.png',
    followersCount: 5100,
    studio: { name: 'Wildbriar', slug: 'wildbriar' },
    tags: ['Adventure', 'Atmospheric'],
  },
  {
    id: 'home-paper',
    title: 'Paper Relics',
    slug: 'paper-relics',
    status: 'PRE_ALPHA',
    coverUrl: '/playmorrow/paper-relics.png',
    followersCount: 3200,
    studio: { name: 'Second Story Games', slug: 'second-story-games' },
    tags: ['Card Battler', 'Roguelike'],
  },
];

const liveItems = [
  { icon: <SquarePlay className="size-4" />, title: 'Starfall Tactics', body: 'released a devlog', time: '2m ago' },
  { icon: <Flame className="size-4 text-coral" />, title: 'Voidrunner', body: 'hit 10K wishlists!', time: '5m ago' },
  { icon: <Activity className="size-4" />, title: 'Paper Relics', body: 'updated their roadmap', time: '12m ago' },
  { icon: <UserPlus className="size-4" />, title: 'Mossbound', body: 'is now following you', time: '18m ago' },
];

export default function HomePage() {
  const { data: feedData } = usePublicFeed(1, 4);
  const { data: gamesData } = useGames(1, 4);

  const latestGames = normalizeLatestGames(gamesData?.items);

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen overflow-hidden bg-background px-5 pb-24 pt-4 sm:px-8 lg:px-10">
        <CircuitFrame className="opacity-60" />
        <div className="relative z-10 mx-auto max-w-[1500px]">
          <section className="grid gap-7 lg:grid-cols-[0.92fr_1.08fr]">
            <HudPanel className="flex min-h-[438px] items-center px-6 py-8 sm:px-12 lg:px-14" accent="muted">
              <div className="max-w-[620px]">
                <div className="pm-micro mb-6 flex items-center gap-4 text-cyan">
                  <span>The indie development network</span>
                  <span className="h-px w-28 bg-gradient-to-r from-cyan/70 to-transparent" />
                </div>
                <h1 className="font-display text-[3.25rem] font-black leading-[1.06] text-foreground sm:text-[3.8rem] lg:text-[4.15rem]">
                  Follow games<br />while they&apos;re<br />being made.
                </h1>
                <p className="mt-5 max-w-[520px] text-base leading-7 text-muted-foreground">
                  Discover games in development, follow studios, and get real-time updates from the creators.
                </p>
                <div className="mt-8 grid gap-5 text-sm text-muted-foreground sm:grid-cols-3">
                  <HeroSignal icon={<Radio className="size-7" />} title="Live updates" body="From the source" />
                  <HeroSignal icon={<Users className="size-7" />} title="Build your feed" body="Follow what matters" />
                  <HeroSignal icon={<Activity className="size-7" />} title="Back indie" body="Fuel what's next" />
                </div>
              </div>
            </HudPanel>

            <FeaturedGameCard />
          </section>

          <LiveTicker feedCount={feedData?.items.length ?? 0} />

          <HudPanel className="mt-5 px-4 py-5 sm:px-7" accent="muted">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="pm-display flex items-center gap-3 text-base text-foreground">
                <span className="text-coral">...</span> Latest games
              </h2>
              <Link href="/games" className="pm-micro hidden items-center gap-2 text-coral sm:inline-flex">
                Browse all games <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {latestGames.map((game) => (
                <LatestGameCard key={game.id} game={game} />
              ))}
            </div>
          </HudPanel>
        </div>
        <HudStatusRail />
      </main>
      <SiteFooter />
    </>
  );
}

function FeaturedGameCard() {
  return (
    <HudPanel className="relative min-h-[438px] overflow-hidden p-6 sm:p-7" accent="muted">
      <img
        src="/playmorrow/neon-warden.png"
        alt="Neon Warden key art"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/56 to-background/6" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/92 via-transparent to-background/20" />

      <div className="relative z-10 grid min-h-[386px] content-between">
        <div>
          <StatusBadge status="FEATURED" />
          <h2 className="mt-5 font-display text-5xl font-black uppercase leading-none text-foreground sm:text-[3.55rem]">
            Neon<br />Warden
          </h2>
          <p className="pm-micro mt-5 text-muted-foreground">Tactical stealth • Cyberpunk</p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
            In a city that never sleeps, shadows are your only allies. Plan. Infiltrate. Expose the system.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.72fr_1fr]">
          <div>
            <div className="flex items-center gap-4 border-t border-border/80 pt-3">
              <div className="grid size-12 place-items-center border border-border-bright bg-background/70">
                <Zap className="size-6 text-foreground" />
              </div>
              <div>
                <p className="pm-display text-sm text-foreground">Obsidian Signal <span className="text-cyan">●</span></p>
                <p className="text-xs text-muted-foreground">Independent Studio</p>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-2 text-lg text-cyan">
              <Users className="size-5" /> 12.4K <span className="text-sm text-muted-foreground">followers</span>
            </p>
            <div className="mt-4 flex gap-2">
              {['PC', 'PS5', 'XBOX SERIES X|S'].map((platform) => (
                <span key={platform} className="border border-border bg-background/65 px-3 py-2 font-mono text-[10px] uppercase text-muted-foreground">
                  {platform}
                </span>
              ))}
            </div>
          </div>

          <div className="clip-corner border border-border bg-background/70 p-4 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <span className="pm-micro text-foreground">Roadmap</span>
              <Link href="/games/test-game" className="pm-micro inline-flex items-center gap-2 text-cyan">
                View full roadmap <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="relative h-2 rounded-none bg-border">
              <div className="absolute inset-y-0 left-0 w-[67%] bg-cyan shadow-[0_0_18px_rgb(62_231_255_/_0.85)]" />
              {[0, 34, 67, 100].map((left) => (
                <span
                  key={left}
                  className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 border-2 border-cyan bg-background shadow-[0_0_14px_rgb(62_231_255_/_0.85)]"
                  style={{ left: `${left}%` }}
                />
              ))}
            </div>
            <div className="mt-5 grid grid-cols-4 gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <RoadmapStep title="Prototype" body="Complete" done />
              <RoadmapStep title="Alpha" body="Complete" done />
              <RoadmapStep title="Beta" body="In Progress" active />
              <RoadmapStep title="Launch" body="Q4 2025" />
            </div>
          </div>
        </div>
      </div>
    </HudPanel>
  );
}

function LiveTicker({ feedCount }: { feedCount: number }) {
  const items = feedCount > 0 ? liveItems : liveItems;

  return (
    <div className="mt-5 grid overflow-hidden border border-border bg-background/72 lg:grid-cols-[170px_1fr_170px]">
      <div className="flex items-center gap-3 border-b border-border px-6 py-3 lg:border-b-0 lg:border-r">
        <span className="size-2 bg-coral shadow-[0_0_12px_rgb(255_87_77_/_0.75)]" />
        <span className="pm-micro text-coral">Live Feed</span>
        <Activity className="size-4 text-coral" />
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={`${item.title}-${item.time}`} className="flex items-center gap-3 border-b border-border px-5 py-3 md:border-r xl:border-b-0">
            <span className="text-muted-foreground">{item.icon}</span>
            <span className="min-w-0">
              <span className="pm-micro text-foreground">{item.title}</span>
              <span className="ml-2 text-xs text-muted-foreground">{item.body}</span>
              <span className="block text-[10px] text-muted-foreground">{item.time}</span>
            </span>
          </div>
        ))}
      </div>
      <Link href="/feed" className="pm-micro flex items-center justify-center gap-4 px-6 py-3 text-coral">
        View all <span className="tracking-normal">•••</span>
      </Link>
    </div>
  );
}

function LatestGameCard({ game }: { game: HomeGame }) {
  const progress = game.title.includes('Moss') ? 32 : game.title.includes('Paper') ? 18 : 54;
  const bar = game.status === 'ALPHA' ? 'bg-violet' : game.status === 'PRE_ALPHA' ? 'bg-amber' : 'bg-cyan';

  return (
    <Link href={`/games/${game.slug}`} className="panel group grid min-h-[260px] overflow-hidden border-border bg-card transition hover:border-cyan/70">
      <div className="relative min-h-[180px] p-4">
        <img src={game.coverUrl} alt={game.title} className="absolute inset-0 size-full object-cover transition group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/86 via-background/42 to-transparent" />
        <div className="relative z-10">
          <StatusBadge status={game.status} />
          <h3 className="mt-6 font-display text-4xl font-black uppercase leading-none text-foreground">
            {game.title}
          </h3>
          <p className="mt-4 text-xs text-muted-foreground">{game.tags.join(' • ')}</p>
          <p className="mt-4 max-w-[250px] text-sm leading-6 text-muted-foreground">
            {descriptionFor(game.title)}
          </p>
        </div>
      </div>
      <div className="border-t border-border bg-background/50 p-4">
        <div className="mb-2 flex justify-between pm-micro text-muted-foreground">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1 bg-border">
          <div className={`h-full ${bar} shadow-[0_0_12px_currentColor]`} style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="pm-micro text-foreground">{game.studio.name}</span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="size-3 text-cyan" /> {formatFollowers(game.followersCount)}
          </span>
          <Bookmark className="size-4 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
}

function HeroSignal({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-center gap-4 border-border sm:border-r sm:last:border-r-0">
      <span className="grid size-10 place-items-center text-cyan drop-shadow-[0_0_12px_rgb(62_231_255_/_0.55)]">{icon}</span>
      <span>
        <span className="block text-sm text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">{body}</span>
      </span>
    </div>
  );
}

function RoadmapStep({ title, body, done, active }: { title: string; body: string; done?: boolean; active?: boolean }) {
  return (
    <div>
      <p className={active ? 'text-cyan' : 'text-muted-foreground'}>{title}</p>
      <p className="mt-1 flex items-center gap-1">
        {done && <Check className="size-3 text-success" />}
        {body}
      </p>
    </div>
  );
}

type HomeGame = {
  id: string;
  title: string;
  slug: string;
  status: string;
  coverUrl: string;
  followersCount: number;
  studio: { name: string; slug: string };
  tags: string[];
};

function normalizeLatestGames(games?: Game[]): HomeGame[] {
  const usable = games
    ?.filter((game) => game.title !== 'Neon Warden')
    .slice(0, 3)
    .map((game) => ({
      id: game.id,
      title: game.title,
      slug: game.slug,
      status: game.status,
      coverUrl: game.coverUrl ?? coverFor(game.title),
      followersCount: game.followersCount,
      studio: { name: game.studio?.name ?? 'Independent Studio', slug: game.studio?.slug ?? 'studio' },
      tags: game.tags?.length ? game.tags.slice(0, 2) : ['Indie', 'In Development'],
    }));

  return usable?.length ? usable : [...fallbackGames];
}

function coverFor(title: string) {
  if (title.includes('Moss')) return '/playmorrow/mossbound.png';
  if (title.includes('Paper')) return '/playmorrow/paper-relics.png';
  if (title.includes('Void')) return '/playmorrow/voidrunner.png';
  return '/playmorrow/starfall-tactics.png';
}

function descriptionFor(title: string) {
  if (title.includes('Moss')) return 'A tiny traveler. An ancient forest. Secrets grow in the dark.';
  if (title.includes('Paper')) return 'Fold the past. Play the present. Rewrite your fate.';
  return 'Lead a crew through a dying galaxy where every choice leaves a scar.';
}

function formatFollowers(count: number) {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K followers`;
  return `${count} followers`;
}
