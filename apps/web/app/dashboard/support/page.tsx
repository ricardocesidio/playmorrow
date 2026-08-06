'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Ticket, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { api, ApiError } from '@/lib/api/client';
import { TicketCard } from '@/components/support/ticket-card';
import {
  type SupportTicket,
  type SupportTicketStatus,
} from '@/lib/api/support-types';

interface TicketsResponse {
  items: SupportTicket[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface Metrics {
  open: number;
  waiting: number;
  resolved: number;
  total: number;
}

const FILTER_TABS: { key: string; label: string; status?: SupportTicketStatus }[] = [
  { key: 'all', label: 'All' },
  { key: 'OPEN', label: 'Open', status: 'OPEN' },
  { key: 'WAITING_SUPPORT', label: 'Waiting', status: 'WAITING_SUPPORT' },
  { key: 'WAITING_CUSTOMER', label: 'Awaiting Reply', status: 'WAITING_CUSTOMER' },
  { key: 'INVESTIGATING', label: 'Investigating', status: 'INVESTIGATING' },
  { key: 'RESOLVED', label: 'Resolved', status: 'RESOLVED' },
  { key: 'CLOSED', label: 'Closed', status: 'CLOSED' },
];

export default function AdminSupportPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [metrics, setMetrics] = useState<Metrics>({ open: 0, waiting: 0, resolved: 0, total: 0 });
  const pageSize = 20;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
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

      const data = await api.get<TicketsResponse>(`/admin/support/tickets?${params}`);
      setTickets(data.items);
      setTotal(data.total);

      const allData = await api.get<TicketsResponse>('/admin/support/tickets?pageSize=1');
      setMetrics({
        open: allData.total,
        waiting: 0,
        resolved: 0,
        total: allData.total,
      });
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

  const handleUpdateStatus = async (ticketId: string, status: SupportTicketStatus) => {
    try {
      await api.patch(`/admin/support/tickets/${ticketId}`, { status });
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status } : t)),
      );
      toast.success(`Ticket status updated to ${status.replace(/_/g, ' ')}`);
    } catch {
      toast.error('Failed to update ticket status.');
    }
  };

  const handleAssign = async (ticketId: string) => {
    try {
      await api.post(`/admin/support/tickets/${ticketId}/assign`);
      toast.success('Ticket assigned to you.');
      fetchTickets();
    } catch {
      toast.error('Failed to assign ticket.');
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

      <main className="relative mx-auto max-w-5xl px-6 py-10">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground hover:text-cyan"
        >
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Ticket className="size-6 text-cyan" />
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">
              Support Queue
            </h1>
          </div>
        </div>

        {/* Metrics */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="clip-corner border border-cyan/20 bg-cyan/[0.02] p-4 text-center">
            <Ticket className="mx-auto mb-1 size-5 text-cyan/60" />
            <p className="font-mono text-lg font-bold text-cyan">{metrics.total}</p>
            <p className="font-mono text-[0.45rem] uppercase tracking-wider text-muted-foreground/60">Total</p>
          </div>
          <div className="clip-corner border border-amber/20 bg-amber/[0.02] p-4 text-center">
            <Clock className="mx-auto mb-1 size-5 text-amber/60" />
            <p className="font-mono text-lg font-bold text-amber">{metrics.open}</p>
            <p className="font-mono text-[0.45rem] uppercase tracking-wider text-muted-foreground/60">Open</p>
          </div>
          <div className="clip-corner border border-violet/20 bg-violet/[0.02] p-4 text-center">
            <AlertTriangle className="mx-auto mb-1 size-5 text-violet/60" />
            <p className="font-mono text-lg font-bold text-violet">{metrics.waiting}</p>
            <p className="font-mono text-[0.45rem] uppercase tracking-wider text-muted-foreground/60">Waiting</p>
          </div>
          <div className="clip-corner border border-green/20 bg-green/[0.02] p-4 text-center">
            <CheckCircle className="mx-auto mb-1 size-5 text-green/60" />
            <p className="font-mono text-lg font-bold text-green">{metrics.resolved}</p>
            <p className="font-mono text-[0.45rem] uppercase tracking-wider text-muted-foreground/60">Resolved</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex flex-wrap gap-4 border-b border-border/40">
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
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
              {statusFilter === 'all' ? 'No tickets in the queue.' : 'No tickets with this status.'}
            </p>
          </div>
        )}

        {/* List with admin actions */}
        {!loading && !error && tickets.length > 0 && (
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="group relative">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <TicketCard
                      ticket={ticket}
                      href={`/support/tickets/${ticket.id}`}
                    />
                  </div>

                  {/* Admin actions */}
                  <div className="flex shrink-0 flex-col gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {ticket.assignedToId !== user?.id && (
                      <Button
                        onClick={() => handleAssign(ticket.id)}
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[0.45rem]"
                      >
                        Assign
                      </Button>
                    )}
                    {ticket.status !== 'RESOLVED' && (
                      <Button
                        onClick={() => handleUpdateStatus(ticket.id, 'RESOLVED')}
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[0.45rem] text-green hover:text-green"
                      >
                        Resolve
                      </Button>
                    )}
                    {ticket.status !== 'CLOSED' && (
                      <Button
                        onClick={() => handleUpdateStatus(ticket.id, 'CLOSED')}
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[0.45rem] text-muted-foreground"
                      >
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </div>
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
