'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, ExternalLink, Trash2 } from 'lucide-react';

import { ImageUpload } from '@/components/image-upload';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/api/auth-context';
import { useStudio, useUpdateStudio, useDeleteStudio } from '@/lib/api/hooks';
import { ApiError } from '@/lib/api/client';

export default function EditStudioPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: studio, isLoading: studioLoading } = useStudio(slug);
  const updateStudio = useUpdateStudio();
  const deleteStudio = useDeleteStudio();

  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (studio && !initialized) {
      setName(studio.name ?? '');
      setTagline(studio.tagline ?? '');
      setDescription(studio.description ?? '');
      setLocation(studio.location ?? '');
      setWebsiteUrl(studio.websiteUrl ?? '');
      setLogoUrl(studio.logoUrl ?? '');
      setBannerUrl(studio.bannerUrl ?? '');
      setInitialized(true);
    }
  }, [studio, initialized]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    try {
      await updateStudio.mutateAsync({
        slug,
        body: {
          name: name.trim(),
          tagline: tagline.trim() || null,
          description: description.trim() || null,
          location: location.trim() || null,
          websiteUrl: websiteUrl.trim() || null,
          logoUrl: logoUrl.trim() || null,
          bannerUrl: bannerUrl.trim() || null,
        },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setError('You don\'t have permission to edit this studio.');
        } else {
          const msg = typeof err.body === 'object' && err.body
            ? Array.isArray((err.body as { message?: string[] }).message)
              ? (err.body as { message: string[] }).message.join(', ')
              : (err.body as { message: string }).message || 'Failed to update'
            : 'Failed to update';
          setError(msg);
        }
      } else {
        setError('Something went wrong');
      }
    }
  };

  if (authLoading || studioLoading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 rounded bg-muted" />
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-10 rounded bg-muted" />
          <div className="h-20 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!studio) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold">Studio not found</h1>
        <Link href="/dashboard" className="mt-4 inline-flex items-center gap-2 text-sm text-primary underline">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Edit studio</h1>
          <p className="mt-1 text-muted-foreground">{studio.name}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/studios/${slug}`}>
            <ExternalLink className="size-3" /> View public page
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
            Studio updated successfully.
          </div>
        )}

        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium">Name</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Slug (immutable)</label>
          <input type="text" value={slug} disabled
            className="w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground" />
        </div>

        <div>
          <label htmlFor="tagline" className="mb-1.5 block text-sm font-medium">Tagline</label>
          <input id="tagline" type="text" value={tagline} onChange={(e) => setTagline(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium">Description</label>
          <textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="location" className="mb-1.5 block text-sm font-medium">Location</label>
            <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="websiteUrl" className="mb-1.5 block text-sm font-medium">Website</label>
            <input id="websiteUrl" type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUpload value={logoUrl} onChange={setLogoUrl} label="Logo" />
          <ImageUpload value={bannerUrl} onChange={setBannerUrl} label="Banner" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex gap-3">
            <Button type="submit" disabled={updateStudio.isPending}>
              {updateStudio.isPending ? 'Saving…' : 'Save changes'}
              <Save className="size-4" />
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Cancel</Link>
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={async () => {
              if (!confirm(`Delete studio "${studio?.name}" permanently? This cannot be undone.`)) return;
              try {
                await deleteStudio.mutateAsync({ slug });
                router.push('/dashboard');
              } catch { /* ignore */ }
            }}
            disabled={deleteStudio.isPending}
          >
            <Trash2 className="size-4" />
            {deleteStudio.isPending ? 'Deleting…' : 'Delete studio'}
          </Button>
        </div>
      </form>
    </div>
  );
}
