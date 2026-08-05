'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Store, ArrowLeft, Tag } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { ErrorState } from '@/components/error-state';
import { CircuitFrame, HudPanel, HudStatusRail } from '@/components/playmorrow/hud';
import { Button } from '@/components/ui/button';
import { StripePayment } from '@/components/stripe-payment';
import { useMarketplaceListing, usePurchaseListing } from '@/lib/api/hooks';
import { useAuth } from '@/lib/api/auth-context';
import { formatPrice } from '@/lib/format';

export default function MarketplaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: listing, isLoading, error } = useMarketplaceListing(id);
  const purchase = usePurchaseListing();
  const [clientSecret, setClientSecret] = useState('');

  const handlePurchase = async () => {
    if (!user) { router.push('/login'); return; }
    const result = await purchase.mutateAsync(id);
    if (result?.clientSecret) setClientSecret(result.clientSecret);
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
        <div className="relative z-10 mx-auto max-w-4xl">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan focus-visible:ring-2 focus-visible:ring-cyan"
          >
            <ArrowLeft aria-hidden="true" className="size-3" /> Back
          </button>

          <HudPanel className="mb-3 px-4 py-3 sm:px-8 sm:py-4" accent="muted">
            <div className="flex flex-col gap-6 sm:flex-row">
              <div className="flex h-48 w-full items-center justify-center bg-muted sm:w-72">
                {listing.thumbnailUrl ? (
                  <img src={listing.thumbnailUrl} alt={listing.title} className="size-full object-cover" />
                ) : (
                  <Store aria-hidden="true" className="size-16 text-muted-foreground/30" />
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <span className="mb-2 self-start bg-cyan/90 px-2 py-0.5 font-mono text-[0.55rem] uppercase text-white">
                  {listing.type}
                </span>
                <h1 className="font-display text-2xl font-black uppercase text-foreground">
                  {listing.title}
                </h1>
                <p className="mt-1 font-mono text-[0.6rem] text-muted-foreground">
                  by {listing.studio.name}
                </p>
                {listing.description && (
                  <p className="mt-3 text-sm text-foreground/80">{listing.description}</p>
                )}
                <div className="mt-auto flex items-center justify-between pt-4">
                  <span className="font-mono text-xl text-cyan">
                    {formatPrice(listing.priceCents)}
                  </span>
                  <Button onClick={handlePurchase} disabled={purchase.isPending} aria-disabled={purchase.isPending}>
                    {purchase.isPending ? 'Processing...' : 'Purchase'}
                  </Button>
                </div>
              </div>
            </div>
          </HudPanel>

          {clientSecret && (
            <HudPanel className="mt-6 px-4 py-3 sm:px-8 sm:py-4" accent="cyan" aria-live="polite">
              <h2 className="mb-3 font-display text-sm font-bold uppercase text-foreground">Complete Payment</h2>
              <StripePayment
                clientSecret={clientSecret}
                onSuccess={() => {
                  setClientSecret('');
                  router.push('/me/licenses');
                }}
              />
            </HudPanel>
          )}

          {listing.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {listing.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 border border-border/60 px-2 py-1 font-mono text-[0.5rem] text-muted-foreground">
                  <Tag aria-hidden="true" className="size-2.5" /> {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <HudStatusRail />
      </main>
    </>
  );
}
