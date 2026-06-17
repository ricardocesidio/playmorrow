'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Globe, Calendar } from 'lucide-react';

import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { GameCard } from '@/components/game-card';
import { useStudio, useStudioMembers, useStudioGames } from '@/lib/api/hooks';
import { FollowButton } from '@/components/follow-button';

export default function StudioDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: studio, isLoading, error } = useStudio(slug);
  const { data: members } = useStudioMembers(slug);
  const { data: gamesData } = useStudioGames(slug);

  if (isLoading) {
    return (
      <>
        <Nav />
        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="aspect-[3/1] rounded-xl bg-muted" />
            <div className="h-4 w-96 rounded bg-muted" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !studio) {
    return (
      <>
        <Nav />
        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-20 text-center">
          <h1 className="text-2xl font-semibold">Studio not found</h1>
          <p className="mt-2 text-muted-foreground">This studio doesn&apos;t exist or was removed.</p>
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
        <Link
          href="/games"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>

        {/* Banner */}
        {studio.bannerUrl && (
          <div className="mb-6 overflow-hidden rounded-xl">
            <img src={studio.bannerUrl} alt="" className="aspect-[3/1] w-full object-cover" />
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start gap-6">
          {studio.logoUrl && (
            <div className="size-20 shrink-0 overflow-hidden rounded-xl">
              <img src={studio.logoUrl} alt={studio.name} className="size-full object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold tracking-tight">{studio.name}</h1>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {studio.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" /> {studio.location}
                </span>
              )}
              {studio.foundedYear && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3.5" /> Founded {studio.foundedYear}
                </span>
              )}
              <FollowButton targetType="studio" slug={slug} />
              {studio.websiteUrl && (
                <a
                  href={studio.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                >
                  <Globe className="size-3.5" /> Website
                </a>
              )}
            </div>
          </div>
        </div>

        {studio.tagline && (
          <p className="mb-6 text-lg text-muted-foreground">{studio.tagline}</p>
        )}

        {studio.description && (
          <section className="mb-10">
            <h2 className="mb-3 text-lg font-semibold">About</h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {studio.description}
            </div>
          </section>
        )}

        {/* Members */}
        {members?.members && members.members.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-lg font-semibold">Team ({members.members.length})</h2>
            <div className="flex flex-wrap gap-3">
              {members.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card/20 p-3"
                >
                  {m.user.avatarUrl ? (
                    <img src={m.user.avatarUrl} alt="" className="size-10 rounded-full object-cover" />
                  ) : (
                    <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-xs text-primary">
                      {m.user.displayName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{m.user.displayName}</p>
                    <p className="text-xs text-muted-foreground">{m.title ?? m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Games */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold">Games ({studio.gamesCount})</h2>
          {gamesData?.items.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {gamesData.items.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No games yet.</p>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
