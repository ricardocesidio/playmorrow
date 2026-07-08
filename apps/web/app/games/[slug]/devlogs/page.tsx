'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Flame, MessageCircle } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { HudPanel, CircuitFrame, HudStatusRail } from '@/components/playmorrow/hud';
import { StatusBadge } from '@/components/status-badge';
import { useGame, useGameDevlogs } from '@/lib/api/hooks';

export default function GameDevlogsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: game } = useGame(slug);
  const { data: devlogsData, isLoading } = useGameDevlogs(slug);
  const devlogs = devlogsData?.items ?? [];

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
        <CircuitFrame className="opacity-30" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <Link
            href={`/games/${slug}`}
            className="mb-6 clip-corner inline-flex items-center gap-1.5 border border-border/60 px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan"
          >
            <ArrowLeft className="size-4" /> {game?.title || 'Back to game'}
          </Link>

          <div className="mb-8 flex items-center gap-3">
            <FileText className="size-6 text-cyan" />
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">
              {game?.title ? `${game.title} Devlogs` : 'Devlogs'}
            </h1>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse clip-corner border border-border/70 bg-[#050b0f]/80 p-5">
                  <div className="h-4 w-1/3 rounded bg-border/20 mb-3" />
                  <div className="h-3 w-2/3 rounded bg-border/20 mb-2" />
                  <div className="h-3 w-1/2 rounded bg-border/20" />
                </div>
              ))}
            </div>
          ) : devlogs.length === 0 ? (
            <HudPanel className="p-6 text-center">
              <p className="font-mono text-sm text-muted-foreground">No devlogs published yet.</p>
            </HudPanel>
          ) : (
            <div className="space-y-4">
              {devlogs.map((dl) => (
                <Link
                  key={dl.id}
                  href={`/devlogs/${dl.id}`}
                  className="clip-corner block border border-border/70 bg-[#050b0f]/80 p-5 shadow-[0_0_20px_rgb(0_0_0_/_0.15)] transition hover:border-cyan/50 sm:p-6"
                >
                  <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground mb-2">
                    <StatusBadge status={dl.status} />
                    {dl.publishedAt && (
                      <span>{new Date(dl.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    )}
                    {dl.category && (
                      <span className="border border-violet/30 bg-violet/5 px-1.5 py-0.5 text-[0.5rem] text-violet">{dl.category}</span>
                    )}
                  </div>
                  <h2 className="font-display text-lg font-black uppercase tracking-tight text-white">{dl.title}</h2>
                  {dl.subtitle && <p className="mt-1 font-mono text-sm text-muted-foreground">{dl.subtitle}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Flame className="size-3" />{dl.reactionsCount ?? 0}</span>
                    <span className="inline-flex items-center gap-1"><MessageCircle className="size-3" />{dl.commentsCount ?? 0}</span>
                    {dl.readingTimeMin && <span>{dl.readingTimeMin} min read</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <HudStatusRail />
      </main>
    </>
  );
}
