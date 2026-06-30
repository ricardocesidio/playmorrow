'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Globe, Calendar, Users, Gamepad2, Heart, BadgeCheck, UserPlus, Check } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { GameCard } from '@/components/game-card';
import { SignalLabel } from '@/components/signal-label';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { ErrorState } from '@/components/error-state';
import { useStudio, useStudioMembers, useStudioGames } from '@/lib/api/hooks';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/api/auth-context';
import { FollowButton } from '@/components/follow-button';
import { ReportForm } from '@/components/report-form';

export default function StudioDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user: authUser } = useAuth();
  const { data: studio, isLoading, error } = useStudio(slug);
  const { data: members } = useStudioMembers(slug);
  const { data: gamesData } = useStudioGames(slug);
  const [requestSent, setRequestSent] = useState(false);

  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <main className="relative min-h-screen overflow-hidden bg-[#020609] px-5 pb-24 pt-4 sm:px-8 lg:px-10">
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
        <main className="relative min-h-screen overflow-hidden bg-[#020609] px-5 pb-24 pt-4 sm:px-8 lg:px-10">
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
      <main className="relative min-h-screen overflow-hidden bg-[#020609] px-5 pb-24 pt-3 sm:px-8 lg:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-coral/20 to-transparent" />

        <div className="relative z-10 mx-auto max-w-5xl">
          <Link
            href="/studios"
            className="mb-6 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-cyan"
          >
            <ArrowLeft className="size-3" /> Back to studios
          </Link>

          {/* Banner */}
          {studio.bannerUrl && (
            <div className="clip-corner mb-6 overflow-hidden border border-border/90 shadow-[0_18px_70px_rgb(0_0_0_/_0.36)]">
              <div className="relative aspect-[3/1]">
                <img src={studio.bannerUrl} alt="" className="size-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/20" />
                <div className="pointer-events-none absolute right-0 top-0 size-64 translate-x-32 -translate-y-32 rounded-full border border-cyan/10" />
              </div>
            </div>
          )}

          {/* Header */}
          <div className="clip-corner mb-8 border border-border/90 bg-[#050b0f]/88 p-5 shadow-[0_18px_70px_rgb(0_0_0_/_0.36)] sm:p-7">
            <div className="flex flex-wrap items-start gap-6">
              {studio.logoUrl && (
                <div className="size-20 shrink-0 border border-border/70">
                  <img src={studio.logoUrl} alt={studio.name} className="size-full object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">{studio.name}</h1>
                  {studio.isVerified && <BadgeCheck className="size-6 fill-cyan text-background" />}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {studio.location && (
                    <span className="inline-flex items-center gap-1 text-cyan/70">
                      <MapPin className="size-3" /> {studio.location}
                    </span>
                  )}
                  {studio.foundedYear && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3" /> Founded {studio.foundedYear}
                    </span>
                  )}
                  <FollowButton targetType="studio" slug={slug} />
                  {authUser && !requestSent && (
                    <button onClick={async () => { try { await api.post(`/studios/${slug}/request-join`); setRequestSent(true); } catch { /* ignore */ } }}
                      className="clip-corner flex cursor-pointer items-center gap-2 border border-cyan/60 bg-cyan/5 px-5 py-2.5 font-mono text-[0.55rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background">
                      <UserPlus className="size-4" /> Request to Join
                    </button>
                  )}
                  {requestSent && (
                    <span className="inline-flex items-center gap-2 font-mono text-[0.55rem] text-cyan">
                      <Check className="size-4" /> Request sent!
                    </span>
                  )}
                  {studio && <ReportForm targetType="STUDIO" targetId={studio.id} />}
                  {studio.websiteUrl && (
                    <a href={studio.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan underline-offset-2 hover:underline">
                      <Globe className="size-3" /> Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {studio.tagline && (
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{studio.tagline}</p>
            )}
          </div>

          {/* Stats */}
          <div className="mb-8 grid grid-cols-3 gap-4">
            <div className="clip-corner border border-border/90 bg-background/55 p-5 text-center shadow-[0_0_20px_rgb(255_87_77_/_0.12)] transition hover:border-coral/50">
              <Heart className="mx-auto size-5 text-coral drop-shadow-[0_0_8px_rgb(255_87_77_/_0.4)]" />
              <p className="mt-2 font-display text-2xl font-semibold">{studio.followersCount}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Followers</p>
            </div>
            <div className="clip-corner border border-border/90 bg-background/55 p-5 text-center shadow-[0_0_20px_rgb(62_231_255_/_0.12)] transition hover:border-cyan/50">
              <Gamepad2 className="mx-auto size-5 text-cyan drop-shadow-[0_0_8px_rgb(62_231_255_/_0.4)]" />
              <p className="mt-2 font-display text-2xl font-semibold">{studio.gamesCount}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Games</p>
            </div>
            <div className="clip-corner border border-border/90 bg-background/55 p-5 text-center shadow-[0_0_20px_rgb(234_179_8_/_0.12)] transition hover:border-amber/50">
              <Users className="mx-auto size-5 text-amber drop-shadow-[0_0_8px_rgb(234_179_8_/_0.4)]" />
              <p className="mt-2 font-display text-2xl font-semibold">{studio.membersCount}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Members</p>
            </div>
          </div>

          {/* Description */}
          {studio.description && (
            <section className="clip-corner mb-8 border border-border/90 bg-[#050b0f]/88 p-5 shadow-[0_18px_70px_rgb(0_0_0_/_0.36)] sm:p-7">
              <h2 className="mb-3 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">About</h2>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{studio.description}</div>
            </section>
          )}

          {/* Members */}
          {members?.members && members.members.length > 0 && (
            <section className="clip-corner mb-8 border border-border/90 bg-[#050b0f]/88 p-5 shadow-[0_18px_70px_rgb(0_0_0_/_0.36)] sm:p-7">
              <h2 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">Team ({members.members.length})</h2>
              <div className="flex flex-wrap gap-3">
                {members.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 border border-border/70 bg-background/45 p-3 transition hover:border-cyan/50">
                    {m.user.avatarUrl ? (
                      <img src={m.user.avatarUrl} alt="" className="size-10 border border-border object-cover" />
                    ) : (
                      <div className="grid size-10 place-items-center border border-border bg-muted font-mono text-xs uppercase text-muted-foreground">
                        {m.user.displayName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.user.displayName}</p>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">{m.title ?? m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Games */}
          <section className="clip-corner border border-border/90 bg-[#050b0f]/88 p-5 shadow-[0_18px_70px_rgb(0_0_0_/_0.36)] sm:p-7">
            <h2 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">Games ({studio.gamesCount})</h2>
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
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
