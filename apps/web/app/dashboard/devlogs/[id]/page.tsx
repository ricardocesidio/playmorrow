'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import { SiteHeader } from '@/components/site-header';
import { MarkdownEditor } from '@/components/md-editor';

import { ArrowLeft, FileText, ExternalLink, X, Calendar, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/api/auth-context';
import { useDevlog, useUpdateDevlog, useDeleteDevlog } from '@/lib/api/hooks';
import { ApiError } from '@/lib/api/client';

export default function EditDevlogPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: devlog, isLoading: devlogLoading } = useDevlog(id);
  const updateDevlog = useUpdateDevlog();
  const deleteDevlog = useDeleteDevlog();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [scheduledDate, setScheduledDate] = useState('');
  const [category, setCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [screenshots, setScreenshots] = useState<{ id: string; url: string; order: number; caption?: string | null }[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (devlog && !initialized) {
      setTitle(devlog.title ?? '');
      setBody(devlog.body ?? '');
      setSubtitle(devlog.subtitle ?? '');
      setStatus(devlog.status ?? (devlog.isPublished ? 'PUBLISHED' : 'DRAFT'));
      setCategory(devlog.category ?? '');
      setTags(devlog.tags ?? []);
      setScreenshots(devlog.screenshots ?? []);
      setInitialized(true);
    }
  }, [devlog, initialized]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!title.trim()) { setError('Title is required'); return; }
    if (!token) { setError('You must be signed in'); return; }

    try {
      await updateDevlog.mutateAsync({
        id,
        token,
        body: {
          title: title.trim(),
          body: body.trim(),
          subtitle: subtitle.trim() || null,
          status,
          isPublished: status === 'PUBLISHED',
          publishedAt: status === 'PUBLISHED' && !devlog?.publishedAt ? new Date().toISOString()
            : status !== 'PUBLISHED' ? null
            : devlog?.publishedAt,
          scheduledFor: status === 'SCHEDULED' && scheduledDate ? new Date(scheduledDate).toISOString() : null,
          category: category.trim() || null,
          tags: tags.length ? tags : null,
        },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) setError("You don't have permission to edit this devlog.");
        else {
          const msg = typeof err.body === 'object' && err.body
            ? Array.isArray((err.body as { message?: string[] }).message)
              ? (err.body as { message: string[] }).message.join(', ')
              : (err.body as { message: string }).message || 'Failed to update'
            : 'Failed to update';
          setError(msg);
        }
      } else { setError('Something went wrong'); }
    }
  };

  if (authLoading || devlogLoading) {
    return (
      <>
        <SiteHeader />
        <main className="relative min-h-screen bg-[#020609]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
          <div className="relative mx-auto max-w-3xl flex min-h-screen items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
          </div>
        </main>
      </>
    );
  }

  if (!devlog) {
    return (
      <>
        <SiteHeader />
        <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
          <div className="relative mx-auto max-w-3xl py-20 text-center">
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Devlog not found</h1>
            <Link href="/dashboard" className="mt-4 inline-flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-widest text-cyan underline underline-offset-4 transition hover:text-cyan/80">
              <ArrowLeft className="size-3" /> Back to dashboard
            </Link>
          </div>
        </main>
      </>
    );
  }

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

        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <FileText className="size-6 text-cyan" />
              <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Edit devlog</h1>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground">{devlog.title}</span>
              <span className={`clip-corner px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-widest ${devlog.status === 'PUBLISHED' ? 'border border-cyan/40 bg-cyan/5 text-cyan' : devlog.status === 'SCHEDULED' ? 'border border-amber/40 bg-amber/5 text-amber' : 'border border-border/50 bg-background/30 text-muted-foreground'}`}>
                {devlog.status === 'PUBLISHED' ? 'Published' : devlog.status === 'SCHEDULED' ? 'Scheduled' : 'Draft'}
              </span>
            </div>
          </div>
          <Link href={`/devlogs/${id}`} className="clip-corner inline-flex items-center gap-1.5 border border-cyan/40 bg-cyan/5 px-4 py-1.5 font-mono text-[0.55rem] uppercase tracking-widest text-cyan transition hover:bg-cyan/20">
            <ExternalLink className="size-3" /> View
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="clip-corner border border-coral/40 bg-coral/5 px-4 py-3 font-mono text-[0.68rem] text-coral">
              {error}
            </div>
          )}
          {success && (
            <div className="clip-corner border border-cyan/40 bg-cyan/5 px-4 py-3 font-mono text-[0.68rem] text-cyan">
              Devlog updated successfully.
            </div>
          )}

          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Content</h3>
            <div className="mb-4">
              <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
            </div>
            <div className="mb-4">
              <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Body</label>
              <MarkdownEditor value={body} onChange={setBody} />
            </div>
          </div>

          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Details</h3>
            <div className="mb-4">
              <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Subtitle</label>
              <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
                placeholder="A short summary"
                className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
            </div>
            <div className="mb-4">
              <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Category</label>
              <input type="text" value={category} onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Combat, Art, Design, Update"
                className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
            </div>
            <div>
              <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Tags</label>
              <div className="flex flex-wrap items-center gap-2 rounded border border-input bg-background/80 p-2 min-h-[42px]">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 border border-cyan/40 bg-cyan/5 px-2 py-0.5 font-mono text-[0.6rem] uppercase text-cyan">
                    {t}
                    <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="cursor-pointer hover:text-coral"><X className="size-3" /></button>
                  </span>
                ))}
                <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                      e.preventDefault();
                      const newTag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
                      if (!tags.includes(newTag)) setTags([...tags, newTag]);
                      setTagInput('');
                    }
                    if (e.key === 'Backspace' && !tagInput && tags.length) { setTags(tags.slice(0, -1)); }
                  }}
                  placeholder="Type tag and press Enter…"
                  className="flex-1 min-w-[120px] bg-transparent px-2 py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground/50" />
              </div>
            </div>
          </div>

          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Status</h3>
            <div className="flex items-center gap-4">
              {(['DRAFT', 'PUBLISHED', 'SCHEDULED'] as const).map((s) => (
                <label key={s} className={`flex items-center gap-2 cursor-pointer font-mono text-[0.6rem] uppercase tracking-widest px-3 py-2 border transition ${
                  status === s ? 'border-cyan bg-cyan/10 text-cyan' : 'border-border text-muted-foreground hover:border-cyan/50'
                }`}>
                  <input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} className="hidden" />
                  {s === 'DRAFT' ? 'Draft' : s === 'PUBLISHED' ? 'Publish' : 'Schedule'}
                </label>
              ))}
            </div>
            {status === 'SCHEDULED' && (
              <div className="mt-4">
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Calendar className="size-3" /> Scheduled date
                </label>
                <input type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              </div>
            )}
          </div>

          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Screenshots</h3>
            <div className="flex flex-wrap gap-2">
              {screenshots.map((s, i) => (
                <div key={s.url} className="relative size-16 border border-border overflow-hidden group">
                  <img src={s.url} alt={s.caption ?? ''} className="size-full object-cover" />
                  <button type="button" onClick={() => setScreenshots(screenshots.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-background/80 text-coral cursor-pointer opacity-0 group-hover:opacity-100 transition">
                    <X className="size-2.5" />
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-1.5 font-mono text-[0.5rem] text-muted-foreground">
              To add screenshots, create a new devlog or upload images in the create form.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex gap-3">
              <button type="submit" disabled={updateDevlog.isPending}
                className="clip-corner cursor-pointer border border-cyan bg-cyan/10 px-6 py-2.5 font-mono text-[0.62rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background disabled:cursor-not-allowed disabled:opacity-40">
                {updateDevlog.isPending ? 'Saving…' : status === 'PUBLISHED' ? 'Save & Publish' : status === 'SCHEDULED' ? 'Save & Schedule' : 'Save changes'}
              </button>
              <Link href="/dashboard"
                className="clip-corner inline-flex items-center border border-border/60 px-6 py-2.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan">
                Cancel
              </Link>
            </div>
            <button type="button"
              onClick={async () => {
                if (!token) return;
                try {
                  await deleteDevlog.mutateAsync({ id, token });
                  router.push('/dashboard');
                } catch { /* ignore */ }
              }}
              disabled={deleteDevlog.isPending}
              className="clip-corner cursor-pointer border border-coral/60 bg-coral/5 px-4 py-2 font-mono text-[0.55rem] uppercase tracking-widest text-coral transition hover:bg-coral/20 disabled:cursor-not-allowed disabled:opacity-40">
              <Trash2 className="mr-1.5 inline size-4" />
              {deleteDevlog.isPending ? 'Deleting…' : 'Delete devlog'}
            </button>
          </div>
        </form>
      </div>
    </main>
    </>
  );
}
