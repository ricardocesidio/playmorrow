'use client';

import Link from 'next/link';
import { Gamepad2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/api/auth-context';
import { useUnreadNotificationCount } from '@/lib/api/hooks';

export function Nav() {
  const pathname = usePathname();
  const { user, token, isAuthenticated, isLoading } = useAuth();
  const { data: unreadData } = useUnreadNotificationCount(token ?? undefined);
  const unreadCount = unreadData?.unreadCount ?? 0;

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
          <Gamepad2 className="size-5" />
        </span>
        <span className="text-lg">Playmorrow</span>
      </Link>
      <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
        <Link
          href="/games"
          className={`transition-colors hover:text-foreground ${pathname === '/games' ? 'text-foreground' : ''}`}
        >
          Games
        </Link>
      </nav>
      <div className="flex items-center gap-2">
        {isLoading ? null : isAuthenticated && user ? (
          <>
            <Link
              href="/dashboard/notifications"
              className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.displayName}</span>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </>
        ) : (
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Register</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
