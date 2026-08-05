'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, ExternalLink, CheckCircle } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { ErrorState } from '@/components/error-state';
import { CircuitFrame, HudPanel, HudStatusRail } from '@/components/playmorrow/hud';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/api/auth-context';
import { useMyStudios } from '@/lib/api/hooks';
import { api } from '@/lib/api/client';

export default function StripeOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: studios, isLoading } = useMyStudios();
  const studio = studios?.[0];
  const [loading, setLoading] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [stripeError, setStripeError] = useState('');

  const handleConnect = async () => {
    if (!studio) return;
    setLoading(true);
    try {
      const res = await api.post<{ url: string }>('/payments/stripe/onboarding', {
        studioId: studio.id,
        refreshUrl: `${window.location.origin}/dashboard/marketplace/stripe`,
        returnUrl: `${window.location.origin}/dashboard/marketplace/stripe?success=1`,
      });
      window.location.href = res.url;
    } catch (err: unknown) {
      const e = err as { body?: { message?: string }; message?: string };
      setStripeError(e?.body?.message || e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const isSuccess = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('success') === '1';

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 pb-28 pt-4 sm:px-8 lg:px-10">
        <CircuitFrame className="opacity-70" />
        <div className="relative z-10 mx-auto max-w-lg py-16 text-center">
          <CreditCard className="mx-auto mb-4 size-12 text-cyan" aria-hidden="true" />

          {isSuccess || onboarded ? (
            <>
              <CheckCircle className="mx-auto mb-4 size-12 text-green-400" aria-hidden="true" />
              <h1 className="font-display text-2xl font-black uppercase text-foreground">Connected!</h1>
              <p className="mt-2 text-sm text-muted-foreground">Your Stripe account is ready. You can now sell on the Marketplace.</p>
              <Button className="mt-6" onClick={() => router.push('/dashboard/marketplace')}>
                Go to My Listings
              </Button>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-black uppercase text-foreground">Stripe Connect</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Connect a Stripe account to receive payments from Marketplace sales. 
                {studio?.name && <> Studio <span className="text-cyan">{studio.name}</span> will receive payouts directly.</>}
              </p>
              <div className="mt-6 space-y-3 text-left text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><ExternalLink className="size-3 text-cyan" aria-hidden="true" /> Quick onboarding via Stripe Express</p>
                <p className="flex items-center gap-2"><ExternalLink className="size-3 text-cyan" aria-hidden="true" /> No monthly fees — only pay Stripe processing</p>
                <p className="flex items-center gap-2"><ExternalLink className="size-3 text-cyan" aria-hidden="true" /> Payouts go directly to your bank account</p>
              </div>
              <Button className="mt-8" onClick={handleConnect} disabled={loading || !studio}>
                {loading ? 'Redirecting to Stripe...' : 'Connect with Stripe'}
              </Button>
              {stripeError && (
                <ErrorState message={`Failed to connect Stripe: ${stripeError}`} />
              )}
            </>
          )}
        </div>
        <HudStatusRail />
      </main>
    </>
  );
}
