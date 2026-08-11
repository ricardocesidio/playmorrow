'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/lib/api/auth-context';
import { useRecommendationPreferences } from '@/lib/api/hooks';
import { SiteHeader } from '@/components/site-header';
import { SettingsNav } from '@/components/settings-nav';

export default function PersonalizationSettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { preferences, setPreferences, resetHistory } = useRecommendationPreferences();

  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const enabled = preferences.data?.personalizationEnabled ?? false;
  const saving = setPreferences.isPending;
  const resetting = resetHistory.isPending;

  const togglePersonalization = () => {
    const next = !enabled;
    setPreferences.mutate(next, {
      onSuccess: () => {
        toast.success(next ? 'Personalization enabled — your For You feed will adapt to you.' : 'Personalization disabled.');
      },
      onError: () => toast.error('Failed to update preference.'),
    });
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    resetHistory.mutate(undefined, {
      onSuccess: () => {
        setConfirmReset(false);
        toast.success('Recommendation history cleared. Your feed will re-learn from scratch.');
      },
      onError: () => toast.error('Failed to reset history.'),
    });
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020609]">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative min-h-screen bg-[#020609]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
      <SiteHeader />

      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground hover:text-cyan"
        >
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        <h1 className="mb-2 mt-6 font-display text-3xl font-black uppercase tracking-tight text-white">Personalization</h1>
        <SettingsNav />

        <div className="clip-corner border border-border/70 panel p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
          <div className="mb-4 flex items-center gap-3 border-b border-border/50 pb-3">
            <Sparkles className="size-5 text-cyan" />
            <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan">AI Recommendations</h2>
          </div>

          <div className="flex items-center justify-between gap-4 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[0.6rem] uppercase tracking-widest text-foreground">Personalized For You feed</p>
              <p className="mt-0.5 font-mono text-[0.55rem] leading-relaxed text-muted-foreground">
                When enabled, your For You feed is built from your wishlist, views, tags, followed studios, and
                dismissals — and every recommendation explains why it was chosen. When disabled, you get our
                non-personalized content feed and no personal data is used.
              </p>
            </div>
            <button
              id="personalization-toggle"
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-describedby="personalization-help"
              onClick={togglePersonalization}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors ${
                enabled ? 'border-cyan/60 bg-cyan/20' : 'border-border/50 bg-background/40'
              } ${saving ? 'opacity-60' : ''}`}
            >
              <span
                className={`inline-block size-4 transform rounded-full shadow-sm transition-transform duration-200 ${
                  enabled ? 'translate-x-[1.35rem] bg-cyan' : 'translate-x-[3px] bg-muted-foreground/40'
                }`}
              />
            </button>
          </div>
          <p id="personalization-help" className="border-t border-border/30 pt-3 font-mono text-[0.55rem] text-muted-foreground">
            Consent is stored server-side. You can change your mind at any time — disabling stops all personal data
            use immediately.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="font-mono text-[0.55rem] text-muted-foreground">
            Clears your click, dismissal, impression and wishlist history used by the engine. Dismissed games can
            then appear again.
          </p>
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="clip-corner inline-flex cursor-pointer items-center gap-2 border border-border/50 bg-background/30 px-4 py-2 font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground transition hover:text-foreground disabled:opacity-60"
          >
            <Trash2 className="size-3.5" />
            {resetting ? 'Clearing...' : confirmReset ? 'Click again to confirm' : 'Reset history'}
          </button>
        </div>
      </div>
    </div>
  );
}
