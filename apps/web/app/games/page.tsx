'use client';

import { useState, useCallback } from 'react';
import { Search, Gamepad2, Sparkles, Loader2 } from 'lucide-react';

import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { GameCard } from '@/components/game-card';
import { useInfiniteGames, useIntersectionObserver } from '@/lib/api/hooks';

export default function GamesPage() {
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteGames(20, searchQuery || undefined);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sentinelRef = useIntersectionObserver(loadMore, !!hasNextPage && !isFetchingNextPage);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(search);
  };

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <Nav />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Explore games</h1>
          <p className="mt-2 text-muted-foreground">
            Discover indie games from studios around the world.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search games…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Search
          </button>
        </form>

        {/* Loading */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/2] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 py-12">
            <p className="text-destructive">Failed to load games</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-primary underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && items.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card/30 py-16">
            <Sparkles className="size-10 text-muted-foreground/40" />
            {searchQuery ? (
              <>
                <p className="text-muted-foreground">No games matching &ldquo;{searchQuery}&rdquo;</p>
                <button
                  onClick={() => { setSearch(''); setSearchQuery(''); }}
                  className="text-sm text-primary underline"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <Gamepad2 className="size-10 text-muted-foreground/40" />
                <p className="text-muted-foreground">No games yet</p>
              </>
            )}
          </div>
        )}

        {/* Games grid */}
        {items.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}

        {/* Sentinel for infinite scroll */}
        {hasNextPage && (
          <div ref={sentinelRef} className="flex justify-center py-8">
            {isFetchingNextPage && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
          </div>
        )}

        {/* End of list */}
        {!hasNextPage && items.length > 0 && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            {searchQuery ? `All results for "${searchQuery}"` : 'All games loaded.'}
          </p>
        )}
      </main>

      <Footer />
    </>
  );
}
