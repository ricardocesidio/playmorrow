'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
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

  if (authLoading) return null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Building2 className="size-6 text-primary" />
          <h1 className="text-3xl font-semibold tracking-tight">Create studio</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Set up a new studio profile to showcase your games.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium">Name *</label>
          <input id="name" type="text" value={name} onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Moonlit Forge"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div>
          <label htmlFor="slug" className="mb-1.5 block text-sm font-medium">Slug *</label>
          <input id="slug" type="text" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugAuto(false); }}
            placeholder="moonlit-forge"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          <p className="mt-1 text-xs text-muted-foreground">URL-safe identifier. Lowercase letters, numbers, hyphens.</p>
        </div>

        <div>
          <label htmlFor="tagline" className="mb-1.5 block text-sm font-medium">Tagline</label>
          <input id="tagline" type="text" value={tagline} onChange={(e) => setTagline(e.target.value)}
            placeholder="Small indie studio making atmospheric adventure games."
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium">Description</label>
          <textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell the world about your studio…"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="location" className="mb-1.5 block text-sm font-medium">Location</label>
            <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="Lisbon, Portugal"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="websiteUrl" className="mb-1.5 block text-sm font-medium">Website</label>
            <input id="websiteUrl" type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="logoUrl" className="mb-1.5 block text-sm font-medium">Logo URL</label>
            <input id="logoUrl" type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="bannerUrl" className="mb-1.5 block text-sm font-medium">Banner URL</label>
            <input id="bannerUrl" type="url" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://example.com/banner.png"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={createStudio.isPending}>
            {createStudio.isPending ? 'Creating…' : 'Create studio'}
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
