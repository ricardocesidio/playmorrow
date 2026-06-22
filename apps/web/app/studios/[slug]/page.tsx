'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Globe, Calendar, Users, Gamepad2, Heart } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { GameCard } from '@/components/game-card';
import { SignalLabel } from '@/components/signal-label';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { ErrorState } from '@/components/error-state';
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
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-4 py-8 lg:px-6 lg:py-10">
          <LoadingSkeleton count={6} height="h-16" />
        </main>
        <SiteFooter />
      </>
    );
  }

  if (error || !studio) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-4 py-8 lg:px-6 lg:py-10">
          <ErrorState message="Studio not found." />
          <div className="mt-4 text-center">
            <Link href="/studios" className="font-mono text-xs uppercase tracking-widest text-cyan underline">Back to studios</Link>
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

        {/* Banner */}
        {studio.bannerUrl && (
          <div className="mb-6 border border-border">
            <img src={studio.bannerUrl} alt="" className="aspect-[3/1] w-full object-cover" />
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start gap-6">
          {studio.logoUrl && (
            <div className="size-20 shrink-0 border border-border">
              <img src={studio.logoUrl} alt={studio.name} className="size-full object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-semibold tracking-tight">{studio.name}</h1>
              {studio.isVerified && <SignalLabel color="cyan">Verified</SignalLabel>}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {studio.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" /> {studio.location}
                </span>
              )}
              {studio.foundedYear && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3" /> Founded {studio.foundedYear}
                </span>
              )}
              <FollowButton targetType="studio" slug={slug} />
              {studio.websiteUrl && (
                <a
                  href={studio.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-cyan underline-offset-2 hover:underline"
                >
                  <Globe className="size-3" /> Website
                </a>
              )}
            </div>
          </div>
        </div>

        {studio.tagline && (
          <p className="mb-8 text-sm leading-relaxed text-muted-foreground">{studio.tagline}</p>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-1 border border-border bg-elevated p-4">
            <Heart className="size-5 text-coral" />
            <span className="font-display text-2xl font-semibold">{studio.followersCount}</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Followers</span>
          </div>
          <div className="flex flex-col items-center gap-1 border border-border bg-elevated p-4">
            <Gamepad2 className="size-5 text-cyan" />
            <span className="font-display text-2xl font-semibold">{studio.gamesCount}</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Games</span>
          </div>
          <div className="flex flex-col items-center gap-1 border border-border bg-elevated p-4">
            <Users className="size-5 text-amber" />
            <span className="font-display text-2xl font-semibold">{studio.membersCount}</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Members</span>
          </div>
        </div>

        {studio.description && (
          <section className="mb-8">
            <h2 className="mb-3 font-display text-xl font-semibold">About</h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{studio.description}</div>
          </section>
        )}

        {/* Members */}
        {members?.members && members.members.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 font-display text-xl font-semibold">Team ({members.members.length})</h2>
            <div className="flex flex-wrap gap-3">
              {members.members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 border border-border bg-elevated p-3">
                  {m.user.avatarUrl ? (
                    <img src={m.user.avatarUrl} alt="" className="size-10 border border-border object-cover" />
                  ) : (
                    <div className="grid size-10 place-items-center border border-border bg-muted font-mono text-xs uppercase text-muted-foreground">
                      {m.user.displayName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{m.user.displayName}</p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">{m.title ?? m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Games */}
        <section className="mb-8">
          <h2 className="mb-3 font-display text-xl font-semibold">Games ({studio.gamesCount})</h2>
          {gamesData?.items.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {gamesData.items.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">No games yet.</p>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
