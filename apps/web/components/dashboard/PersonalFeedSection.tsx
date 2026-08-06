'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/api/auth-context';
import { usePersonalFeedCursor } from '@/lib/api/hooks';
import { Loader2, Newspaper, ArrowRight } from 'lucide-react';

export function PersonalFeedSection() {
  const { isAuthenticated } = useAuth();
  const [cursor, setCursor] = useState<{ createdAt: string; id: string } | null>(null);
  const [items, setItems] = useState<{ id: string; title: string; type: string; createdAt: string; summary: string; game: { slug: string; title: string }; studio: { name: string } }[]>([]);
  const [allLoaded, setAllLoaded] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="clip-corner border border-border/40 panel p-6 text-center">
        <Newspaper className="mx-auto mb-3 size-8 text-muted-foreground/40" />
        <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
          <Link href="/login" className="text-cyan underline">Sign in</Link> to see your personal feed.
        </p>
      </div>
    );
  }

  const { data, isLoading } = usePersonalFeedCursor('all', 10, cursor);

  const handleLoadMore = () => {
    if (data?.nextCursor) {
      setCursor(data.nextCursor);
      setItems((prev) => [...prev, ...(data?.items || [])]);
    }
    if (!data?.nextCursor && data?.items) {
      setItems((prev) => [...prev, ...(data?.items || [])]);
      setAllLoaded(true);
    }
  };

  // Initial load
  if (!cursor && data && data.items && items.length === 0) {
    setItems(data.items);
  }

  // Load more if we have a cursor update
  const displayItems = cursor ? items : (data?.items || []);
  const hasMore = !allLoaded && (cursor ? data?.nextCursor : data?.hasMore);

  if (displayItems.length === 0 && !isLoading) {
    return (
      <div className="clip-corner border border-border/40 panel p-6 text-center">
        <Newspaper className="mx-auto mb-3 size-8 text-muted-foreground/40" />
        <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">No activity yet.</p>
        <Link href="/studios" className="mt-3 inline-flex items-center gap-1 font-mono text-[0.55rem] text-cyan underline">
          Follow studios <ArrowRight className="size-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="clip-corner border border-border/40 panel">
      <div className="border-b border-border/40 px-4 py-3">
        <h2 className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan">
          <Newspaper className="size-3.5" /> Studio Activity
        </h2>
      </div>
      <div className="divide-y divide-border/30">
        {displayItems.slice(0, cursor ? items.length + 10 : 10).map((item) => (
          <Link
            key={item.id}
            href={`/devlogs/${item.id}`}
            className="flex items-center gap-3 px-4 py-3 transition "
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-foreground">
                {item.title}
              </p>
              <p className="truncate font-mono text-[0.5rem] text-muted-foreground/60">
                {item.studio?.name} · {item.type}
              </p>
            </div>
          </Link>
        ))}
      </div>
      {hasMore && (
        <div className="border-t border-border/30 p-3 text-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="inline-flex items-center gap-1 font-mono text-[0.55rem] uppercase tracking-widest text-cyan transition hover:text-cyan/80"
          >
            {isLoading ? <Loader2 className="size-3 animate-spin" /> : null}
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
