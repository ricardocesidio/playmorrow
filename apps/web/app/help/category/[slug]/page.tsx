'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, FileText, BookOpen } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/error-state';
import { api, ApiError } from '@/lib/api/client';
import type { HelpArticle, HelpCategory, PaginatedHelpArticles } from '@/lib/api/help-types';

const PAGE_SIZE = 12;

export default function HelpCategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [category, setCategory] = useState<HelpCategory | null>(null);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchData();
  }, [slug, page]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [articlesData, categoriesData] = await Promise.all([
        api.get<PaginatedHelpArticles>(`/help/articles?category=${slug}&page=${page}&pageSize=${PAGE_SIZE}`),
        api.get<HelpCategory[]>('/help/categories'),
      ]);
      const found = categoriesData.find((c) => c.slug === slug);
      if (!found) {
        setError('Category not found.');
        setLoading(false);
        return;
      }
      setCategory(found);
      setArticles(articlesData.items);
      setTotal(articlesData.total);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('Category not found.');
      } else {
        setError('Failed to load category.');
      }
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (error) {
    return (
      <div className="relative min-h-screen bg-[#020609]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <SiteHeader />
        <main className="relative mx-auto max-w-3xl px-6 py-10">
          <Link
            href="/help"
            className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground hover:text-cyan"
          >
            <ArrowLeft className="size-4" /> Back to help center
          </Link>
          <ErrorState message={error} onRetry={fetchData} />
        </main>
              </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#020609]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
      <SiteHeader />

      <main className="relative mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/help"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground hover:text-cyan"
        >
          <ArrowLeft className="size-4" /> Back to help center
        </Link>

        {loading && (
          <div>
            <div className="h-3 w-32 bg-border/30 rounded mb-2 animate-pulse" />
            <div className="h-4 w-64 bg-border/20 rounded mb-8 animate-pulse" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="clip-corner border border-border/40 bg-[#050b0f]/30 p-5 animate-pulse">
                  <div className="h-4 w-3/4 bg-border/30 rounded mb-3" />
                  <div className="h-3 w-full bg-border/20 rounded mb-1" />
                  <div className="h-3 w-2/3 bg-border/20 rounded" />
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && category && (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="size-6 text-cyan" />
                <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">
                  {category.name}
                </h1>
              </div>
              {category.description && (
                <p className="font-mono text-[0.65rem] text-muted-foreground/80 ml-9">
                  {category.description}
                </p>
              )}
            </div>

            {articles.length === 0 && (
              <div className="clip-corner border border-border/40 bg-[#050b0f]/30 py-16 text-center">
                <FileText className="mx-auto mb-3 size-10 text-muted-foreground/30" />
                <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                  No articles in this category yet.
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {articles.map((article) => (
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
                    {article.readingTimeMin && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" /> {article.readingTimeMin} min read
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-8">
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  variant="outline" size="sm"
                >
                  Previous
                </Button>
                <span className="font-mono text-[0.55rem] text-muted-foreground/60">
                  Page {page} of {totalPages}
                </span>
                <Button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  variant="outline" size="sm"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>

    </div>
  );
}
