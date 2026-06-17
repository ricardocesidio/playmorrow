'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Rss, RefreshCw } from 'lucide-react';

import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { FeedItemCard } from '@/components/feed-item';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/api/auth-context';
import { usePersonalFeed } from '@/lib/api/hooks';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'devlogs', label: 'Devlogs' },
  { key: 'roadmap', label: 'Roadmap' },
] as const;

export default function PersonalFeedPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [type, setType] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, error, refetch, isRefetching } = usePersonalFeed(
    type,
    page,
    pageSize,
    token ?? undefined,
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

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
              onClick={() => handleTypeChange(tab.key)}
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
        {!isLoading && !error && data && data.items.length === 0 && type === 'all' && (
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
        {!isLoading && !error && data && data.items.length === 0 && type !== 'all' && (
          <div className="rounded-xl border border-border bg-card/20 py-16 text-center">
            <p className="text-muted-foreground">
              No {type} updates found.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => handleTypeChange('all')}>
              Show all
            </Button>
          </div>
        )}

        {/* Feed items */}
        {data && data.items.length > 0 && (
          <>
            <div className="space-y-3">
              {data.items.map((item) => (
                <FeedItemCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-input px-3 py-1.5 text-sm transition-colors hover:bg-accent disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {data.page} of {totalPages}
                </span>
                <button
                  disabled={!data.hasMore}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-input px-3 py-1.5 text-sm transition-colors hover:bg-accent disabled:opacity-40"
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
