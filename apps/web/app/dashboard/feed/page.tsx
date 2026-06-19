'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Rss, RefreshCw, Loader2 } from 'lucide-react';

import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { FeedItemCard } from '@/components/feed-item';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/api/auth-context';
import { useInfinitePersonalFeed, useIntersectionObserver } from '@/lib/api/hooks';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'devlogs', label: 'Devlogs' },
  { key: 'roadmap', label: 'Roadmap' },
] as const;

export default function PersonalFeedPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [type, setType] = useState('all');

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePersonalFeed(type, 10, token ?? undefined);

  const loadMore = () => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); };
  const sentinelRef = useIntersectionObserver(loadMore, !!hasNextPage && !isFetchingNextPage);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Rss className="size-6 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight">Your Feed</h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            Updates from games and studios you follow.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex gap-1 rounded-lg border border-border bg-card/20 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setType(tab.key)}
              aria-pressed={type === tab.key}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                type === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 py-12 text-center">
            <p className="text-destructive">Could not load your feed.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="mt-4"
            >
              <RefreshCw className="size-3" /> Try again
            </Button>
          </div>
        )}

        {/* Empty: no follows */}
        {!isLoading && !error && items.length === 0 && type === 'all' && (
          <div className="rounded-xl border border-border bg-card/20 py-16 text-center">
            <Rss className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              Follow games and studios to see their latest updates here.
            </p>
            <Button asChild className="mt-4">
              <Link href="/games">Explore games</Link>
            </Button>
          </div>
        )}

        {/* Empty: filter has no results */}
        {!isLoading && !error && items.length === 0 && type !== 'all' && (
          <div className="rounded-xl border border-border bg-card/20 py-16 text-center">
            <p className="text-muted-foreground">
              No {type} updates found.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setType('all')}>
              Show all
            </Button>
          </div>
        )}

        {/* Feed items */}
        {items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <FeedItemCard key={`${item.type}-${item.id}`} item={item} />
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
          <p className="mt-8 text-center text-sm text-muted-foreground">You've reached the end.</p>
        )}
      </main>
      <Footer />
    </>
  );
}
