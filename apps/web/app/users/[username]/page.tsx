'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, Calendar, Heart, ShieldCheck, User, Users } from 'lucide-react';

import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
import { useUserProfile } from '@/lib/api/hooks';

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data, isLoading, error } = useUserProfile(username);

  if (isLoading) {
    return (
      <>
        <Nav />
        <main className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-6">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </main>
        <Footer />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Nav />
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6">
          <User className="mb-3 size-12 text-muted-foreground/40" />
          <h1 className="text-xl font-semibold">User not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">No user named &ldquo;{username}&rdquo;</p>
          <Link href="/" className="mt-4 text-sm text-primary underline">Go home</Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        {/* Profile header */}
        <div className="flex items-start gap-5">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-muted text-2xl font-bold text-muted-foreground">
            {data.avatarUrl ? (
              <img src={data.avatarUrl} alt="" className="size-full rounded-full object-cover" />
            ) : (
              data.displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{data.displayName}</h1>
              {data.isVerified && <ShieldCheck className="size-5 text-primary" />}
            </div>
            <p className="text-muted-foreground">@{data.username}</p>
            {data.bio && <p className="mt-2 text-sm">{data.bio}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="rounded bg-muted px-2 py-0.5 font-medium uppercase tracking-wider">{data.role}</span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                Joined {new Date(data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
        </div>

        {/* Follower stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card/20 p-4">
            <Heart className="size-5 text-coral" />
            <div>
              <p className="text-lg font-semibold text-foreground">{data.followersCount}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card/20 p-4">
            <Users className="size-5 text-cyan" />
            <div>
              <p className="text-lg font-semibold text-foreground">{data.followingCount}</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </div>
          </div>
        </div>

        {/* Studios */}
        {data.studios.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Building2 className="size-5 text-primary" />
              Studios
            </h2>
            <div className="space-y-2">
              {data.studios.map((s) => (
                <Link
                  key={s.id}
                  href={`/studios/${s.slug}`}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/40"
                >
                  {s.logoUrl ? (
                    <img src={s.logoUrl} alt="" className="size-10 rounded object-cover" />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded bg-muted text-muted-foreground/30 text-xs">No logo</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{s.name}</p>
                    {s.tagline && <p className="truncate text-sm text-muted-foreground">{s.tagline}</p>}
                  </div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground/60">{s.role}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
