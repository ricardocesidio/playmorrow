'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Upload, X } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { ErrorState } from '@/components/error-state';
import { CircuitFrame, HudPanel, HudStatusRail } from '@/components/playmorrow/hud';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMarketplaceListing, useUpdateListing, useUpload } from '@/lib/api/hooks';

const LISTING_TYPES = [
  { value: 'ASSET', label: 'Asset' },
  { value: 'GAME', label: 'Game' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'PLUGIN', label: 'Plugin' },
];

const LISTING_STATUSES = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: listing, isLoading, error } = useMarketplaceListing(id);
  const update = useUpdateListing();
  const upload = useUpload();

  const [type, setType] = useState('ASSET');
  const [status, setStatus] = useState('DRAFT');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceCents, setPriceCents] = useState(0);
  const [fileUrl, setFileUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!listing) return;
    setType(listing.type);
    setStatus(listing.status);
    setTitle(listing.title);
    setDescription(listing.description ?? '');
    setPriceCents(listing.priceCents);
    setFileUrl(listing.fileUrl ?? '');
    setThumbnailUrl(listing.thumbnailUrl ?? '');
    setTagsStr((listing.tags ?? []).join(', '));
  }, [listing]);

  const handleFileUpload = async (file: File | undefined, target: 'file' | 'thumbnail') => {
    if (!file) return;
    const result = await upload.mutateAsync(file);
    if (target === 'file') setFileUrl(result.url);
    else setThumbnailUrl(result.url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await update.mutateAsync({
      id,
      type,
      status,
      title,
      description: description || undefined,
      priceCents,
      fileUrl: fileUrl || undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      tags: tagsStr.split(',').map((t) => t.trim()).filter(Boolean),
    });
    router.push('/dashboard/marketplace');
  };

  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <main className="flex min-h-screen items-center justify-center bg-[#020609]">
          <div role="status" className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
        </main>
      </>
    );
  }

  if (error || !listing) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen bg-[#020609] px-5 py-6">
          <ErrorState message="Listing not found." />
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 pb-28 pt-4 sm:px-8 lg:px-10">
        <CircuitFrame className="opacity-70" />
        <div className="relative z-10 mx-auto max-w-2xl">
          <HudPanel className="mb-3 px-4 py-3 sm:px-8 sm:py-4" accent="muted">
            <h1 className="font-display text-2xl font-black uppercase text-foreground">
              Edit Listing
            </h1>
            <p className="mt-1 font-mono text-[0.6rem] text-muted-foreground">{listing.title}</p>
          </HudPanel>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label id="listing-type-label" className="mb-1 block font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Type</label>
              <div className="flex gap-2" role="radiogroup" aria-labelledby="listing-type-label">
                {LISTING_TYPES.map((t) => (
                  <button key={t.value} type="button" onClick={() => setType(t.value)} aria-pressed={type === t.value}
                    className={`px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-wider transition ${
                      type === t.value ? 'border border-cyan bg-cyan/10 text-cyan' : 'border border-border/60 text-muted-foreground hover:text-foreground'
                    }`}>{t.label}</button>
                ))}
              </div>
            </div>

            <div>
              <label id="listing-status-label" className="mb-1 block font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Status</label>
              <div className="flex gap-2" role="radiogroup" aria-labelledby="listing-status-label">
                {LISTING_STATUSES.map((s) => (
                  <button key={s.value} type="button" onClick={() => setStatus(s.value)} aria-pressed={status === s.value}
                    className={`px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-wider transition ${
                      status === s.value ? 'border border-cyan bg-cyan/10 text-cyan' : 'border border-border/60 text-muted-foreground hover:text-foreground'
                    }`}>{s.label}</button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="listing-title" className="mb-1 block font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Title</label>
              <Input id="listing-title" value={title} onChange={(e) => setTitle(e.target.value)} required aria-required="true" placeholder="e.g., Cyberpunk Music Pack" />
            </div>

            <div>
              <label htmlFor="listing-description" className="mb-1 block font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Description</label>
              <textarea id="listing-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
                className="clip-corner w-full border border-border-bright/50 bg-background/70 px-4 py-2 text-sm text-foreground outline-none transition-colors focus:border-cyan focus:ring-1 focus:ring-cyan"
                placeholder="Describe what you're selling..." />
            </div>

            <div>
              <label htmlFor="listing-price" className="mb-1 block font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Price (cents)</label>
              <Input id="listing-price" type="number" min={0} value={priceCents} onChange={(e) => setPriceCents(parseInt(e.target.value) || 0)} required aria-required="true" aria-describedby="listing-price-help" placeholder="e.g., 1999 = $19.99" />
              <p id="listing-price-help" className="mt-1 font-mono text-[0.5rem] text-muted-foreground">Enter amount in cents. Example: 1999 = $19.99</p>
            </div>

            <div>
              <label htmlFor="listing-file" className="mb-1 block font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">File (asset to sell)</label>
              <input ref={fileInputRef} id="listing-file" type="file" className="hidden" onChange={(e) => handleFileUpload(e.target.files?.[0], 'file')} />
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={upload.isPending} aria-label="Upload listing file">
                  <Upload className="size-3" aria-hidden="true" /> {upload.isPending ? 'Uploading...' : 'Replace file'}
                </Button>
                {fileUrl && (
                  <span className="flex items-center gap-1 font-mono text-[0.5rem] text-cyan">
                    File attached
                    <button type="button" onClick={() => setFileUrl('')} className="text-coral" aria-label="Remove uploaded file"><X className="size-3" aria-hidden="true" /></button>
                  </span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="listing-thumbnail" className="mb-1 block font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Thumbnail</label>
              <input ref={thumbInputRef} id="listing-thumbnail" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e.target.files?.[0], 'thumbnail')} />
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => thumbInputRef.current?.click()} disabled={upload.isPending} aria-label="Upload thumbnail image">
                  <Upload className="size-3" aria-hidden="true" /> {upload.isPending ? 'Uploading...' : 'Replace thumbnail'}
                </Button>
                {thumbnailUrl && (
                  <span className="flex items-center gap-1 font-mono text-[0.5rem] text-cyan">
                    Thumbnail attached
                    <button type="button" onClick={() => setThumbnailUrl('')} className="text-coral" aria-label="Remove uploaded thumbnail"><X className="size-3" aria-hidden="true" /></button>
                  </span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="listing-tags" className="mb-1 block font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Tags (comma-separated)</label>
              <Input id="listing-tags" value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="music, cyberpunk, synthwave" />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={update.isPending || !title}>
                {update.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/dashboard/marketplace')}>Cancel</Button>
            </div>
          </form>
        </div>
        <HudStatusRail />
      </main>
    </>
  );
}
