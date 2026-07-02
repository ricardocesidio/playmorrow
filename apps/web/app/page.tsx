'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Activity, ArrowRight, Bookmark, Check, Flame, Gamepad2, Radio, SquarePlay, UserPlus, Users, Zap,
  Building2, MessageCircle, Star, TrendingUp, Crown,
} from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { StatusBadge } from '@/components/status-badge';
import { CircuitFrame, HudPanel, HudStatusRail, HexGrid } from '@/components/playmorrow/hud';
import { formatRelativeTime, formatFollowers } from '@/lib/format';
import { usePublicFeed, useGames, useStudios } from '@/lib/api/hooks';
import type { Game } from '@/lib/api/client';

function getFeedIcon(type: string) {
  if (type === 'ROADMAP_ITEM') return <Activity className="size-4" />;
  return <SquarePlay className="size-4" />;
}

export default function HomePage() {
  const { data: feedData } = usePublicFeed();
  const { data: gamesData } = useGames();
  const { data: studiosData } = useStudios();

  const games = normalizeLatestGames(gamesData?.items);
  const feedItems = feedData?.items?.slice(0, 4) ?? [];
  const feedCount = feedData?.items?.length ?? 0;
  const studioCount = studiosData?.items?.length ?? 0;

  return (
    <>
      <SiteHeader />
      <main className="relative overflow-hidden bg-[#020609]">
        <div className="pointer-events-none absolute inset-0" />
        <HexGrid className="opacity-70" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
        <CircuitFrame className="opacity-30" />

        {/* Hero Section */}
        <section className="relative px-5 pb-12 pt-8 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[1500px]">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] xl:gap-16">
              <div>
                <div className="inline-flex items-center gap-2 border border-cyan/30 bg-cyan/5 px-4 py-2 font-mono text-[0.55rem] uppercase tracking-widest text-cyan">
                  <Radio className="size-3" /> Live now — {feedCount} active signals
                </div>
                <h1 className="mt-6 font-display text-[clamp(2.5rem,6vw,5rem)] font-black uppercase leading-[0.9] text-white">
                  Discover tomorrow's<br />
                  <span className="text-cyan">indie games</span> today.
                </h1>
                <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">
                  Playmorrow is where indie studios build their public presence and grow their audience.
                  Follow development in real-time, play demos, and be part of the journey before the game ships.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href="/games"
                className="clip-corner flex items-center gap-2 border border-cyan bg-cyan/10 px-8 py-3.5 font-mono text-[0.65rem] uppercase tracking-widest text-cyan shadow-[0_0_24px_rgb(62_231_255_/_0.15)] transition hover:bg-cyan hover:text-background hover:shadow-[0_0_36px_rgb(62_231_255_/_0.25)]">
                    <Gamepad2 className="size-5" /> Browse games
                  </Link>
                  <Link href="/register"
                    className="clip-corner flex items-center gap-2 border border-coral bg-coral/10 px-8 py-3.5 font-mono text-[0.65rem] uppercase tracking-widest text-coral transition hover:bg-coral hover:text-coral-foreground">
                    <UserPlus className="size-5" /> Join as a studio
                  </Link>
                </div>

                {/* Stats row */}
                <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border/60 pt-6">
                  <div>
                    <p className="font-display text-2xl font-black text-white">{games.length}+</p>
                    <p className="mt-1 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Games in development</p>
                  </div>
                  <div>
                    <p className="font-display text-2xl font-black text-white">{studioCount}+</p>
                    <p className="mt-1 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Active studios</p>
                  </div>
                  <div>
                    <p className="font-display text-2xl font-black text-white">{feedCount * 4}+</p>
                    <p className="mt-1 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Devlogs published</p>
                  </div>
                </div>
              </div>

              {/* Featured Game Card */}
              <div className="hidden lg:block">
                <FeaturedGameCard />
              </div>
            </div>
          </div>
        </section>

        {/* Live Feed Ticker */}
        <section className="relative px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[1500px]">
            <LiveTicker items={feedItems} feedCount={feedCount} />
          </div>
        </section>

        {/* Latest Games Grid */}
        <section className="relative px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-white">Latest games</h2>
                <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Discover what studios are building</p>
              </div>
              <Link href="/games"
                className="font-mono text-[0.6rem] uppercase tracking-widest text-cyan transition hover:text-white">
                View all <ArrowRight className="ml-1 inline size-3" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {games.map((game) => (
                <LatestGameCard key={game.id} game={game} />
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="relative border-t border-border/60 px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[1500px]">
            <h2 className="mb-3 text-center font-display text-2xl font-black uppercase tracking-tight text-white">How it works</h2>
            <p className="mb-10 text-center font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">For players and studios</p>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="clip-corner border border-border/70 bg-[linear-gradient(135deg,rgb(62_231_255_/_0.05),rgb(166_92_255_/_0.03),rgb(255_87_77_/_0.02))] p-6 text-center shadow-[0_0_30px_rgb(0_0_0_/_0.3),0_0_16px_rgb(62_231_255_/_0.04)] hover:border-cyan/40 hover:shadow-[0_0_40px_rgb(0_0_0_/_0.4),0_0_24px_rgb(62_231_255_/_0.08)] transition-all duration-300 animate-scan-top relative overflow-hidden">
                <div className="mx-auto grid size-14 place-items-center rounded-full border border-cyan/30 bg-cyan/5">
                  <SearchIcon className="size-6 text-cyan" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-white">Discover</h3>
                <p className="mt-2 font-mono text-[0.55rem] leading-relaxed text-muted-foreground">
                  Browse games in development, follow studios, and get real-time updates on progress.
                </p>
              </div>
              <div className="clip-corner border border-border/70 bg-[linear-gradient(135deg,rgb(62_231_255_/_0.05),rgb(166_92_255_/_0.03),rgb(255_87_77_/_0.02))] p-6 text-center shadow-[0_0_30px_rgb(0_0_0_/_0.3),0_0_16px_rgb(62_231_255_/_0.04)] hover:border-cyan/40 hover:shadow-[0_0_40px_rgb(0_0_0_/_0.4),0_0_24px_rgb(62_231_255_/_0.08)] transition-all duration-300 animate-scan-top relative overflow-hidden">
                <div className="mx-auto grid size-14 place-items-center rounded-full border border-coral/30 bg-coral/5">
                  <FollowingIcon className="size-6 text-coral" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-white">Follow</h3>
                <p className="mt-2 font-mono text-[0.55rem] leading-relaxed text-muted-foreground">
                  Get notified of devlogs, roadmaps, milestones, and releases from studios you follow.
                </p>
              </div>
              <div className="clip-corner border border-border/70 bg-[linear-gradient(135deg,rgb(62_231_255_/_0.05),rgb(166_92_255_/_0.03),rgb(255_87_77_/_0.02))] p-6 text-center shadow-[0_0_30px_rgb(0_0_0_/_0.3),0_0_16px_rgb(62_231_255_/_0.04)] hover:border-cyan/40 hover:shadow-[0_0_40px_rgb(0_0_0_/_0.4),0_0_24px_rgb(62_231_255_/_0.08)] transition-all duration-300 animate-scan-top relative overflow-hidden">
                <div className="mx-auto grid size-14 place-items-center rounded-full border border-amber/30 bg-amber/5">
                  <EngageIcon className="size-6 text-amber" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-white">Engage</h3>
                <p className="mt-2 font-mono text-[0.55rem] leading-relaxed text-muted-foreground">
                  Comment, react, wishlist, and play demos. Your feedback shapes the final game.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative border-t border-border/60 px-5 py-20 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[1500px] text-center">
            <Crown className="mx-auto size-10 text-cyan" />
            <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-tight text-white">
              Ready to share your game?
            </h2>
            <p className="mt-3 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
              Join {studioCount}+ studios already building their audience on Playmorrow
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/register"
                className="clip-corner flex items-center gap-2 border border-cyan bg-cyan/10 px-8 py-3.5 font-mono text-[0.65rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background">
                Create your studio profile
              </Link>
              <Link href="/games"
                className="clip-corner flex items-center gap-2 border border-border/60 px-8 py-3.5 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan">
                Browse games <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function SearchIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function FollowingIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6" /><path d="M22 11h-6" />
    </svg>
  );
}
function EngageIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function FeaturedGameCard() {
  return (
    <Link href="/games/neon-warden" className="block cursor-pointer">
      <HudPanel className="relative min-h-[438px] overflow-hidden p-6 sm:p-7 transition hover:border-cyan/70" accent="muted">
        <Image src="/playmorrow/neon-warden.png" alt="Neon Warden key art" width={768} height={512} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/56 to-background/6" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/92 via-transparent to-background/20" />
        <div className="relative z-10 grid min-h-[386px] content-between">
          <div>
            <StatusBadge status="FEATURED" />
            <h2 className="mt-5 font-display text-5xl font-black uppercase leading-none text-foreground sm:text-[3.55rem]">Neon<br />Warden</h2>
            <p className="pm-micro mt-5 text-muted-foreground">Tactical stealth • Cyberpunk</p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">In a city that never sleeps, shadows are your only allies.</p>
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
              <p className="mt-4 flex items-center gap-2 text-lg text-cyan"><Users className="size-5" /> 12.4K followers</p>
            </div>
            <div className="clip-corner border border-border bg-background/70 p-4 backdrop-blur-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <span className="pm-micro text-foreground">Roadmap</span>
                <span className="pm-micro inline-flex items-center gap-2 text-cyan">
                  View full roadmap <ArrowRight className="size-3" />
                </span>
              </div>
              <div className="relative h-2 rounded-none bg-border">
                <div className="absolute inset-y-0 left-0 w-[67%] bg-cyan shadow-[0_0_18px_rgb(62_231_255_/_0.85)]" />
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                <div><p className="text-foreground">Prototype</p><p className="mt-1 flex items-center gap-1"><Check className="size-3 text-success" /> Complete</p></div>
                <div><p className="text-foreground">Alpha</p><p className="mt-1 flex items-center gap-1"><Check className="size-3 text-success" /> Complete</p></div>
                <div><p className="text-cyan">Beta</p><p className="mt-1 flex items-center gap-1">In Progress</p></div>
                <div><p className="text-muted-foreground">Launch</p><p className="mt-1">Q4 2025</p></div>
              </div>
            </div>
          </div>
        </div>
      </HudPanel>
    </Link>
  );
}

function LiveTicker({ items, feedCount }: { items: any[]; feedCount: number }) {
  return (
    <div className="grid overflow-hidden border border-border bg-background/72 lg:grid-cols-[170px_1fr_170px]">
      <div className="flex items-center gap-3 border-b border-border px-6 py-3 lg:border-b-0 lg:border-r">
        <span className="size-2 bg-coral shadow-[0_0_12px_rgb(255_87_77_/_0.75)]" />
        <span className="pm-micro text-coral">Live Feed</span>
        <Activity className="size-4 text-coral" />
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4">
        {(items.length > 0 ? items : []).map((item: any, i: number) => (
          <div key={i} className="flex items-center gap-3 border-b border-border px-5 py-3 md:border-r xl:border-b-0">
            <span className="text-muted-foreground">{getFeedIcon(item.type)}</span>
            <span className="min-w-0">
              <span className="pm-micro text-foreground">{typeof item.game === 'string' ? item.game : item.game?.title ?? item.title ?? 'Update'}</span>
              <span className="ml-2 text-xs text-muted-foreground">{item.type === 'DEVLOG' ? 'posted a devlog' : item.type === 'ROADMAP_ITEM' ? 'updated roadmap' : 'new activity'}</span>
              <span className="block text-[10px] text-muted-foreground">{formatRelativeTime(item.createdAt)}</span>
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
    <Link href={`/games/${game.slug}`} className="group grid min-h-[260px] overflow-hidden border border-border bg-card transition hover:border-cyan/70">
      <div className="relative min-h-[180px] p-4">
        <img src={game.coverUrl} alt={game.title} className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.035]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/86 via-background/42 to-transparent" />
        <div className="relative z-10">
          <StatusBadge status={game.status} />
          <h3 className="mt-6 font-display text-4xl font-black uppercase leading-none text-foreground">{game.title}</h3>
          <p className="mt-4 text-xs text-muted-foreground">{game.tags.join(' • ')}</p>
          <p className="mt-4 max-w-[250px] text-sm leading-6 text-muted-foreground">{game.tagline ?? 'No description available'}</p>
        </div>
      </div>
      <div className="border-t border-border bg-background/50 p-4">
        <div className="mb-2 flex justify-between pm-micro text-muted-foreground"><span>Progress</span><span>{progress}%</span></div>
        <div className="h-1 bg-border"><div className={`h-full ${bar} shadow-[0_0_12px_currentColor]`} style={{ width: `${progress}%` }} /></div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="pm-micro text-foreground">{game.studio.name}</span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="size-3 text-cyan" /> {formatFollowers(game.followersCount)}</span>
        </div>
      </div>
    </Link>
  );
}

type HomeGame = {
  id: string; title: string; slug: string; status: string; coverUrl: string;
  followersCount: number; studio: { name: string; slug: string }; tags: string[];
  tagline: string | null;
};

function normalizeLatestGames(games?: Game[]): HomeGame[] {
  if (!games?.length) return [];
  return games.slice(0, 3).map((g) => ({
    id: g.id, title: g.title, slug: g.slug, status: g.status,
    coverUrl: g.coverUrl ?? '/playmorrow/neon-warden.png', followersCount: g.followersCount,
    studio: { name: g.studio?.name ?? 'Independent Studio', slug: g.studio?.slug ?? 'studio' },
    tags: g.tags?.length ? g.tags.slice(0, 2) : ['Indie', 'In Development'],
    tagline: g.tagline,
  }));
}

