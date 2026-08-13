'use client';

import Link from 'next/link';
import { MapPin, Calendar } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { ErrorState } from '@/components/error-state';
import { CircuitFrame, HudPanel, HudStatusRail } from '@/components/playmorrow/hud';
import { useEvents } from '@/lib/api/hooks';
import { formatPrice } from '@/lib/format';

export default function EventsPage() {
  const { data, isLoading, error } = useEvents(true);

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
                  Events
                </h1>
                <p className="mt-2 text-sm leading-none text-muted-foreground sm:text-base">
                  Discover the game jams, showcases, and community gatherings shaping the indie scene.
                </p>
              </div>
              {data && (
                <div className="pm-micro text-muted-foreground">
                  <span className="text-cyan">{data.total.toLocaleString()}</span> events indexed
                </div>
              )}
            </div>
          </HudPanel>

          {error && !isLoading && <ErrorState message="Failed to load events." />}

          {isLoading && (
            <div role="status" aria-busy="true" aria-live="polite" className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="clip-corner h-24 animate-pulse border border-border/40 panel" />
              ))}
            </div>
          )}

          {!isLoading && data && data.items.length === 0 && (
            <div className="relative flex flex-col items-center gap-4 overflow-hidden border border-border/60 bg-muted/10 py-16 grayscale shadow-[inset_0_0_90px_rgb(0_0_0_/_0.45),0_0_30px_rgb(0_0_0_/_0.25)] panel">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgb(255_255_255_/_0.025)_48%,transparent_50%)]" aria-hidden="true" />
              <div className="relative flex size-16 items-center justify-center border border-border/70 bg-background/60 text-muted-foreground/45 shadow-[0_0_24px_rgb(0_0_0_/_0.35)]" aria-hidden="true">
                <Calendar className="size-7" />
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
                No upcoming events
              </p>
              <p className="relative max-w-md text-center text-sm text-muted-foreground/60">
                Event listings are being prepared.
              </p>
              <Link
                href="/games"
                className="relative mt-2 clip-corner border border-border/70 bg-background/40 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-muted-foreground transition hover:border-cyan/60 hover:text-cyan"
              >
                Browse games
              </Link>
            </div>
          )}

          {!isLoading && data && data.items.length > 0 && (
            <div className="space-y-3">
              {data.items.map((event: { id: string; title: string; slug: string; startDate: string; location: string | null; virtual: boolean; ticketPriceCents: number | null }) => (
                <Link key={event.id} href={`/events/${event.slug}`}
                  className="group clip-corner flex border border-border/40 panel p-4 transition hover:border-cyan/40 focus-visible:ring-2 focus-visible:ring-cyan">
                  <div className="mr-4 flex w-16 flex-col items-center justify-center border border-border bg-background/60 p-2">
                    <span className="font-mono text-lg font-bold text-cyan">
                      {new Date(event.startDate).getDate()}
                    </span>
                    <span className="font-mono text-[0.5rem] uppercase text-muted-foreground">
                      {new Date(event.startDate).toLocaleString('default', { month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-sm font-black uppercase text-foreground group-hover:text-cyan">
                      {event.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-3 font-mono text-[0.5rem] text-muted-foreground">
                      {event.location && <span className="flex items-center gap-1"><MapPin aria-hidden="true" className="size-3" />{event.location}</span>}
                      {event.virtual && <span className="text-cyan">Virtual</span>}
                    </div>
                    {event.ticketPriceCents != null && event.ticketPriceCents > 0 ? (
                      <p className="mt-1 font-mono text-xs text-cyan">{formatPrice(event.ticketPriceCents)}</p>
                    ) : (
                      <p className="mt-1 font-mono text-xs text-green-400">Free</p>
                    )}
                  </div>
                  <Calendar aria-hidden="true" className="size-4 self-center text-muted-foreground transition group-hover:text-cyan" />
                </Link>
              ))}
            </div>
          )}
        </div>
        <HudStatusRail />
      </main>
    </>
  );
}
