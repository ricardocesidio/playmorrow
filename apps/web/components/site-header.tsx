'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/api/auth-context';
import { useUnreadNotificationCount } from '@/lib/api/hooks';
import { useTheme } from 'next-themes';
import { ArrowUpRight, Bell, Menu, Moon, Search, Sun, X } from 'lucide-react';
import { HudLinkLogo } from '@/components/playmorrow/hud';

const NAV_LINKS = [
  { href: '/games', label: 'Games' },
  { href: '/studios', label: 'Studios' },
  { href: '/feed', label: 'Live Feed' },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const { user, token, isAuthenticated, isLoading } = useAuth();
  const { data: unreadData } = useUnreadNotificationCount(token ?? undefined);
  const [mobileOpen, setMobileOpen] = useState(false);

  const unreadCount = unreadData?.unreadCount ?? 0;
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-40 border-b border-border/45 bg-background/88 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-[1500px] grid-cols-[auto_1fr_auto] items-center gap-4 px-5 sm:px-8 lg:px-10">
        <HudLinkLogo />

        <nav className="hidden items-center justify-center gap-12 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`relative inline-flex items-center gap-2 py-2 text-sm transition-colors ${
                isActive(link.href)
                  ? 'text-cyan after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:bg-cyan after:shadow-[0_0_10px_rgb(62_231_255_/_0.8)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
              {(isActive(link.href) || link.href === '/feed') && (
                <span className="size-1.5 rounded-full bg-cyan shadow-[0_0_10px_rgb(62_231_255_/_0.85)]" />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-5">
          <Link
            href="/search"
            className="clip-corner hidden h-10 w-[340px] items-center gap-3 border border-border bg-background/60 px-4 text-sm text-muted-foreground transition hover:border-border-bright xl:flex"
          >
            <Search className="size-4" />
            <span>Search games, studios, genres...</span>
          </Link>

          <ThemeToggle />

          {!isLoading && isAuthenticated && user ? (
            <>
              <Link
                href="/dashboard/notifications"
                className="relative grid size-8 place-items-center text-muted-foreground hover:text-cyan"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              >
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-none bg-coral text-[9px] font-bold text-coral-foreground">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/dashboard"
                className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
              >
                {user.displayName}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-foreground hover:text-cyan"
              >
                Sign in
              </Link>
            </>
          )}

          <Link
            href={isAuthenticated ? '/dashboard/games/new' : '/register'}
            className="clip-corner hidden border border-coral bg-coral px-5 py-3 pm-display text-[0.68rem] text-coral-foreground shadow-[0_0_24px_rgb(255_87_77_/_0.22)] transition hover:bg-[#ff6a61] sm:inline-flex"
          >
            Share your game <ArrowUpRight className="size-4" />
          </Link>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="grid size-8 place-items-center text-muted-foreground md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="border-t border-border bg-background px-4 py-4 md:hidden" aria-label="Mobile navigation">
          <div className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`px-3 py-2 font-mono text-xs uppercase tracking-widest ${
                  isActive(link.href) ? 'text-cyan' : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useState(() => setMounted(true));
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="grid size-8 place-items-center text-muted-foreground hover:text-cyan"
      aria-label={mounted && theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {mounted && theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
