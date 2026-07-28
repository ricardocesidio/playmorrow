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
  Shield,
  ShieldCheck,
  MessageSquare,
  FileText,
  Download,
  Palette,
  ExternalLink,
  Github,
  Linkedin,
  MessageCircle,
  Monitor,
  Gamepad,
  Star,
  Info,
  Award,
  Video,
  Hash,
} from 'lucide-react';

import { formatFollowers, formatRelativeTime } from '@/lib/format';

import { SiteHeader } from '@/components/site-header';
import { GameCard } from '@/components/game-card';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { ErrorState } from '@/components/error-state';
import { useStudio, useStudioMembers, useStudioGames, useStudioAuditLogs, useRequestJoin, useStudios, useTrustScore, useStudioPressKit, useStudioBrandKit, useCompanyProfile } from '@/lib/api/hooks';
import type { AuditLogEntry } from '@/lib/api/hooks';
import { useAuth } from '@/lib/api/auth-context';
import { FollowButton } from '@/components/follow-button';
import { ReportForm } from '@/components/report-form';
import { VERIFICATION_LEVEL_LABELS, VERIFICATION_LEVEL_COLORS, COMPANY_SIZE_OPTIONS } from '@/lib/api/verification-types';
import type { VerificationLevel } from '@/lib/api/verification-types';

export default function StudioDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user: authUser } = useAuth();
  const { data: studio, isLoading, error } = useStudio(slug);
  const { data: membersData } = useStudioMembers(slug);
  const { data: gamesData } = useStudioGames(slug);
  const { data: auditData } = useStudioAuditLogs(slug);
  const { data: trustScore } = useTrustScore(slug);
  const { data: companyProfile } = useCompanyProfile(slug);
  const { data: pressKit } = useStudioPressKit(slug);
  const { data: brandKit } = useStudioBrandKit(slug);
  const requestJoin = useRequestJoin();
  const [requestSent, setRequestSent] = useState(false);

  if (isLoading) {
    return <PageShell><main className="relative min-h-screen overflow-hidden bg-[#020609] px-5 pb-24 pt-4 sm:px-8 lg:px-10"><LoadingSkeleton count={6} height="h-16" /></main></PageShell>;
  }

  if (error || !studio) {
    return <PageShell><main className="relative min-h-screen overflow-hidden bg-[#020609] px-5 pb-24 pt-4 sm:px-8 lg:px-10">
      <ErrorState message="Studio not found." />
      <div className="mt-4 text-center">
        <Link href="/studios" className="font-mono text-xs uppercase tracking-widest text-cyan underline">Back to studios</Link>
      </div>
    </main></PageShell>;
  }

  const members = membersData?.members ?? [];
  const games = gamesData?.items ?? [];
  const auditLogs = auditData?.items ?? [];
  const verLevel: VerificationLevel = trustScore?.level ?? 'NONE';
  const trustPercent = trustScore?.score ?? 0;
  const hasPressKit = pressKit && (pressKit.headline || pressKit.logoPrimary || pressKit.keyArt);
  const hasBrandKit = brandKit && (brandKit.logoPrimary || (brandKit.colors && brandKit.colors.length > 0) || brandKit.typography);
  const cp = companyProfile;

  const trustColor = trustPercent >= 80 ? '#06ffa5' : trustPercent >= 60 ? '#62e7ff' : trustPercent >= 40 ? '#f59e0b' : '#ff5757';

  const SOCIAL_PLATFORMS = [
    { key: 'discord' as const, icon: MessageCircle, label: 'Discord', href: cp?.discord },
    { key: 'xUrl' as const, icon: Hash, label: 'X', href: cp?.xUrl },
    { key: 'githubUrl' as const, icon: Github, label: 'GitHub', href: cp?.githubUrl },
    { key: 'linkedinUrl' as const, icon: Linkedin, label: 'LinkedIn', href: cp?.linkedinUrl },
  ];

  const PLATFORM_LINKS = [
    { key: 'steamUrl' as const, icon: Monitor, label: 'Steam', href: cp?.steamUrl },
    { key: 'epicUrl' as const, icon: Gamepad, label: 'Epic Games', href: cp?.epicUrl },
    { key: 'itchUrl' as const, icon: Download, label: 'itch.io', href: cp?.itchUrl },
  ];

  return (
    <PageShell>
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
              <div className="relative aspect-[3/1] min-h-[340px] sm:min-h-[400px] lg:min-h-[460px]">
                <img src={studio.bannerUrl} alt="" className="size-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#020609] via-[#020609]/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020609] via-[#020609]/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 via-transparent to-transparent" />
              </div>
            ) : (
              <div className="relative flex min-h-[340px] items-center bg-gradient-to-br from-[#050b0f] via-[#0a1620] to-[#050b0f] sm:min-h-[400px] lg:min-h-[460px]">
                <div className="absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.045)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan/8 via-transparent to-coral/5" />
              </div>
            )}

            <div className="pointer-events-none absolute right-0 top-0 size-[500px] translate-x-1/4 -translate-y-1/4 rounded-full border border-cyan/[0.06]" />
            <div className="pointer-events-none absolute right-0 top-0 size-[380px] translate-x-1/4 -translate-y-1/4 rounded-full border border-cyan/[0.04]" />
            <div className="pointer-events-none absolute right-0 top-0 size-[260px] translate-x-1/4 -translate-y-1/4 rounded-full border border-cyan/[0.03]" />

            <div className="pointer-events-none absolute bottom-0 left-0 h-px w-1/3 bg-gradient-to-r from-cyan/40 to-transparent" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-1/6 bg-gradient-to-r from-coral/30 to-transparent" />

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
                  <VerificationBadge level={verLevel} size="lg" />
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
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
            <div className="clip-corner border border-border/80 bg-[#050b0f]/80 p-5 text-center shadow-[0_0_30px_rgb(0_0_0_/_0.3)] transition sm:p-6" style={{ borderColor: `${trustColor}40` }}>
              <div className="relative mx-auto flex size-12 items-center justify-center sm:size-14">
                <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke={trustColor} strokeWidth="3" strokeDasharray={`${trustPercent * 0.8639} 100`} strokeLinecap="round" />
                </svg>
                <Shield className="size-5 sm:size-6" style={{ color: trustColor }} />
              </div>
              <p className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">{trustPercent}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Trust Score</p>
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

        {/* ── TWO-COLUMN LAYOUT ──────────────────────────────────────── */}
        <div className="relative z-10 mx-auto mt-6 max-w-6xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

            {/* ── LEFT COLUMN ─────────────────────────────────────── */}
            <div className="space-y-6">

              {/* About */}
              {studio.description && (
                <section className="clip-corner border border-border/80 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] sm:p-7">
                  <h2 className="mb-3 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">About</h2>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#c8d0d4]">{studio.description}</div>
                </section>
              )}

              {/* Company Info */}
              {cp && (cp.legalName || cp.engine || cp.platforms || cp.mission) && (
                <section className="clip-corner border border-border/80 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] sm:p-7">
                  <h2 className="mb-4 flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">
                    <Info className="size-4" /> Company Info
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {cp.legalName && <InfoRow label="Legal Name" value={cp.legalName} />}
                    {cp.companySize && <InfoRow label="Company Size" value={`${cp.companySize} employees`} />}
                    {cp.engine && <InfoRow label="Engine" value={cp.engine} />}
                    {cp.platforms && <InfoRow label="Platforms" value={cp.platforms} />}
                  </div>
                  {cp.mission && (
                    <div className="mt-4 border-t border-border/60 pt-4">
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Mission</p>
                      <p className="text-sm text-[#c8d0d4]">{cp.mission}</p>
                    </div>
                  )}
                  {cp.vision && (
                    <div className="mt-3">
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Vision</p>
                      <p className="text-sm text-[#c8d0d4]">{cp.vision}</p>
                    </div>
                  )}
                </section>
              )}

              {/* Social Links */}
              {SOCIAL_PLATFORMS.some(p => p.href) && (
                <section className="clip-corner border border-border/80 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] sm:p-7">
                  <h2 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">Social</h2>
                  <div className="flex flex-wrap gap-3">
                    {SOCIAL_PLATFORMS.filter(p => p.href).map((platform) => (
                      <a
                        key={platform.key}
                        href={platform.href!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="clip-corner inline-flex items-center gap-2 border border-border/60 px-4 py-2.5 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan/60 hover:text-cyan"
                      >
                        <platform.icon className="size-4" /> {platform.label}
                      </a>
                    ))}
                    {PLATFORM_LINKS.filter(p => p.href).map((platform) => (
                      <a
                        key={platform.key}
                        href={platform.href!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="clip-corner inline-flex items-center gap-2 border border-border/60 px-4 py-2.5 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan/60 hover:text-cyan"
                      >
                        <platform.icon className="size-4" /> {platform.label}
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* Team */}
              {members.length > 0 && (
                <section className="clip-corner border border-border/80 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] sm:p-7">
                  <h2 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">Team ({members.length})</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {members.map((m: { id: string; role: string; title: string | null; user: { id: string; username: string; displayName: string; avatarUrl: string | null } }) => (
                      <div
                        key={m.id}
                        className="clip-corner flex items-center gap-4 border border-border/70 bg-[#050b0f]/60 p-4 shadow-[0_0_20px_rgb(0_0_0_/_0.25)] transition hover:border-cyan/50 hover:shadow-[0_0_24px_rgb(62_231_255_/_0.08)]"
                      >
                        {m.user.avatarUrl ? (
                          <img src={m.user.avatarUrl} alt="" className="size-12 shrink-0 border border-border/60 object-cover" />
                        ) : (
                          <div className="grid size-12 shrink-0 place-items-center border border-border/60 bg-muted font-mono text-lg uppercase text-muted-foreground">
                            {m.user.displayName.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-display text-sm font-bold text-white">{m.user.displayName}</p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <RoleBadge role={m.role} />
                            {m.title && (
                              <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/40">{m.title}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Press Kit */}
              {hasPressKit && (
                <section className="clip-corner border border-border/80 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] sm:p-7">
                  <h2 className="mb-4 flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">
                    <Download className="size-4" /> Press Kit
                  </h2>
                  {pressKit?.headline && (
                    <p className="text-sm font-semibold text-white">{pressKit.headline}</p>
                  )}
                  {pressKit?.history && (
                    <p className="mt-2 text-xs leading-relaxed text-[#c8d0d4] line-clamp-3">{pressKit.history}</p>
                  )}
                  {pressKit?.awards && (
                    <div className="mt-3 flex items-start gap-2">
                      <Award className="mt-0.5 size-4 shrink-0 text-amber" />
                      <p className="text-xs text-muted-foreground">{pressKit.awards}</p>
                    </div>
                  )}
                  {pressKit?.pressContacts && pressKit.pressContacts.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {pressKit.pressContacts.slice(0, 2).map((c, i) => (
                        <p key={i} className="text-xs text-muted-foreground">
                          {c.name} — <span className="text-cyan">{c.email}</span>
                        </p>
                      ))}
                    </div>
                  )}
                  {pressKit?.downloads && pressKit.downloads.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {pressKit.downloads.slice(0, 3).map((d, i) => (
                        <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-cyan hover:text-white transition">
                          <FileText className="size-3" /> {d.label}
                        </a>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Brand Kit */}
              {hasBrandKit && (
                <section className="clip-corner border border-border/80 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] sm:p-7">
                  <h2 className="mb-4 flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">
                    <Palette className="size-4" /> Brand Kit
                  </h2>
                  {brandKit?.colors && brandKit.colors.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Colors</p>
                      <div className="flex flex-wrap gap-2">
                        {brandKit.colors.map((c, i) => (
                          <div key={i} className="flex items-center gap-2 border border-border/60 px-3 py-1.5">
                            <span className="size-4 border border-border/40" style={{ backgroundColor: c }} />
                            <span className="font-mono text-[0.55rem] text-muted-foreground">{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {brandKit?.typography && (
                    <div className="mb-2">
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Typography</p>
                      <p className="text-sm text-[#c8d0d4]">{brandKit.typography}</p>
                    </div>
                  )}
                  {brandKit?.logoPrimary && (
                    <div className="mt-3 aspect-[3/1] overflow-hidden border border-border/60 bg-background/40">
                      <img src={brandKit.logoPrimary} alt="Brand logo" className="size-full object-contain" />
                    </div>
                  )}
                </section>
              )}

              {/* Games */}
              <section className="clip-corner border border-border/80 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] sm:p-7">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">Games ({studio.gamesCount})</h2>
                  {authUser && (
                    <Link href={`/dashboard/games/new?studio=${studio.slug}`} className="font-mono text-[0.55rem] uppercase tracking-widest text-coral hover:text-cyan transition">
                      + Add game
                    </Link>
                  )}
                </div>
                {games.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {games.map((game) => (
                      <GameCard key={game.id} game={game} variant="compact" />
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">No games yet.</p>
                )}
              </section>
            </div>

            {/* ── RIGHT SIDEBAR ────────────────────────────────────── */}
            <div className="space-y-6">

              {/* Trust Score Breakdown */}
              {trustScore && trustScore.breakdown && trustScore.breakdown.length > 0 && (
                <section className="clip-corner border border-border/80 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] sm:p-7">
                  <h2 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">Health Score</h2>
                  <div className="space-y-3">
                    {trustScore.breakdown.map((b) => (
                      <div key={b.category}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{b.label}</span>
                          <span className="font-mono text-cyan">{b.score}/{b.maxScore}</span>
                        </div>
                        <div className="h-1.5 bg-border">
                          <div
                            className="h-full shadow-[0_0_8px_var(--tw-shadow-color)]"
                            style={{
                              width: `${(b.score / b.maxScore) * 100}%`,
                              backgroundColor: b.score / b.maxScore >= 0.8 ? '#06ffa5' : b.score / b.maxScore >= 0.6 ? '#62e7ff' : b.score / b.maxScore >= 0.4 ? '#f59e0b' : '#ff5757',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Studio Identity */}
              {(studio.location || studio.foundedYear || cp?.legalName) && (
                <section className="clip-corner border border-border/80 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] sm:p-7">
                  <h2 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">Identity</h2>
                  <div className="space-y-4">
                    {cp?.legalName && (
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center border border-violet/30 bg-violet/5">
                          <FileText className="size-4 text-violet" />
                        </span>
                        <div>
                          <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Legal Name</p>
                          <p className="font-display text-sm font-semibold text-white">{cp.legalName}</p>
                        </div>
                      </div>
                    )}
                    {studio.location && (
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center border border-cyan/30 bg-cyan/5">
                          <MapPin className="size-4 text-cyan" />
                        </span>
                        <div>
                          <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Location</p>
                          <p className="font-display text-sm font-semibold text-white">{studio.location}</p>
                        </div>
                      </div>
                    )}
                    {studio.foundedYear && (
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center border border-amber/30 bg-amber/5">
                          <Calendar className="size-4 text-amber" />
                        </span>
                        <div>
                          <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Founded</p>
                          <p className="font-display text-sm font-semibold text-white">{studio.foundedYear}</p>
                        </div>
                      </div>
                    )}
                    {cp?.businessEmail && (
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center border border-cyan/30 bg-cyan/5">
                          <MessageSquare className="size-4 text-cyan" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Business Email</p>
                          <p className="truncate text-sm font-semibold text-white">{cp.businessEmail}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Key Art / Media */}
              {pressKit?.keyArt && (
                <section className="clip-corner border border-border/80 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] sm:p-7">
                  <h2 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">Key Art</h2>
                  <div className="aspect-video overflow-hidden border border-border/60">
                    <img src={pressKit.keyArt} alt="Key art" className="size-full object-cover" />
                  </div>
                </section>
              )}

              {pressKit?.trailerUrl && (
                <section className="clip-corner border border-border/80 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] sm:p-7">
                  <h2 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">Trailer</h2>
                  <a
                    href={pressKit.trailerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 border border-cyan/40 bg-cyan/5 px-4 py-3 text-xs text-cyan hover:bg-cyan hover:text-background transition"
                  >
                    <Video className="size-4" /> Watch Trailer
                  </a>
                </section>
              )}

              {/* Recommendations */}
              {trustScore?.recommendations && trustScore.recommendations.length > 0 && (
                <section className="clip-corner border border-amber/30 bg-amber/[0.03] p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] sm:p-7">
                  <h2 className="mb-3 flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-amber">
                    <Star className="size-4" /> Recommendations
                  </h2>
                  <ul className="space-y-2">
                    {trustScore.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-amber" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Activity */}
              {auditLogs.length > 0 && (
                <section className="clip-corner border border-border/80 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)] sm:p-7">
                  <h2 className="mb-4 flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-cyan">
                    <Clock className="size-4" /> Recent Activity
                  </h2>
                  <div className="space-y-1">
                    {auditLogs.slice(0, 5).map((entry: AuditLogEntry) => (
                      <div key={entry.id} className="flex items-center gap-2 border-b border-border/30 py-2 last:border-0">
                        {entry.actor?.avatarUrl ? (
                          <img src={entry.actor.avatarUrl} alt="" className="size-6 shrink-0 border border-border/40 object-cover" />
                        ) : (
                          <div className="grid size-6 shrink-0 place-items-center border border-border/40 bg-muted font-mono text-[9px] uppercase text-muted-foreground">
                            {entry.actor?.displayName?.charAt(0) ?? '?'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs text-muted-foreground">
                            <span className="font-semibold text-white">{entry.actor?.displayName ?? 'System'}</span>
                            {' '}{formatAction(entry.action)}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/50">
                          {formatRelativeTime(entry.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>

        {/* Similar Studios */}
        <SimilarStudios currentSlug={slug} />
      </main>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <><SiteHeader />{children}</>;
}

/* ── Verification Badge ─────────────────────────────────────────────── */
function VerificationBadge({ level, size = 'md' }: { level: VerificationLevel; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'size-8 sm:size-10' : size === 'sm' ? 'size-4' : 'size-6';
  const colors: Record<VerificationLevel, { icon: typeof Shield; color: string; glow: string }> = {
    NONE: { icon: Shield, color: 'text-muted-foreground', glow: '' },
    BASIC: { icon: ShieldCheck, color: 'text-amber', glow: 'drop-shadow-[0_0_14px_rgb(234_179_8_/_0.6)]' },
    VERIFIED: { icon: ShieldCheck, color: 'text-cyan', glow: 'drop-shadow-[0_0_14px_rgb(62_231_255_/_0.6)]' },
    VERIFIED_PLUS: { icon: BadgeCheck, color: 'text-violet', glow: 'drop-shadow-[0_0_14px_rgb(139_92_246_/_0.6)]' },
    PARTNER: { icon: BadgeCheck, color: 'text-coral', glow: 'drop-shadow-[0_0_14px_rgb(255_87_77_/_0.6)]' },
  };
  const cfg = colors[level] ?? colors.NONE;
  const Icon = cfg.icon;
  if (level === 'NONE') return null;
  return (
    <span className={`relative ${dims} shrink-0 ${cfg.glow}`} title={VERIFICATION_LEVEL_LABELS[level]}>
      <Icon className={`size-full ${cfg.color}`} />
    </span>
  );
}

/* ── Info Row ──────────────────────────────────────────────────────── */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

/* ── Role Badge ────────────────────────────────────────────────────── */
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
