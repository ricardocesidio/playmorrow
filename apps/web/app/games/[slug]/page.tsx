'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, ExternalLink } from 'lucide-react';

import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { Tag } from '@/components/tag';
import { useGame, useGameDevlogs, useGameRoadmap, useGamePressKit } from '@/lib/api/hooks';

export default function GameDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: game, isLoading, error } = useGame(slug);
  const { data: devlogs } = useGameDevlogs(slug);
  const { data: roadmap } = useGameRoadmap(slug);
  const { data: pressKit } = useGamePressKit(slug);

  if (isLoading) {
    return (
      <>
        <Nav />
        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="aspect-video rounded-xl bg-muted" />
            <div className="h-4 w-96 rounded bg-muted" />
            <div className="h-20 rounded bg-muted" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !game) {
    return (
      <>
        <Nav />
        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-20 text-center">
          <h1 className="text-2xl font-semibold">Game not found</h1>
          <p className="mt-2 text-muted-foreground">This game doesn&apos;t exist or was removed.</p>
          <Link href="/games" className="mt-6 inline-flex items-center gap-2 text-sm text-primary underline">
            <ArrowLeft className="size-4" /> Back to games
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        {/* Back link */}
        <Link
          href="/games"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to games
        </Link>

        {/* Header */}
        <div className="mb-8">
          {game.coverUrl && (
            <div className="mb-6 overflow-hidden rounded-xl">
              <img
                src={game.coverUrl}
                alt={game.title}
                className="aspect-video w-full object-cover"
              />
            </div>
          )}

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{game.title}</h1>
              {game.studio && (
                <Link
                  href={`/studios/${game.studio.slug}`}
                  className="mt-1 inline-block text-sm text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
                >
                  {game.studio.name}
                </Link>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Users className="size-4" />
              <span>{game.followersCount} followers</span>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">{game.status}</span>
            </div>
          </div>

          {game.tagline && (
            <p className="mt-3 text-lg text-muted-foreground">{game.tagline}</p>
          )}
        </div>

        {/* Tags + price */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          {game.tags?.map((t) => <Tag key={t}>{t}</Tag>)}
          {game.priceCents != null && (
            <span className="text-sm text-muted-foreground">
              {game.isFree ? 'Free' : `$${(game.priceCents / 100).toFixed(2)}`}
            </span>
          )}
        </div>

        {/* Description */}
        {game.description && (
          <section className="mb-10">
            <h2 className="mb-3 text-lg font-semibold">About</h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {game.description}
            </div>
          </section>
        )}

        {/* Media */}
        {game.media?.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-lg font-semibold">Media</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {game.media.map((m) => (
                <div key={m.id} className="overflow-hidden rounded-lg border border-border">
                  <img src={m.url} alt={m.caption ?? ''} className="aspect-video w-full object-cover" />
                  {m.caption && (
                    <p className="p-2 text-xs text-muted-foreground">{m.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Platform links */}
        {game.platformLinks?.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-lg font-semibold">Where to find</h2>
            <div className="flex flex-wrap gap-2">
              {game.platformLinks.map((pl) => (
                <a
                  key={pl.id}
                  href={pl.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-sm transition-colors hover:bg-accent"
                >
                  <ExternalLink className="size-3" />
                  {pl.label ?? pl.platform}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Devlogs */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">Devlogs</h2>
          {devlogs?.items.length ? (
            <div className="space-y-3">
              {devlogs.items.map((d) => (
                <Link
                  key={d.id}
                  href={`/devlogs/${d.id}`}
                  className="block rounded-xl border border-border bg-card/20 p-4 transition-colors hover:border-primary/40"
                >
                  <div className="text-xs text-muted-foreground">
                    {d.publishedAt ? new Date(d.publishedAt).toLocaleDateString() : ''}
                  </div>
                  <h3 className="mt-1 font-medium">{d.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.excerpt}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No devlogs yet.</p>
          )}
        </section>

        {/* Roadmap */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">Roadmap</h2>
          {roadmap?.length ? (
            <div className="space-y-2">
              {roadmap.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between rounded-lg border border-border bg-card/20 p-3"
                >
                  <div>
                    <h4 className="text-sm font-medium">{item.title}</h4>
                    {item.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                  <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No roadmap yet.</p>
          )}
        </section>

        {/* Press Kit */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">Press kit</h2>
          {pressKit ? (
            <div className="rounded-xl border border-border bg-card/20 p-4">
              {pressKit.headline && (
                <p className="text-sm text-muted-foreground">{pressKit.headline}</p>
              )}
              {pressKit.contactEmail && (
                <a
                  href={`mailto:${pressKit.contactEmail}`}
                  className="mt-2 inline-flex items-center gap-1 text-sm text-primary underline"
                >
                  {pressKit.contactEmail}
                </a>
              )}
              {pressKit.downloadUrl && (
                <a
                  href={pressKit.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-primary underline"
                >
                  <ExternalLink className="size-3" /> Download assets
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No press kit yet.</p>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
