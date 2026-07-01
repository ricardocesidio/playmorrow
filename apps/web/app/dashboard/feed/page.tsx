'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Rss, RefreshCw, Loader2 } from 'lucide-react';

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
      <div className="flex min-h-screen items-center justify-center bg-[#020609]">
        <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      {/* Top accent line */}
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

      <div className="relative mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <Rss className="size-6 text-cyan" />
          <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Your Feed</h1>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex gap-4 border-b border-border/40">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setType(tab.key)}
              className={`pb-2 font-mono text-[0.6rem] uppercase tracking-widest transition-colors ${
                type === tab.key
                  ? 'border-b-2 border-cyan text-cyan'
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
              <div key={i} className="clip-corner h-24 animate-pulse border border-border/40 bg-[#050b0f]/30" />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="clip-corner border border-coral/40 bg-coral/5 py-12 text-center">
            <p className="font-mono text-[0.65rem] text-coral">Could not load your feed.</p>
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
          <div className="clip-corner border border-border/40 bg-[#050b0f]/30 py-16 text-center">
            <Rss className="mx-auto mb-3 size-10 text-muted-foreground/30" />
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
              Follow games and studios to see their latest updates here.
            </p>
            <Button asChild className="mt-4">
              <Link href="/games">Explore games</Link>
            </Button>
          </div>
        )}

        {/* Empty: filter has no results */}
        {!isLoading && !error && items.length === 0 && type !== 'all' && (
          <div className="clip-corner border border-border/40 bg-[#050b0f]/30 py-16 text-center">
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
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
          <p className="mt-8 text-center font-mono text-[0.55rem] text-muted-foreground">You've reached the end.</p>
        )}
      </div>
    </main>
  );
}
