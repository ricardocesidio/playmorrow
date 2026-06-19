'use client';

import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart3, ChevronDown, Search, X } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { GameCard } from '@/components/game-card';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { CircuitFrame, HudPanel, HudStatusRail } from '@/components/playmorrow/hud';
import { useInfiniteGames } from '@/lib/api/hooks';

export default function GamesPage() {
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteGames(20, searchQuery || undefined);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(search);
  };

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <SiteHeader />
      <main className="relative flex-1 overflow-hidden px-5 pb-24 pt-0 sm:px-8 lg:px-10">
        <CircuitFrame className="opacity-55" />
        <div className="relative z-10 mx-auto max-w-[1500px]">
          <HudPanel className="mb-6 px-5 py-4 sm:px-9 sm:py-5" accent="muted">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <h1 className="font-display text-4xl font-black uppercase leading-none text-foreground sm:text-5xl lg:text-[3.45rem]">
                  Browse the next generation
                </h1>
                <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                  Discover games before the rest of the world.
                </p>
              </div>
              <div className="pm-micro text-muted-foreground">
                <span className="text-cyan">{(data?.pages[0]?.total ?? 2431).toLocaleString()}</span> games indexed
              </div>
            </div>

            <form onSubmit={handleSearch} className="mt-5 grid gap-4">
              <div className="relative max-w-[680px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search games, studios, genres..."
                  aria-label="Search games"
                  className="clip-corner h-12 w-full border border-border-bright/60 bg-background/75 pl-12 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/45 focus:border-cyan focus:ring-1 focus:ring-cyan"
                />
                <button type="submit" className="sr-only">Search</button>
              </div>

              <div className="grid gap-5 xl:grid-cols-[390px_1fr_1fr_1.08fr_1.08fr]">
                <FilterGroup label="Status" options={['All', 'In development', 'Alpha', 'Pre-alpha']} />
                <FilterSelect label="Genre" value="All" />
                <FilterSelect label="Platform" value="All" />
                <FilterSelect label="Release window" value="All time" />
                <FilterSelect label="Sort by" value="Most active" icon={<BarChart3 className="size-4" />} />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {['Status: In development', 'Alpha', 'Pre-alpha', 'Playtest available'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className="clip-corner inline-flex items-center gap-2 border border-cyan/45 bg-cyan/5 px-3 py-1.5 pm-micro text-cyan"
                  >
                    {chip} <X className="size-3" />
                  </button>
                ))}
                <button type="button" className="px-3 py-1.5 pm-micro text-coral">Clear all</button>
              </div>
            </form>
          </HudPanel>

          <div className="grid gap-6 xl:grid-cols-[1fr_190px]">
            <div>
          {isLoading && <LoadingSkeleton count={8} height="h-64" />}

          {error && !isLoading && <ErrorState message="Failed to load games." />}

          {!isLoading && !error && items.length === 0 && (
            <EmptyState
              title={searchQuery ? `No games matching "${searchQuery}"` : 'No games yet'}
              action={searchQuery ? undefined : { label: 'Explore studios', href: '/studios' }}
            />
          )}

          {items.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {items.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}

          {hasNextPage && (
            <div className="mt-7 flex items-center justify-center gap-4">
              <button
                onClick={loadMore}
                disabled={isFetchingNextPage}
                className="clip-corner inline-flex h-12 min-w-32 items-center justify-center gap-3 border border-cyan/70 bg-cyan/5 px-6 pm-display text-xs text-cyan transition hover:bg-cyan hover:text-cyan-foreground disabled:opacity-50"
              >
                {isFetchingNextPage ? 'Loading' : 'Next'} <ArrowRight className="size-4" />
              </button>
            </div>
          )}

          {!hasNextPage && items.length > 0 && (
            <p className="mt-7 text-center pm-micro text-muted-foreground/60">
              {searchQuery ? `All results for "${searchQuery}"` : 'End of catalogue'}
            </p>
          )}
            </div>

            <HudPanel className="hidden self-start p-4 xl:block" accent="muted">
              <h2 className="pm-micro mb-5 flex items-center justify-between text-foreground">
                Trending now <span className="text-cyan">~</span>
              </h2>
              <div className="space-y-5">
                {items.slice(0, 5).map((game, index) => (
                  <div key={game.id} className="grid grid-cols-[22px_1fr] gap-3 border-b border-border/50 pb-4 last:border-b-0">
                    <span className="font-mono text-sm text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                    <span>
                      <span className="block pm-micro text-foreground">{game.title}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{game.tags?.[0] ?? game.status.replace(/_/g, ' ')}</span>
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/feed"
                className="mt-5 inline-flex items-center gap-2 border border-coral/60 px-3 py-2 pm-micro text-coral"
              >
                View all trending <ArrowRight className="size-3" />
              </Link>
            </HudPanel>
          </div>
        </div>
        <HudStatusRail />
      </main>
    </>
  );
}

function FilterGroup({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <div className="pm-micro mb-2 text-muted-foreground">{label} <ChevronDown className="inline size-3" /></div>
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => (
          <button
            key={option}
            type="button"
            className={`clip-corner border px-4 py-2 pm-micro ${
              index === 0
                ? 'border-cyan bg-cyan/10 text-cyan'
                : 'border-border bg-background/50 text-muted-foreground'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterSelect({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div>
      <div className="pm-micro mb-2 text-muted-foreground">{label}</div>
      <button
        type="button"
        className="clip-corner flex h-10 w-full items-center justify-between gap-3 border border-border-bright/60 bg-background/60 px-3 pm-micro text-cyan"
      >
        {value}
        <span className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <ChevronDown className="size-3" />
        </span>
      </button>
    </div>
  );
}
