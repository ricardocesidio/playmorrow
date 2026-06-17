'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, ExternalLink, Gamepad2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/api/auth-context';
import { useGame, useUpdateGame } from '@/lib/api/hooks';
import { ApiError } from '@/lib/api/client';

const STATUSES = ['CONCEPT', 'IN_DEVELOPMENT', 'ALPHA', 'BETA', 'EARLY_ACCESS', 'RELEASED', 'CANCELLED', 'ON_HOLD'];

export default function EditGamePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: game, isLoading: gameLoading } = useGame(slug);
  const updateGame = useUpdateGame();

  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [expectedReleaseText, setExpectedReleaseText] = useState('');
  const [priceCents, setPriceCents] = useState('');
  const [currency, setCurrency] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (game && !initialized) {
      setTitle(game.title ?? '');
      setTagline(game.tagline ?? '');
      setDescription(game.description ?? '');
      setStatus(game.status ?? '');
      setReleaseDate(game.releaseDate ? game.releaseDate.slice(0, 10) : '');
      setExpectedReleaseText(game.expectedReleaseText ?? '');
      setPriceCents(game.priceCents != null ? String(game.priceCents) : '');
      setCurrency(game.currency ?? 'USD');
      setIsFree(game.isFree ?? false);
      setCoverUrl(game.coverUrl ?? '');
      setBannerUrl(game.bannerUrl ?? '');
      setInitialized(true);
    }
  }, [game, initialized]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!title.trim()) { setError('Title is required'); return; }
    if (!token) { setError('You must be signed in'); return; }

    try {
      await updateGame.mutateAsync({
        slug,
        token,
        body: {
          title: title.trim(),
          tagline: tagline.trim() || null,
          description: description.trim() || null,
          status,
          releaseDate: releaseDate ? `${releaseDate}T00:00:00.000Z` : null,
          expectedReleaseText: expectedReleaseText.trim() || null,
          priceCents: priceCents ? Math.round(parseFloat(priceCents)) : null,
          currency,
          isFree,
          coverUrl: coverUrl.trim() || null,
          bannerUrl: bannerUrl.trim() || null,
        },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) setError("You don't have permission to edit this game.");
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

  if (authLoading || gameLoading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 rounded bg-muted" />
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-10 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold">Game not found</h1>
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
            <Gamepad2 className="size-6 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight">Edit game</h1>
          </div>
          <p className="mt-1 text-muted-foreground">{game.title}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/games/${slug}`}><ExternalLink className="size-3" /> View public page</Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
        {success && <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">Game updated successfully.</div>}

        <div>
          <label className="mb-1.5 block text-sm font-medium">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Slug (immutable)</label>
          <input type="text" value={slug} disabled
            className="w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Tagline</label>
          <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Description</label>
          <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Expected release text</label>
            <input type="text" value={expectedReleaseText} onChange={(e) => setExpectedReleaseText(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Release date</label>
            <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Currency</label>
            <input type="text" value={currency} onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/20 p-4">
          <h3 className="mb-3 text-sm font-semibold">Pricing</h3>
          <div className="flex items-center gap-3 mb-3">
            <input type="checkbox" id="isFree" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} className="rounded border-input" />
            <label htmlFor="isFree" className="text-sm">Free</label>
          </div>
          {!isFree && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Price (cents)</label>
              <input type="number" value={priceCents} onChange={(e) => setPriceCents(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Cover image URL</label>
            <input type="url" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Banner URL</label>
            <input type="url" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={updateGame.isPending}>
            {updateGame.isPending ? 'Saving…' : 'Save changes'}
            <Save className="size-4" />
          </Button>
          <Button asChild variant="outline"><Link href="/dashboard">Cancel</Link></Button>
        </div>
      </form>
    </div>
  );
}
