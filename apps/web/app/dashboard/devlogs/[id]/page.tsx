'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, ExternalLink, FileText, Trash2 } from 'lucide-react';

import { ImageUpload } from '@/components/image-upload';
import { MarkdownEditor } from '@/components/md-editor';

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
  const [coverUrl, setCoverUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);
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
      setCoverUrl(devlog.coverUrl ?? '');
      setIsPublished(devlog.isPublished ?? false);
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
          coverUrl: coverUrl.trim() || null,
          isPublished,
          publishedAt: isPublished && !devlog?.publishedAt ? new Date().toISOString() : isPublished ? devlog?.publishedAt : null,
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
      <main className="relative min-h-screen bg-[#020609]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
        <div className="relative mx-auto max-w-3xl flex min-h-screen items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
        </div>
      </main>
    );
  }

  if (!devlog) {
    return (
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
    );
  }

  return (
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
              <span className={`clip-corner px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-widest ${devlog.isPublished ? 'border border-cyan/40 bg-cyan/5 text-cyan' : 'border border-border/50 bg-background/30 text-muted-foreground'}`}>
                {devlog.isPublished ? 'Published' : 'Draft'}
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
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Cover Image</h3>
            <ImageUpload value={coverUrl} onChange={setCoverUrl} label="Cover image" />
          </div>

          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Publishing</h3>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="isPublished" checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded border-input" />
              <label htmlFor="isPublished" className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Published</label>
              {isPublished
                ? <span className="font-mono text-[0.55rem] text-muted-foreground">(publishedAt will be set to now)</span>
                : <span className="font-mono text-[0.55rem] text-muted-foreground">(publishedAt will be cleared)</span>}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex gap-3">
              <button type="submit" disabled={updateDevlog.isPending}
                className="clip-corner cursor-pointer border border-cyan bg-cyan/10 px-6 py-2.5 font-mono text-[0.62rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background disabled:cursor-not-allowed disabled:opacity-40">
                {updateDevlog.isPending ? 'Saving…' : 'Save changes'}
                <Save className="ml-1.5 inline size-4" />
              </button>
              <Link href="/dashboard"
                className="clip-corner inline-flex items-center border border-border/60 px-6 py-2.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan">
                Cancel
              </Link>
            </div>
            <button type="button"
              onClick={async () => {
                if (!token || !confirm(`Delete devlog "${devlog?.title}" permanently? This cannot be undone.`)) return;
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
  );
}
