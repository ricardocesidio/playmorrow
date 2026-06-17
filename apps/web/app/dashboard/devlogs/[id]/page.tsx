'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, ExternalLink, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/api/auth-context';
import { useDevlog, useUpdateDevlog } from '@/lib/api/hooks';
import { ApiError } from '@/lib/api/client';

export default function EditDevlogPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: devlog, isLoading: devlogLoading } = useDevlog(id);
  const updateDevlog = useUpdateDevlog();

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
          publishedAt: isPublished ? new Date().toISOString() : null,
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
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 rounded bg-muted" />
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-48 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!devlog) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold">Devlog not found</h1>
        <Link href="/dashboard" className="mt-4 inline-flex items-center gap-2 text-sm text-primary underline">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <FileText className="size-6 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight">Edit devlog</h1>
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{devlog.title}</span>
            <span className={`rounded px-1.5 py-0.5 text-xs ${devlog.isPublished ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {devlog.isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/devlogs/${id}`}><ExternalLink className="size-3" /> View</Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
        {success && <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">Devlog updated successfully.</div>}

        <div>
          <label className="mb-1.5 block text-sm font-medium">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Body</label>
          <textarea rows={16} value={body} onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono leading-relaxed focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
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
          <label htmlFor="isPublished" className="text-sm font-medium">Published</label>
          {isPublished
            ? <span className="text-xs text-muted-foreground">(publishedAt will be set to now)</span>
            : <span className="text-xs text-muted-foreground">(publishedAt will be cleared)</span>}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={updateDevlog.isPending}>
            {updateDevlog.isPending ? 'Saving…' : 'Save changes'}
            <Save className="size-4" />
          </Button>
          <Button asChild variant="outline"><Link href="/dashboard">Cancel</Link></Button>
        </div>
      </form>
    </div>
  );
}
