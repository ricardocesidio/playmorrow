'use client';

import Link from 'next/link';
import { ArrowRight, Gamepad2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { GameCard } from '@/components/game-card';
import { FeedItemCard } from '@/components/feed-item';
import { usePublicFeed, useGames } from '@/lib/api/hooks';

export default function HomePage() {
  const { data: feedData, isLoading: feedLoading } = usePublicFeed(1, 4);
  const { data: gamesData, isLoading: gamesLoading } = useGames(1, 4);

  return (
    <>
      <Nav />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6">
        {/* Hero */}
        <section className="flex flex-col items-center py-20 text-center sm:py-28">
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Discover{' '}
            <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              tomorrow&apos;s
            </span>{' '}
            indie games today.
          </h1>

          <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            Follow indie studios, watch games evolve through devlogs and roadmaps, try early demos,
            and find the next project worth believing in.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/games">
                Explore games
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/studios/new">Create studio profile</Link>
            </Button>
          </div>
        </section>

        {/* Latest games */}
        <section className="pb-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Latest games</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/games">
                View all <ArrowRight className="size-3" />
              </Link>
            </Button>
          </div>
          {gamesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[3/2] animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : gamesData?.items.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {gamesData.items.slice(0, 4).map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card/30 py-12">
              <Sparkles className="size-8 text-muted-foreground/40" />
              <p className="text-muted-foreground">No games yet. Be the first!</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/studios/new">Create a studio</Link>
              </Button>
            </div>
          )}
        </section>

        {/* Recent activity */}
        <section className="pb-20">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent activity</h2>
          </div>
          {feedLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : feedData?.items.length ? (
            <div className="space-y-3">
              {feedData.items.map((item) => (
                <FeedItemCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card/30 py-12">
              <Gamepad2 className="size-8 text-muted-foreground/40" />
              <p className="text-muted-foreground">No activity yet.</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
