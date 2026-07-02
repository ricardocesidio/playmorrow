'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Building2, Gamepad2, Loader2, Heart } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { useMyFollows } from '@/lib/api/hooks';
import { useRouter } from 'next/navigation';

export default function FollowingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data: follows, isLoading } = useMyFollows();
  const [tab, setTab] = useState<'studios' | 'games'>('studios');

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

  const studios = follows?.studios ?? [];
  const games = follows?.games ?? [];

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

        <div className="relative mx-auto max-w-4xl px-5 py-6 sm:px-8 lg:px-10">
          <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan">
            <ArrowLeft className="size-3" /> Back to dashboard
          </Link>

          <h1 className="mb-6 font-display text-3xl font-black uppercase tracking-tight text-white">
            <Heart className="mr-3 inline size-7 text-coral" />
            Following
          </h1>

          <div className="mb-6 flex gap-4 border-b border-border/60">
            <button onClick={() => setTab('studios')}
              className={`pb-3 font-mono text-[0.6rem] uppercase tracking-widest cursor-pointer ${tab === 'studios' ? 'border-b-2 border-cyan text-cyan' : 'text-muted-foreground'}`}>
              Studios ({studios.length})
            </button>
            <button onClick={() => setTab('games')}
              className={`pb-3 font-mono text-[0.6rem] uppercase tracking-widest cursor-pointer ${tab === 'games' ? 'border-b-2 border-cyan text-cyan' : 'text-muted-foreground'}`}>
              Games ({games.length})
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-cyan" /></div>
          ) : tab === 'studios' && studios.length === 0 ? (
            <div className="clip-corner border border-border/60 bg-[#050b0f]/50 px-6 py-16 text-center">
              <Building2 className="mx-auto mb-4 size-10 text-muted-foreground" />
              <p className="font-display text-xl font-bold text-white">Not following any studios</p>
              <p className="mt-2 font-mono text-[0.6rem] text-muted-foreground">Follow studios to get updates on their games.</p>
              <Link href="/studios" className="mt-6 inline-flex items-center gap-2 border border-cyan bg-cyan/10 px-6 py-3 font-mono text-[0.6rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background">
                <Building2 className="size-4" /> Browse studios
              </Link>
            </div>
          ) : tab === 'games' && games.length === 0 ? (
            <div className="clip-corner border border-border/60 bg-[#050b0f]/50 px-6 py-16 text-center">
              <Gamepad2 className="mx-auto mb-4 size-10 text-muted-foreground" />
              <p className="font-display text-xl font-bold text-white">Not following any games</p>
              <p className="mt-2 font-mono text-[0.6rem] text-muted-foreground">Follow games to get notified of updates.</p>
              <Link href="/games" className="mt-6 inline-flex items-center gap-2 border border-cyan bg-cyan/10 px-6 py-3 font-mono text-[0.6rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background">
                <Gamepad2 className="size-4" /> Browse games
              </Link>
            </div>
          ) : tab === 'studios' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {studios.map((s) => (
                <Link key={s.id} href={`/studios/${s.slug}`}
                  className="clip-corner flex items-center gap-4 border border-border/70 bg-[#050b0f]/80 p-4 shadow-[0_0_20px_rgb(0_0_0_/_0.25)] transition hover:border-cyan/70">
                  <div className="grid size-12 shrink-0 place-items-center rounded-full border border-border bg-background/60 overflow-hidden">
                    {s.logoUrl ? <img src={s.logoUrl} alt="" className="size-full object-cover" /> : <Building2 className="size-5 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-bold text-white truncate">{s.name}</p>
                    <p className="font-mono text-[0.55rem] text-muted-foreground">@{s.slug}</p>
                  </div>
                  <Users className="ml-auto size-4 text-cyan" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {games.map((g) => (
                <Link key={g.id} href={`/games/${g.slug}`}
                  className="group overflow-hidden border border-border/80 bg-[#050b0f]/70 transition hover:border-cyan/70">
                  <div className="relative aspect-[1.15/1] overflow-hidden">
                    <img src={g.coverUrl || ''} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/15 to-transparent" />
                    <div className="absolute inset-x-3 bottom-3">
                      <h3 className="font-display text-[1.2rem] uppercase leading-none text-white drop-shadow-lg">{g.title}</h3>
                      <p className="mt-1 text-[0.6rem] text-muted-foreground">{g.studio?.name}</p>
                    </div>
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
