'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SiteHeader } from '@/components/site-header';
import { MarkdownEditor } from '@/components/md-editor';
import { useAuth } from '@/lib/api/auth-context';
import { api, ApiError } from '@/lib/api/client';
import type { HelpCategory, CreateHelpArticleDto, HelpArticle } from '@/lib/api/help-types';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export default function NewHelpArticlePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    api.get<HelpCategory[]>('/help/categories')
      .then(setCategories)
      .catch(() => {});
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugManuallyEdited) {
      setSlug(slugify(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Title and body are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateHelpArticleDto = {
        title: title.trim(),
        slug: slug.trim() || slugify(title),
        description: description.trim(),
        body,
        categoryId: categoryId || undefined as unknown as string,
        tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
        isPublished,
        isFeatured,
      };

      const article = await api.post<HelpArticle>('/admin/help/articles', payload);
      toast.success('Article created.');
      router.push(`/dashboard/help/${article.id}`);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.body && typeof err.body === 'object') {
        const body = err.body as Record<string, unknown>;
        const msg = Array.isArray(body.message)
          ? (body.message as string[]).join(', ')
          : typeof body.message === 'string'
            ? body.message
            : 'Failed to create article.';
        toast.error(msg);
      } else {
        toast.error('Failed to create article.');
      }
    } finally {
      setSubmitting(false);
    }
  };

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

      <main className="relative mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/dashboard/help"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground hover:text-cyan"
        >
          <ArrowLeft className="size-4" /> Back to articles
        </Link>

        <h1 className="mb-8 mt-6 font-display text-3xl font-black uppercase tracking-tight text-white">
          New Article
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="clip-corner border border-border/70 panel p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <div className="space-y-5">
              {/* Title */}
              <div>
                <label htmlFor="title" className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                  Title
                </label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Article title"
                  maxLength={200}
                />
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="slug" className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                  Slug
                </label>
                <Input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugManuallyEdited(true); }}
                  placeholder="article-slug"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="clip-corner h-20 w-full resize-y border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]"
                  placeholder="Brief description for search and preview"
                  maxLength={500}
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                  Category
                </label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                  Tags (comma-separated)
                </label>
                <Input
                  id="tags"
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="getting-started, faq, troubleshooting"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="size-4 accent-cyan"
                  />
                  <span className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Published</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="size-4 accent-cyan"
                  />
                  <span className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Featured</span>
                </label>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="clip-corner border border-border/70 panel p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <label className="mb-3 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
              Body (Markdown)
            </label>
            <MarkdownEditor value={body} onChange={setBody} />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="clip-corner inline-flex h-14 w-full cursor-pointer items-center justify-center gap-3 border border-cyan bg-cyan/10 px-7 font-mono text-xs uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background disabled:pointer-events-none disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="size-5" />
                Create Article
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
