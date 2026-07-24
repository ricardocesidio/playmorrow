'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, ArrowLeft, Clock, FileText, Loader2 } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/error-state';
import { api, ApiError } from '@/lib/api/client';
import type { HelpArticle, PaginatedHelpArticles } from '@/lib/api/help-types';

export default function HelpSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuery) {
      fetchResults(initialQuery);
    } else {
      setLoading(false);
    }
  }, [initialQuery]);

  const fetchResults = async (q: string) => {
    setLoading(true);
    setError('');
    setSelectedIdx(-1);
    try {
      const data = await api.get<HelpArticle[] | PaginatedHelpArticles>(`/help/articles/search?q=${encodeURIComponent(q)}`);
      setResults(Array.isArray(data) ? data : data.items);
    } catch (err) {
      if (err instanceof ApiError) {
        setError('Search failed.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/help/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIdx >= 0 && results[selectedIdx]) {
      router.push(`/help/article/${results[selectedIdx].slug}`);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#020609]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
      <SiteHeader />

      <main className="relative mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/help"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground hover:text-cyan"
        >
          <ArrowLeft className="size-4" /> Back to help center
        </Link>

        <h1 className="mb-8 mt-6 font-display text-3xl font-black uppercase tracking-tight text-white">
          Search Articles
        </h1>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="clip-corner flex h-14 items-center gap-3 border border-cyan/30 bg-[#050b0f]/80 px-5 shadow-[0_0_30px_rgb(62_231_255_/_0.08)]">
            <Search className="size-5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search articles..."
              aria-label="Search articles"
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
              autoFocus
            />
            <Button type="submit" size="sm" disabled={!query.trim()}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'Search'}
            </Button>
          </div>
        </form>

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="clip-corner border border-border/40 bg-[#050b0f]/30 p-4 animate-pulse">
                <div className="h-4 w-3/4 bg-border/30 rounded mb-2" />
                <div className="h-3 w-full bg-border/20 rounded mb-1" />
                <div className="h-3 w-1/2 bg-border/20 rounded" />
              </div>
            ))}
          </div>
        )}

        {error && !loading && <ErrorState message={error} onRetry={() => fetchResults(query)} />}

        {!loading && !error && results.length === 0 && initialQuery && (
          <div className="clip-corner border border-border/40 bg-[#050b0f]/30 py-16 text-center">
            <Search className="mx-auto mb-3 size-10 text-muted-foreground/30" />
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-2">
              No results found
            </p>
            <p className="font-mono text-[0.5rem] text-muted-foreground/60">
              Try different keywords or browse categories
            </p>
          </div>
        )}

        {!loading && !error && results.length === 0 && !initialQuery && (
          <div className="clip-corner border border-border/40 bg-[#050b0f]/30 py-16 text-center">
            <Search className="mx-auto mb-3 size-10 text-muted-foreground/30" />
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
              Enter a search term to find articles
            </p>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <div ref={listRef} className="space-y-2" role="listbox" aria-label="Search results">
            {results.map((article, idx) => (
              <Link
                key={article.id}
                href={`/help/article/${article.slug}`}
                role="option"
                aria-selected={selectedIdx === idx}
                className={`flex items-start gap-4 clip-corner border p-4 transition ${
                  selectedIdx === idx
                    ? 'border-cyan/40 bg-cyan/[0.03] shadow-[0_0_16px_rgb(62_231_255_/_0.08)]'
                    : 'border-border/40 bg-[#050b0f]/30 hover:bg-[#050b0f]/50 hover:border-border/60'
                }`}
              >
                <FileText className="size-5 shrink-0 mt-0.5 text-cyan/60" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-foreground mb-1">
                    {article.title}
                  </h3>
                  <p className="font-mono text-[0.55rem] text-muted-foreground/70 line-clamp-2 mb-2">
                    {article.description}
                  </p>
                  <div className="flex items-center gap-3 font-mono text-[0.5rem] text-muted-foreground/50">
                    {article.category && <span>{article.category.name}</span>}
                    {article.readingTimeMin && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" /> {article.readingTimeMin} min
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
