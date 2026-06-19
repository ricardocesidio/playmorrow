'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/api/auth-context';
import { useUnreadNotificationCount } from '@/lib/api/hooks';
import { Gamepad2, Bell, Sun, Moon, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/games', label: 'Games' },
  { href: '/studios', label: 'Studios' },
  { href: '/feed', label: 'Feed' },
  { href: '/search', label: 'Search' },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, token, isAuthenticated, isLoading } = useAuth();
  const { data: unreadData } = useUnreadNotificationCount(token ?? undefined);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const unreadCount = unreadData?.unreadCount ?? 0;
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <span className="grid size-8 place-items-center rounded-none bg-cyan/10 text-cyan">
            <Gamepad2 className="size-4" />
          </span>
          <span>Playmorrow</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${
                isActive(link.href)
                  ? 'text-cyan'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="grid size-8 place-items-center text-muted-foreground hover:text-foreground"
            aria-label={mounted && theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {mounted && theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {/* Auth */}
          {isLoading ? (
            <div className="flex items-center gap-2" aria-hidden>
              <div className="h-7 w-16 animate-pulse bg-muted" />
              <div className="h-7 w-20 animate-pulse bg-muted" />
            </div>
          ) : isAuthenticated && user ? (
            <>
              <Link
                href="/dashboard/notifications"
                className="relative grid size-8 place-items-center text-muted-foreground hover:text-foreground"
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
                className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                {user.displayName}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-none border border-coral bg-coral/10 px-3 py-1 font-mono text-xs uppercase tracking-widest text-coral transition-colors hover:bg-coral hover:text-coral-foreground"
              >
                Register
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
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
