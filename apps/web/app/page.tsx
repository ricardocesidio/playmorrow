'use client';

import Link from 'next/link';
import { ArrowRight, Gamepad2, Rss, Building2 } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { GameCard } from '@/components/game-card';
import { FeedItemCard } from '@/components/feed-item';
import { SectionHeading } from '@/components/section-heading';
import { SignalLabel } from '@/components/signal-label';
import { usePublicFeed, useGames } from '@/lib/api/hooks';

export default function HomePage() {
  const { data: feedData, isLoading: feedLoading } = usePublicFeed(1, 4);
  const { data: gamesData, isLoading: gamesLoading } = useGames(1, 4);

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-20 lg:px-6 lg:py-28">
            <div className="max-w-2xl">
              <SignalLabel color="cyan">Next-gen indie discovery</SignalLabel>
              <h1 className="mt-4 font-display text-5xl font-semibold leading-tight tracking-tight lg:text-7xl">
                Discover tomorrow&apos;s
                <br />
                <span className="text-cyan">indie games</span> today.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
                Playmorrow is a curated social platform where indie studios showcase their games,
                share development logs, publish roadmaps, and build communities around their work.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/games"
                  className="inline-flex items-center gap-2 border border-coral bg-coral/10 px-6 py-3 font-mono text-xs uppercase tracking-widest text-coral transition-colors hover:bg-coral hover:text-coral-foreground"
                >
                  Explore games <ArrowRight className="size-3" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 border border-border px-6 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                >
                  Join as a studio
                </Link>
              </div>
            </div>
          </div>
          {/* Circuit decoration */}
          <div aria-hidden className="pointer-events-none absolute right-0 top-0 hidden h-full w-1/2 opacity-[0.03] lg:block">
            <svg viewBox="0 0 400 400" fill="none" className="size-full">
              <path d="M0 200h100v100h100" stroke="currentColor" strokeWidth="0.5" />
              <path d="M200 0v100h100v100h100" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="100" cy="200" r="2" fill="currentColor" />
              <circle cx="200" cy="100" r="2" fill="currentColor" />
              <circle cx="300" cy="200" r="2" fill="currentColor" />
            </svg>
          </div>
        </section>

        {/* Latest games */}
        <section className="mx-auto max-w-7xl px-4 py-16 lg:px-6 lg:py-20">
          <div className="flex items-end justify-between">
            <SectionHeading tag="Games" as="h2">Latest releases</SectionHeading>
            <Link
              href="/games"
              className="mb-6 flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-cyan transition-colors hover:text-cyan/80"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </div>

          {gamesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse border border-border bg-elevated" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {gamesData?.items.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </section>

        {/* Recent activity */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-5xl px-4 py-16 lg:px-6 lg:py-20">
            <SectionHeading tag="Feed" as="h2">Recent activity</SectionHeading>

            {feedLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse border border-border bg-elevated" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {feedData?.items.map((item) => (
                  <FeedItemCard key={`${item.type}-${item.id}`} item={item} />
                ))}
              </div>
            )}

            <div className="mt-8 text-center">
              <Link
                href="/feed"
                className="inline-flex items-center gap-2 border border-border px-6 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                <Rss className="size-3" /> View full feed
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-7xl px-4 py-16 lg:px-6 lg:py-20">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col items-center gap-2 border border-border bg-elevated p-8">
                <Gamepad2 className="size-6 text-cyan" />
                <span className="font-display text-4xl font-semibold text-foreground">Indie</span>
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Curated games</span>
              </div>
              <div className="flex flex-col items-center gap-2 border border-border bg-elevated p-8">
                <Building2 className="size-6 text-amber" />
                <span className="font-display text-4xl font-semibold text-foreground">Studios</span>
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Independent creators</span>
              </div>
              <div className="flex flex-col items-center gap-2 border border-border bg-elevated p-8">
                <Rss className="size-6 text-violet" />
                <span className="font-display text-4xl font-semibold text-foreground">Devlogs</span>
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Development feeds</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
