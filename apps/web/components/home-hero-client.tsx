'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Activity, ArrowRight, Gamepad2, Radio, SquarePlay, UserPlus } from 'lucide-react';
import { GameCard } from '@/components/game-card';
import { formatRelativeTime } from '@/lib/format';
import { usePublicFeed, useGames, useStudios } from '@/lib/api/hooks';
import { useAuth } from '@/lib/api/auth-context';

function getFeedIcon(type: string) {
  if (type === 'ROADMAP_ITEM') return <Activity className="size-4" />;
  return <SquarePlay className="size-4" />;
}

export function HeroSection({ children }: { children?: ReactNode }) {
  const { data: feedData, isLoading: feedLoading, error: feedError } = usePublicFeed();
  const { data: gamesData } = useGames(1, 9);
  const { data: studiosData } = useStudios();
  const { user } = useAuth();

  const feedItems = feedData?.items?.slice(0, 4) ?? [];
  const feedCount = feedData?.total ?? 0;
  const gamesCount = gamesData?.total ?? 0;
  const studioCount = Math.min(studiosData?.total ?? 0, 5);
  const games = gamesData?.items?.slice(0, 9) ?? [];

  return (
    <>
      {feedError && (
        <div className="relative px-5 sm:px-8 lg:px-10 z-10">
          <div className="mx-auto max-w-[1500px]">
            <div className="mt-4 clip-corner border border-coral/50 bg-coral/5 p-4 text-sm text-coral">
              <p>Unable to load some content. The data may be temporarily unavailable. Please try again later.</p>
            </div>
          </div>
        </div>
      )}
      <section className="relative px-5 pb-12 pt-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] xl:gap-16">
            <div>
              <div className="inline-flex items-center gap-2 border border-cyan/30 bg-cyan/5 px-4 py-2 font-mono text-[0.55rem] uppercase tracking-widest text-cyan">
                <Radio className="size-3" /> {feedCount > 0 ? `${feedCount} active signals` : 'Live now'}
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
                <Link href={user ? '/dashboard' : '/games'}
                  className="clip-corner flex items-center gap-2 border border-cyan bg-cyan/10 px-8 py-3.5 font-mono text-[0.65rem] uppercase tracking-widest text-cyan shadow-[0_0_24px_rgb(62_231_255_/_0.15)] transition hover:bg-cyan hover:text-background hover:shadow-[0_0_36px_rgb(62_231_255_/_0.25)]">
                  <Gamepad2 className="size-5" /> {user ? 'Dashboard' : 'Browse games'}
                </Link>
                {!user && (
                  <Link href="/register"
                    className="clip-corner flex items-center gap-2 border border-coral bg-coral/10 px-8 py-3.5 font-mono text-[0.65rem] uppercase tracking-widest text-coral transition hover:bg-coral hover:text-coral-foreground">
                    <UserPlus className="size-5" /> Join as a studio
                  </Link>
                )}
              </div>
              <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border/60 pt-6">
                <div>
                  <p className="font-display text-2xl font-black text-white">{gamesCount}+</p>
                  <p className="mt-1 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Games in development</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-black text-white">{studioCount}+</p>
                  <p className="mt-1 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Active studios</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-black text-white">{feedCount}+</p>
                  <p className="mt-1 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Feed updates</p>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              {games.length > 0 && (
                <GameCard game={games[0]!} variant="featured" />
              )}
            </div>
          </div>
        </div>
      </section>
      {feedItems.length > 0 && (
        <section className="relative px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[1500px]">
            <LiveTicker items={feedItems} />
          </div>
        </section>
      )}
    </>
  );
}

function LiveTicker({ items }: { items: { type: string; title?: string; game?: { title: string }; createdAt: string }[] }) {
  return (
    <div className="grid overflow-hidden border border-border bg-background/72 lg:grid-cols-[170px_1fr_170px]">
      <div className="flex items-center gap-3 border-b border-border px-6 py-3 lg:border-b-0 lg:border-r">
        <span className="size-2 bg-coral shadow-[0_0_12px_rgb(255_87_77_/_0.75)]" />
        <span className="pm-micro text-coral">Live Feed</span>
        <Activity className="size-4 text-coral" />
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4">
        {items.map((item, i) => (
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

export function GamesSection() {
  const [gamePage, setGamePage] = useState(1);
  const { data: gamesData, isLoading: gamesLoading } = useGames(gamePage, 9);

  const games = gamesData?.items?.slice(0, 9) ?? [];
  const gamesHasMore = gamesData?.hasMore ?? false;

  return (
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
          {gamesLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse border border-border/40 bg-card min-h-[260px]">
                <div className="h-[180px] bg-border/10" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-1/3 rounded bg-border/20" />
                  <div className="h-3 w-2/3 rounded bg-border/20" />
                  <div className="h-3 w-1/2 rounded bg-border/20" />
                </div>
              </div>
            ))
          ) : (
            games.map((game) => (
              <GameCard key={game.id} game={game} variant="compact" />
            ))
          )}
        </div>
        {gamesHasMore && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setGamePage((p) => p + 1)}
              disabled={gamesLoading}
              className="clip-corner inline-flex h-10 items-center gap-2 border border-cyan/50 bg-cyan/5 px-6 font-mono text-xs text-cyan hover:bg-cyan/10 transition disabled:opacity-50"
            >
              {gamesLoading ? 'Loading...' : 'Load more games'} <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
