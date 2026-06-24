'use client';

import { Suspense, useState, type FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Gamepad2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/api/auth-context';
import { useMyStudios, useCreateGame } from '@/lib/api/hooks';
import { ApiError } from '@/lib/api/client';

const STATUSES = ['CONCEPT', 'IN_DEVELOPMENT', 'ALPHA', 'BETA', 'EARLY_ACCESS', 'RELEASED', 'CANCELLED', 'ON_HOLD'];
const MEDIA_TYPES = ['SCREENSHOT', 'TRAILER', 'VIDEO', 'LOGO', 'BANNER', 'IMAGE'];
const PLATFORM_KINDS = ['STEAM', 'ITCH', 'EPIC', 'GOG', 'PLAYSTATION', 'XBOX', 'NINTENDO', 'WEB', 'ANDROID', 'IOS', 'DEMO', 'DISCORD', 'WEBSITE', 'OTHER'];

interface MediaRow { type: string; url: string; caption: string }
interface PlatformRow { platform: string; url: string; label: string }

export default function CreateGamePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-6 py-10"><div className="h-96 animate-pulse rounded-xl bg-muted" /></div>}>
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
  const [tagsInput, setTagsInput] = useState('');
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [platformLinks, setPlatformLinks] = useState<PlatformRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (slugAuto) setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  };

  const addMedia = () => setMedia([...media, { type: 'SCREENSHOT', url: '', caption: '' }]);
  const removeMedia = (i: number) => setMedia(media.filter((_, idx) => idx !== i));
  const updateMedia = (i: number, field: keyof MediaRow, val: string) => {
    setMedia(media.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  };

  const addPlatform = () => setPlatformLinks([...platformLinks, { platform: 'STEAM', url: '', label: '' }]);
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
        tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
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
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <Gamepad2 className="size-6 text-primary" />
        <h1 className="text-3xl font-semibold tracking-tight">Create game</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}

        {/* Studio selector */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Studio *</label>
          <select value={studioSlug} onChange={(e) => setStudioSlug(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="">Select a studio…</option>
            {studios?.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </div>

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
          <label className="mb-1.5 block text-sm font-medium">Tagline</label>
          <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Description</label>
          <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Full README</label>
          <textarea id="readme" rows={10} value={readme} onChange={(e) => setReadme(e.target.value)} placeholder="Write the full game README here..."
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Demo status</label>
            <select id="demoStatus" value={demoStatus} onChange={(e) => setDemoStatus(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="NO_DEMO">No demo</option>
              <option value="DEMO_LOCKED">Demo locked</option>
              <option value="DEMO_PLAYABLE">Demo playable</option>
              <option value="PLAYTEST_AVAILABLE">Playtest available</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Demo URL (if playable)</label>
            <input type="url" id="demoUrl" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Edition</label>
            <input type="text" id="edition" value={edition} onChange={(e) => setEdition(e.target.value)} placeholder="Standard Edition"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Engine</label>
            <input type="text" id="engine" value={engine} onChange={(e) => setEngine(e.target.value)} placeholder="e.g. Unreal Engine 5"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Languages (comma-separated)</label>
            <input type="text" id="languages" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="EN, FR, DE, JP, ZH"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Genres (comma-separated)</label>
            <input type="text" id="genres" value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="Tactical, Stealth, Cyberpunk"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Modes (comma-separated)</label>
          <input type="text" id="modes" value={modes} onChange={(e) => setModes(e.target.value)} placeholder="Single Player, Multiplayer"
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
            <label className="mb-1.5 block text-sm font-medium">Tag</label>
            <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
              placeholder="adventure, exploration (comma-separated)"
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
            <label className="mb-1.5 block text-sm font-medium">Expected release text</label>
            <input type="text" value={expectedReleaseText} onChange={(e) => setExpectedReleaseText(e.target.value)}
              placeholder="Q4 2026"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        {/* Pricing */}
        <div className="rounded-xl border border-border bg-card/20 p-4">
          <h3 className="mb-3 text-sm font-semibold">Pricing</h3>
          <div className="flex items-center gap-3 mb-3">
            <input type="checkbox" id="isFree" checked={isFree} onChange={(e) => setIsFree(e.target.checked)}
              className="rounded border-input" />
            <label htmlFor="isFree" className="text-sm">Free</label>
          </div>
          {!isFree && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Price (cents)</label>
                <input type="number" value={priceCents} onChange={(e) => setPriceCents(e.target.value)}
                  placeholder="1999"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Currency</label>
                <input type="text" value={currency} onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
          )}
        </div>

        {/* Media URLs */}
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

        {/* Media rows */}
        <div className="rounded-xl border border-border bg-card/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Media</h3>
            <Button type="button" variant="outline" size="sm" onClick={addMedia}>
              <Plus className="size-3" /> Add
            </Button>
          </div>
          {media.map((m, i) => (
            <div key={i} className="mb-2 flex flex-wrap items-end gap-2">
              <select value={m.type} onChange={(e) => updateMedia(i, 'type', e.target.value)}
                className="rounded-lg border border-input bg-background px-2 py-2 text-xs focus:border-primary focus:outline-none">
                {MEDIA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="url" value={m.url} onChange={(e) => updateMedia(i, 'url', e.target.value)}
                placeholder="URL" className="min-w-[200px] flex-1 rounded-lg border border-input bg-background px-2 py-2 text-xs focus:border-primary focus:outline-none" />
              <input type="text" value={m.caption} onChange={(e) => updateMedia(i, 'caption', e.target.value)}
                placeholder="Caption" className="min-w-[120px] rounded-lg border border-input bg-background px-2 py-2 text-xs focus:border-primary focus:outline-none" />
              <Button type="button" variant="ghost" size="sm" onClick={() => removeMedia(i)}>
                <Trash2 className="size-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        {/* Platform links rows */}
        <div className="rounded-xl border border-border bg-card/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Platform links</h3>
            <Button type="button" variant="outline" size="sm" onClick={addPlatform}>
              <Plus className="size-3" /> Add
            </Button>
          </div>
          {platformLinks.map((p, i) => (
            <div key={i} className="mb-2 flex flex-wrap items-end gap-2">
              <select value={p.platform} onChange={(e) => updatePlatform(i, 'platform', e.target.value)}
                className="rounded-lg border border-input bg-background px-2 py-2 text-xs focus:border-primary focus:outline-none">
                {PLATFORM_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              <input type="url" value={p.url} onChange={(e) => updatePlatform(i, 'url', e.target.value)}
                placeholder="URL" className="min-w-[200px] flex-1 rounded-lg border border-input bg-background px-2 py-2 text-xs focus:border-primary focus:outline-none" />
              <input type="text" value={p.label} onChange={(e) => updatePlatform(i, 'label', e.target.value)}
                placeholder="Label" className="min-w-[120px] rounded-lg border border-input bg-background px-2 py-2 text-xs focus:border-primary focus:outline-none" />
              <Button type="button" variant="ghost" size="sm" onClick={() => removePlatform(i)}>
                <Trash2 className="size-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={createGame.isPending}>
            {createGame.isPending ? 'Creating…' : 'Create game'}
          </Button>
          <Button asChild variant="outline"><Link href="/dashboard">Cancel</Link></Button>
        </div>
      </form>
    </div>
  );
}
