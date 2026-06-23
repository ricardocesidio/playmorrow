'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { StatusBadge } from '@/components/status-badge';
import { SignalLabel } from '@/components/signal-label';
import { MediaGallery } from '@/components/media-gallery';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { ErrorState } from '@/components/error-state';
import { useGame, useGameDevlogs, useGameRoadmap } from '@/lib/api/hooks';
import { FollowButton } from '@/components/follow-button';
import { ReportForm } from '@/components/report-form';
import { WishlistButton } from '@/components/wishlist-button';

export default function GameDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: game, isLoading, error } = useGame(slug);
  const { data: devlogs } = useGameDevlogs(slug);
  const { data: roadmap } = useGameRoadmap(slug);

  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-4 py-8 lg:px-6 lg:py-10">
          <LoadingSkeleton count={6} height="h-16" />
        </main>
        <SiteFooter />
      </>
    );
  }

  if (error || !game) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-4 py-8 lg:px-6 lg:py-10">
          <ErrorState message="Game not found." />
          <div className="mt-4 text-center">
            <Link href="/games" className="font-mono text-xs uppercase tracking-widest text-cyan underline">Back to games</Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 lg:px-6 lg:py-10">
        <Link
          href="/games"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> Back
        </Link>

        {/* Header */}
        <div className="mb-8 border-b border-border pb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="font-display text-4xl font-semibold tracking-tight">{game.title}</h1>
                <StatusBadge status={game.status} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                {game.studio && (
                  <Link
                    href={`/studios/${game.studio.slug}`}
                    className="font-mono text-xs uppercase tracking-widest text-cyan transition-colors hover:text-cyan/80"
                  >
                    {game.studio.name}
                  </Link>
                )}
                {game.expectedReleaseText && (
                  <SignalLabel color="amber">{game.expectedReleaseText}</SignalLabel>
                )}
                <FollowButton targetType="game" slug={slug} />
                <WishlistButton slug={slug} />
                <ReportForm targetType="GAME" targetId={game.id} />
              </div>
            </div>
          </div>

          {game.tagline && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{game.tagline}</p>
          )}

          {/* Tags */}
          {game.tags && game.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {game.tags.map((t) => (
                <span key={t} className="border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-10 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Cover */}
            {game.coverUrl && (
              <div className="mb-8 border border-border">
                <img src={game.coverUrl} alt={game.title} className="w-full object-cover" />
              </div>
            )}

            {/* Description */}
            {game.description && (
              <section className="mb-8">
                <h2 className="mb-3 font-display text-xl font-semibold">About</h2>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {game.description}
                </div>
              </section>
            )}

            {/* Media gallery */}
            <MediaGallery media={game.media ?? []} />

            {/* Devlogs */}
            {devlogs && devlogs.items.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 font-display text-xl font-semibold">Devlogs ({devlogs.total})</h2>
                <div className="space-y-3">
                  {devlogs.items.map((dl) => (
                    <Link
                      key={dl.id}
                      href={`/devlogs/${dl.id}`}
                      className="block border border-border bg-elevated p-4 transition-colors hover:border-border-bright"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-display font-semibold">{dl.title}</p>
                          {dl.excerpt && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{dl.excerpt}</p>}
                        </div>
                        {dl.coverUrl && (
                          <img src={dl.coverUrl} alt="" className="size-16 shrink-0 border border-border object-cover" />
                        )}
                      </div>
                      <div className="mt-2 flex gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                        {dl.publishedAt && <span>{new Date(dl.publishedAt).toLocaleDateString()}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="border border-border bg-elevated p-4">
              <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">Details</h3>
              <div className="space-y-2 font-mono text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span className="uppercase tracking-widest">Followers</span>
                  <span className="text-foreground">{game.followersCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="uppercase tracking-widest">Status</span>
                  <StatusBadge status={game.status} />
                </div>
                {game.expectedReleaseText && (
                  <div className="flex justify-between">
                    <span className="uppercase tracking-widest">Release</span>
                    <span className="text-foreground">{game.expectedReleaseText}</span>
                  </div>
                )}
                {game.priceCents != null && (
                  <div className="flex justify-between">
                    <span className="uppercase tracking-widest">Price</span>
                    <span className="text-foreground">{game.isFree ? 'Free' : `$${(game.priceCents / 100).toFixed(2)}`}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Platform links */}
            {game.platformLinks && game.platformLinks.length > 0 && (
              <div className="border border-border bg-elevated p-4">
                <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">Where to find</h3>
                <div className="space-y-2">
                  {game.platformLinks.map((pl) => (
                    <a
                      key={pl.id}
                      href={pl.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-cyan transition-colors hover:text-cyan/80"
                    >
                      <ExternalLink className="size-3" />
                      {pl.label ?? pl.platform}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Roadmap */}
            {roadmap && roadmap.length > 0 && (
              <div className="border border-border bg-elevated p-4">
                <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">Roadmap</h3>
                <div className="space-y-3">
                  {roadmap.map((item) => (
                    <div key={item.id} className="relative pl-4 before:absolute before:left-0 before:top-1.5 before:size-1.5 before:bg-cyan before:shadow-[0_0_6px_oklch(0.75_0.12_200_/_0.4)]">
                      <p className="font-display text-sm font-medium">{item.title}</p>
                      {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                      {item.targetDate && (
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">{item.targetDate}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
