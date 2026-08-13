'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Store, ArrowRight } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { ErrorState } from '@/components/error-state';
import { CircuitFrame, HudPanel, HudStatusRail } from '@/components/playmorrow/hud';
import { Button } from '@/components/ui/button';
import { useMarketplaceListings } from '@/lib/api/hooks';
import { formatPrice } from '@/lib/format';

const TYPE_LABELS: Record<string, string> = {
  ASSET: 'Asset', GAME: 'Game', SERVICE: 'Service', PLUGIN: 'Plugin',
};

const TABS = [
  { key: '', label: 'All' },
  { key: 'ASSET', label: 'Assets' },
  { key: 'GAME', label: 'Games' },
  { key: 'SERVICE', label: 'Services' },
  { key: 'PLUGIN', label: 'Plugins' },
];

export default function MarketplacePage() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || '';
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useMarketplaceListings(type || undefined, page);

  const items = data?.items ?? [];

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 pb-28 pt-4 sm:px-8 lg:px-10">
        <CircuitFrame className="opacity-70" />
        <div className="relative z-10 mx-auto max-w-[1448px]">
          <HudPanel className="mb-3 px-4 py-3 sm:px-8 sm:py-4" accent="muted">
            <div className="flex flex-wrap items-end justify-between gap-5 border-b border-border/55 pb-2">
              <div>
                <h1 className="font-display text-[2.55rem] font-black uppercase leading-[0.9] text-foreground sm:text-5xl lg:text-[3.28rem]">
                  Marketplace
                </h1>
                <p className="mt-2 text-sm leading-none text-muted-foreground sm:text-base">
                  Discover the assets, tools, and services trusted by independent game developers.
                </p>
              </div>
            </div>

            <div role="tablist" className="mt-4 flex gap-4 border-b border-border/40">
              {TABS.map((tab) => (
                <Link
                  key={tab.key}
                  href={tab.key ? `/marketplace?type=${tab.key}` : '/marketplace'}
                  role="tab"
                  aria-selected={type === tab.key}
                  className={`pb-2 font-mono text-[0.6rem] uppercase tracking-widest transition-colors focus-visible:ring-2 focus-visible:ring-cyan ${
                    type === tab.key
                      ? 'border-b-2 border-cyan text-cyan'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </HudPanel>

          <div aria-live="polite">
            {error && !isLoading && <ErrorState message="Failed to load marketplace." />}

            {isLoading && (
              <div role="status" aria-busy="true" aria-live="polite" className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="clip-corner border border-border/60 bg-background/60 p-3">
                    <div className="mb-3 h-28 animate-pulse bg-white/10" />
                    <div className="h-3 w-2/3 animate-pulse bg-white/10" />
                    <div className="mt-2 h-3 w-1/2 animate-pulse bg-white/10" />
                  </div>
                ))}
              </div>
            )}

            {!isLoading && !error && items.length === 0 && (
              <div className="relative flex flex-col items-center gap-4 overflow-hidden border border-border/60 bg-muted/10 py-16 grayscale shadow-[inset_0_0_90px_rgb(0_0_0_/_0.45),0_0_30px_rgb(0_0_0_/_0.25)] panel">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgb(255_255_255_/_0.025)_48%,transparent_50%)]" aria-hidden="true" />
                <div className="relative flex size-16 items-center justify-center border border-border/70 bg-background/60 text-muted-foreground/45 shadow-[0_0_24px_rgb(0_0_0_/_0.35)]" aria-hidden="true">
                  <Store className="size-7" />
                  <span className="absolute -right-2 -top-2 border border-border/80 bg-background px-2 py-1 font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground/70">
                    Locked
                  </span>
                </div>
                <span className="relative border border-border/70 bg-background/70 px-3 py-1 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground">
                  Coming Soon
                </span>
                <p className="relative font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground/60">
                  <span className="animate-blink mr-2 inline-block h-3 w-2 bg-muted-foreground/50 align-middle" aria-hidden="true" />
                  NO DATA DETECTED
                </p>
                <p className="relative font-display text-lg font-semibold text-muted-foreground">
                  No listings yet
                </p>
                <p className="relative max-w-md text-center text-sm text-muted-foreground/60">
                  Marketplace inventory is being prepared.
                </p>
                <Link
                  href="/games"
                  className="relative mt-2 clip-corner border border-border/70 bg-background/40 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-muted-foreground transition hover:border-cyan/60 hover:text-cyan"
                >
                  Browse games
                </Link>
              </div>
            )}

            {!isLoading && items.length > 0 && (
              <>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((listing) => (
                    <Link
                      key={listing.id}
                      href={`/marketplace/${listing.id}`}
                      className="group panel relative flex min-h-[200px] flex-col overflow-hidden border-border/90 bg-[linear-gradient(135deg,rgb(62_231_255_/_0.06),rgb(166_92_255_/_0.04),rgb(255_87_77_/_0.03))] transition duration-200 hover:border-cyan/70"
                    >
                      <div className="relative flex h-32 items-center justify-center bg-muted">
                        {listing.thumbnailUrl ? (
                          <img src={listing.thumbnailUrl} alt={listing.title} className="size-full object-cover" />
                        ) : (
                          <Store aria-hidden="true" className="size-10 text-muted-foreground/30" />
                        )}
                        <div className="absolute left-2 top-2">
                          <span className="bg-cyan/90 px-2 py-0.5 font-mono text-[0.55rem] uppercase text-white">
                            {TYPE_LABELS[listing.type] || listing.type}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col border-t border-border/80 p-3">
                        <h3 className="font-display text-sm font-black uppercase leading-none text-foreground transition-colors group-hover:text-cyan">
                          {listing.title}
                        </h3>
                        <p className="mt-1 font-mono text-[0.5rem] text-muted-foreground">
                          {listing.studio.name}
                        </p>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <span className="font-mono text-xs text-cyan">
                            {formatPrice(listing.priceCents)}
                          </span>
                          <ArrowRight aria-hidden="true" className="size-3 text-muted-foreground transition group-hover:text-cyan" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {data?.hasMore && (
                  <div className="mt-6 text-center">
                    <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={isLoading}>
                      {isLoading ? 'Loading...' : 'Load More'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <HudStatusRail />
      </main>
    </>
  );
}
