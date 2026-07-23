'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Gamepad2,
  Globe,
  Heart,
  MapPin,
  Users,
  UserPlus,
  Check,
  Clock,
} from 'lucide-react';

import { formatFollowers, formatRelativeTime } from '@/lib/format';

import { SiteHeader } from '@/components/site-header';
import { GameCard } from '@/components/game-card';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { ErrorState } from '@/components/error-state';
import { useStudio, useStudioMembers, useStudioGames, useStudioAuditLogs, useRequestJoin, useStudios } from '@/lib/api/hooks';
import type { AuditLogEntry } from '@/lib/api/hooks';
import { useAuth } from '@/lib/api/auth-context';
import { FollowButton } from '@/components/follow-button';
import { ReportForm } from '@/components/report-form';



export default function StudioDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user: authUser } = useAuth();
  const { data: studio, isLoading, error } = useStudio(slug);
  const { data: membersData } = useStudioMembers(slug);
  const { data: gamesData } = useStudioGames(slug);
  const { data: auditData } = useStudioAuditLogs(slug);
  const requestJoin = useRequestJoin();
  const [requestSent, setRequestSent] = useState(false);

  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <main className="relative min-h-screen overflow-hidden bg-[#020609] px-5 pb-24 pt-4 sm:px-8 lg:px-10">
          <LoadingSkeleton count={6} height="h-16" />
        </main>
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
      </>
    );
  }

  const members = membersData?.members ?? [];
  const games = gamesData?.items ?? [];
  const auditLogs = auditData?.items ?? [];

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen overflow-hidden bg-[#020609] pb-32">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-coral/20 to-transparent" />

        {/* ── Back nav ─────────────────────────────────────────────── */}
        <div className="relative z-10 mx-auto max-w-6xl px-5 pt-4 sm:px-8 lg:px-10">
          <Link
            href="/studios"
            className="mb-6 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-cyan"
          >
            <ArrowLeft className="size-3" /> Back to studios
          </Link>
        </div>

        {/* ── HERO SECTION ─────────────────────────────────────────── */}
        <section className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <div className="clip-corner relative overflow-hidden border border-border/90 shadow-[0_18px_70px_rgb(0_0_0_/_0.46)]">
            {studio.bannerUrl ? (
              <>
                <div className="relative aspect-[3/1] min-h-[340px] sm:min-h-[400px] lg:min-h-[460px]">
                  <img src={studio.bannerUrl} alt="" className="size-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#020609] via-[#020609]/50 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020609] via-[#020609]/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 via-transparent to-transparent" />
                </div>
              </>
            ) : (
              <div className="relative flex min-h-[340px] items-center bg-gradient-to-br from-[#050b0f] via-[#0a1620] to-[#050b0f] sm:min-h-[400px] lg:min-h-[460px]">
                <div className="absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.045)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan/8 via-transparent to-coral/5" />
              </div>
            )}

            {/* Decorative concentric circles */}
            <div className="pointer-events-none absolute right-0 top-0 size-[500px] translate-x-1/4 -translate-y-1/4 rounded-full border border-cyan/[0.06]" />
            <div className="pointer-events-none absolute right-0 top-0 size-[380px] translate-x-1/4 -translate-y-1/4 rounded-full border border-cyan/[0.04]" />
            <div className="pointer-events-none absolute right-0 top-0 size-[260px] translate-x-1/4 -translate-y-1/4 rounded-full border border-cyan/[0.03]" />

            {/* Decorative accent lines */}
            <div className="pointer-events-none absolute bottom-0 left-0 h-px w-1/3 bg-gradient-to-r from-cyan/40 to-transparent" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-1/6 bg-gradient-to-r from-coral/30 to-transparent" />

            {/* Hero content overlay */}
            <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 sm:p-8 lg:p-12">
              <div className="max-w-3xl">
                {studio.logoUrl && (
                  <div className="mb-4 size-16 border border-cyan/40 shadow-[0_0_20px_rgb(62_231_255_/_0.15)] sm:size-20">
                    <img src={studio.logoUrl} alt={studio.name} className="size-full object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <h1 className="font-display text-[clamp(2rem,6vw,5.5rem)] font-black uppercase leading-[0.88] tracking-tight text-white drop-shadow-[0_4px_20px_rgb(0_0_0_/_0.7)]">
                    {studio.name}
                  </h1>
                  {studio.isVerified && (
                    <BadgeCheck className="mt-2 size-8 shrink-0 fill-cyan text-background drop-shadow-[0_0_14px_rgb(62_231_255_/_0.6)] sm:size-10" />
                  )}
                </div>
                {studio.tagline && (
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#c8d0d4] drop-shadow-[0_2px_8px_rgb(0_0_0_/_0.6)] sm:text-lg">
                    {studio.tagline}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS CARDS ─────────────────────────────────────────────── */}
        <section className="relative z-10 mx-auto mt-6 max-w-6xl px-5 sm:px-8 lg:px-10">
          <div className="grid grid-cols-3 gap-4 sm:gap-5">
            <div className="clip-corner border border-border/80 bg-[#050b0f]/80 p-5 text-center shadow-[0_0_30px_rgb(0_0_0_/_0.3)] transition hover:border-coral/50 hover:shadow-[0_0_30px_rgb(255_87_77_/_0.15)] sm:p-6">
              <Heart className="mx-auto size-6 text-coral drop-shadow-[0_0_12px_rgb(255_87_77_/_0.5)] sm:size-7" />
              <p className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">{formatFollowers(studio.followersCount)}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Followers</p>
            </div>
            <div className="clip-corner border border-border/80 bg-[#050b0f]/80 p-5 text-center shadow-[0_0_30px_rgb(0_0_0_/_0.3)] transition hover:border-cyan/50 hover:shadow-[0_0_30px_rgb(62_231_255_/_0.15)] sm:p-6">
              <Gamepad2 className="mx-auto size-6 text-cyan drop-shadow-[0_0_12px_rgb(62_231_255_/_0.5)] sm:size-7" />
              <p className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">{studio.gamesCount}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Games</p>
            </div>
            <div className="clip-corner border border-border/80 bg-[#050b0f]/80 p-5 text-center shadow-[0_0_30px_rgb(0_0_0_/_0.3)] transition hover:border-amber/50 hover:shadow-[0_0_30px_rgb(234_179_8_/_0.15)] sm:p-6">
              <Users className="mx-auto size-6 text-amber drop-shadow-[0_0_12px_rgb(234_179_8_/_0.5)] sm:size-7" />
              <p className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">{studio.membersCount}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Members</p>
            </div>
          </div>
        </section>

        {/* ── ACTION BAR ──────────────────────────────────────────────── */}
        <section className="relative z-10 mx-auto mt-6 max-w-6xl px-5 sm:px-8 lg:px-10">
          <div className="clip-corner border border-border/80 bg-[#050b0f]/80 p-4 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] sm:p-5">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <FollowButton targetType="studio" slug={slug} />

              {authUser && !requestSent && (
                <button
                  onClick={() => {
                    requestJoin.mutate(slug, {
                      onSuccess: () => setRequestSent(true),
                    });
                  }}
                  disabled={requestJoin.isPending}
                  className="clip-corner inline-flex cursor-pointer items-center gap-2 border border-cyan/60 bg-cyan/5 px-5 py-2.5 font-mono text-[0.55rem] uppercase tracking-widest text-cyan shadow-[0_0_16px_rgb(62_231_255_/_0.1)] transition hover:bg-cyan hover:text-background disabled:opacity-50"
                >
                  {requestJoin.isPending ? 'Sending...' : <><UserPlus className="size-4" /> Request to Join</>}
                </button>
              )}
              {requestSent && (
                <span className="inline-flex items-center gap-2 font-mono text-[0.55rem] text-cyan">
                  <Check className="size-4" /> Request sent!
                </span>
              )}

              {studio.websiteUrl && (
                <a
                  href={studio.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="clip-corner inline-flex items-center gap-2 border border-border/60 px-5 py-2.5 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground shadow-[0_0_16px_rgb(0_0_0_/_0.2)] transition hover:border-cyan/60 hover:text-cyan"
                >
                  <Globe className="size-4" /> Website
                </a>
              )}

              {studio && <ReportForm targetType="STUDIO" targetId={studio.id} />}
            </div>
          </div>
        </section>

        {/* ── STUDIO IDENTITY ─────────────────────────────────────────── */}
        {(studio.location || studio.foundedYear) && (
          <section className="relative z-10 mx-auto mt-6 max-w-6xl px-5 sm:px-8 lg:px-10">
            <div className="clip-corner border border-border/80 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] sm:p-7">
              <h2 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">Studio Identity</h2>
              <div className="flex flex-wrap gap-6">
                {studio.location && (
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-sm border border-cyan/30 bg-cyan/5">
                      <MapPin className="size-5 text-cyan" />
                    </span>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Location</p>
                      <p className="font-display text-base font-semibold text-white">{studio.location}</p>
                    </div>
                  </div>
                )}
                {studio.foundedYear && (
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-sm border border-amber/30 bg-amber/5">
                      <Calendar className="size-5 text-amber" />
                    </span>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Founded</p>
                      <p className="font-display text-base font-semibold text-white">{studio.foundedYear}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── ABOUT ───────────────────────────────────────────────────── */}
        {studio.description && (
          <section className="relative z-10 mx-auto mt-6 max-w-6xl px-5 sm:px-8 lg:px-10">
            <div className="clip-corner border border-border/80 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] sm:p-7">
              <h2 className="mb-3 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">About</h2>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#c8d0d4]">{studio.description}</div>
            </div>
          </section>
        )}

        {/* ── TEAM ────────────────────────────────────────────────────── */}
        {members.length > 0 && (
          <section className="relative z-10 mx-auto mt-6 max-w-6xl px-5 sm:px-8 lg:px-10">
            <div className="clip-corner border border-border/80 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] sm:p-7">
              <h2 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">Team ({members.length})</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {members.map((m: { id: string; role: string; title: string | null; user: { id: string; username: string; displayName: string; avatarUrl: string | null } }) => (
                  <div
                    key={m.id}
                    className="clip-corner flex items-center gap-4 border border-border/70 bg-[#050b0f]/60 p-4 shadow-[0_0_20px_rgb(0_0_0_/_0.25)] transition hover:border-cyan/50 hover:shadow-[0_0_24px_rgb(62_231_255_/_0.08)]"
                  >
                    {m.user.avatarUrl ? (
                      <img src={m.user.avatarUrl} alt="" className="size-14 shrink-0 border border-border/60 object-cover sm:size-16" />
                    ) : (
                      <div className="grid size-14 shrink-0 place-items-center border border-border/60 bg-muted font-mono text-lg uppercase text-muted-foreground sm:size-16">
                        {m.user.displayName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-bold text-white">{m.user.displayName}</p>
                      <p className="truncate font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">@{m.user.username}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <RoleBadge role={m.role} />
                        {m.title && (
                          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40">{m.title}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── GAMES ──────────────────────────────────────────────────── */}
        <section className="relative z-10 mx-auto mt-6 max-w-6xl px-5 sm:px-8 lg:px-10">
          <div className="clip-corner border border-border/80 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">Games ({studio.gamesCount})</h2>
              {authUser && (
                <Link href={`/dashboard/games/new?studio=${studio.slug}`} className="font-mono text-[0.55rem] uppercase tracking-widest text-coral hover:text-cyan transition">
                  + Add game
                </Link>
              )}
            </div>
            {games.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {games.map((game) => (
                  <GameCard key={game.id} game={game} variant="compact" />
                ))}
              </div>
            ) : (
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">No games yet.</p>
            )}
          </div>
        </section>

        {/* ── ACTIVITY TIMELINE ──────────────────────────────────────── */}
        {auditLogs.length > 0 && (
          <section className="relative z-10 mx-auto mt-6 max-w-6xl px-5 sm:px-8 lg:px-10">
            <div className="clip-corner border border-border/80 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] sm:p-7">
              <h2 className="mb-4 flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">
                <Clock className="size-4" /> Recent Activity
              </h2>
              <div className="space-y-1">
                {auditLogs.slice(0, 8).map((entry: AuditLogEntry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 border-b border-border/30 py-2.5 last:border-0"
                  >
                    {entry.actor?.avatarUrl ? (
                      <img src={entry.actor.avatarUrl} alt="" className="size-7 shrink-0 border border-border/40 object-cover" />
                    ) : (
                      <div className="grid size-7 shrink-0 place-items-center border border-border/40 bg-muted font-mono text-[10px] uppercase text-muted-foreground">
                        {entry.actor?.displayName?.charAt(0) ?? '?'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground/80">
                        <span className="font-semibold text-white">{entry.actor?.displayName ?? 'System'}</span>
                        <span className="text-muted-foreground"> {formatAction(entry.action)}</span>
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
                      {formatRelativeTime(entry.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Similar Studios */}
        <SimilarStudios currentSlug={slug} />
      </main>
    </>
  );
}

/* ── Role Badge ─────────────────────────────────────────────────────── */
function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    OWNER: 'border-amber/50 text-amber',
    ADMIN: 'border-coral/50 text-coral',
    MODERATOR: 'border-violet/50 text-violet',
  };
  const style = styles[role] ?? 'border-border/50 text-muted-foreground';
  return (
    <span className={`inline-block border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ${style}`}>
      {role}
    </span>
  );
}

function SimilarStudios({ currentSlug }: { currentSlug: string }) {
  const { data } = useStudios(1, 4);
  const others = (data?.items ?? []).filter((s) => s.slug !== currentSlug).slice(0, 3);
  if (!others.length) return null;
  return (
    <section className="relative z-10 mx-auto mt-6 max-w-6xl px-5 sm:px-8 lg:px-10">
      <div className="clip-corner border border-border/80 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] sm:p-7">
        <h2 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">More Studios</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {others.map((s) => (
            <Link key={s.id} href={`/studios/${s.slug}`} className="clip-corner flex items-center gap-4 border border-border/60 bg-[#050b0f]/40 p-4 transition hover:border-cyan/50 hover:shadow-[0_0_20px_rgb(62_231_255_/_0.06)]">
              <div className="grid size-12 shrink-0 place-items-center border border-cyan/30 bg-cyan/5 text-cyan font-display text-lg font-black">{s.name.charAt(0)}</div>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-white">{s.name}</p>
                <p className="mt-0.5 font-mono text-[0.55rem] text-muted-foreground">{s.followersCount?.toLocaleString() || 0} followers</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function formatAction(action: string) {
  return action.replace(/_/g, ' ').toLowerCase();
}
