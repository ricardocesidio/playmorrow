'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Loader2, Gamepad2, Building2, FileText } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { api, type SearchResponse } from '@/lib/api/client';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [data, setData] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debounced.trim()) { setData(null); return; }
    setIsLoading(true);
    setError('');
    api.get<SearchResponse>(`/search?q=${encodeURIComponent(debounced)}&pageSize=5`)
      .then(setData)
      .catch(() => setError('Search failed'))
      .finally(() => setIsLoading(false));
  }, [debounced]);

  const hasResults = data && (data.games.total > 0 || data.studios.total > 0 || data.devlogs.total > 0);
  const noResults = data && !hasResults;

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
        
        <div className="relative mx-auto w-full max-w-3xl">
          <h1 className="mb-2 font-display text-3xl font-black uppercase tracking-tight text-white">Search</h1>
          <p className="mb-8 font-mono text-[0.6rem] text-muted-foreground">Find games, studios, and devlogs.</p>

          {/* Search input */}
          <div className="relative mb-8">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="clip-corner h-12 w-full border border-input bg-background/80 pl-11 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]"
            />
            {isLoading && (
              <Loader2 className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="clip-corner border border-coral/40 bg-coral/5 px-4 py-3 font-mono text-[0.6rem] text-coral">{error}</p>
          )}

          {/* No results */}
          {noResults && (
            <div className="clip-corner border border-border/40 bg-[#050b0f]/30 py-16 text-center">
              <Search className="mx-auto mb-3 size-10 text-muted-foreground/30" />
              <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">No results for &ldquo;{debounced}&rdquo;</p>
            </div>
          )}

          {/* Results */}
          {hasResults && (
            <div className="space-y-10">
              {data.games.total > 0 && (
                <section>
                  <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-black uppercase tracking-tight text-white">
                    <Gamepad2 className="size-5 text-cyan" />
                    Games ({data.games.total})
                  </h2>
                  <div className="space-y-2">
                    {data.games.items.map((g) => (
                      <Link
                        key={g.id}
                        href={`/games/${g.slug}`}
                        className="clip-corner flex items-center gap-3 border border-border/70 bg-[#050b0f]/80 p-3 shadow-[0_0_20px_rgb(0_0_0_/_0.25)] transition-colors hover:border-cyan/30"
                      >
                        {g.coverUrl ? (
                          <img src={g.coverUrl} alt="" className="size-12 border border-border/60 object-cover" />
                        ) : (
                          <div className="flex size-12 items-center justify-center border border-border/60 bg-[#050b0f]/50 font-mono text-[0.55rem] uppercase text-muted-foreground">No cover</div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display font-semibold text-white">{g.title}</p>
                          {g.tagline && <p className="truncate font-mono text-[0.6rem] text-muted-foreground">{g.tagline}</p>}
                          <p className="font-mono text-[0.55rem] text-muted-foreground/60">{g.studio.name}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {data.studios.total > 0 && (
                <section>
                  <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-black uppercase tracking-tight text-white">
                    <Building2 className="size-5 text-cyan" />
                    Studios ({data.studios.total})
                  </h2>
                  <div className="space-y-2">
                    {data.studios.items.map((s) => (
                      <Link
                        key={s.id}
                        href={`/studios/${s.slug}`}
                        className="clip-corner flex items-center gap-3 border border-border/70 bg-[#050b0f]/80 p-3 shadow-[0_0_20px_rgb(0_0_0_/_0.25)] transition-colors hover:border-cyan/30"
                      >
                        {s.logoUrl ? (
                          <img src={s.logoUrl} alt="" className="size-12 border border-border/60 object-cover" />
                        ) : (
                          <div className="flex size-12 items-center justify-center border border-border/60 bg-[#050b0f]/50 font-mono text-[0.55rem] uppercase text-muted-foreground">No logo</div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display font-semibold text-white">{s.name}</p>
                          {s.tagline && <p className="truncate font-mono text-[0.6rem] text-muted-foreground">{s.tagline}</p>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {data.devlogs.total > 0 && (
                <section>
                  <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-black uppercase tracking-tight text-white">
                    <FileText className="size-5 text-cyan" />
                    Devlogs ({data.devlogs.total})
                  </h2>
                  <div className="space-y-2">
                    {data.devlogs.items.map((d) => (
                      <Link
                        key={d.id}
                        href={`/devlogs/${d.id}`}
                        className="clip-corner flex items-center gap-3 border border-border/70 bg-[#050b0f]/80 p-3 shadow-[0_0_20px_rgb(0_0_0_/_0.25)] transition-colors hover:border-cyan/30"
                      >
                        <div className="flex size-12 items-center justify-center border border-border/60 bg-[#050b0f]/50 font-mono text-[0.55rem] uppercase text-muted-foreground">Devlog</div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display font-semibold text-white">{d.title}</p>
                          <p className="font-mono text-[0.55rem] text-muted-foreground/60">{d.game.title}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
