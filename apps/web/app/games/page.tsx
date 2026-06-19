'use client';

import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { GameCard } from '@/components/game-card';
import { SectionHeading } from '@/components/section-heading';
import { SearchField } from '@/components/search-field';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
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
      <SiteHeader />
      <main className="mx-auto max-w-7xl flex-1 px-4 py-8 lg:px-6 lg:py-10">
        <SectionHeading tag="Catalog" as="h1">
          Browse games
        </SectionHeading>

        <SearchField
          value={search}
          onChange={setSearch}
          onSubmit={handleSearch}
          placeholder="Search games..."
        />

        <div className="mt-8">
          {isLoading && <LoadingSkeleton count={8} height="h-64" />}

          {error && !isLoading && <ErrorState message="Failed to load games." />}

          {!isLoading && !error && items.length === 0 && (
            <EmptyState
              title={searchQuery ? `No games matching "${searchQuery}"` : 'No games yet'}
              action={searchQuery ? undefined : { label: 'Explore studios', href: '/studios' }}
            />
          )}

          {items.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}

          {hasNextPage && (
            <div ref={sentinelRef} className="flex justify-center py-8">
              {isFetchingNextPage && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
            </div>
          )}

          {!hasNextPage && items.length > 0 && (
            <p className="mt-8 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground/60">
              {searchQuery ? `All results for "${searchQuery}"` : 'End of catalogue'}
            </p>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
