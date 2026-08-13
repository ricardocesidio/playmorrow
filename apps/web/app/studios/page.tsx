'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Building2, Search, BadgeCheck, Users, Gamepad2, Heart } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { SignalLabel } from '@/components/signal-label';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { CircuitFrame, HudPanel, HudStatusRail } from '@/components/playmorrow/hud';
import { Input } from '@/components/ui/input';
import { useStudios } from '@/lib/api/hooks';
import { cn } from '@/lib/utils';

function useCountUp(end: number, duration = 2000, enabled = true) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || end === 0) { setCount(0); return; }
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [end, duration, enabled]);

  return count;
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  const count = useCountUp(value, 2000, value > 0);
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center border border-cyan/25 bg-cyan/10 text-cyan shadow-[0_0_14px_rgb(62_231_255_/_0.12)]" aria-hidden>
        {icon}
      </span>
      <span className="leading-none">
        <span className="block font-mono text-lg font-bold tabular-nums text-cyan">{count.toLocaleString()}</span>
        <span className="mt-1 block pm-micro text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}

export default function StudiosPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useStudios(page, 20, search || undefined);

  if (!data && !isLoading) {
    return (
      <main className="relative min-h-screen bg-[#020609] px-5 pb-28 pt-4 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="font-display text-2xl font-bold text-white">No studios found</p>
          <p className="mt-2 text-muted-foreground">Check back later for new studios.</p>
        </div>
      </main>
    );
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  const totalGames = data?.items.reduce((sum, s) => sum + s.gamesCount, 0) ?? 0;
  const totalFollowers = data?.items.reduce((sum, s) => sum + s.followersCount, 0) ?? 0;

  const items = data?.items ?? [];

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);
      if (page <= 3) {
        start = 2;
        end = Math.min(maxVisible, totalPages - 1);
      } else if (page >= totalPages - 2) {
        start = Math.max(2, totalPages - maxVisible + 1);
        end = totalPages - 1;
      }
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 pb-28 pt-4 sm:px-8 lg:px-10">
        <CircuitFrame className="opacity-70" />
        <div className="relative z-10 mx-auto max-w-[1448px]">
          <HudPanel className="mb-3 px-4 py-3 sm:px-8 sm:py-4" accent="muted">
            <div className="flex flex-wrap items-end justify-between gap-5 border-b border-border/55 pb-2">
              <div>
                <h1 className="font-display text-[2.55rem] font-black uppercase leading-[0.9] text-foreground sm:text-5xl lg:text-[3.28rem]">
                  Studios
                </h1>
                <p className="mt-2 text-sm leading-none text-muted-foreground sm:text-base">
                  Discover the teams behind tomorrow&apos;s games.
                </p>
              </div>
              {data && (
                <div className="pm-micro text-muted-foreground">
                  <span className="text-cyan">{data.total.toLocaleString()}</span> studios indexed
                </div>
              )}
            </div>

            {data && !isLoading && (
              <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
                <StatItem icon={<Building2 className="size-4" />} label="Studios" value={data.total} />
                <StatItem icon={<Gamepad2 className="size-4" />} label="Games" value={totalGames} />
                <StatItem icon={<Heart className="size-4" />} label="Followers" value={totalFollowers} />
              </div>
            )}

            <form onSubmit={handleSearch} className="mt-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search studios by name..."
                  aria-label="Search studios"
                  className="h-10 w-full border-border-bright/50 bg-background/70 pl-12 placeholder:text-muted-foreground/45"
                />
                <button type="submit" className="cursor-pointer sr-only">Search</button>
              </div>
            </form>
          </HudPanel>

          <div aria-live="polite">
            {error && !isLoading && <ErrorState message="Failed to load studios." />}

            {isLoading && (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="status" aria-busy="true" aria-live="polite">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="clip-corner border border-border/60 bg-background/60 p-3">
                    <div className="mb-3 h-28 animate-pulse bg-white/10" />
                    <div className="h-3 w-2/3 animate-pulse bg-white/10" />
                    <div className="mt-2 h-3 w-1/2 animate-pulse bg-white/10" />
                  </div>
                ))}
              </div>
            )}

            {!isLoading && !error && items.length === 0 && (
              <EmptyState
                icon={<Building2 className="size-10" />}
                title={search ? `No studios matching "${search}"` : 'No studios yet'}
                description={search ? undefined : 'Be the first studio to broadcast a signal.'}
                action={search ? undefined : { label: 'Create a studio', href: '/studios/new' }}
              />
            )}

            {items.length > 0 && (
              <>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((studio, index) => (
                    <Link
                      key={studio.id}
                      href={`/studios/${studio.slug}`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                      className={cn(
                        'group clip-corner relative flex flex-col overflow-hidden',
                        'border border-border/70 panel',
                        'transition-all duration-500',
                        'hover:scale-[1.02] hover:border-cyan/70 hover:shadow-[0_0_30px_rgb(62_231_255_/_0.15)]',
                        'animate-fadeIn',
                      )}
                    >
                      {/* Banner */}
                      <div className="relative h-36 overflow-hidden sm:h-44">
                        {studio.bannerUrl ? (
                          <img
                            src={studio.bannerUrl}
                            alt=""
                            className="size-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center bg-gradient-to-br from-cyan/10 via-[#050b0f] to-violet/10">
                            <Building2 className="size-10 text-muted-foreground/20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050b0f] via-transparent to-transparent" />

                        {/* Avatar + verified */}
                        <div className="absolute -bottom-8 left-5 flex items-end gap-3">
                          {studio.logoUrl ? (
                            <img
                              src={studio.logoUrl}
                              alt=""
                              className="relative size-16 border-2 border-border/60 object-cover shadow-lg"
                            />
                          ) : (
                            <div className="relative flex size-16 items-center justify-center border-2 border-border/60 panel font-display text-xl font-black uppercase text-muted-foreground shadow-lg">
                              {studio.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Body */}
                      <div className="flex flex-1 flex-col px-5 pb-5 pt-10">
                        <div className="mb-1 flex items-center gap-2">
                          <h2 className="font-display text-lg font-bold text-white group-hover:text-cyan transition-colors">
                            {studio.name}
                          </h2>
                          {studio.isVerified && (
                            <BadgeCheck className="size-5 fill-cyan text-background" aria-label="Verified" />
                          )}
                        </div>

                        {studio.tagline && (
                          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                            {studio.tagline}
                          </p>
                        )}

                        {/* Stats row */}
                        <div className="mt-auto flex items-center gap-4 border-t border-border/30 pt-3">
                          <span className="flex items-center gap-1.5 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground/60">
                            <Gamepad2 className="size-3" />
                            {studio.gamesCount} {studio.gamesCount === 1 ? 'game' : 'games'}
                          </span>
                          <span className="flex items-center gap-1.5 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground/60">
                            <Heart className="size-3" />
                            {studio.followersCount} followers
                          </span>
                          <span className="flex items-center gap-1.5 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground/60">
                            <Users className="size-3" />
                            {studio.membersCount} {studio.membersCount === 1 ? 'member' : 'members'}
                          </span>
                        </div>

                        {/* Location badge */}
                        {studio.location && (
                          <div className="absolute right-3 top-3">
                            <SignalLabel color="muted">{studio.location}</SignalLabel>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-7 flex items-center justify-center gap-4">
                    <div className="hidden h-px flex-1 bg-gradient-to-r from-transparent via-border-bright/45 to-border md:block" />
                    <div className="clip-corner flex items-center gap-6 border border-border bg-background/70 px-7 py-3">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="cursor-pointer text-cyan/60 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Previous page"
                      >
                        <ArrowLeft className="size-4" />
                      </button>
                      {getPageNumbers().map((p, index) =>
                        p === '...' ? (
                          <span key={`ellipsis-${index}`} className="font-mono text-sm text-muted-foreground">...</span>
                        ) : (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPage(p as number)}
                            className={
                              p === page
                                ? 'grid size-8 place-items-center border border-cyan bg-cyan/10 font-mono text-sm text-cyan shadow-[0_0_14px_rgb(62_231_255_/_0.18)] cursor-pointer'
                                : 'font-mono text-sm text-foreground/90 cursor-pointer'
                            }
                          >
                            {p}
                          </button>
                        ),
                      )}
                      <button
                        type="button"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!data?.hasMore}
                        className="cursor-pointer text-cyan/60 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Next page"
                      >
                        <ArrowRight className="size-4" />
                      </button>
                      <span className="h-8 w-px bg-border" />
                      <button
                        type="button"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!data?.hasMore}
                        className="clip-corner inline-flex h-8 items-center gap-3 border border-cyan/70 px-5 pm-display text-xs text-cyan transition hover:bg-cyan hover:text-cyan-foreground disabled:opacity-70 cursor-pointer"
                      >
                        {isLoading ? 'Loading' : 'Next'} <ArrowRight className="size-4" />
                      </button>
                    </div>
                    <div className="hidden h-px flex-1 bg-gradient-to-r from-border via-border-bright/45 to-transparent md:block" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <HudStatusRail />
      </main>
    </>
  );
}
