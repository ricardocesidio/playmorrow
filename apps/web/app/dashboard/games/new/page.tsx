'use client';

import { Suspense, useState, type FormEvent, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Gamepad2, Upload, Loader2 } from 'lucide-react';
import DOMPurify from 'dompurify';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { useMyStudios, useCreateGame } from '@/lib/api/hooks';
import { ApiError } from '@/lib/api/client';

const STATUSES = ['CONCEPT', 'IN_DEVELOPMENT', 'ALPHA', 'BETA', 'EARLY_ACCESS', 'RELEASED', 'CANCELLED', 'ON_HOLD'];
const MAX_SCREENSHOTS = 15;
const MAX_PLATFORM_LINKS = 6;
const AVAILABLE_TAGS = [
  { slug: 'stealth', name: 'Stealth' },
  { slug: 'cyberpunk', name: 'Cyberpunk' },
  { slug: 'tactical', name: 'Tactical' },
  { slug: 'strategy', name: 'Strategy' },
  { slug: 'sci-fi', name: 'Sci-Fi' },
  { slug: 'singleplayer', name: 'Singleplayer' },
  { slug: 'story-rich', name: 'Story Rich' },
  { slug: 'atmospheric', name: 'Atmospheric' },
  { slug: 'rpg', name: 'RPG' },
  { slug: 'space', name: 'Space' },
  { slug: 'adventure', name: 'Adventure' },
  { slug: 'exploration', name: 'Exploration' },
  { slug: 'fantasy', name: 'Fantasy' },
  { slug: 'card-game', name: 'Card Game' },
  { slug: 'roguelike', name: 'Roguelike' },
  { slug: 'action', name: 'Action' },
  { slug: 'runner', name: 'Runner' },
  { slug: 'fast-paced', name: 'Fast-Paced' },
  { slug: 'deckbuilding', name: 'Deckbuilding' },
];
const PLATFORM_KINDS = ['STEAM', 'ITCH', 'EPIC', 'GOG', 'PLAYSTATION', 'XBOX', 'NINTENDO', 'WEB', 'ANDROID', 'IOS', 'DEMO', 'DISCORD', 'WEBSITE', 'OTHER'];

interface MediaRow { type: string; url: string; caption: string }
interface PlatformRow { platform: string; url: string; label: string }

export default function CreateGamePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#020609]"><div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" /></div>}>
      <CreateGameForm />
    </Suspense>
  );
}

function CreateGameForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: studios } = useMyStudios(token ?? undefined);
  const createGame = useCreateGame();

  const [studioSlug, setStudioSlug] = useState(searchParams.get('studio') ?? '');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugAuto, setSlugAuto] = useState(true);
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [readme, setReadme] = useState('');
  const [demoStatus, setDemoStatus] = useState('NO_DEMO');
  const [demoUrl, setDemoUrl] = useState('');
  const [edition, setEdition] = useState('');
  const [engine, setEngine] = useState('');
  const [languages, setLanguages] = useState('');
  const [genres, setGenres] = useState('');
  const [modes, setModes] = useState('');
  const [status, setStatus] = useState('IN_DEVELOPMENT');
  const [releaseDate, setReleaseDate] = useState('');
  const [expectedReleaseText, setExpectedReleaseText] = useState('');
  const [priceCents, setPriceCents] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [isFree, setIsFree] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [tagsInput, setTagsInput] = useState<string[]>([]);
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [uploadingShot, setUploadingShot] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [platformLinks, setPlatformLinks] = useState<PlatformRow[]>([]);
  const [error, setError] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1">$1</code>')
      .replace(/^- (.*)/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/\n/g, '<br/>');
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (slugAuto) setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  };

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
        const res = await fetch('/api/upload', { method: 'POST', body: form, credentials: 'include' });
        if (!res.ok) {
          const errBody = await res.text();
          setError(`Upload failed: ${res.status} ${errBody}`);
          break;
        }
        const data = await res.json();
        setMedia((prev) => [...prev, { type: 'SCREENSHOT', url: data.url, caption: '', position: prev.length + 1 }]);
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
  const updateMedia = (i: number, field: keyof MediaRow, val: string) => {
    setMedia(media.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  };

  const addPlatform = () => {
    if (platformLinks.length >= MAX_PLATFORM_LINKS) { setError(`Max ${MAX_PLATFORM_LINKS} platform links.`); return; }
    setPlatformLinks([...platformLinks, { platform: 'STEAM', url: '', label: '' }]);
  };
  const removePlatform = (i: number) => setPlatformLinks(platformLinks.filter((_, idx) => idx !== i));
  const updatePlatform = (i: number, field: keyof PlatformRow, val: string) => {
    setPlatformLinks(platformLinks.map((p, idx) => idx === i ? { ...p, [field]: val } : p));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!studioSlug || !title.trim() || !slug.trim()) {
      setError('Studio, title, and slug are required');
      return;
    }
    if (!token) { setError('You must be signed in'); return; }

    try {
      const result = await createGame.mutateAsync({
        studioSlug,
        token,
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        tagline: tagline.trim() || undefined,
        description: description.trim() || undefined,
        readme: readme.trim() || undefined,
        demoStatus: demoStatus !== 'NO_DEMO' ? demoStatus : undefined,
        demoUrl: demoUrl.trim() || undefined,
        edition: edition.trim() || undefined,
        engine: engine.trim() || undefined,
        languages: languages.trim() || undefined,
        genres: genres.trim() || undefined,
        modes: modes.trim() || undefined,
        status,
        releaseDate: releaseDate || undefined,
        expectedReleaseText: expectedReleaseText.trim() || undefined,
        priceCents: priceCents ? Math.round(parseFloat(priceCents)) : undefined,
        currency,
        isFree,
        coverUrl: coverUrl.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
        trailerUrl: trailerUrl.trim() || undefined,
        tags: tagsInput,
        media: media.filter((m) => m.url).map((m) => ({ type: m.type, url: m.url, caption: m.caption || undefined, sortOrder: 0 })),
        platformLinks: platformLinks.filter((p) => p.url).map((p) => ({ platform: p.platform, url: p.url, label: p.label || undefined })),
      });
      router.push(`/games/${result.slug}`);
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = typeof err.body === 'object' && err.body
          ? Array.isArray((err.body as { message?: string[] }).message)
            ? (err.body as { message: string[] }).message.join(', ')
            : (err.body as { message: string }).message || 'Failed to create game'
          : 'Failed to create game';
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
          <Gamepad2 className="size-6 text-cyan" />
          <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Create game</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="clip-corner border border-coral/40 bg-coral/5 px-4 py-3 font-mono text-[0.68rem] text-coral">
              {error}
            </div>
          )}

          {/* Studio selector */}
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Studio</h3>
            <div>
              <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Studio *</label>
              <select value={studioSlug} onChange={(e) => setStudioSlug(e.target.value)}
                className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)] cursor-pointer">
                <option value="">Select a studio…</option>
                {studios?.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Basic Info */}
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Basic Information</h3>
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
              <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Tagline</label>
              <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)}
                className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Description</label>
                <button type="button" onClick={() => setPreviewMode(!previewMode)}
                  className={`clip-corner cursor-pointer border px-3 py-1 font-mono text-[0.55rem] uppercase tracking-widest transition ${
                    previewMode
                      ? 'border-cyan text-cyan bg-cyan/10'
                      : 'border-border/60 text-muted-foreground hover:border-cyan hover:text-cyan'
                  }`}>
                  {previewMode ? 'Edit' : 'Preview'}
                </button>
              </div>
              {previewMode ? (
                <div className="clip-corner min-h-[6rem] w-full border border-input bg-background/80 px-4 py-3 text-sm text-foreground [&_strong]:text-white [&_code]:bg-muted [&_code]:px-1"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderMarkdown(description)) }} />
              ) : (
                <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                  className="clip-corner w-full resize-none border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              )}
            </div>

            <div className="mt-4">
              <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Full README</label>
              <textarea id="readme" rows={10} value={readme} onChange={(e) => setReadme(e.target.value)} placeholder="Write the full game README here..."
                className="clip-corner w-full resize-none border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
            </div>
          </div>

          {/* Demo & Release */}
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Demo &amp; Release</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Demo status</label>
                <select id="demoStatus" value={demoStatus} onChange={(e) => setDemoStatus(e.target.value)}
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)] cursor-pointer">
                  <option value="NO_DEMO">No demo</option>
                  <option value="DEMO_LOCKED">Demo locked</option>
                  <option value="DEMO_PLAYABLE">Demo playable</option>
                  <option value="PLAYTEST_AVAILABLE">Playtest available</option>
                </select>
              </div>
              <div>
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Demo URL (if playable)</label>
                <input type="url" id="demoUrl" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://..."
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Edition</label>
                <input type="text" id="edition" value={edition} onChange={(e) => setEdition(e.target.value)} placeholder="Standard Edition"
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              </div>
              <div>
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Engine</label>
                <input type="text" id="engine" value={engine} onChange={(e) => setEngine(e.target.value)} placeholder="e.g. Unreal Engine 5"
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Languages (comma-separated)</label>
                <input type="text" id="languages" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="EN, FR, DE, JP, ZH"
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              </div>
              <div>
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Genres (comma-separated)</label>
                <input type="text" id="genres" value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="Tactical, Stealth, Cyberpunk"
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              </div>
            </div>

            <div className="mt-4">
              <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Modes (comma-separated)</label>
              <input type="text" id="modes" value={modes} onChange={(e) => setModes(e.target.value)} placeholder="Single Player, Multiplayer"
                className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)] cursor-pointer">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-2 block">Tags ({tagsInput.length} selected)</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map(({ slug, name }) => {
                    const isSelected = tagsInput.includes(slug);
                    return (
                      <button key={slug} type="button" onClick={() => {
                        setTagsInput(isSelected ? tagsInput.filter((t) => t !== slug) : [...tagsInput, slug]);
                      }}
                      className={`clip-corner-sm border px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-wider transition cursor-pointer ${
                        isSelected ? 'border-cyan bg-cyan/10 text-cyan' : 'border-border text-muted-foreground hover:border-cyan/50'
                      }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Release date</label>
                <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)}
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              </div>
              <div>
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Expected release text</label>
                <input type="text" value={expectedReleaseText} onChange={(e) => setExpectedReleaseText(e.target.value)}
                  placeholder="Q4 2026"
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Pricing</h3>
            <div className="flex items-center gap-3 mb-3">
              <input type="checkbox" id="isFree" checked={isFree} onChange={(e) => setIsFree(e.target.checked)}
                className="rounded border-input" />
              <label htmlFor="isFree" className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Free</label>
            </div>
            {!isFree && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Price (cents)</label>
                  <input type="number" value={priceCents} onChange={(e) => setPriceCents(e.target.value)}
                    placeholder="1999"
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

          {/* Media URLs */}
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Cover & Banner</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Cover image URL</label>
                <input type="url" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)}
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              {coverUrl && (
                <div className="mt-2">
                  <img src={coverUrl} alt="Cover preview" className="clip-corner h-20 w-full max-w-[160px] object-cover border border-border/50"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
              </div>
              <div>
                <label className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Banner URL</label>
                <input type="url" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)}
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              {bannerUrl && (
                <div className="mt-2">
                  <img src={bannerUrl} alt="Banner preview" className="clip-corner h-20 w-full max-w-[160px] object-cover border border-border/50"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
              </div>
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

          {/* Platform links rows */}
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan">Platform Links ({platformLinks.length}/{MAX_PLATFORM_LINKS})</h3>
              <button type="button" onClick={addPlatform}
                className="clip-corner cursor-pointer border border-cyan bg-cyan/10 px-4 py-2 font-mono text-[0.62rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background">
                <Plus className="mr-1 inline size-3" /> Add
              </button>
            </div>
            {platformLinks.map((p, i) => (
              <div key={i} className="clip-corner border border-border/50 bg-background/30 p-3 mb-2 flex flex-wrap items-end gap-2">
                <select value={p.platform} onChange={(e) => updatePlatform(i, 'platform', e.target.value)}
                  className="clip-corner h-9 border border-input bg-background/80 px-3 text-xs text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)] cursor-pointer">
                  {PLATFORM_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
                <input type="url" value={p.url} onChange={(e) => updatePlatform(i, 'url', e.target.value)}
                  placeholder="URL" className="min-w-[200px] flex-1 clip-corner h-9 border border-input bg-background/80 px-3 text-xs text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
                <input type="text" value={p.label} onChange={(e) => updatePlatform(i, 'label', e.target.value)}
                  placeholder="Label" className="min-w-[120px] clip-corner h-9 border border-input bg-background/80 px-3 text-xs text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
                <button type="button" onClick={() => removePlatform(i)}
                  className="clip-corner cursor-pointer border border-coral/60 bg-coral/5 px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-widest text-coral hover:bg-coral/20">
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createGame.isPending}
              className="clip-corner cursor-pointer border border-cyan bg-cyan/10 px-6 py-2.5 font-mono text-[0.62rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background disabled:cursor-not-allowed disabled:opacity-40">
              {createGame.isPending ? 'Creating…' : 'Create game'}
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
