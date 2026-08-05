'use client';

import { useState } from 'react';
import { Handshake, ExternalLink } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';
import { CircuitFrame, HudPanel, HudStatusRail } from '@/components/playmorrow/hud';
import { usePartners } from '@/lib/api/hooks';

const TABS = [
  { key: '', label: 'All' },
  { key: 'UNIVERSITY', label: 'Universities' },
  { key: 'PUBLISHER', label: 'Publishers' },
  { key: 'ACCELERATOR', label: 'Accelerators' },
  { key: 'STUDIO', label: 'Studios' },
];

export default function PartnersPage() {
  const [type, setType] = useState('');

  const { data, isLoading, error } = usePartners(type || undefined);

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 pb-28 pt-4 sm:px-8 lg:px-10">
        <CircuitFrame className="opacity-70" />
        <div className="relative z-10 mx-auto max-w-5xl">
          <HudPanel className="mb-3 px-4 py-3 sm:px-8 sm:py-4" accent="muted">
            <h1 className="font-display text-2xl font-black uppercase text-foreground">Partner Network</h1>
            <p className="mt-1 text-sm text-muted-foreground">Universities, publishers, accelerators, and studios powering the ecosystem.</p>
          </HudPanel>

          <div role="tablist" aria-label="Partner type filter" className="mb-4 flex gap-4 border-b border-border/40">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => setType(tab.key)} role="tab" aria-selected={type === tab.key}
                className={`pb-2 font-mono text-[0.6rem] uppercase tracking-widest transition-colors focus-visible:ring-2 focus-visible:ring-cyan ${
                  type === tab.key ? 'border-b-2 border-cyan text-cyan' : 'text-muted-foreground hover:text-foreground'
                }`}>{tab.label}</button>
            ))}
          </div>

          {isLoading ? (
            <div role="status" aria-busy="true" aria-live="polite" className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="clip-corner h-20 animate-pulse border border-border/40 bg-[#050b0f]/30" />
              ))}
            </div>
          ) : error ? (
            <ErrorState message="Failed to load partners." />
          ) : (
            <div className="space-y-3">
              {data?.items.map((p) => (
                <div key={p.id} className="clip-corner border border-border/40 bg-[#050b0f]/30 p-4 transition hover:border-cyan/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center border border-border bg-background/60">
                        <Handshake aria-hidden="true" className="size-5 text-cyan" />
                      </div>
                      <div>
                        <h3 className="font-display text-sm font-black uppercase text-foreground">{p.name}</h3>
                        <p className="font-mono text-[0.5rem] text-muted-foreground">{p.type}</p>
                      </div>
                    </div>
                    {p.websiteUrl && (
                      <a href={p.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-cyan focus-visible:ring-2 focus-visible:ring-cyan" aria-label={`Visit ${p.name} website`}>
                        <ExternalLink aria-hidden="true" className="size-4" />
                      </a>
                    )}
                  </div>
                  {p.description && <p className="mt-2 text-xs text-foreground/70">{p.description}</p>}
                </div>
              ))}
              {data && data.items.length === 0 && (
                <EmptyState title="No partners found" />
              )}
            </div>
          )}
        </div>
        <HudStatusRail />
      </main>
    </>
  );
}
