'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SectionHeading } from '@/components/section-heading';
import { SearchField } from '@/components/search-field';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { SignalLabel } from '@/components/signal-label';
import { useStudios } from '@/lib/api/hooks';

export default function StudiosPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useStudios(page, 20, search || undefined);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl flex-1 px-4 py-8 lg:px-6 lg:py-10">
        <SectionHeading tag="Directory" as="h1">
          Studios
        </SectionHeading>

        <SearchField
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          onSubmit={handleSearch}
          placeholder="Search studios..."
        />

        <div className="mt-8">
          {isLoading && <LoadingSkeleton count={6} height="h-28" />}

          {error && !isLoading && <ErrorState message="Failed to load studios." />}

          {!isLoading && !error && data?.items.length === 0 && (
            <EmptyState
              icon={<Building2 className="size-10" />}
              title={search ? `No studios matching "${search}"` : 'No studios yet'}
              action={search ? undefined : { label: 'Create a studio', href: '/studios/new' }}
            />
          )}

          {data && data.items.length > 0 && (
            <div className="space-y-3">
              {data.items.map((studio) => (
                <Link
                  key={studio.id}
                  href={`/studios/${studio.slug}`}
                  className="flex items-center gap-4 border border-border bg-elevated p-4 transition-colors hover:border-border-bright"
                >
                  {studio.logoUrl ? (
                    <img src={studio.logoUrl} alt="" className="size-12 border border-border object-cover" />
                  ) : (
                    <div className="flex size-12 items-center justify-center border border-border bg-muted font-mono text-xs uppercase text-muted-foreground">
                      {studio.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold">{studio.name}</p>
                    {studio.tagline && (
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">{studio.tagline}</p>
                    )}
                    <div className="mt-1 flex gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                      <span>{studio.gamesCount} games</span>
                      <span>{studio.followersCount} followers</span>
                    </div>
                  </div>
                  {studio.location && (
                    <SignalLabel color="muted">{studio.location}</SignalLabel>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="border border-border px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-30"
              >
                Previous
              </button>
              <span className="font-mono text-xs text-muted-foreground">
                {data!.page} / {totalPages}
              </span>
              <button
                disabled={!data?.hasMore}
                onClick={() => setPage((p) => p + 1)}
                className="border border-border px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
