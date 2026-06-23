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
  Gamepad,
  FileText,
  Users,
  Heart,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/api/auth-context';
import { useMyStudios, useMyGames, useMyDevlogs, useUnreadNotificationCount, useMyFollows, useMyWishlist } from '@/lib/api/hooks';
import { Footer } from '@/components/footer';

function MyFollowsList({ token }: { token: string | null }) {
  const { data: follows, isLoading } = useMyFollows(token ?? undefined);

  if (isLoading) {
    return <div className="h-16 animate-pulse rounded-xl bg-muted" />;
  }

  const items = [
    ...(follows?.studios ?? []).map((s) => ({ type: 'studio' as const, slug: s.slug, name: s.name, img: s.logoUrl })),
    ...(follows?.games ?? []).map((g) => ({ type: 'game' as const, slug: g.slug, name: g.title, img: g.coverUrl })),
  ];

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card/20 py-8 text-center">
        <p className="text-sm text-muted-foreground">Not following anything yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.slice(0, 8).map((item) => (
        <Link
          key={`${item.type}-${item.slug}`}
          href={item.type === 'studio' ? `/studios/${item.slug}` : `/games/${item.slug}`}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/30 px-3 py-1.5 text-sm transition-colors hover:border-primary/40"
        >
          {item.img ? (
            <img src={item.img} alt="" className="size-5 rounded object-cover" />
          ) : (
            <div className="grid size-5 place-items-center rounded bg-primary/10 text-[9px] text-primary">
              {item.type === 'studio' ? 'S' : 'G'}
            </div>
          )}
          <span className="max-w-[140px] truncate">{item.name}</span>
        </Link>
      ))}
      {items.length > 8 && (
        <span className="inline-flex items-center text-sm text-muted-foreground">
          +{items.length - 8} more
        </span>
      )}
    </div>
  );
}

function MyDevlogsList({ token }: { token: string | null }) {
  const { data: devlogs, isLoading } = useMyDevlogs(token ?? undefined);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (devlogs && devlogs.length > 0) {
    return (
      <div className="space-y-3">
        {devlogs.slice(0, 5).map((d) => (
          <div key={d.id} className="flex items-center justify-between rounded-xl border border-border bg-card/30 p-4 transition-colors hover:border-primary/30">
            <div className="flex items-center gap-4 min-w-0">
              <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0">
                <Link href={`/devlogs/${d.id}`} className="font-medium hover:text-primary transition-colors">
                  {d.title}
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className={`rounded px-1.5 py-0.5 ${d.isPublished ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {d.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <span>{d.game?.title}</span>
                  <span>·</span>
                  <span>{d.publishedAt ? new Date(d.publishedAt).toLocaleDateString() : new Date(d.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button asChild variant="ghost" size="sm">
                <Link href={`/devlogs/${d.id}`}><ExternalLink className="size-3" /></Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/dashboard/devlogs/${d.id}`}><Settings className="size-3" /></Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card/20 py-10 text-center">
      <FileText className="mx-auto mb-3 size-8 text-muted-foreground/40" />
      <p className="text-muted-foreground">No devlogs yet.</p>
      <Button asChild className="mt-4" size="sm">
        <Link href="/dashboard/devlogs/new">Write your first devlog</Link>
      </Button>
    </div>
  );
}

function MyGamesList({ token }: { token: string | null }) {
  const { data: games, isLoading } = useMyGames(token ?? undefined);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (games && games.length > 0) {
    return (
      <div className="space-y-3">
        {games.map((g) => (
          <div key={g.id} className="flex items-center justify-between rounded-xl border border-border bg-card/30 p-4 transition-colors hover:border-primary/30">
            <div className="flex items-center gap-4 min-w-0">
              {g.coverUrl ? (
                <img src={g.coverUrl} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Gamepad className="size-5" />
                </div>
              )}
              <div className="min-w-0">
                <Link href={`/games/${g.slug}`} className="font-medium hover:text-primary transition-colors">
                  {g.title}
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">{g.status}</span>
                  <span>{g.studio?.name}</span>
                  <span>·</span>
                  <span>{g.followersCount} followers</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button asChild variant="ghost" size="sm">
                <Link href={`/games/${g.slug}`}><ExternalLink className="size-3" /></Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/dashboard/games/${g.slug}`}><Settings className="size-3" /></Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card/20 py-10 text-center">
      <Gamepad2 className="mx-auto mb-3 size-8 text-muted-foreground/40" />
      <p className="text-muted-foreground">No games yet. Create one under a studio.</p>
      <Button asChild className="mt-4" size="sm">
        <Link href="/dashboard/games/new">Create your first game</Link>
      </Button>
    </div>
  );
}

function MyWishlistSection() {
  const { data: wishlist, isLoading } = useMyWishlist();

  if (isLoading) {
    return <div className="h-16 animate-pulse rounded border border-border bg-elevated" />;
  }

  if (!wishlist || wishlist.items.length === 0) {
    return (
      <div className="rounded border border-border bg-elevated py-8 text-center">
        <Heart className="mx-auto mb-2 size-6 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Your wishlist is empty. Save games you want to follow later.</p>
        <Link href="/games" className="mt-3 inline-block border border-coral bg-coral/10 px-4 py-2 font-mono text-xs uppercase tracking-widest text-coral">
          Explore games
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {wishlist.items.slice(0, 5).map((item) => (
        <Link
          key={item.id}
          href={`/games/${item.game.slug}`}
          className="flex items-center gap-3 rounded border border-border bg-elevated p-3 transition-colors hover:border-border-bright"
        >
          {item.game.coverUrl ? (
            <img src={item.game.coverUrl} alt="" className="size-10 rounded object-cover" />
          ) : (
            <div className="flex size-10 items-center justify-center rounded bg-muted font-mono text-xs text-muted-foreground/30">No cover</div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-sm">{item.game.title}</p>
            <p className="truncate text-xs text-muted-foreground">{item.game.studio.name}</p>
          </div>
          <Heart className="size-3 shrink-0 text-coral fill-coral" />
        </Link>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoading, isAuthenticated, logout } = useAuth();
  const { data: studios, isLoading: studiosLoading } = useMyStudios(token ?? undefined);
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.unreadCount ?? 0;

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

        {/* My Games */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Gamepad className="size-5 text-primary" />
              My Games
            </h2>
            <Button asChild size="sm">
              <Link href="/dashboard/games/new">
                <PlusCircle className="size-4" /> Create game
              </Link>
            </Button>
          </div>

          <MyGamesList token={token} />
        </section>

        {/* My Devlogs */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="size-5 text-primary" />
              Recent Devlogs
            </h2>
          </div>
          <MyDevlogsList token={token} />
        </section>

        {/* Following */}
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Users className="size-5 text-primary" />
            Following
          </h2>
          <MyFollowsList token={token} />
        </section>

        {/* Wishlist */}
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Heart className="size-5 text-coral" />
            My Wishlist
          </h2>
          <MyWishlistSection />
        </section>

        {/* Other placeholder cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard/notifications"
            className="group relative rounded-xl border border-border bg-card/30 p-6 transition-colors hover:border-primary/40"
          >
            <span className="mb-4 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Bell className="size-5" />
            </span>
            <h3 className="font-medium group-hover:text-primary transition-colors">Notifications</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : 'View your notifications'}
            </p>
            {unreadCount > 0 && (
              <span className="absolute right-4 top-4 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <Link
            href="/dashboard/feed"
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
