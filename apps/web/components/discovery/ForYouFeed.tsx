'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Gamepad2, Loader2, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/lib/api/auth-context';
import { useForYouFeed, useRecommendationFeedback, useRecordImpressions, type ForYouItem } from '@/lib/api/hooks';
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
  const [pageIndex, setPageIndex] = useState(0);
  const feedback = useRecommendationFeedback();
  const impressions = useRecordImpressions();
  const recorded = useRef<Set<string>>(new Set());

  const pages = data?.pages ?? [];
  const items = useMemo(
    () => (pages[pageIndex]?.items ?? []).filter((i) => !dismissed.has(i.gameId)),
    [pages, pageIndex, dismissed],
  );

  const total = data?.pages[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 12));

  const goToPage = async (index: number) => {
    if (index < 0) return;
    while (index >= pages.length && hasNextPage) {
      await fetchNextPage();
    }
    setPageIndex(Math.min(index, pages.length - 1));
  };
  const goNext = () => {
    if (pageIndex < pages.length - 1) {
      setPageIndex((p) => p + 1);
      return;
    }
    if (hasNextPage) {
      fetchNextPage().then(() => setPageIndex((p) => p + 1));
    }
  };
  const goPrev = () => setPageIndex((p) => Math.max(0, p - 1));

  // Impression capture (CTR denominator). Each game counts once per client
  // session; the API additionally dedupes within a 60-minute window.
  useEffect(() => {
    if (!isAuthenticated || items.length === 0) return;
    const fresh = items.map((i) => i.gameId).filter((id) => !recorded.current.has(id));
    if (fresh.length === 0) return;
    fresh.forEach((id) => recorded.current.add(id));
    impressions.mutate(fresh);
  }, [isAuthenticated, items, impressions]);

  const method = data?.pages[0]?.method ?? 'legacy';
  const personalizationEnabled = data?.pages[0]?.personalizationEnabled ?? null;

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

        {isAuthenticated && personalizationEnabled === false && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-cyan/25 bg-cyan/5 px-4 py-3">
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-cyan">
              <Sparkles className="mr-1.5 inline size-3.5" aria-hidden="true" />
              Your feed is not personalized yet. Turn it on to get recommendations built around your taste — with an
              explanation for every pick.
            </p>
            <Link
              href="/settings/personalization"
              className="clip-corner border border-cyan/40 bg-cyan/10 px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-widest text-cyan transition hover:bg-cyan/20 focus-visible:ring-2 focus-visible:ring-cyan"
            >
              Personalize
            </Link>
          </div>
        )}

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

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={goPrev}
              disabled={pageIndex === 0}
              className="clip-corner flex cursor-pointer items-center gap-1.5 border border-border/40 px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan/30 hover:text-cyan focus-visible:ring-2 focus-visible:ring-cyan disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ArrowLeft className="size-3" aria-hidden="true" /> Prev
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToPage(i)}
                disabled={isFetchingNextPage && i >= pages.length}
                aria-current={i === pageIndex ? 'page' : undefined}
                className={`clip-corner min-w-9 cursor-pointer border px-3 py-2 font-mono text-[0.6rem] tracking-widest transition focus-visible:ring-2 focus-visible:ring-cyan ${
                  i === pageIndex
                    ? 'border-cyan bg-cyan/15 text-cyan'
                    : 'border-border/40 text-muted-foreground hover:border-cyan/30 hover:text-cyan'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              type="button"
              onClick={goNext}
              disabled={!hasNextPage && pageIndex >= pages.length - 1}
              className="clip-corner flex cursor-pointer items-center gap-1.5 border border-border/40 px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan/30 hover:text-cyan focus-visible:ring-2 focus-visible:ring-cyan disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isFetchingNextPage && pageIndex >= pages.length - 1 ? (
                <>
                  <Loader2 className="size-3 animate-spin" aria-hidden="true" /> Loading
                </>
              ) : (
                <>
                  Next <ArrowRight className="size-3" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
