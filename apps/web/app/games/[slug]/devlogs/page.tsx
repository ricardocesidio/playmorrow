'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Flame, MessageCircle } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { HudPanel, CircuitFrame, HudStatusRail } from '@/components/playmorrow/hud';
import { StatusBadge } from '@/components/status-badge';
import { useGame, useGameDevlogs } from '@/lib/api/hooks';

const PAGE_SIZE = 5;

export default function GameDevlogsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: game } = useGame(slug);
  const [page, setPage] = useState(1);
  const { data: devlogsData, isLoading } = useGameDevlogs(slug, page, PAGE_SIZE);
  const devlogs = devlogsData?.items ?? [];
  const hasMore = devlogsData?.hasMore ?? false;
  const total = devlogsData?.total ?? 0;

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
        <CircuitFrame className="opacity-30" />

        <div className="relative z-10 mx-auto max-w-4xl">
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
            <div className="space-y-6">
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
            <>
              <div className="space-y-6">
                {devlogs.map((dl) => (
                  <Link
                    key={dl.id}
                    href={`/devlogs/${dl.id}`}
                    className="clip-corner group block border border-border/70 bg-[#050b0f]/80 p-5 shadow transition hover:border-cyan/50"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {dl.screenshots && dl.screenshots.length > 0 ? (
                        <div className="w-full sm:w-48 h-40 sm:h-28 overflow-hidden rounded border border-border/40 shrink-0">
                          <img src={dl.screenshots[0]!.url} alt="" className="size-full object-cover" />
                        </div>
                      ) : null}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground mb-1">
                          <StatusBadge status={dl.status} />
                          {dl.publishedAt && <span>{new Date(dl.publishedAt).toLocaleDateString()}</span>}
                          {dl.category && <span className="border border-violet/30 bg-violet/5 px-1 py-0.5 text-[0.5rem] text-violet">{dl.category}</span>}
                        </div>
                        <h2 className="font-display text-lg font-black uppercase tracking-tight text-white group-hover:text-cyan">{dl.title}</h2>
                        {dl.subtitle && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{dl.subtitle}</p>}
                        {dl.body && <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{dl.body.replace(/[#*`_]/g, ' ').substring(0, 180)}...</p>}
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          {dl.author && <span>by {dl.author.displayName || dl.author.username}</span>}
                          <span className="inline-flex items-center gap-1"><Flame className="size-3" />{dl.reactionsCount ?? 0}</span>
                          <span className="inline-flex items-center gap-1"><MessageCircle className="size-3" />{dl.commentsCount ?? 0}</span>
                          {dl.readingTimeMin && <span>{dl.readingTimeMin} min</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-between text-xs font-mono">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="clip-corner border border-cyan/50 px-4 py-2 text-cyan disabled:opacity-40 hover:bg-cyan/10"
                >
                  ← Prev
                </button>
                <span className="text-muted-foreground">
                  Page {page} {total > 0 && `of ${Math.ceil(total / PAGE_SIZE)}`} ({devlogs.length} shown)
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasMore}
                  className="clip-corner border border-cyan/50 px-4 py-2 text-cyan disabled:opacity-40 hover:bg-cyan/10"
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
        <HudStatusRail />
      </main>
    </>
  );
}
