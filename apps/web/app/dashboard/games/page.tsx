'use client';

import Link from 'next/link';
import { Gamepad2, Plus, ExternalLink } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { useMyGames } from '@/lib/api/hooks';
import type { Game, Studio } from '@/lib/api/client';

type StudioGame = Game & { studio: Studio };

export default function MyGamesPage() {
  const { user, token } = useAuth();
  const { data: games, isLoading } = useMyGames(token ?? undefined);

  if (!user) return null;

  const studioGames = (games ?? []) as StudioGame[];

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-3 pb-8 pt-3 sm:px-5">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-black uppercase text-foreground">My Games</h1>
              <p className="mt-1 text-sm text-muted-foreground">Manage your published and in-development games.</p>
            </div>
            <Link href="/dashboard/games/new" className="clip-corner inline-flex items-center gap-2 border border-cyan bg-cyan/10 px-5 py-3 font-mono text-xs uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background">
              <Plus className="size-4" /> New Game
            </Link>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-52 animate-pulse border border-border bg-muted/30" />
              ))}
            </div>
          ) : studioGames.length === 0 ? (
            <div className="panel flex flex-col items-center gap-4 p-12 text-center">
              <Gamepad2 className="size-12 text-muted-foreground" />
              <h2 className="font-display text-xl font-bold text-foreground">No games yet</h2>
              <p className="text-sm text-muted-foreground">Create your first game to start building your portfolio.</p>
              <Link href="/dashboard/games/new" className="clip-corner inline-flex items-center gap-2 border border-coral bg-coral px-5 py-3 font-mono text-xs uppercase tracking-widest text-coral-foreground">
                <Plus className="size-4" /> Create Your First Game
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {studioGames.map((game) => (
                <Link
                  key={game.id}
                  href={`/games/${game.slug}`}
                  className="group overflow-hidden border border-border/90 bg-background/60 transition hover:-translate-y-0.5 hover:border-cyan/70"
                >
                  <div className="relative aspect-[1.6/1] overflow-hidden">
                    <img
                      src={game.coverUrl || '/demo/games/neon-warden/hero.svg'}
                      alt={game.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                    <span className="absolute right-2 top-2 border border-coral/60 bg-coral/15 px-2 py-1 font-mono text-[0.55rem] uppercase text-coral">
                      {game.status.replace(/_/g, ' ')}
                    </span>
                    <div className="absolute inset-x-3 bottom-3">
                      <h3 className="font-display text-xl uppercase leading-none text-white">{game.title}</h3>
                      <p className="mt-1 text-[0.68rem] text-muted-foreground">{game.tagline || game.genres || 'Studio Project'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <div className="flex gap-3 font-mono text-[0.58rem] text-muted-foreground">
                      <span>{game.followersCount} followers</span>
                      <span>{game.viewsCount ?? 0} views</span>
                    </div>
                    <ExternalLink className="size-3.5 text-muted-foreground transition group-hover:text-cyan" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
