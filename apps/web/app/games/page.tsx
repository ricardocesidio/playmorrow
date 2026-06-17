'use client';

import { useState } from 'react';
import { Search, Gamepad2, Sparkles } from 'lucide-react';

import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { GameCard } from '@/components/game-card';
import { useGames } from '@/lib/api/hooks';

export default function GamesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useGames(page, 20, search || undefined);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

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
              onClick={() => setPage(1)}
              className="text-sm text-primary underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && data?.items.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card/30 py-16">
            <Sparkles className="size-10 text-muted-foreground/40" />
            {search ? (
              <>
                <p className="text-muted-foreground">No games matching &ldquo;{search}&rdquo;</p>
                <button
                  onClick={() => setSearch('')}
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
        {!isLoading && data && data.items.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.items.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>

            {/* Pagination */}
            {data.total > data.pageSize && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-input px-4 py-2 text-sm transition-colors hover:bg-accent disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {data.page} of {Math.ceil(data.total / data.pageSize)}
                </span>
                <button
                  disabled={!data.hasMore}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-input px-4 py-2 text-sm transition-colors hover:bg-accent disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
