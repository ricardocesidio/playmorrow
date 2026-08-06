'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Ticket } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/api/auth-context';
import { api, ApiError } from '@/lib/api/client';
import { TicketCard } from '@/components/support/ticket-card';
import { type SupportTicket, type SupportTicketStatus } from '@/lib/api/support-types';

const FILTER_TABS: { key: string; label: string; status?: SupportTicketStatus }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open', status: 'OPEN' },
  { key: 'waiting', label: 'Waiting', status: 'WAITING_CUSTOMER' },
  { key: 'resolved', label: 'Resolved', status: 'RESOLVED' },
  { key: 'closed', label: 'Closed', status: 'CLOSED' },
];

interface TicketsResponse {
  items: SupportTicket[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export default function MyTicketsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const pageSize = 20;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/support/tickets');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter]);

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const data = await api.get<TicketsResponse>(`/support/tickets?${params}`);
      setTickets(data.items);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof ApiError) {
        setError('Failed to load tickets.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020609]">
        <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    );
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="relative min-h-screen bg-[#020609]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
      <SiteHeader />

      <main className="relative mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/support"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground hover:text-cyan"
        >
          <ArrowLeft className="size-4" /> Back to support
        </Link>

        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Ticket className="size-6 text-cyan" />
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">My Tickets</h1>
          </div>
          <Link href="/support/new">
            <Button>New Ticket</Button>
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex gap-4 border-b border-border/40">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setStatusFilter(tab.key); setPage(1); }}
              className={`pb-2 font-mono text-[0.6rem] uppercase tracking-widest transition-colors cursor-pointer ${
                statusFilter === tab.key
                  ? 'border-b-2 border-cyan text-cyan'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="clip-corner border border-border/40 panel p-4 animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 w-16 bg-border/30 rounded" />
                  <div className="h-3 w-12 bg-border/20 rounded" />
                </div>
                <div className="h-4 w-3/4 bg-border/30 rounded mb-1" />
                <div className="h-3 w-1/2 bg-border/20 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="clip-corner border border-coral/40 bg-coral/5 py-12 text-center">
            <p className="font-mono text-[0.65rem] text-coral">{error}</p>
            <Button onClick={fetchTickets} variant="outline" size="sm" className="mt-4">
              Try Again
            </Button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && tickets.length === 0 && (
          <div className="clip-corner border border-border/40 panel py-16 text-center">
            <Ticket className="mx-auto mb-3 size-10 text-muted-foreground/30" />
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground mb-4">
              {statusFilter === 'all' ? 'No tickets yet.' : 'No tickets with this status.'}
            </p>
            <Link href="/support/new">
              <Button variant="outline" size="sm">
                Create your first ticket
              </Button>
            </Link>
          </div>
        )}

        {/* List */}
        {!loading && !error && tickets.length > 0 && (
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                href={`/support/tickets/${ticket.id}`}
              />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  variant="outline" size="sm"
                >
                  Previous
                </Button>
                <span className="font-mono text-[0.55rem] text-muted-foreground/60">
                  Page {page} of {totalPages}
                </span>
                <Button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  variant="outline" size="sm"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

    </div>
  );
}
