'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Building2, Search, BadgeCheck, Users, Gamepad2, Heart } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SignalLabel } from '@/components/signal-label';
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
    <div className="group flex items-center gap-2.5 transition-all duration-500 hover:drop-shadow-[0_0_6px_rgb(62_231_255_/_0.3)]">
      <div className="flex size-9 items-center justify-center border border-cyan/20 bg-cyan/5 text-cyan shadow-[0_0_12px_rgb(62_231_255_/_0.08)] transition-shadow duration-500 group-hover:shadow-[0_0_20px_rgb(62_231_255_/_0.2)]">
        {icon}
      </div>
      <div>
        <p className="font-mono text-lg font-black tabular-nums text-white">{count.toLocaleString()}</p>
        <p className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function StudiosPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useStudios(page, 20, search || undefined);

  if (!data && !isLoading) {
    return (
      <main className="relative min-h-screen bg-[#020609]">
        <div className="mx-auto max-w-7xl px-5 py-10">
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

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609]">
        {/* Grid overlay */}
        <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        {/* Top accent line */}
        <div className="pointer-events-none fixed left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="relative border-b border-border/40">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgb(62_231_255_/_0.08),transparent_55%)] animate-pulse-glow" />
          <div className="mx-auto max-w-6xl px-5 pb-8 pt-16 sm:px-8 lg:px-10">
            <div className="mb-8 flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center border border-cyan/30 bg-cyan/5 shadow-[0_0_20px_rgb(62_231_255_/_0.1)]">
                  <Building2 className="size-6 text-cyan" />
                </div>
                <div>
                  <h1 className="font-display text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
                    Studios
                  </h1>
                  <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                    Discover the teams behind tomorrow&apos;s games
                  </p>
                </div>
              </div>
            </div>

            {/* Stats row */}
            {data && !isLoading && (
              <div className="mb-8 flex flex-wrap gap-6">
                <StatItem icon={<Building2 className="size-4" />} label="Studios" value={data.total} />
                <StatItem icon={<Gamepad2 className="size-4" />} label="Games" value={totalGames} />
                <StatItem icon={<Heart className="size-4" />} label="Followers" value={totalFollowers} />
              </div>
            )}

            {/* Search */}
            <form onSubmit={handleSearch}>
              <div className="relative max-w-md">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-cyan/60" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search studios..."
                  className="clip-corner h-12 w-full border border-cyan/30 bg-[#050b0f]/80 pl-12 pr-4 font-mono text-sm text-white outline-none placeholder:text-muted-foreground/40 shadow-[0_0_12px_rgb(62_231_255_/_0.06)] transition-all duration-500 focus:border-cyan focus:shadow-[0_0_30px_rgb(62_231_255_/_0.2)]"
                />
              </div>
            </form>
          </div>
        </section>

        {/* ── Content ───────────────────────────────────────────────── */}
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:px-10">
          {isLoading && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="clip-corner animate-pulse border border-border/40 bg-[#050b0f]/30"
                  style={{ animationDelay: `${i * 0.1}s`, animationDuration: '1.5s' }}
                >
                  {/* Banner placeholder */}
                  <div className="h-36 bg-[#0a1a24]/50 sm:h-44" />
                  {/* Avatar placeholder */}
                  <div className="relative px-5 pb-5 pt-3">
                    <div className="mb-2 size-16 -mt-11 border-2 border-border/40 bg-[#0a1a24]/60" />
                    {/* Title bar */}
                    <div className="mb-3 h-5 w-3/5 bg-[#0a1a24]/60" />
                    {/* Tagline */}
                    <div className="mb-2 h-3 w-full bg-[#0a1a24]/40" />
                    <div className="mb-4 h-3 w-4/5 bg-[#0a1a24]/40" />
                    {/* Divider */}
                    <div className="mb-3 h-px bg-border/20" />
                    {/* Stats row */}
                    <div className="flex gap-4">
                      <div className="h-3 w-16 bg-[#0a1a24]/40" />
                      <div className="h-3 w-20 bg-[#0a1a24]/40" />
                      <div className="h-3 w-16 bg-[#0a1a24]/40" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && !isLoading && (
            <div className="clip-corner border border-coral/40 bg-coral/5 py-16 text-center">
              <p className="font-mono text-[0.65rem] text-coral">Failed to load studios.</p>
            </div>
          )}

          {!isLoading && !error && data?.items.length === 0 && (
            <div className="clip-corner border border-border/40 bg-[#050b0f]/30 py-20 text-center">
              <Building2 className="mx-auto mb-4 size-12 text-muted-foreground/30" />
              <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                {search ? `No studios matching "${search}"` : 'No studios yet'}
              </p>
              {!search && (
                <Link
                  href="/studios/new"
                  className="mt-6 inline-flex items-center gap-2 border border-cyan/60 px-5 py-3 font-mono text-[0.6rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background"
                >
                  Create a studio
                </Link>
              )}
            </div>
          )}

          {data && data.items.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data.items.map((studio, index) => (
                  <Link
                    key={studio.id}
                    href={`/studios/${studio.slug}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    className={cn(
                      'group clip-corner relative flex flex-col overflow-hidden',
                      'border border-border/70 bg-[#050b0f]/80',
                      'shadow-[0_0_30px_rgb(0_0_0_/_0.3)]',
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
                          <div className="relative flex size-16 items-center justify-center border-2 border-border/60 bg-[#050b0f] font-display text-xl font-black uppercase text-muted-foreground shadow-lg">
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
                <div className="mt-12 flex items-center justify-center gap-4">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="clip-corner border border-border/60 px-5 py-2.5 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground shadow-[0_0_8px_rgb(62_231_255_/_0.04)] transition-all duration-300 hover:border-cyan hover:text-cyan hover:shadow-[0_0_20px_rgb(62_231_255_/_0.15)] disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={cn(
                          'flex size-8 items-center justify-center font-mono text-[0.6rem] transition-all duration-300',
                          p === page
                            ? 'border border-cyan/60 bg-cyan/10 text-cyan shadow-[0_0_15px_rgb(62_231_255_/_0.15)]'
                            : 'border border-border/40 text-muted-foreground shadow-[0_0_6px_rgb(62_231_255_/_0.03)] hover:border-cyan/30 hover:text-cyan/70 hover:shadow-[0_0_12px_rgb(62_231_255_/_0.1)]',
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={!data?.hasMore}
                    onClick={() => setPage((p) => p + 1)}
                    className="clip-corner border border-border/60 px-5 py-2.5 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground shadow-[0_0_8px_rgb(62_231_255_/_0.04)] transition-all duration-300 hover:border-cyan hover:text-cyan hover:shadow-[0_0_20px_rgb(62_231_255_/_0.15)] disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
