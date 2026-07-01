'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, ExternalLink, ScrollText } from 'lucide-react';

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
      <div className="flex min-h-screen items-center justify-center bg-[#020609]">
        <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    );
  }

  if (!game) {
    return (
      <main className="relative min-h-screen bg-[#020609]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
        <div className="relative flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-white">Game not found</h1>
            <Link href="/dashboard" className="mt-4 inline-flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-widest text-cyan underline transition hover:text-white">
              <ArrowLeft className="size-3" /> Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

      <div className="relative mx-auto max-w-2xl">
        <Link
          href={'/dashboard/games/' + slug}
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan"
        >
          <ArrowLeft className="size-3" /> Back to game settings
        </Link>

        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <ScrollText className="size-6 text-cyan" />
            <div>
              <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Press kit</h1>
              <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground">
                {isExisting ? 'Edit press kit for ' + game.title : 'Create press kit for ' + game.title}
              </p>
            </div>
          </div>
          <Link
            href={'/games/' + slug}
            className="clip-corner inline-flex items-center border border-border/60 px-4 py-2 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan"
          >
            <ExternalLink className="mr-1.5 size-3" /> View game
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="clip-corner border border-coral/40 bg-coral/5 px-4 py-3 font-mono text-[0.68rem] text-coral">
              {error}
            </div>
          )}

          {success && (
            <div className="clip-corner border border-success/40 bg-success/5 px-4 py-3 font-mono text-[0.68rem] text-success">
              Press kit saved successfully.
            </div>
          )}

          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <h3 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan mb-3">Press Kit Details</h3>

            <div>
              <label htmlFor="headline" className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Press headline *</label>
              <input
                id="headline"
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="A hand-painted exploration game about forgotten underwater ruins."
                className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]"
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contactEmail" className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Press contact email</label>
                <input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="press@example.com"
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]"
                />
              </div>
              <div>
                <label htmlFor="downloadUrl" className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Press assets URL</label>
                <input
                  id="downloadUrl"
                  type="url"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  placeholder="https://drive.google.com/…"
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]"
                />
                <p className="mt-1 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                  Use a Drive, Dropbox, or public press assets folder for now.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="factSheet" className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-1.5 block">Factsheet JSON</label>
              <textarea
                id="factSheet"
                rows={10}
                value={factSheetText}
                onChange={(e) => setFactSheetText(e.target.value)}
                className="clip-corner w-full resize-none border border-input bg-background/80 px-4 py-3 text-sm font-mono text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]"
              />
              <p className="mt-1 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">
                Structured data about the game. Must be valid JSON.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={upsert.isPending}
              className="clip-corner cursor-pointer border border-cyan bg-cyan/10 px-6 py-2.5 font-mono text-[0.62rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background disabled:cursor-not-allowed disabled:opacity-40">
              {upsert.isPending ? 'Saving…' : 'Save press kit'}
              <Save className="ml-1.5 inline size-3" />
            </button>
            <Link href={'/dashboard/games/' + slug}
              className="clip-corner inline-flex items-center border border-border/60 px-6 py-2.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:border-cyan hover:text-cyan">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
