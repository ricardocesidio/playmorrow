'use client';

import Link from 'next/link';
import { CalendarDays, MapPin, Calendar } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { CircuitFrame, HudPanel, HudStatusRail } from '@/components/playmorrow/hud';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { formatPrice } from '@/lib/format';

export default function EventsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get<{ items: any[]; total: number }>('/events'),
  });

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 pb-28 pt-4 sm:px-8 lg:px-10">
        <CircuitFrame className="opacity-70" />
        <div className="relative z-10 mx-auto max-w-5xl">
          <HudPanel className="mb-3 px-4 py-3 sm:px-8 sm:py-4" accent="muted">
            <h1 className="font-display text-2xl font-black uppercase text-foreground">Events</h1>
            <p className="mt-1 text-sm text-muted-foreground">Game jams, showcases, and community events.</p>
          </HudPanel>

          {error && !isLoading && <ErrorState message="Failed to load events." />}

          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="clip-corner h-24 animate-pulse border border-border/40 bg-[#050b0f]/30" />
              ))}
            </div>
          )}

          {!isLoading && data && data.items.length === 0 && (
            <EmptyState title="No upcoming events" action={{ label: 'Browse games', href: '/games' }} />
          )}

          {!isLoading && data && data.items.length > 0 && (
            <div className="space-y-3">
              {data.items.map((event: any) => (
                <Link key={event.id} href={`/events/${event.slug}`}
                  className="group clip-corner flex border border-border/40 bg-[#050b0f]/30 p-4 transition hover:border-cyan/40">
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
                      {event.location && <span className="flex items-center gap-1"><MapPin className="size-3" />{event.location}</span>}
                      {event.virtual && <span className="text-cyan">Virtual</span>}
                    </div>
                    {event.ticketPriceCents != null && event.ticketPriceCents > 0 && (
                      <p className="mt-1 font-mono text-xs text-cyan">{formatPrice(event.ticketPriceCents)}</p>
                    )}
                    {event.ticketPriceCents === 0 && <p className="mt-1 font-mono text-xs text-green-400">Free</p>}
                  </div>
                  <Calendar className="size-4 self-center text-muted-foreground transition group-hover:text-cyan" />
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
