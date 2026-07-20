'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/api/auth-context';
import { ArrowUpRight, Building2, Gamepad2, Loader2, Menu, Search, X } from 'lucide-react';
import { HudLinkLogo } from '@/components/playmorrow/hud';
import { NotificationDropdown } from '@/components/notification-dropdown';
import { api, type SearchResponse } from '@/lib/api/client';
import { useMyInvitations } from '@/lib/api/hooks';

const NAV_LINKS = [
  { href: '/games', label: 'Games' },
  { href: '/studios', label: 'Studios' },
  { href: '/feed', label: 'Live Feed' },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { data: invitations } = useMyInvitations();
  const pendingCount = invitations?.length ?? 0;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!searchDebounced.trim()) { setSearchResults(null); setSearchOpen(false); return; }
    setSearchLoading(true);
    api.get<SearchResponse>(`/search?q=${encodeURIComponent(searchDebounced)}&pageSize=5`)
      .then((data) => { setSearchResults(data); setSearchOpen(true); })
      .catch(() => setSearchResults(null))
      .finally(() => setSearchLoading(false));
  }, [searchDebounced]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-40 border-b border-border/45 glass">
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
          <div ref={searchRef} className="relative hidden xl:block">
            <div className="clip-corner flex h-10 w-[340px] items-center gap-3 border border-border bg-background/60 px-4 text-sm text-muted-foreground">
              <Search className="size-4 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchResults) setSearchOpen(true); }}
                placeholder="Search games, studios, genres..."
                className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground/60"
              />
              {searchLoading && <Loader2 className="size-4 animate-spin shrink-0" />}
              {searchQuery && !searchLoading && (
                <button type="button" onClick={() => { setSearchQuery(''); setSearchResults(null); setSearchOpen(false); }} className="shrink-0 text-muted-foreground hover:text-foreground">
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {searchOpen && searchResults && (
              <div className="absolute right-0 top-full mt-2 w-[400px] rounded-lg border border-border bg-background shadow-xl">
                <div className="max-h-[480px] overflow-y-auto p-2">
                  {searchResults.games.total > 0 && (
                    <div className="mb-2">
                      <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Games ({searchResults.games.total})</p>
                      {searchResults.games.items.map((g) => (
                        <Link key={g.id} href={`/games/${g.slug}`} onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                          className="flex items-center gap-3 rounded px-2 py-2 transition hover:bg-muted"
                        >
                          {g.coverUrl ? (
                            <img src={g.coverUrl} alt="" className="size-9 shrink-0 rounded object-cover" />
                          ) : (
                            <div className="flex size-9 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground/30"><Gamepad2 className="size-4" /></div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{g.title}</p>
                            {g.tagline && <p className="truncate text-xs text-muted-foreground">{g.tagline}</p>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.studios.total > 0 && (
                    <div className="mb-2">
                      <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Studios ({searchResults.studios.total})</p>
                      {searchResults.studios.items.map((s) => (
                        <Link key={s.id} href={`/studios/${s.slug}`} onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                          className="flex items-center gap-3 rounded px-2 py-2 transition hover:bg-muted"
                        >
                          {s.logoUrl ? (
                            <img src={s.logoUrl} alt="" className="size-9 shrink-0 rounded object-cover" />
                          ) : (
                            <div className="flex size-9 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground/30"><Building2 className="size-4" /></div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
                            {s.tagline && <p className="truncate text-xs text-muted-foreground">{s.tagline}</p>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.games.total + searchResults.studios.total + searchResults.devlogs.total === 0 && (
                    <p className="px-2 py-4 text-center text-sm text-muted-foreground">No results found.</p>
                  )}

                  <Link href={`/search?q=${encodeURIComponent(searchQuery)}`} onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                    className="mt-1 flex items-center justify-center rounded px-2 py-2 text-xs font-medium text-cyan transition hover:bg-muted"
                  >
                    View all results <ArrowUpRight className="ml-1 size-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>


          {!isLoading && isAuthenticated && user ? (
            <>
              <Link href="/my/invitations" className="relative hidden sm:block">
                <div className="grid size-8 place-items-center rounded-full border border-border bg-background/60 text-muted-foreground hover:text-cyan transition-colors">
                  <Building2 className="size-4" />
                </div>
                {pendingCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-coral px-1 py-0.5 font-mono text-[9px] font-bold text-white leading-none">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Link>
              <NotificationDropdown />
              <div className="relative group hidden sm:block">
                <button className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground" aria-haspopup="true" aria-expanded="false">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-background/60 text-[10px] font-bold text-foreground overflow-hidden">
                    {user.avatarUrl ? <img src={user.avatarUrl} alt={`${user.displayName}'s avatar`} className="size-full object-cover" /> : user.displayName.slice(0, 1).toUpperCase()}
                  </span>
                  {user.displayName}
                  <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                <div className="absolute right-0 top-full z-50 mt-1 w-40 border border-border bg-background shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-150">
                  <Link href="/dashboard" className="block px-4 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:bg-cyan/10 hover:text-cyan transition">Dashboard</Link>
                  <button onClick={() => { logout(); window.location.href = '/'; }} className="block w-full cursor-pointer px-4 py-2 text-left text-xs font-mono uppercase tracking-widest text-muted-foreground hover:bg-coral/10 hover:text-coral transition">Sign out</button>
                </div>
              </div>
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
            href={isAuthenticated ? (user?.accountType === 'STUDIO' ? '/dashboard' : '/dashboard/games/new') : '/register'}
            className="clip-corner hidden border border-coral bg-coral px-5 py-3 pm-display text-[0.68rem] text-coral-foreground shadow-[0_0_24px_rgb(255_87_77_/_0.22)] transition hover:bg-[#ff6a61] sm:inline-flex"
          >
            {user?.accountType === 'STUDIO' ? 'Studio Dashboard' : 'Share your game'} <ArrowUpRight className="size-4" />
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

