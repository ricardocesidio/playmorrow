'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, Calendar, Heart, Settings, ShieldCheck, User, Users } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { useAuth } from '@/lib/api/auth-context';
import { useUserProfile } from '@/lib/api/hooks';

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
          <div className="relative mx-auto flex w-full max-w-3xl flex-1 items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </main>
        <SiteFooter />
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
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
        
        <div className="relative mx-auto w-full max-w-3xl">
          {/* Profile header */}
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 shadow-[0_0_20px_rgb(0_0_0_/_0.25)] sm:p-7">
            <div className="flex items-start gap-5">
              <div className="flex size-20 shrink-0 items-center justify-center border border-border/60 bg-[#050b0f]/50 font-display text-2xl font-bold text-muted-foreground">
                {data.avatarUrl ? (
                  <img src={data.avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  data.displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-black uppercase tracking-tight text-white">{data.displayName}</h1>
                  {data.isVerified && <ShieldCheck className="size-5 text-cyan" />}
                </div>
                <p className="font-mono text-[0.6rem] text-muted-foreground">@{data.username}</p>
                {data.bio && <p className="mt-2 font-mono text-[0.6rem] text-foreground">{data.bio}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-4 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                  <span className="clip-corner border border-border/60 px-2 py-0.5">{data.role}</span>
                  <span className="flex items-center gap-1 normal-case">
                    <Calendar className="size-3" />
                    Joined {new Date(data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                  </span>
                  {isOwnProfile && (
                    <Link
                      href="/settings/profile"
                      className="clip-corner inline-flex items-center gap-1 border border-cyan/60 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background"
                    >
                      <Settings className="size-3" /> Edit profile
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Follower stats */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-4 shadow-[0_0_20px_rgb(0_0_0_/_0.25)]">
              <div className="flex items-center gap-3">
                <Heart className="size-5 text-coral" />
                <div>
                  <p className="font-display text-lg font-black text-white">{data.followersCount}</p>
                  <p className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Followers</p>
                </div>
              </div>
            </div>
            <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-4 shadow-[0_0_20px_rgb(0_0_0_/_0.25)]">
              <div className="flex items-center gap-3">
                <Users className="size-5 text-cyan" />
                <div>
                  <p className="font-display text-lg font-black text-white">{data.followingCount}</p>
                  <p className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Following</p>
                </div>
              </div>
            </div>
          </div>

          {/* Studios */}
          {data.studios.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-black uppercase tracking-tight text-white">
                <Building2 className="size-5 text-cyan" />
                Studios
              </h2>
              <div className="space-y-2">
                {data.studios.map((s) => (
                  <Link
                    key={s.id}
                    href={`/studios/${s.slug}`}
                    className="clip-corner flex items-center gap-3 border border-border/70 bg-[#050b0f]/80 p-3 shadow-[0_0_20px_rgb(0_0_0_/_0.25)] transition-colors hover:border-cyan/30"
                  >
                    {s.logoUrl ? (
                      <img src={s.logoUrl} alt="" className="size-10 border border-border/60 object-cover" />
                    ) : (
                      <div className="flex size-10 items-center justify-center border border-border/60 bg-[#050b0f]/50 font-mono text-[0.55rem] uppercase text-muted-foreground">No logo</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display font-semibold text-white">{s.name}</p>
                      {s.tagline && <p className="truncate font-mono text-[0.6rem] text-muted-foreground">{s.tagline}</p>}
                    </div>
                    <span className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground/60">{s.role}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
