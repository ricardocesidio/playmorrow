'use client';

import Link from 'next/link';
import { Store, Plus } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { CircuitFrame, HudPanel, HudStatusRail } from '@/components/playmorrow/hud';
import { Button } from '@/components/ui/button';
import { useMyStudios } from '@/lib/api/hooks';
import { useMarketplaceListings } from '@/lib/api/hooks';
import { useAuth } from '@/lib/api/auth-context';
import { formatPrice, formatRelativeTime } from '@/lib/format';

export default function DashboardMarketplacePage() {
  const { user } = useAuth();
  const { data: studios } = useMyStudios();
  const studio = studios?.[0];
  const { data, isLoading, error } = useMarketplaceListings(undefined, 1, 50);

  if (!user) return null;

  const myListings = data?.items.filter((l) => l.studioId === studio?.id) ?? [];

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 pb-28 pt-4 sm:px-8 lg:px-10">
        <CircuitFrame className="opacity-70" />
        <div className="relative z-10 mx-auto max-w-4xl">
          <HudPanel className="mb-3 px-4 py-3 sm:px-8 sm:py-4" accent="muted">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-2xl font-black uppercase text-foreground">
                  My Listings
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your marketplace products.
                </p>
              </div>
              <Button asChild>
                <Link href="/dashboard/marketplace/new">
                  <Plus className="size-3" /> New Listing
                </Link>
              </Button>
            </div>
          </HudPanel>

          {error && !isLoading && <ErrorState message="Failed to load listings." />}

          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="clip-corner h-20 animate-pulse border border-border/40 bg-[#050b0f]/30" />
              ))}
            </div>
          )}

          {!isLoading && !error && myListings.length === 0 && (
            <EmptyState
              title="No listings yet"
              action={{ label: 'Create your first listing', href: '/dashboard/marketplace/new' }}
            />
          )}

          {!isLoading && myListings.length > 0 && (
            <div className="space-y-3">
              {myListings.map((listing) => (
                <div key={listing.id} className="clip-corner border border-border/40 bg-[#050b0f]/30 p-4 transition hover:border-cyan/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link href={`/marketplace/${listing.id}`} className="font-display text-sm font-black uppercase text-foreground hover:text-cyan">
                        {listing.title}
                      </Link>
                      <p className="mt-0.5 flex items-center gap-2 font-mono text-[0.55rem] text-muted-foreground">
                        <span className={`${listing.status === 'active' ? 'text-cyan' : 'text-coral'}`}>
                          {listing.status}
                        </span>
                        &middot; {formatPrice(listing.priceCents)}
                        &middot; {listing.type}
                      </p>
                    </div>
                    <span className="font-mono text-[0.5rem] text-muted-foreground">
                      {formatRelativeTime(listing.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <HudStatusRail />
      </main>
    </>
  );
}
