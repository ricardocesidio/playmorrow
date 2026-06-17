'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Gamepad2,
  LayoutDashboard,
  Building2,
  PlusCircle,
  Bell,
  Rss,
  LogOut,
  ExternalLink,
  Settings,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/api/auth-context';
import { useMyStudios } from '@/lib/api/hooks';
import { Footer } from '@/components/footer';

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoading, isAuthenticated, logout } = useAuth();
  const { data: studios, isLoading: studiosLoading } = useMyStudios(token ?? undefined);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
            <Gamepad2 className="size-5" />
          </span>
          <span className="text-lg">Playmorrow</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/games" className="text-muted-foreground transition-colors hover:text-foreground">
            Games
          </Link>
          <span className="text-muted-foreground/30">·</span>
          <span className="text-foreground">{user.displayName}</span>
          <Button variant="ghost" size="sm" onClick={() => { logout(); router.push('/'); }}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="size-6 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          </div>
          <p className="mt-2 text-muted-foreground">Welcome back, {user.displayName}.</p>
        </div>

        {/* User summary */}
        <div className="mb-10 rounded-xl border border-border bg-card/30 p-5">
          <div className="flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-full bg-primary/15 text-xl font-semibold text-primary">
              {user.displayName.charAt(0)}
            </div>
            <div>
              <p className="font-medium">{user.displayName}</p>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground/60">Role: {user.role}</p>
            </div>
          </div>
        </div>

        {/* My Studios */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Building2 className="size-5 text-primary" />
              My Studios
            </h2>
            <Button asChild size="sm">
              <Link href="/studios/new">
                <PlusCircle className="size-4" /> Create studio
              </Link>
            </Button>
          </div>

          {studiosLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : studios && studios.length > 0 ? (
            <div className="space-y-3">
              {studios.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card/30 p-4 transition-colors hover:border-primary/30"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {s.logoUrl ? (
                      <img src={s.logoUrl} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="size-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/studios/${s.slug}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {s.name}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{s.gamesCount} games</span>
                        <span>·</span>
                        <span>{s.followersCount} followers</span>
                        {s.location && (
                          <>
                            <span>·</span>
                            <span>{s.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/studios/${s.slug}`}>
                        <ExternalLink className="size-3" />
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/dashboard/studios/${s.slug}`}>
                        <Settings className="size-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card/20 py-10 text-center">
              <Building2 className="mx-auto mb-3 size-8 text-muted-foreground/40" />
              <p className="text-muted-foreground">You haven&apos;t created any studios yet.</p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/studios/new">Create your first studio</Link>
              </Button>
            </div>
          )}
        </section>

        {/* Other placeholder cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="#"
            className="group rounded-xl border border-border bg-card/30 p-6 transition-colors hover:border-primary/40"
          >
            <span className="mb-4 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Bell className="size-5" />
            </span>
            <h3 className="font-medium group-hover:text-primary transition-colors">Notifications</h3>
            <p className="mt-1 text-sm text-muted-foreground">View your latest notifications.</p>
          </Link>

          <Link
            href="#"
            className="group rounded-xl border border-border bg-card/30 p-6 transition-colors hover:border-primary/40"
          >
            <span className="mb-4 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Rss className="size-5" />
            </span>
            <h3 className="font-medium group-hover:text-primary transition-colors">Feed</h3>
            <p className="mt-1 text-sm text-muted-foreground">Your personalized activity feed.</p>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
