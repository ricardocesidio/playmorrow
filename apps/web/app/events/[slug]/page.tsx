'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, MapPin, ArrowLeft } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { ErrorState } from '@/components/error-state';
import { CircuitFrame, HudPanel, HudStatusRail } from '@/components/playmorrow/hud';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { formatPrice } from '@/lib/format';

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', slug],
    queryFn: () => api.get<any>(`/events/${slug}`),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <main className="flex min-h-screen items-center justify-center bg-[#020609]">
          <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
        </main>
      </>
    );
  }

  if (error || !event) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen bg-[#020609] px-5 py-6">
          <ErrorState message="Event not found." />
        </main>
      </>
    );
  }

  const startDate = new Date(event.startDate);

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 pb-28 pt-4 sm:px-8 lg:px-10">
        <CircuitFrame className="opacity-70" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <Link href="/events" className="mb-4 flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan">
            <ArrowLeft className="size-3" /> Back to events
          </Link>

          <HudPanel className="mb-3 px-4 py-3 sm:px-8 sm:py-4" accent="muted">
            <h1 className="font-display text-2xl font-black uppercase text-foreground">{event.title}</h1>

            <div className="mt-4 flex flex-wrap gap-4 font-mono text-[0.55rem] text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3 text-cyan" />
                {startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              {event.location && (
                <span className="flex items-center gap-1"><MapPin className="size-3 text-cyan" />{event.location}</span>
              )}
              {event.virtual && <span className="text-cyan">Virtual Event</span>}
            </div>

            {event.description && (
              <p className="mt-4 text-sm text-foreground/80">{event.description}</p>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
              <span className="font-mono text-lg text-cyan">
                {event.ticketPriceCents == null ? 'Free' :
                  event.ticketPriceCents === 0 ? 'Free' : formatPrice(event.ticketPriceCents)}
              </span>
              <Button>Register</Button>
            </div>
          </HudPanel>
        </div>
        <HudStatusRail />
      </main>
    </>
  );
}
