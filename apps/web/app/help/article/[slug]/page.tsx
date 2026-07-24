'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, User, Calendar, Share2, Copy, ThumbsUp, ThumbsDown, Check, BookOpen, List } from 'lucide-react';
import { toast } from 'sonner';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/error-state';
import { SanitizedMarkdown } from '@/components/sanitized-markdown';
import { api, ApiError } from '@/lib/api/client';
import type { HelpArticle } from '@/lib/api/help-types';

function extractHeadings(body: string): { id: string; text: string; level: number }[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: { id: string; text: string; level: number }[] = [];
  let match;
  while ((match = headingRegex.exec(body)) !== null) {
    const text = match[2]!.trim();
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    headings.push({ id, text, level: match[1]!.length });
  }
  return headings;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function HelpArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [article, setArticle] = useState<HelpArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchArticle();
  }, [slug]);

  const fetchArticle = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<HelpArticle>('/help/articles/' + slug);
      setArticle(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('Article not found.');
      } else {
        setError('Failed to load article.');
      }
    } finally {
      setLoading(false);
    }
  };

  const headings = useMemo(() => article ? extractHeadings(article.body) : [], [article?.body]);

  const handleFeedback = async (type: 'up' | 'down') => {
    if (!article || feedback) return;
    try {
      await api.post(`/help/articles/${article.id}/feedback`, { helpful: type === 'up' });
      setFeedback(type);
      toast.success(type === 'up' ? 'Glad this helped!' : 'Thanks for your feedback.');
    } catch {
      toast.error('Failed to submit feedback.');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link.');
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#020609]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <SiteHeader />
        <main className="relative mx-auto max-w-4xl px-6 py-10">
          <div className="h-4 w-40 bg-border/30 rounded mb-8 animate-pulse" />
          <div className="flex gap-8">
            <div className="flex-1">
              <div className="h-8 w-3/4 bg-border/30 rounded mb-4 animate-pulse" />
              <div className="h-4 w-1/2 bg-border/20 rounded mb-6 animate-pulse" />
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-4 bg-border/20 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                ))}
              </div>
            </div>
            <div className="hidden lg:block w-56 shrink-0">
              <div className="h-4 w-24 bg-border/30 rounded mb-4 animate-pulse" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-3 w-full bg-border/20 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

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
          <ErrorState message={error} onRetry={fetchArticle} />
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="relative min-h-screen bg-[#020609]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
      <SiteHeader />

      <main className="relative mx-auto max-w-4xl px-6 py-10">
        {/* Breadcrumbs */}
        <nav className="mb-6 flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground/60">
          <Link href="/help" className="hover:text-cyan transition">Help</Link>
          <span>/</span>
          {article.category && (
            <>
              <Link href={`/help/category/${article.category.slug}`} className="hover:text-cyan transition">
                {article.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground/60 truncate max-w-[200px]">{article.title}</span>
        </nav>

        <div className="flex gap-8">
          {/* Article Content */}
          <article className="flex-1 min-w-0">
            <h1 className="mb-3 font-display text-3xl font-black uppercase tracking-tight text-white">
              {article.title}
            </h1>

            {article.description && (
              <p className="mb-6 font-mono text-[0.65rem] text-muted-foreground/80 leading-relaxed">
                {article.description}
              </p>
            )}

            {/* Meta */}
            <div className="mb-8 flex flex-wrap items-center gap-4 font-mono text-[0.5rem] text-muted-foreground/60">
              {article.author && (
                <span className="flex items-center gap-1.5">
                  <User className="size-3.5" /> {article.author.displayName}
                </span>
              )}
              {article.readingTimeMin && (
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5" /> {article.readingTimeMin} min read
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" /> Updated {formatDate(article.updatedAt)}
              </span>
            </div>

            {/* Article Body */}
            <div className="prose-custom mb-12">
              <SanitizedMarkdown source={article.body} />
            </div>

            {/* Was this helpful? */}
            <div className="clip-corner border border-border/60 bg-[#050b0f]/60 p-6 mb-8">
              <h3 className="mb-4 text-center font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan">
                Was this helpful?
              </h3>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => handleFeedback('up')}
                  disabled={!!feedback}
                  className={`flex items-center gap-2 clip-corner border px-5 py-3 font-mono text-[0.6rem] uppercase tracking-widest transition cursor-pointer ${
                    feedback === 'up'
                      ? 'border-green/40 bg-green/5 text-green'
                      : 'border-border/50 bg-transparent text-muted-foreground hover:border-green/30 hover:text-green'
                  } ${feedback && feedback !== 'up' ? 'opacity-30 pointer-events-none' : ''}`}
                >
                  <ThumbsUp className="size-4" /> Yes
                </button>
                <button
                  onClick={() => handleFeedback('down')}
                  disabled={!!feedback}
                  className={`flex items-center gap-2 clip-corner border px-5 py-3 font-mono text-[0.6rem] uppercase tracking-widest transition cursor-pointer ${
                    feedback === 'down'
                      ? 'border-coral/40 bg-coral/5 text-coral'
                      : 'border-border/50 bg-transparent text-muted-foreground hover:border-coral/30 hover:text-coral'
                  } ${feedback && feedback !== 'down' ? 'opacity-30 pointer-events-none' : ''}`}
                >
                  <ThumbsDown className="size-4" /> No
                </button>
              </div>
            </div>

            {/* Share */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground/60">
                Share this article:
              </span>
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                {copied ? <Check className="size-4 text-green" /> : <Copy className="size-4" />}
                {copied ? 'Copied' : 'Copy Link'}
              </Button>
            </div>
          </article>

          {/* ToC Sidebar */}
          {headings.length > 0 && (
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-24">
                <h4 className="mb-4 flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-widest text-cyan">
                  <List className="size-3.5" /> On this page
                </h4>
                <nav className="space-y-1.5">
                  {headings.map((h) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className={`block font-mono text-[0.5rem] leading-relaxed text-muted-foreground/60 hover:text-cyan transition ${
                        h.level === 3 ? 'pl-3' : ''
                      }`}
                    >
                      {h.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
