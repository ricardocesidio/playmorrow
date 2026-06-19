'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Loader2, Gamepad2, Building2, FileText } from 'lucide-react';

import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';
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
      <Nav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight">Search</h1>
        <p className="mb-8 text-muted-foreground">Find games, studios, and devlogs.</p>

        {/* Search input */}
        <div className="relative mb-8">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full rounded-lg border border-input bg-background py-3 pl-10 pr-4 text-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* No results */}
        {noResults && (
          <div className="rounded-xl border border-border bg-card/20 py-16 text-center">
            <Search className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">No results for &ldquo;{debounced}&rdquo;</p>
          </div>
        )}

        {/* Results */}
        {hasResults && (
          <div className="space-y-10">
            {data.games.total > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Gamepad2 className="size-5 text-primary" />
                  Games ({data.games.total})
                </h2>
                <div className="space-y-2">
                  {data.games.items.map((g) => (
                    <Link
                      key={g.id}
                      href={`/games/${g.slug}`}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/40"
                    >
                      {g.coverUrl ? (
                        <img src={g.coverUrl} alt="" className="size-12 rounded object-cover" />
                      ) : (
                        <div className="flex size-12 items-center justify-center rounded bg-muted text-muted-foreground/30 text-xs">No cover</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{g.title}</p>
                        {g.tagline && <p className="truncate text-sm text-muted-foreground">{g.tagline}</p>}
                        <p className="text-xs text-muted-foreground/60">{g.studio.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {data.studios.total > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Building2 className="size-5 text-primary" />
                  Studios ({data.studios.total})
                </h2>
                <div className="space-y-2">
                  {data.studios.items.map((s) => (
                    <Link
                      key={s.id}
                      href={`/studios/${s.slug}`}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/40"
                    >
                      {s.logoUrl ? (
                        <img src={s.logoUrl} alt="" className="size-12 rounded object-cover" />
                      ) : (
                        <div className="flex size-12 items-center justify-center rounded bg-muted text-muted-foreground/30 text-xs">No logo</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{s.name}</p>
                        {s.tagline && <p className="truncate text-sm text-muted-foreground">{s.tagline}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {data.devlogs.total > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <FileText className="size-5 text-primary" />
                  Devlogs ({data.devlogs.total})
                </h2>
                <div className="space-y-2">
                  {data.devlogs.items.map((d) => (
                    <Link
                      key={d.id}
                      href={`/devlogs/${d.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/40"
                    >
                      {d.coverUrl ? (
                        <img src={d.coverUrl} alt="" className="size-12 rounded object-cover" />
                      ) : (
                        <div className="flex size-12 items-center justify-center rounded bg-muted text-muted-foreground/30 text-xs">No cover</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{d.title}</p>
                        <p className="text-xs text-muted-foreground/60">{d.game.title}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
