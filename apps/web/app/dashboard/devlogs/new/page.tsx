'use client';

import { Suspense, useState, type FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/api/auth-context';
import { useMyStudios, useCreateDevlog } from '@/lib/api/hooks';
import type { Game } from '@/lib/api/client';
import { ApiError } from '@/lib/api/client';

import { MarkdownEditor } from '@/components/md-editor';

export default function CreateDevlogPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-6 py-10"><div className="h-96 animate-pulse rounded-xl bg-muted" /></div>}>
      <CreateDevlogForm />
    </Suspense>
  );
}

function CreateDevlogForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: studios } = useMyStudios(token ?? undefined);
  const createDevlog = useCreateDevlog();

  const [games, setGames] = useState<Game[]>([]);
  const [selectedStudio, setSelectedStudio] = useState('');
  const [gameSlug, setGameSlug] = useState(searchParams.get('game') ?? '');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugAuto, setSlugAuto] = useState(true);
  const [body, setBody] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  // Load games when studio is selected
  useEffect(() => {
    if (selectedStudio) {
      fetch(`/api/studios/${selectedStudio}/games`)
        .then((r) => r.json())
        .then((data) => setGames(data.items ?? []))
        .catch(() => setGames([]));
    } else {
      setGames([]);
    }
  }, [selectedStudio]);

  // Pre-select game from query param
  useEffect(() => {
    if (gameSlug && studios) {
      // Fetch the game to get its studio
      fetch(`/api/games/${gameSlug}`)
        .then((r) => r.json())
        .then((g) => {
          if (g.studio?.slug) setSelectedStudio(g.studio.slug);
        })
        .catch(() => {});
    }
  }, [gameSlug, studios]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (slugAuto) setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!gameSlug || !title.trim() || !slug.trim() || !body.trim()) {
      setError('Game, title, slug, and body are required');
      return;
    }
    if (!token) { setError('You must be signed in'); return; }

    try {
      const result = await createDevlog.mutateAsync({
        gameSlug,
        token,
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        body: body.trim(),
        coverUrl: coverUrl.trim() || undefined,
        isPublished,
        publishedAt: isPublished ? new Date().toISOString() : undefined,
      });
      router.push(`/devlogs/${result.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = typeof err.body === 'object' && err.body
          ? Array.isArray((err.body as { message?: string[] }).message)
            ? (err.body as { message: string[] }).message.join(', ')
            : (err.body as { message: string }).message || 'Failed to create devlog'
          : 'Failed to create devlog';
        setError(msg);
      } else { setError('Something went wrong'); }
    }
  };

  if (authLoading) return null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <FileText className="size-6 text-primary" />
        <h1 className="text-3xl font-semibold tracking-tight">Write devlog</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}

        {!gameSlug && (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Studio</label>
              <select value={selectedStudio} onChange={(e) => setSelectedStudio(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">Select a studio…</option>
                {studios?.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </select>
            </div>
            {selectedStudio && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Game *</label>
                <select value={gameSlug} onChange={(e) => setGameSlug(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Select a game…</option>
                  {games.map((g) => <option key={g.slug} value={g.slug}>{g.title}</option>)}
                </select>
              </div>
            )}
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Title *</label>
            <input type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Slug *</label>
            <input type="text" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugAuto(false); }}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Body *</label>
          <MarkdownEditor value={body} onChange={setBody} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Cover image URL</label>
          <input type="url" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card/20 p-4">
          <input type="checkbox" id="isPublished" checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="rounded border-input" />
          <label htmlFor="isPublished" className="text-sm font-medium">
            Publish immediately
          </label>
          {isPublished && <span className="text-xs text-muted-foreground">(publishedAt will be set to now)</span>}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={createDevlog.isPending}>
            {createDevlog.isPending ? 'Saving…' : isPublished ? 'Publish devlog' : 'Save draft'}
          </Button>
          <Button asChild variant="outline"><Link href="/dashboard">Cancel</Link></Button>
        </div>
      </form>
    </div>
  );
}
