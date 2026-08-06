'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, FileText, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { api, ApiError } from '@/lib/api/client';
import { ErrorState } from '@/components/error-state';
import type { HelpArticle, PaginatedHelpArticles } from '@/lib/api/help-types';

export default function AdminHelpPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    fetchArticles();
  }, [page]);

  const fetchArticles = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<PaginatedHelpArticles>(
        `/admin/help/articles?page=${page}&pageSize=${pageSize}`
      );
      setArticles(data.items);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof ApiError) {
        setError('Failed to load articles.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (article: HelpArticle) => {
    try {
      await api.patch(`/admin/help/articles/${article.id}`, {
        isPublished: !article.isPublished,
      });
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, isPublished: !a.isPublished } : a)),
      );
      toast.success(article.isPublished ? 'Article unpublished.' : 'Article published.');
    } catch {
      toast.error('Failed to update article.');
    }
  };

  const handleDelete = async (article: HelpArticle) => {
    if (!confirm(`Delete "${article.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/help/articles/${article.id}`);
      setArticles((prev) => prev.filter((a) => a.id !== article.id));
      toast.success('Article deleted.');
    } catch {
      toast.error('Failed to delete article.');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020609]">
        <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#020609]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <SiteHeader />

      <main className="relative mx-auto max-w-5xl px-6 py-10">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground hover:text-cyan"
        >
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileText className="size-6 text-cyan" />
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">
              Help Articles
            </h1>
          </div>
          <Link href="/dashboard/help/new">
            <Button>
              <Plus className="size-4" /> New Article
            </Button>
          </Link>
        </div>

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="clip-corner border border-border/40 panel p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-12 bg-border/20 rounded" />
                  <div className="h-4 w-1/3 bg-border/30 rounded" />
                  <div className="h-3 w-16 bg-border/20 rounded ml-auto" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !loading && <ErrorState message={error} onRetry={fetchArticles} />}

        {!loading && !error && articles.length === 0 && (
          <div className="clip-corner border border-border/40 panel py-16 text-center">
            <FileText className="mx-auto mb-3 size-10 text-muted-foreground/30" />
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-4">
              No articles yet.
            </p>
            <Link href="/dashboard/help/new">
              <Button variant="outline" size="sm">
                Create your first article
              </Button>
            </Link>
          </div>
        )}

        {!loading && !error && articles.length > 0 && (
          <div className="space-y-2">
            {articles.map((article) => (
              <div
                key={article.id}
                className="clip-corner border border-border/40 panel p-4 transition "
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-mono text-[0.45rem] uppercase tracking-widest px-1.5 py-0.5 clip-corner border ${
                          article.isPublished
                            ? 'border-green/40 bg-green/5 text-green'
                            : 'border-amber/40 bg-amber/5 text-amber'
                        }`}
                      >
                        {article.isPublished ? 'Published' : 'Draft'}
                      </span>
                      {article.isFeatured && (
                        <span className="font-mono text-[0.45rem] uppercase tracking-widest px-1.5 py-0.5 clip-corner border border-cyan/40 bg-cyan/5 text-cyan">
                          Featured
                        </span>
                      )}
                      {article.category && (
                        <span className="font-mono text-[0.45rem] text-muted-foreground/50">
                          {article.category.name}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/help/${article.id}`}
                      className="font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-foreground hover:text-cyan transition"
                    >
                      {article.title}
                    </Link>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      onClick={() => handleTogglePublish(article)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title={article.isPublished ? 'Unpublish' : 'Publish'}
                    >
                      {article.isPublished ? <X className="size-4 text-amber" /> : <Check className="size-4 text-green" />}
                    </Button>
                    <Link href={`/dashboard/help/${article.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit">
                        <FileText className="size-4" />
                      </Button>
                    </Link>
                    <Button
                      onClick={() => handleDelete(article)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-coral hover:text-coral"
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
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
          </div>
        )}
      </main>
    </div>
  );
}
