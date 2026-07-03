'use client';

import { useState, type FormEvent, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Save, ExternalLink, Gamepad2, Milestone, FileText, ScrollText, Trash2, Upload, Loader2, X } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { useGame, useUpdateGame, useDeleteGame } from '@/lib/api/hooks';
import { ApiError } from '@/lib/api/client';

const STATUSES = ['CONCEPT', 'IN_DEVELOPMENT', 'ALPHA', 'BETA', 'EARLY_ACCESS', 'RELEASED', 'CANCELLED', 'ON_HOLD'];
const MAX_SCREENSHOTS = 10;

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
  const [trailerUrl, setTrailerUrl] = useState('');
  const [media, setMedia] = useState<{ id?: string; type: string; url: string; caption: string }[]>([]);
  const [uploadingShot, setUploadingShot] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      setTrailerUrl(game.trailerUrl ?? '');
      setMedia((game.media ?? []).map((m: { id?: string; type: string; url: string; caption?: string | null }) => ({ id: m.id, type: m.type, url: m.url, caption: m.caption ?? '' })));
      setInitialized(true);
    }
  }, [game, initialized]);

  const handleShotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingShot(true);
    setError('');
    for (const file of Array.from(files)) {
      if (media.length >= MAX_SCREENSHOTS) { setError(`Max ${MAX_SCREENSHOTS} screenshots.`); break; }
      if (!['image/png', 'image/jpeg'].includes(file.type)) { setError('Only PNG and JPG allowed.'); continue; }
      if (file.size > 10 * 1024 * 1024) { setError('Image too large (max 10MB).'); continue; }
      const form = new FormData();
      form.append('file', file);
      try {
        const res = await fetch('http://localhost:4000/api/upload', { method: 'POST', body: form, credentials: 'include' });
        if (!res.ok) {
          const errBody = await res.text();
          setError(`Upload failed: ${res.status} ${errBody}`);
          break;
        }
        const data = await res.json();
        const fullUrl = `http://localhost:4000${data.url}`;
        setMedia((prev) => [...prev, { type: 'SCREENSHOT', url: fullUrl, caption: '' }]);
      } catch {
        setError('Upload failed. Please try again.');
        break;
      }
    }
    setUploadingShot(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addMedia = () => {
    if (media.length >= MAX_SCREENSHOTS) { setError(`Max ${MAX_SCREENSHOTS} screenshots.`); return; }
    fileInputRef.current?.click();
  };
  const removeMedia = (i: number) => setMedia(media.filter((_, idx) => idx !== i));
  const updateMedia = (i: number, field: string, val: string) => {
    setMedia(media.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!title.trim()) { setError('Title is required'); return; }

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
          trailerUrl: trailerUrl.trim() || null,
          media: media.filter((m) => m.url).map((m) => ({ type: m.type, url: m.url, caption: m.caption || null })),
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
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)] cursor-pointer">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="BRL">BRL (R$)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="CHF">CHF (Fr)</option>
                  <option value="CNY">CNY (¥)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="KRW">KRW (₩)</option>
                  <option value="MXN">MXN (Mex$)</option>
                </select>
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

          {/* Trailer */}
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Trailer</h3>
            <div>
              <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">YouTube trailer URL</label>
              <input type="url" value={trailerUrl} onChange={(e) => setTrailerUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              <p className="mt-1 font-mono text-[0.55rem] text-muted-foreground">Link a YouTube video to appear as the game trailer.</p>
            </div>
          </div>

          {/* Cover & Banner */}
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Cover & Banner</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FileUploadField label="Cover image" value={coverUrl} onChange={setCoverUrl} />
              <FileUploadField label="Banner" value={bannerUrl} onChange={setBannerUrl} />
            </div>
          </div>

          {/* Screenshots */}
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan">Screenshots ({media.length}/{MAX_SCREENSHOTS})</h3>
              <button type="button" onClick={addMedia} disabled={uploadingShot || media.length >= MAX_SCREENSHOTS}
                className="clip-corner cursor-pointer border border-cyan/60 px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-widest text-cyan transition hover:bg-cyan/10 disabled:opacity-40 disabled:cursor-not-allowed">
                {uploadingShot ? <Loader2 className="size-3 mr-1 inline animate-spin" /> : <Upload className="size-3 mr-1 inline" />}
                Add screenshot
              </button>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" multiple onChange={handleShotUpload} className="hidden" />
            </div>
            <div className="space-y-3">
              {media.map((m, i) => (
                <div key={i} className="flex items-start gap-3 border border-border/60 bg-background/40 p-3">
                  <div className="size-16 shrink-0 overflow-hidden border border-border bg-muted">
                    <img src={m.url} alt="" className="size-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <input type="text" value={m.caption} onChange={(e) => updateMedia(i, 'caption', e.target.value)}
                      placeholder="Caption (optional)"
                      className="clip-corner h-9 w-full border border-input bg-background/80 px-3 text-xs text-foreground outline-none focus:border-cyan" />
                  </div>
                  <button type="button" onClick={() => removeMedia(i)} className="mt-1 cursor-pointer text-coral hover:text-coral/80">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              {media.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">No screenshots yet. Click "Add screenshot" to upload PNG/JPG images (max 10).</p>
              )}
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

function FileUploadField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('http://localhost:4000/api/upload', { method: 'POST', body: form, credentials: 'include' });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      onChange(`http://localhost:4000${data.url}`);
    } catch { /* ignore */ }
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground block">{label}</label>
      {value ? (
        <div className="relative overflow-hidden border border-border bg-muted">
          <img src={value} alt="" className="h-20 w-full object-cover" />
          <button type="button" onClick={() => onChange('')} className="absolute right-1 top-1 cursor-pointer bg-background/80 p-1 text-coral hover:text-coral/80">
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="clip-corner inline-flex items-center gap-2 border border-cyan/60 bg-cyan/5 px-4 py-2.5 font-mono text-[0.6rem] uppercase tracking-widest text-cyan transition hover:bg-cyan/10 cursor-pointer disabled:opacity-50">
          {uploading ? <Loader2 className="size-3.5 mr-1 inline animate-spin" /> : <Upload className="size-3.5 mr-1 inline" />}
          {uploading ? 'Uploading...' : `Upload ${label.toLowerCase()}`}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/png,image/jpeg" onChange={handleUpload} className="hidden" />
    </div>
  );
}
