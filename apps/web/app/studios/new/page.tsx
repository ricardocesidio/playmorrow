'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { useCreateStudio } from '@/lib/api/hooks';
import { ApiError } from '@/lib/api/client';

export default function CreateStudioPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const createStudio = useCreateStudio();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugAuto, setSlugAuto] = useState(true);
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (slugAuto) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !slug.trim()) {
      setError('Name and slug are required');
      return;
    }
    if (!token) {
      setError('You must be signed in');
      return;
    }

    try {
      const result = await createStudio.mutateAsync({
        token,
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        tagline: tagline.trim() || undefined,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
      });
      router.push(`/studios/${result.slug}`);
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = typeof err.body === 'object' && err.body
          ? Array.isArray((err.body as { message?: string[] }).message)
            ? (err.body as { message: string[] }).message.join(', ')
            : (err.body as { message: string }).message || 'Failed to create studio'
          : 'Failed to create studio';
        setError(msg);
      } else {
        setError('Something went wrong');
      }
    }
  };

  if (authLoading) return (
    <>
      <SiteHeader />
      <div className="flex min-h-screen items-center justify-center bg-[#020609]">
        <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    </>
  );

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      {/* Top accent line */}
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

      <div className="relative mx-auto max-w-2xl">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan">
          <ArrowLeft className="size-3" /> Back to dashboard
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <Building2 className="size-6 text-cyan" />
          <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Create studio</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="clip-corner border border-coral/40 bg-coral/5 px-4 py-3 font-mono text-[0.68rem] text-coral">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Basic Information</h3>

            <div>
              <label htmlFor="name" className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Name *</label>
              <input id="name" type="text" value={name} onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Moonlit Forge"
                className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
            </div>

            <div className="mt-4">
              <label htmlFor="slug" className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Slug *</label>
              <input id="slug" type="text" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugAuto(false); }}
                placeholder="moonlit-forge"
                className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              <p className="mt-1 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">URL-safe identifier. Lowercase letters, numbers, hyphens.</p>
            </div>

            <div className="mt-4">
              <label htmlFor="tagline" className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Tagline</label>
              <input id="tagline" type="text" value={tagline} onChange={(e) => setTagline(e.target.value)}
                placeholder="Small indie studio making atmospheric adventure games."
                className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
            </div>

            <div className="mt-4">
              <label htmlFor="description" className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Description</label>
              <textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell the world about your studio…"
                className="clip-corner w-full resize-none border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
            </div>
          </div>

          {/* Links */}
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Links</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="location" className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Location</label>
                <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                  placeholder="Lisbon, Portugal"
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              </div>
              <div>
                <label htmlFor="websiteUrl" className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Website</label>
                <input id="websiteUrl" type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="logoUrl" className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Logo URL</label>
                <input id="logoUrl" type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              </div>
              <div>
                <label htmlFor="bannerUrl" className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Banner URL</label>
                <input id="bannerUrl" type="url" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://example.com/banner.png"
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]" />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createStudio.isPending}
              className="clip-corner cursor-pointer border border-cyan bg-cyan/10 px-6 py-2.5 font-mono text-[0.62rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background disabled:cursor-not-allowed disabled:opacity-40">
              {createStudio.isPending ? 'Creating…' : 'Create studio'}
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
