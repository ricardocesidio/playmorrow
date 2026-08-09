'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Gamepad2, Loader2, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/lib/api/auth-context';
import { useForYouFeed, useRecommendationFeedback, type ForYouItem } from '@/lib/api/hooks';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';

const REASON_ICONS: Record<ForYouItem['reasonType'], string> = {
  semantic: '🧠',
  'tag-affinity': '🏷️',
  'studio-follow': '🎮',
  trending: '📈',
  'hidden-gem': '💎',
  fresh: '✨',
  popular: '🔥',
  legacy: '🔥',
};

const METHOD_LABELS: Record<string, string> = {
  hybrid: 'AI For You',
  content: 'For You',
  trending: 'Trending',
  legacy: 'For You',
};

export default function ForYouFeed() {
  const { isAuthenticated } = useAuth();
  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useForYouFeed(12);

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const feedback = useRecommendationFeedback();

  const items = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.items).filter((i) => !dismissed.has(i.gameId)),
    [data, dismissed],
  );

  const method = data?.pages[0]?.method ?? 'legacy';

  const onDismiss = (item: ForYouItem) => {
    setDismissed((prev) => new Set(prev).add(item.gameId));
    if (isAuthenticated) {
      feedback.mutate({ gameId: item.gameId, action: 'DISMISSED' });
    }
  };

  const onOpen = (item: ForYouItem) => {
    if (isAuthenticated) {
      feedback.mutate({ gameId: item.gameId, action: 'CLICKED' });
    }
  };

  if (isLoading) {
    return (
      <section className="px-5 py-10 sm:px-8 lg:px-10" aria-busy="true" aria-live="polite">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-6 h-6 w-48 animate-pulse rounded bg-border/20" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded bg-border/10" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="px-5 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1500px]">
          <ErrorState message={(error as Error)?.message ?? "Couldn't load your feed. Try again in a moment."} />
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="px-5 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1500px]">
          <EmptyState
            icon={<Gamepad2 className="size-6" />}
            title="Nothing here yet"
            description="Games are publishing every week — check back soon."
          />
        </div>
      </section>
    );
  }

  return (
    <section className="px-5 py-10 sm:px-8 lg:px-10" aria-live="polite">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl font-black uppercase tracking-tight text-white">
            <Sparkles className="size-4 text-coral" aria-hidden="true" />
            {METHOD_LABELS[method] ?? 'For You'}
          </h2>
          <Link
            href="/discover"
            className="font-mono text-[0.6rem] uppercase tracking-widest text-cyan hover:text-white"
          >
            Discover all <ArrowRight className="ml-1 inline size-3" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {items.map((item) => (
            <div key={item.gameId} className="group relative">
              <Link
                href={`/games/${item.slug ?? item.gameId}`}
                onClick={() => onOpen(item)}
                className="clip-corner block h-full border border-border/40 panel overflow-hidden transition hover:border-cyan/30 hover:shadow-[0_0_20px_rgb(62_231_255_/_0.06)]"
                aria-label={`Open ${item.title ?? 'game'}`}
              >
                <div className="relative aspect-[3/4] bg-border/10">
                  {item.coverUrl ? (
                    <img src={item.coverUrl} alt={item.title ?? ''} className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Gamepad2 className="size-8 text-muted-foreground/30" aria-hidden="true" />
                    </div>
                  )}
                  <span
                    className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[0.55rem] text-white/90"
                    aria-label="Recommendation reason"
                  >
                    {REASON_ICONS[item.reasonType] ?? '🔥'} {item.reason}
                  </span>
                </div>
                <div className="p-3">
                  <p className="truncate font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-foreground transition group-hover:text-cyan">
                    {item.title ?? 'Untitled game'}
                  </p>
                  <p className="mt-1 truncate font-mono text-[0.5rem] text-muted-foreground/60">
                    {item.studioName ?? 'Unknown studio'}
                  </p>
                </div>
              </Link>
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => onDismiss(item)}
                  className="absolute right-2 top-2 z-10 rounded-full bg-black/70 p-1 text-white/70 opacity-0 transition hover:bg-coral hover:text-white focus-visible:ring-2 focus-visible:ring-coral focus-visible:opacity-100 group-hover:opacity-100"
                  aria-label={`Dismiss ${item.title ?? 'game'} recommendation`}
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>

        {hasNextPage && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="clip-corner border border-cyan/30 bg-cyan/5 px-6 py-2 font-mono text-xs uppercase tracking-widest text-cyan transition hover:bg-cyan/15 focus-visible:ring-2 focus-visible:ring-cyan disabled:opacity-50"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 inline size-3 animate-spin" aria-hidden="true" /> Loading
                </>
              ) : (
                'Load more'
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
