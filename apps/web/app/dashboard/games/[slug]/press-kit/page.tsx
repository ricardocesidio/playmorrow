'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, ExternalLink, ScrollText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/api/auth-context';
import { useGame, useGamePressKit, useUpsertPressKit } from '@/lib/api/hooks';
import { ApiError } from '@/lib/api/client';

const DEFAULT_FACTSHEET = JSON.stringify(
  { developer: '', releaseDate: '', platforms: [], price: '', engine: '' },
  null,
  2,
);

export default function PressKitPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: game, isLoading: gameLoading } = useGame(slug);
  const { data: pressKit, isLoading: pkLoading, error: pkError } = useGamePressKit(slug);
  const upsert = useUpsertPressKit();

  const [headline, setHeadline] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [factSheetText, setFactSheetText] = useState(DEFAULT_FACTSHEET);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const isExisting = !!pressKit;

  const isLoadingAll = authLoading || gameLoading || pkLoading;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (initialized) return;
    if (pressKit) {
      setHeadline(pressKit.headline ?? '');
      setContactEmail(pressKit.contactEmail ?? '');
      setDownloadUrl(pressKit.downloadUrl ?? '');
      setFactSheetText(
        pressKit.factSheet
          ? JSON.stringify(pressKit.factSheet, null, 2)
          : DEFAULT_FACTSHEET,
      );
      setInitialized(true);
    } else if (pkError) {
      // 404 means no press kit — show empty form with defaults
      const notFound =
        typeof pkError === 'object' &&
        pkError !== null &&
        'status' in pkError &&
        (pkError as { status: number }).status === 404;
      if (notFound) {
        setFactSheetText(DEFAULT_FACTSHEET);
        setInitialized(true);
      }
    }
  }, [pressKit, pkError, initialized]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!headline.trim()) { setError('Headline is required'); return; }
    if (!token) { setError('You must be signed in'); return; }

    let parsedFactSheet: Record<string, unknown> | undefined;
    if (factSheetText.trim()) {
      try {
        parsedFactSheet = JSON.parse(factSheetText);
        if (typeof parsedFactSheet !== 'object' || Array.isArray(parsedFactSheet)) {
          setError('Factsheet must be a JSON object');
          return;
        }
      } catch {
        setError('Invalid JSON in factsheet. Please fix the syntax.');
        return;
      }
    }

    try {
      await upsert.mutateAsync({
        gameSlug: slug,
        token,
        headline: headline.trim(),
        factSheet: parsedFactSheet,
        contactEmail: contactEmail.trim() || undefined,
        downloadUrl: downloadUrl.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) setError("You don't have permission to manage this press kit.");
        else {
          const msg =
            typeof err.body === 'object' && err.body
              ? Array.isArray((err.body as { message?: string[] }).message)
                ? (err.body as { message: string[] }).message.join(', ')
                : (err.body as { message: string }).message || 'Failed to save'
              : 'Failed to save';
          setError(msg);
        }
      } else {
        setError('Something went wrong');
      }
    }
  };

  if (isLoadingAll) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 rounded bg-muted" />
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-10 rounded bg-muted" />
          <div className="h-32 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold">Game not found</h1>
        <Link href="/dashboard" className="mt-4 inline-flex items-center gap-2 text-sm text-primary underline">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href={'/dashboard/games/' + slug}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to game settings
      </Link>

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <ScrollText className="size-6 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight">Press kit</h1>
          </div>
          <p className="mt-1 text-muted-foreground">
            {isExisting ? 'Edit press kit for ' + game.title : 'Create press kit for ' + game.title}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={'/games/' + slug}><ExternalLink className="size-3" /> View game</Link>
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
            Press kit saved successfully.
          </div>
        )}

        <div>
          <label htmlFor="headline" className="mb-1.5 block text-sm font-medium">Press headline *</label>
          <input
            id="headline"
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="A hand-painted exploration game about forgotten underwater ruins."
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contactEmail" className="mb-1.5 block text-sm font-medium">Press contact email</label>
            <input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="press@example.com"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="downloadUrl" className="mb-1.5 block text-sm font-medium">Press assets URL</label>
            <input
              id="downloadUrl"
              type="url"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              placeholder="https://drive.google.com/…"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Use a Drive, Dropbox, or public press assets folder for now.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="factSheet" className="mb-1.5 block text-sm font-medium">Factsheet JSON</label>
          <textarea
            id="factSheet"
            rows={10}
            value={factSheetText}
            onChange={(e) => setFactSheetText(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono leading-relaxed focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Structured data about the game. Must be valid JSON.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={upsert.isPending}>
            {upsert.isPending ? 'Saving…' : 'Save press kit'}
            <Save className="size-4" />
          </Button>
          <Button asChild variant="outline">
            <Link href={'/dashboard/games/' + slug}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
