'use client';

import { Rss } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { FeedItemCard } from '@/components/feed-item';
import { SectionHeading } from '@/components/section-heading';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { usePublicFeed } from '@/lib/api/hooks';

export default function FeedPage() {
  const { data, isLoading, error } = usePublicFeed(1, 20);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-8 lg:px-6 lg:py-10">
        <SectionHeading tag="Live" as="h1">
          Development feed
        </SectionHeading>
        <p className="-mt-4 mb-8 text-sm text-muted-foreground">
          Recent devlogs and roadmap updates from indie studios.
        </p>

        {isLoading && <LoadingSkeleton count={6} height="h-20" />}

        {error && !isLoading && <ErrorState message="Could not load feed." />}

        {!isLoading && !error && data?.items.length === 0 && (
          <EmptyState icon={<Rss className="size-10" />} title="No activity yet" />
        )}

        {data && data.items.length > 0 && (
          <div className="space-y-3">
            {data.items.map((item) => (
              <FeedItemCard key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
