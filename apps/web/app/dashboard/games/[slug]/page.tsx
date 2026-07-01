'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, ExternalLink, Gamepad2, Milestone, FileText, ScrollText, Trash2 } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { ImageUpload } from '@/components/image-upload';

import { useAuth } from '@/lib/api/auth-context';
import { useGame, useUpdateGame, useDeleteGame } from '@/lib/api/hooks';
import { ApiError } from '@/lib/api/client';

const STATUSES = ['CONCEPT', 'IN_DEVELOPMENT', 'ALPHA', 'BETA', 'EARLY_ACCESS', 'RELEASED', 'CANCELLED', 'ON_HOLD'];

export default function EditGamePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: game, isLoading: gameLoading } = useGame(slug);
  const updateGame = useUpdateGame();
  const deleteGame = useDeleteGame();

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
      <>
        <SiteHeader />
        <div className="flex min-h-screen items-center justify-center bg-[#020609]">
          <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
        </div>
      </>
    );
  }

  if (!game) {
    return (
      <>
        <SiteHeader />
        <div className="relative mx-auto max-w-2xl px-6 py-20 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
          <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Game not found</h1>
          <Link href="/dashboard" className="mt-4 inline-flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground hover:text-cyan">
            <ArrowLeft className="size-3" /> Back to dashboard
          </Link>
        </div>
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
              <Gamepad2 className="size-6 text-cyan" />
              <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Edit game</h1>
            </div>
            <p className="mt-1 text-muted-foreground">{game.title}</p>
          </div>
          <Link href={`/games/${slug}`} className="clip-corner inline-flex items-center border border-border/60 px-4 py-2 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan">
            <ExternalLink className="size-3 mr-1" /> View public page
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
              Game updated successfully.
            </div>
          )}

          {/* Basic Information */}
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Basic Information</h3>
            <div>
              <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
            </div>
            <div className="mt-4">
              <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Slug (immutable)</label>
              <input type="text" value={slug} disabled
                className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground/50 outline-none transition" />
            </div>
            <div className="mt-4">
              <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Tagline</label>
              <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)}
                className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
            </div>
            <div className="mt-4">
              <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Description</label>
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                className="clip-corner w-full resize-none border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
            </div>
          </div>

          {/* Release Details */}
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Release Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)] cursor-pointer">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Expected release text</label>
                <input type="text" value={expectedReleaseText} onChange={(e) => setExpectedReleaseText(e.target.value)}
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Release date</label>
                <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)}
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              </div>
              <div>
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Currency</label>
                <input type="text" value={currency} onChange={(e) => setCurrency(e.target.value)}
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Pricing</h3>
            <div className="flex items-center gap-3 mb-3">
              <input type="checkbox" id="isFree" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} className="rounded border-input" />
              <label htmlFor="isFree" className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Free</label>
            </div>
            {!isFree && (
              <div>
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Price (cents)</label>
                <input type="number" value={priceCents} onChange={(e) => setPriceCents(e.target.value)}
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              </div>
            )}
          </div>

          {/* Media */}
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Media</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <ImageUpload value={coverUrl} onChange={setCoverUrl} label="Cover image" />
              <ImageUpload value={bannerUrl} onChange={setBannerUrl} label="Banner" />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex gap-3">
              <button type="submit" disabled={updateGame.isPending}
                className="clip-corner cursor-pointer border border-cyan bg-cyan/10 px-6 py-2.5 font-mono text-[0.62rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background disabled:cursor-not-allowed disabled:opacity-40">
                {updateGame.isPending ? 'Saving\u2026' : 'Save changes'}
                <Save className="size-3 ml-1 inline" />
              </button>
              <Link href="/dashboard"
                className="clip-corner inline-flex items-center border border-border/60 px-6 py-2.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan">
                Cancel
              </Link>
            </div>
            <button
              type="button"
              className="clip-corner cursor-pointer border border-coral/60 bg-coral/5 px-4 py-2 font-mono text-[0.6rem] uppercase tracking-widest text-coral transition hover:bg-coral/20 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={async () => {
                if (!token || !confirm(`Delete game "${game?.title}" permanently? This cannot be undone.`)) return;
                try {
                  await deleteGame.mutateAsync({ slug, token });
                  router.push('/dashboard');
                } catch { /* ignore */ }
              }}
              disabled={deleteGame.isPending}
            >
              <Trash2 className="size-3 mr-1 inline" />
              {deleteGame.isPending ? 'Deleting\u2026' : 'Delete game'}
            </button>
          </div>
        </form>

        {/* Quick links */}
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href={'/dashboard/devlogs/new?game=' + slug}
            className="clip-corner inline-flex items-center border border-border/60 px-4 py-2 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan">
            <FileText className="size-3 mr-1" /> New devlog
          </Link>
          <Link href={'/dashboard/roadmap?game=' + slug}
            className="clip-corner inline-flex items-center border border-border/60 px-4 py-2 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan">
            <Milestone className="size-3 mr-1" /> Manage roadmap
          </Link>
          <Link href={'/dashboard/games/' + slug + '/press-kit'}
            className="clip-corner inline-flex items-center border border-border/60 px-4 py-2 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan">
            <ScrollText className="size-3 mr-1" /> Manage press kit
          </Link>
        </div>
      </div>
    </main>
    </>
  );
}
