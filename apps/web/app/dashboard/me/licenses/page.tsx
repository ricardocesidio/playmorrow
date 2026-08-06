'use client';

import Link from 'next/link';
import { Download } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { CircuitFrame, HudPanel, HudStatusRail } from '@/components/playmorrow/hud';
import { useMyLicenses } from '@/lib/api/hooks';
import { Button } from '@/components/ui/button';

export default function MyLicensesPage() {
  const { data: licenses, isLoading, error } = useMyLicenses();

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 pb-28 pt-4 sm:px-8 lg:px-10">
        <CircuitFrame className="opacity-70" />
        <div className="relative z-10 mx-auto max-w-4xl">
          <HudPanel className="mb-3 px-4 py-3 sm:px-8 sm:py-4" accent="muted">
            <h1 className="font-display text-2xl font-black uppercase text-foreground">
              My Licenses
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything you&apos;ve purchased on the Marketplace.
            </p>
          </HudPanel>

          {error && !isLoading && <ErrorState message="Failed to load licenses." />}

          {isLoading && (
            <div role="status" aria-busy="true" aria-live="polite" className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="clip-corner h-20 animate-pulse border border-border/40 panel" />
              ))}
            </div>
          )}

          {!isLoading && !error && (!licenses || licenses.length === 0) && (
            <EmptyState
              title="No licenses yet"
              action={{ label: 'Browse Marketplace', href: '/marketplace' }}
            />
          )}

          {!isLoading && licenses && licenses.length > 0 && (
            <div className="space-y-3">
              {licenses.map((license) => (
                <div key={license.id} className="clip-corner border border-border/40 panel p-4 transition hover:border-cyan/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link href={`/marketplace/${license.listing.id}`} className="font-display text-sm font-black uppercase text-foreground hover:text-cyan focus-visible:ring-2 focus-visible:ring-cyan">
                        {license.listing.title}
                      </Link>
                      <p className="mt-0.5 font-mono text-[0.55rem] text-muted-foreground">
                        {license.listing.studio.name} &middot; {license.listing.type}
                      </p>
                    </div>
                    {license.listing.fileUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/api/marketplace/download/${license.listingId}`} rel="noopener noreferrer">
                          <Download aria-hidden="true" className="size-3" /> Download
                        </a>
                      </Button>
                    )}
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
