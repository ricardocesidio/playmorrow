'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Activity,
  Building2,
  Calendar,
  Heart,
  MessageCircle,
  Settings,
  ShieldCheck,
  User,
  Users,
  Clock,
  Zap,
} from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { useUserProfile } from '@/lib/api/hooks';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case 'COMMENT':
      return <MessageCircle className="size-3 text-cyan" />;
    case 'WISHLIST':
      return <Heart className="size-3 text-coral" />;
    case 'FOLLOW_STUDIO':
      return <Users className="size-3 text-violet" />;
    default:
      return <Activity className="size-3 text-muted-foreground" />;
  }
}

function xpProgress(xp: number) {
  const level = Math.max(0, Math.floor((Math.sqrt(1 + (8 * xp) / 100) - 1) / 2));
  const currentXp = (100 * level * (level + 1)) / 2;
  const nextXp = (100 * (level + 1) * (level + 2)) / 2;
  const progress = nextXp > currentXp ? (xp - currentXp) / (nextXp - currentXp) : 1;
  return { level, currentXp, nextXp, progress };
}
export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const { data, isLoading, error } = useUserProfile(username);

  const isOwnProfile = currentUser?.username === username;

  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
          <div className="relative mx-auto max-w-3xl pt-8">
            {/* Profile skeleton for better loading UX (audit polish) */}
            <div className="animate-pulse">
              <div className="flex items-center gap-4">
                <div className="size-20 rounded-full bg-border/30" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 w-48 bg-border/40" />
                  <div className="h-4 w-32 bg-border/30" />
                </div>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 rounded border border-border/30 bg-[#050b0f]/40" />
                ))}
              </div>
              <div className="mt-8 h-64 rounded border border-border/30 bg-[#050b0f]/40" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <SiteHeader />
        <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
          <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <User className="mb-3 size-12 text-muted-foreground/40" />
            <h1 className="font-display text-xl font-black uppercase tracking-tight text-white">User not found</h1>
            <p className="mt-1 font-mono text-[0.6rem] text-muted-foreground">No user named &ldquo;{username}&rdquo;</p>
            <Link href="/" className="mt-4 clip-corner border border-cyan/60 px-4 py-2 font-mono text-[0.6rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background">Go home</Link>
          </div>
        </main>
      </>
    );
  }

  const stats = [
    { icon: Heart, label: 'Wishlisted', value: data.wishlistsCount, color: 'text-coral' },
    { icon: Building2, label: 'Studios followed', value: data.studiosFollowedCount, color: 'text-cyan' },
    { icon: MessageCircle, label: 'Comments', value: data.commentsCount, color: 'text-violet' },
    { icon: Calendar, label: 'Member since', value: new Date(data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }), color: 'text-amber' },
  ];

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

        <div className="relative mx-auto w-full max-w-3xl">
          {/* ── Hero Section ── */}
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 shadow-[0_0_20px_rgb(0_0_0_/_0.25)] transition-shadow duration-300 hover:shadow-[0_0_30px_rgb(62_231_255_/_0.08)] sm:p-8">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
              <div className="relative">
                <div className="flex size-20 shrink-0 items-center justify-center border border-border/60 bg-[#050b0f]/50 font-display text-3xl font-bold text-muted-foreground transition-transform duration-300 hover:scale-105 sm:size-24">
                  {data.avatarUrl ? (
                    <img src={data.avatarUrl} alt="" className="size-full object-cover" />
                  ) : (
                    data.displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 size-3 bg-cyan shadow-[0_0_6px_rgb(62_231_255_/_0.6)]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <h1 className="font-display text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">{data.displayName}</h1>
                  {data.isVerified && <ShieldCheck className="size-5 text-cyan" />}
                </div>
                <p className="mt-0.5 font-mono text-[0.65rem] text-muted-foreground">@{data.username}</p>
                {data.bio && (
                  <p className="mt-3 max-w-lg font-mono text-[0.7rem] leading-relaxed text-foreground/80">{data.bio}</p>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                  <span className="clip-corner border border-border/60 px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">{data.role}</span>
                  <span className="flex items-center gap-1.5 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                    <Calendar className="size-3 text-amber" />
                    Joined {new Date(data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                  </span>
                  {isOwnProfile && (
                    <Link
                      href="/settings/profile"
                      className="clip-corner inline-flex items-center gap-1.5 border border-cyan/60 px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background"
                    >
                      <Settings className="size-3" /> Edit profile
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Stats Grid ── */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="clip-corner border border-border/70 bg-[#050b0f]/80 p-4 shadow-[0_0_20px_rgb(0_0_0_/_0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan/30 hover:shadow-[0_0_25px_rgb(62_231_255_/_0.06)]"
              >
                <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
                  <stat.icon className={cn('size-5', stat.color)} />
                  <div>
                    <p className="font-display text-lg font-black text-white">{stat.value}</p>
                    <p className="font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Level & XP ── */}
          {(() => {
            const { level, nextXp, progress } = xpProgress(data.xp);
            return (
              <div className="mt-6 clip-corner border border-border/70 bg-[#050b0f]/80 p-5 shadow-[0_0_20px_rgb(0_0_0_/_0.25)] transition-all duration-300 hover:border-cyan/30 hover:shadow-[0_0_25px_rgb(62_231_255_/_0.06)]">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center border border-cyan/30 bg-cyan/5 font-display text-xl font-black text-cyan">
                      {level}
                    </div>
                    <div>
                      <p className="font-display text-sm font-black uppercase tracking-tight text-white">Level {level}</p>
                      <p className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                        {data.xp.toLocaleString()} XP &middot; {nextXp.toLocaleString()} to next level
                      </p>
                    </div>
                  </div>
                  <Zap className="size-6 text-cyan/40" />
                </div>
                <div className="mt-3 h-1.5 w-full bg-[#0a1419]">
                  <div
                    className="h-full bg-gradient-to-r from-cyan/60 to-cyan transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round(progress * 100))}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* ── Studio Memberships ── */}
          {data.studios.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-black uppercase tracking-tight text-white">
                <Building2 className="size-5 text-cyan" />
                Studio memberships
                <span className="font-mono text-[0.55rem] font-normal tracking-widest text-muted-foreground">({data.studios.length})</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.studios.map((s) => (
                  <Link
                    key={s.id}
                    href={`/studios/${s.slug}`}
                    className="clip-corner flex items-center gap-4 border border-border/70 bg-[#050b0f]/80 p-4 shadow-[0_0_20px_rgb(0_0_0_/_0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan/30 hover:shadow-[0_0_25px_rgb(62_231_255_/_0.06)]"
                  >
                    {s.logoUrl ? (
                      <img src={s.logoUrl} alt="" className="size-12 border border-border/60 object-cover" />
                    ) : (
                      <div className="flex size-12 items-center justify-center border border-border/60 bg-[#050b0f]/50 font-display text-lg font-bold text-muted-foreground">
                        {s.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display font-semibold text-white">{s.name}</p>
                      {s.tagline && <p className="truncate font-mono text-[0.6rem] text-muted-foreground">{s.tagline}</p>}
                    </div>
                    <span className={cn(
                      'clip-corner border px-2 py-0.5 font-mono text-[0.5rem] uppercase tracking-widest',
                      s.role === 'OWNER'
                        ? 'border-amber/60 text-amber'
                        : s.role === 'ADMIN'
                          ? 'border-cyan/60 text-cyan'
                          : 'border-border/60 text-muted-foreground',
                    )}>
                      {s.role}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Recent Activity ── */}
          {data.recentActivity.length > 0 && (
            <section className="mt-10 mb-16">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-black uppercase tracking-tight text-white">
                <Activity className="size-5 text-coral" />
                Recent activity
                <span className="font-mono text-[0.55rem] font-normal tracking-widest text-muted-foreground">({data.recentActivity.length})</span>
              </h2>
              <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-1 shadow-[0_0_20px_rgb(0_0_0_/_0.25)]">
                {data.recentActivity.map((item, idx) => (
                  <div
                    key={item.id}
                    className={cn(
                      'group flex items-center gap-4 px-4 py-3 transition-all duration-200 hover:bg-cyan/5',
                      idx < data.recentActivity.length - 1 && 'border-b border-border/40',
                    )}
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center border border-border/60 bg-[#050b0f]/50 transition-colors group-hover:border-cyan/40">
                      <ActivityIcon type={item.type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[0.65rem] text-foreground/80">{item.description}</p>
                      {item.target && (
                        <p className="truncate font-mono text-[0.55rem] text-muted-foreground/60">{item.target.title}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground/50">
                      <Clock className="size-2.5" />
                      {formatRelativeTime(item.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
