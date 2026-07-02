'use client';

import Link from 'next/link';
import { ArrowLeft, Heart, Bookmark, Gamepad2, Users, Star, Loader2 } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { useMyWishlist, useRemoveGameFromWishlist } from '@/lib/api/hooks';
import { useRouter } from 'next/navigation';

export default function WishlistPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data: wishlist, isLoading } = useMyWishlist();
  const removeWishlist = useRemoveGameFromWishlist();

  if (authLoading) {
    return (
      <>
        <SiteHeader />
        <div className="flex min-h-screen items-center justify-center bg-[#020609]">
          <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
        </div>
      </>
    );
  }

  if (!user) { router.replace('/login'); return null; }

  const items = wishlist?.items ?? [];

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

        <div className="relative mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
          <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan">
            <ArrowLeft className="size-3" /> Back to dashboard
          </Link>

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">
                <Heart className="mr-3 inline size-7 text-coral" />
                My Wishlist
              </h1>
              <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-widest text-muted-foreground">
                {items.length} game{items.length !== 1 ? 's' : ''} saved
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-cyan" /></div>
          ) : items.length === 0 ? (
            <div className="clip-corner border border-border/60 bg-[#050b0f]/50 px-6 py-16 text-center">
              <Bookmark className="mx-auto mb-4 size-10 text-muted-foreground" />
              <p className="font-display text-xl font-bold text-white">Your wishlist is empty</p>
              <p className="mt-2 font-mono text-[0.6rem] text-muted-foreground">Save games you're interested in to track their progress.</p>
              <Link href="/games" className="mt-6 inline-flex items-center gap-2 border border-cyan bg-cyan/10 px-6 py-3 font-mono text-[0.6rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background">
                <Gamepad2 className="size-4" /> Browse games
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <div key={item.id} className="group overflow-hidden border border-border/80 bg-[#050b0f]/70 transition hover:border-cyan/70">
                  <Link href={`/games/${item.game.slug}`} className="block">
                    <div className="relative aspect-[1.15/1] overflow-hidden bg-muted">
                      {item.game.coverUrl ? (
                        <img src={item.game.coverUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/15 to-transparent" />
                      <div className="absolute inset-x-3 bottom-3">
                        <h3 className="font-display text-[1.35rem] uppercase leading-none text-white drop-shadow-lg">{item.game.title}</h3>
                        {item.game.tagline && <p className="mt-1 text-[0.65rem] text-muted-foreground">{item.game.tagline}</p>}
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center justify-between p-3">
                    <span className="font-mono text-[0.55rem] text-muted-foreground/60">Saved {new Date(item.createdAt).toLocaleDateString()}</span>
                    <button onClick={() => removeWishlist.mutate({ slug: item.game.slug })}
                      className="flex cursor-pointer items-center gap-1 font-mono text-[0.55rem] uppercase tracking-wider text-coral hover:text-coral/80">
                      <Star className="size-3" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
