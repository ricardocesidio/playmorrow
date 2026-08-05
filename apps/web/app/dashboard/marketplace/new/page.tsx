'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { CircuitFrame, HudPanel, HudStatusRail } from '@/components/playmorrow/hud';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/api/auth-context';
import { useMyStudios, useCreateListing, useUpload } from '@/lib/api/hooks';

const LISTING_TYPES = [
  { value: 'ASSET', label: 'Asset' },
  { value: 'GAME', label: 'Game' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'PLUGIN', label: 'Plugin' },
];

export default function NewListingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: studios } = useMyStudios();
  const studio = studios?.[0];
  const create = useCreateListing();
  const upload = useUpload();

  const [type, setType] = useState('ASSET');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceCents, setPriceCents] = useState(0);
  const [fileUrl, setFileUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File | undefined, target: 'file' | 'thumbnail') => {
    if (!file) return;
    const result = await upload.mutateAsync(file);
    if (target === 'file') setFileUrl(result.url);
    else setThumbnailUrl(result.url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studio) return;
    await create.mutateAsync({
      type,
      title,
      description: description || undefined,
      priceCents,
      fileUrl: fileUrl || undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      tags: tagsStr.split(',').map((t) => t.trim()).filter(Boolean),
      studioId: studio.id,
    });
    router.push('/dashboard/marketplace');
  };

  if (!user || !studio) return null;

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 pb-28 pt-4 sm:px-8 lg:px-10">
        <CircuitFrame className="opacity-70" />
        <div className="relative z-10 mx-auto max-w-2xl">
          <HudPanel className="mb-3 px-4 py-3 sm:px-8 sm:py-4" accent="muted">
            <h1 className="font-display text-2xl font-black uppercase text-foreground">
              New Listing
            </h1>
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
                  <Upload className="size-3" aria-hidden="true" /> {upload.isPending ? 'Uploading...' : 'Upload file'}
                </Button>
                {fileUrl && (
                  <span className="flex items-center gap-1 font-mono text-[0.5rem] text-cyan">
                    File uploaded
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
                  <Upload className="size-3" aria-hidden="true" /> {upload.isPending ? 'Uploading...' : 'Upload thumbnail'}
                </Button>
                {thumbnailUrl && (
                  <span className="flex items-center gap-1 font-mono text-[0.5rem] text-cyan">
                    Thumbnail uploaded
                    <button type="button" onClick={() => setThumbnailUrl('')} className="text-coral" aria-label="Remove uploaded thumbnail"><X className="size-3" aria-hidden="true" /></button>
                  </span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="listing-tags" className="mb-1 block font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Tags (comma-separated)</label>
              <Input id="listing-tags" value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="music, cyberpunk, synthwave" />
            </div>

            <Button type="submit" disabled={create.isPending || !title}>
              {create.isPending ? 'Creating...' : 'Create Listing'}
            </Button>
          </form>
        </div>
        <HudStatusRail />
      </main>
    </>
  );
}
