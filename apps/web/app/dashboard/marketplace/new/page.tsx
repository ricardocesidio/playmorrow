'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { SiteHeader } from '@/components/site-header';
import { CircuitFrame, HudPanel, HudStatusRail } from '@/components/playmorrow/hud';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/api/auth-context';
import { useMyStudios, useCreateListing } from '@/lib/api/hooks';

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

  const [type, setType] = useState('ASSET');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceCents, setPriceCents] = useState(0);
  const [fileUrl, setFileUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [tagsStr, setTagsStr] = useState('');

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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                Type
              </label>
              <div className="flex gap-2">
                {LISTING_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-wider transition ${
                      type === t.value
                        ? 'border border-cyan bg-cyan/10 text-cyan'
                        : 'border border-border/60 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                Title
              </label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., Cyberpunk Music Pack" />
            </div>

            <div>
              <label className="mb-1 block font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="clip-corner w-full border border-border-bright/50 bg-background/70 px-4 py-2 text-sm text-foreground outline-none transition-colors focus:border-cyan focus:ring-1 focus:ring-cyan"
                placeholder="Describe what you're selling..."
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                Price (cents)
              </label>
              <Input
                type="number"
                min={0}
                value={priceCents}
                onChange={(e) => setPriceCents(parseInt(e.target.value) || 0)}
                required
                placeholder="e.g., 1999 for $19.99"
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                File URL
              </label>
              <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." />
            </div>

            <div>
              <label className="mb-1 block font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                Thumbnail URL
              </label>
              <Input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://..." />
            </div>

            <div>
              <label className="mb-1 block font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                Tags (comma-separated)
              </label>
              <Input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="music, cyberpunk, synthwave" />
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
