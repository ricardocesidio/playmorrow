'use client';

import { DollarSign, TrendingUp, ShoppingCart, Percent } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { ErrorState } from '@/components/error-state';
import { CircuitFrame, HudPanel, HudStatusRail } from '@/components/playmorrow/hud';
import { useAuth } from '@/lib/api/auth-context';
import { useRevenue } from '@/lib/api/hooks';
import { formatPrice } from '@/lib/format';

export default function RevenueDashboardPage() {
  const { user } = useAuth();
  const { data: studios, isLoading, error } = useRevenue();

  if (!user) return null;

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
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="clip-corner h-24 animate-pulse border border-border/40 bg-[#050b0f]/30" />
              ))}
            </div>
          )}

          {!isLoading && studios && studios.length === 0 && (
            <div className="clip-corner border border-border/40 bg-[#050b0f]/30 py-16 text-center">
              <DollarSign className="mx-auto mb-3 size-10 text-muted-foreground/30" />
              <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                No sales yet. Publish your first Marketplace listing.
              </p>
            </div>
          )}

          {!isLoading && studios && studios.length > 0 && (
            <div className="space-y-6">
              {studios.map((s) => (
                <div key={s.studio.id} className="clip-corner border border-border/40 bg-[#050b0f]/30 p-4">
                  <h2 className="font-display text-sm font-black uppercase text-cyan">{s.studio.name}</h2>

                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="border border-border/60 bg-background/40 p-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ShoppingCart className="size-3" />
                        <span className="font-mono text-[0.5rem] uppercase tracking-widest">Sales</span>
                      </div>
                      <p className="mt-1 font-mono text-lg text-foreground">{s.totalSales}</p>
                    </div>

                    <div className="border border-border/60 bg-background/40 p-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="size-3" />
                        <span className="font-mono text-[0.5rem] uppercase tracking-widest">Revenue</span>
                      </div>
                      <p className="mt-1 font-mono text-lg text-cyan">{formatPrice(s.totalRevenue)}</p>
                    </div>

                    <div className="border border-border/60 bg-background/40 p-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Percent className="size-3" />
                        <span className="font-mono text-[0.5rem] uppercase tracking-widest">Fees</span>
                      </div>
                      <p className="mt-1 font-mono text-lg text-coral">{formatPrice(s.totalFees)}</p>
                    </div>

                    <div className="border border-border/60 bg-background/40 p-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="size-3" />
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
