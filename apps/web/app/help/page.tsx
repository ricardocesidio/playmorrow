'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, BookOpen, Clock, FileText, LifeBuoy, ArrowRight, FileQuestion, BookMarked } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/error-state';
import { api, ApiError } from '@/lib/api/client';
import type { HelpArticle, HelpCategory, PaginatedHelpArticles } from '@/lib/api/help-types';

const CATEGORY_ICON: typeof BookOpen = BookOpen;

export default function HelpPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [featured, setFeatured] = useState<HelpArticle[]>([]);
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [popular, setPopular] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [articlesData, categoriesData] = await Promise.all([
        api.get<PaginatedHelpArticles>('/help/articles?pageSize=10'),
        api.get<HelpCategory[]>('/help/categories'),
      ]);
      setFeatured(articlesData.items.filter((a) => a.isFeatured).slice(0, 3));
      setCategories(categoriesData);
      setPopular(articlesData.items.filter((a) => a.isPublished).slice(0, 5));
    } catch (err) {
      if (err instanceof ApiError) {
        setError('Failed to load help center.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/help/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#020609]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
      <SiteHeader />

      <main className="relative mx-auto max-w-5xl px-6 py-16">
        {/* Hero */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 font-display text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">
            How can we <span className="text-cyan">help?</span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
            Search our knowledge base for guides and documentation
          </p>
          <form onSubmit={handleSearch} className="mx-auto max-w-lg">
            <div className="clip-corner flex h-14 items-center gap-3 border border-cyan/30 bg-[#050b0f]/80 px-5 shadow-[0_0_30px_rgb(62_231_255_/_0.08)]">
              <Search className="size-5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for help..."
                aria-label="Search help articles"
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
              />
              <Button type="submit" size="sm">
                Search
              </Button>
            </div>
          </form>
        </div>

        {loading && (
          <div className="space-y-8">
            <div>
              <div className="h-3 w-32 bg-border/30 rounded mb-4" />
              <div className="grid gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="clip-corner border border-border/40 bg-[#050b0f]/30 p-5 animate-pulse">
                    <div className="h-4 w-3/4 bg-border/30 rounded mb-3" />
                    <div className="h-3 w-full bg-border/20 rounded mb-1" />
                    <div className="h-3 w-2/3 bg-border/20 rounded" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="h-3 w-28 bg-border/30 rounded mb-4" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="clip-corner border border-border/40 bg-[#050b0f]/30 p-5 animate-pulse">
                    <div className="h-8 w-8 bg-border/20 rounded mb-3" />
                    <div className="h-4 w-1/2 bg-border/30 rounded mb-2" />
                    <div className="h-3 w-full bg-border/20 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && !loading && <ErrorState message={error} onRetry={fetchData} />}

        {!loading && !error && (
          <>
            {/* Featured Articles */}
            {featured.length > 0 && (
              <section className="mb-16">
                <h2 className="mb-6 flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan">
                  <BookMarked className="size-4" /> Featured Articles
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  {featured.map((article) => (
                    <Link
                      key={article.id}
                      href={`/help/article/${article.slug}`}
                      className="clip-corner group border border-border/60 bg-[#050b0f]/50 p-5 transition hover:border-cyan/30 hover:bg-[#050b0f]/80 hover:shadow-[0_0_20px_rgb(62_231_255_/_0.06)]"
                    >
                      <h3 className="mb-2 font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-foreground group-hover:text-cyan transition">
                        {article.title}
                      </h3>
                      <p className="mb-3 font-mono text-[0.55rem] text-muted-foreground/70 line-clamp-2">
                        {article.description}
                      </p>
                      <div className="flex items-center gap-3 font-mono text-[0.5rem] text-muted-foreground/50">
                        {article.category && (
                          <span>{article.category.name}</span>
                        )}
                        {article.readingTimeMin && (
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" /> {article.readingTimeMin} min
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Category Cards */}
            <section className="mb-16">
              <h2 className="mb-6 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan">
                Browse by Category
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat) => {
                  return (
                    <Link
                      key={cat.id}
                      href={`/help/category/${cat.slug}`}
                      className="clip-corner group border border-border/60 bg-[#050b0f]/50 p-5 transition hover:border-cyan/30 hover:bg-[#050b0f]/80 hover:shadow-[0_0_20px_rgb(62_231_255_/_0.06)]"
                    >
                      <CATEGORY_ICON className="mb-3 size-6 text-cyan/60 group-hover:text-cyan transition" />
                      <h3 className="mb-1 font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-foreground">
                        {cat.name}
                      </h3>
                      <p className="mb-2 font-mono text-[0.55rem] text-muted-foreground/70 line-clamp-2">
                        {cat.description}
                      </p>
                      {cat.articleCount !== undefined && (
                        <span className="font-mono text-[0.5rem] text-muted-foreground/50">
                          {cat.articleCount} article{cat.articleCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Popular Articles */}
            {popular.length > 0 && (
              <section className="mb-16">
                <h2 className="mb-6 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan">
                  Popular Articles
                </h2>
                <div className="clip-corner border border-border/60 bg-[#050b0f]/50">
                  {popular.map((article, idx) => (
                    <Link
                      key={article.id}
                      href={`/help/article/${article.slug}`}
                      className={`flex items-center gap-4 px-5 py-4 transition hover:bg-[#050b0f]/80 hover:border-cyan/30 ${
                        idx < popular.length - 1 ? 'border-b border-border/40' : ''
                      }`}
                    >
                      <FileText className="size-5 shrink-0 text-cyan/60" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-foreground truncate">
                          {article.title}
                        </h3>
                        <p className="font-mono text-[0.5rem] text-muted-foreground/60 truncate">
                          {article.category?.name}
                          {article.readingTimeMin && ` · ${article.readingTimeMin} min read`}
                        </p>
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground/40 group-hover:text-cyan transition" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Support CTA */}
            <section className="clip-corner border border-border/60 bg-[#050b0f]/60 p-6 text-center">
              <LifeBuoy className="mx-auto mb-3 size-8 text-cyan/60" />
              <h2 className="mb-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan">
                Still need help?
              </h2>
              <p className="mb-6 font-mono text-[0.55rem] text-muted-foreground">
                Can&apos;t find what you&apos;re looking for? Our support team is here to help.
              </p>
              <Link href="/support/new">
                <Button>
                  <FileQuestion className="size-4" />
                  Contact Support
                </Button>
              </Link>
            </section>
          </>
        )}
      </main>

    </div>
  );
}
