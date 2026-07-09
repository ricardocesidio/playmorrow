'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, Heart } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { HudPanel, CircuitFrame, HudStatusRail } from '@/components/playmorrow/hud';
import { useGame, useGameComments } from '@/lib/api/hooks';

export default function GameCommentsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: game } = useGame(slug);
  const { data: commentsData, isLoading } = useGameComments(slug);
  const comments = commentsData?.items ?? [];

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
            <MessageCircle className="size-6 text-cyan" />
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">
              Community Discussion
            </h1>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse clip-corner border border-border/70 bg-[#050b0f]/80 p-5">
                  <div className="h-3 w-1/4 rounded bg-border/20 mb-3" />
                  <div className="h-4 w-2/3 rounded bg-border/20 mb-2" />
                  <div className="h-3 w-1/2 rounded bg-border/20" />
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <HudPanel className="p-6 text-center">
              <p className="font-mono text-sm text-muted-foreground">No comments yet. Be the first to join the discussion.</p>
            </HudPanel>
          ) : (
            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    {c.author?.avatarUrl && (
                      <img src={c.author.avatarUrl} alt="" className="size-8 rounded-full border border-border/40" />
                    )}
                    <div>
                      <p className="font-mono text-xs font-semibold text-foreground">{c.author?.displayName || 'Anonymous'}</p>
                      <p className="font-mono text-[0.55rem] text-muted-foreground">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </p>
                    </div>
                  </div>
                  <p className="font-mono text-sm text-foreground leading-relaxed">{c.body}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="size-3" />
                      {('reactions' in c ? (c as { reactions?: { LIKE?: number } }).reactions?.LIKE : 0) ?? 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <HudStatusRail />
      </main>
    </>
  );
}
