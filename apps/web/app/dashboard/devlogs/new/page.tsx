'use client';

import { Suspense, useState, type FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, X, Upload, Calendar } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { useMyStudios, useCreateDevlog } from '@/lib/api/hooks';
import type { Game } from '@/lib/api/client';
import { ApiError } from '@/lib/api/client';

import { MarkdownEditor } from '@/components/md-editor';

export default function CreateDevlogPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#020609]"><div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" /></div>}>
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
  const [subtitle, setSubtitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [status, setStatus] = useState<string>('DRAFT');
  const [scheduledDate, setScheduledDate] = useState('');
  const [category, setCategory] = useState('');
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
        isPublished: status === 'PUBLISHED',
        status,
        publishedAt: status === 'PUBLISHED' ? new Date().toISOString() : undefined,
        scheduledFor: status === 'SCHEDULED' && scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
        subtitle: subtitle.trim() || undefined,
        tags: tags.length ? tags : undefined,
        category: category.trim() || undefined,
        screenshots: screenshots.length
          ? await Promise.all(screenshots.map(async (f, i) => {
              const formData = new FormData();
              formData.append('file', f);
              const res = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' });
              if (!res.ok) throw new Error('Upload failed');
              const data = await res.json();
              return { url: data.url, order: i };
            }))
          : undefined,
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
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      {/* Top accent line */}
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

      <div className="relative mx-auto max-w-3xl">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan">
          <ArrowLeft className="size-3" /> Back to dashboard
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <FileText className="size-6 text-cyan" />
          <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Write devlog</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="clip-corner border border-coral/40 bg-coral/5 px-4 py-3 font-mono text-[0.68rem] text-coral">
              {error}
            </div>
          )}

          {!gameSlug && (
            <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
              <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Game</h3>
              <div className="space-y-4">
                <div>
                  <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Studio</label>
                  <select value={selectedStudio} onChange={(e) => setSelectedStudio(e.target.value)}
                    className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)] cursor-pointer">
                    <option value="">Select a studio…</option>
                    {studios?.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                  </select>
                </div>
                {selectedStudio && (
                  <div>
                    <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Game *</label>
                    <select value={gameSlug} onChange={(e) => setGameSlug(e.target.value)}
                      className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)] cursor-pointer">
                      <option value="">Select a game…</option>
                      {games.map((g) => <option key={g.slug} value={g.slug}>{g.title}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Content</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Title *</label>
                <input type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)}
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              </div>
              <div>
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Slug *</label>
                <input type="text" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugAuto(false); }}
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              </div>
            </div>

            <div className="mt-4">
              <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Body *</label>
              <MarkdownEditor value={body} onChange={setBody} />
            </div>

            <div className="mt-4">
              <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Cover image URL</label>
              <input type="url" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)}
                className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
            </div>

            <div className="mt-4">
              <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Subtitle</label>
              <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
                placeholder="A short summary of this devlog"
                className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
            </div>

            <div className="mt-4">
              <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Category</label>
              <input type="text" value={category} onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Combat, Art, Design, Update"
                className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
            </div>

            <div className="mt-4">
              <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Tags</label>
              <div className="flex flex-wrap items-center gap-2 rounded border border-input bg-background/80 p-2 min-h-[42px]">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 border border-cyan/40 bg-cyan/5 px-2 py-0.5 font-mono text-[0.6rem] uppercase text-cyan">
                    {t}
                    <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="cursor-pointer hover:text-coral"><X className="size-3" /></button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                      e.preventDefault();
                      const newTag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
                      if (!tags.includes(newTag)) setTags([...tags, newTag]);
                      setTagInput('');
                    }
                    if (e.key === 'Backspace' && !tagInput && tags.length) {
                      setTags(tags.slice(0, -1));
                    }
                  }}
                  placeholder="Type tag and press Enter…"
                  className="flex-1 min-w-[120px] bg-transparent px-2 py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Screenshots</label>
              <div className="flex flex-wrap gap-3">
                {screenshots.map((f, i) => (
                  <div key={i} className="relative size-20 border border-border overflow-hidden group">
                    <img src={URL.createObjectURL(f)} alt="" className="size-full object-cover" />
                    <button type="button" onClick={() => setScreenshots(screenshots.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-background/80 text-coral cursor-pointer opacity-0 group-hover:opacity-100 transition">
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                <label className="grid size-20 cursor-pointer place-items-center border border-dashed border-border/60 text-muted-foreground hover:border-cyan hover:text-cyan transition">
                  <Upload className="size-5" />
                  <span className="mt-1 font-mono text-[0.5rem] uppercase">Add</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      setScreenshots([...screenshots, ...files].slice(0, 10));
                    }}
                    className="hidden" />
                </label>
              </div>
              <p className="mt-1.5 font-mono text-[0.5rem] text-muted-foreground">{screenshots.length}/10 screenshots</p>
            </div>
          </div>

          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Status</h3>
            <div className="flex items-center gap-4">
              {(['DRAFT', 'PUBLISHED', 'SCHEDULED'] as const).map((s) => (
                <label key={s} className={`flex items-center gap-2 cursor-pointer font-mono text-[0.6rem] uppercase tracking-widest px-3 py-2 border transition ${
                  status === s ? 'border-cyan bg-cyan/10 text-cyan' : 'border-border text-muted-foreground hover:border-cyan/50'
                }`}>
                  <input type="radio" name="status" value={s} checked={status === s}
                    onChange={() => setStatus(s)} className="hidden" />
                  {s === 'DRAFT' ? 'Draft' : s === 'PUBLISHED' ? 'Publish' : 'Schedule'}
                </label>
              ))}
            </div>
            {status === 'SCHEDULED' && (
              <div className="mt-4">
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Calendar className="size-3" /> Scheduled date
                </label>
                <input type="datetime-local" value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createDevlog.isPending}
              className="clip-corner cursor-pointer border border-cyan bg-cyan/10 px-6 py-2.5 font-mono text-[0.62rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background disabled:cursor-not-allowed disabled:opacity-40">
              {createDevlog.isPending ? 'Saving…' : status === 'PUBLISHED' ? 'Publish devlog' : status === 'SCHEDULED' ? 'Schedule devlog' : 'Save draft'}
            </button>
            <Link href="/dashboard"
              className="clip-corner inline-flex items-center border border-border/60 px-6 py-2.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
    </>
  );
}
