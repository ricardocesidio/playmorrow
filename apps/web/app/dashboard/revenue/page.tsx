'use client';

import { DollarSign, TrendingUp, ShoppingCart, Percent } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { CircuitFrame, HudPanel, HudStatusRail } from '@/components/playmorrow/hud';
import { useRevenue } from '@/lib/api/hooks';
import { formatPrice } from '@/lib/format';

export default function RevenueDashboardPage() {
  const { data: studios, isLoading, error } = useRevenue();

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 pb-28 pt-4 sm:px-8 lg:px-10">
        <CircuitFrame className="opacity-70" />
        <div className="relative z-10 mx-auto max-w-5xl">
          <HudPanel className="mb-3 px-4 py-3 sm:px-8 sm:py-4" accent="muted">
            <h1 className="font-display text-2xl font-black uppercase text-foreground">Revenue Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sales, earnings, and payouts across your studios.</p>
          </HudPanel>

          {error && !isLoading && <ErrorState message="Failed to load revenue data." />}

          {isLoading && (
            <div className="space-y-3" role="status" aria-busy="true" aria-label="Loading revenue">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="clip-corner h-24 animate-pulse border border-border/40 panel" />
              ))}
            </div>
          )}

          {!isLoading && studios && studios.length === 0 && (
            <EmptyState title="No sales yet" action={{ label: 'Create listing', href: '/dashboard/marketplace/new' }} />
          )}

          {!isLoading && studios && studios.length > 0 && (
            <div className="space-y-6">
              {studios.map((s) => (
                <div key={s.studio.id} className="clip-corner border border-border/40 panel p-4">
                  <h2 className="font-display text-sm font-black uppercase text-cyan">{s.studio.name}</h2>

                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="border border-border/60 bg-background/40 p-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ShoppingCart className="size-3" aria-hidden="true" />
                        <span className="font-mono text-[0.5rem] uppercase tracking-widest">Sales</span>
                      </div>
                      <p className="mt-1 font-mono text-lg text-foreground">{s.totalSales}</p>
                    </div>

                    <div className="border border-border/60 bg-background/40 p-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="size-3" aria-hidden="true" />
                        <span className="font-mono text-[0.5rem] uppercase tracking-widest">Revenue</span>
                      </div>
                      <p className="mt-1 font-mono text-lg text-cyan">{formatPrice(s.totalRevenue)}</p>
                    </div>

                    <div className="border border-border/60 bg-background/40 p-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Percent className="size-3" aria-hidden="true" />
                        <span className="font-mono text-[0.5rem] uppercase tracking-widest">Fees</span>
                      </div>
                      <p className="mt-1 font-mono text-lg text-coral">{formatPrice(s.totalFees)}</p>
                    </div>

                    <div className="border border-border/60 bg-background/40 p-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="size-3" aria-hidden="true" />
                        <span className="font-mono text-[0.5rem] uppercase tracking-widest">Net</span>
                      </div>
                      <p className="mt-1 font-mono text-lg text-green-400">{formatPrice(s.netRevenue)}</p>
                    </div>
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
