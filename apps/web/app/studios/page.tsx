'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Search } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
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
      <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
        {/* Grid overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        {/* Top accent line */}
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

        <div className="relative mx-auto max-w-5xl">
          <div className="mb-6 flex items-center gap-3">
            <Building2 className="size-6 text-cyan" />
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Studios</h1>
          </div>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search studios..."
                className="clip-corner h-10 w-full border border-border-bright/50 bg-background/70 pl-12 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/45 focus:border-cyan focus:ring-1 focus:ring-cyan"
              />
            </div>
          </form>

          <div>
            {isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="clip-corner h-20 animate-pulse border border-border/40 bg-[#050b0f]/30" />
                ))}
              </div>
            )}

            {error && !isLoading && (
              <div className="clip-corner border border-coral/40 bg-coral/5 py-12 text-center">
                <p className="font-mono text-[0.65rem] text-coral">Failed to load studios.</p>
              </div>
            )}

            {!isLoading && !error && data?.items.length === 0 && (
              <div className="clip-corner border border-border/40 bg-[#050b0f]/30 py-16 text-center">
                <Building2 className="mx-auto mb-3 size-10 text-muted-foreground/30" />
                <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                  {search ? `No studios matching "${search}"` : 'No studios yet'}
                </p>
                {!search && (
                  <Link
                    href="/studios/new"
                    className="mt-4 inline-flex items-center gap-2 border border-cyan/60 px-4 py-2 font-mono text-[0.6rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background"
                  >
                    Create a studio
                  </Link>
                )}
              </div>
            )}

            {data && data.items.length > 0 && (
              <div className="space-y-3">
                {data.items.map((studio) => (
                  <Link
                    key={studio.id}
                    href={`/studios/${studio.slug}`}
                    className="clip-corner flex items-center gap-4 border border-border/70 bg-[#050b0f]/80 p-4 shadow-[0_0_20px_rgb(0_0_0_/_0.25)] transition-colors hover:border-cyan/30"
                  >
                    {studio.logoUrl ? (
                      <img src={studio.logoUrl} alt="" className="size-12 border border-border/60 object-cover" />
                    ) : (
                      <div className="flex size-12 items-center justify-center border border-border/60 bg-[#050b0f]/50 font-mono text-xs uppercase text-muted-foreground">
                        {studio.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-semibold text-white">{studio.name}</p>
                      {studio.tagline && (
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">{studio.tagline}</p>
                      )}
                      <div className="mt-1 flex gap-3 font-mono text-[0.55rem] text-muted-foreground">
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
                  className="clip-corner border border-border/60 px-4 py-2 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="font-mono text-[0.55rem] text-muted-foreground/60">
                  {data!.page} / {totalPages}
                </span>
                <button
                  disabled={!data?.hasMore}
                  onClick={() => setPage((p) => p + 1)}
                  className="clip-corner border border-border/60 px-4 py-2 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
