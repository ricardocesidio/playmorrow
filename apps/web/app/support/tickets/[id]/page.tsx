'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/api/auth-context';
import { api, ApiError } from '@/lib/api/client';
import { formatRelativeTime } from '@/lib/format';
import {
  type SupportTicket,
  type SupportReply,
  STATUS_BADGE_COLORS,
  PRIORITY_BADGE_COLORS,
  DEPARTMENT_LABELS,
} from '@/lib/api/support-types';

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<SupportReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/login?redirect=/support/tickets/${params.id}`);
    }
  }, [authLoading, isAuthenticated, router, params.id]);

  useEffect(() => {
    if (params.id) fetchTicket();
  }, [params.id]);

  const fetchTicket = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<SupportTicket>(`/support/tickets/${params.id}`);
      setTicket(data);
      setReplies(data.replies ?? []);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError('Ticket not found.');
        } else {
          setError('Failed to load ticket.');
        }
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) {
      toast.error('Please enter a reply.');
      return;
    }

    setSubmitting(true);
    try {
      const newReply = await api.post<SupportReply>(
        `/support/tickets/${params.id}/replies`,
        { body: replyBody.trim() },
      );
      setReplies((prev) => [...prev, newReply]);
      setReplyBody('');
      toast.success('Reply sent.');
    } catch (err: unknown) {
      if (err instanceof ApiError && err.body && typeof err.body === 'object') {
        const body = err.body as Record<string, unknown>;
        const msg = Array.isArray(body.message)
          ? (body.message as string[]).join(', ')
          : typeof body.message === 'string'
            ? body.message
            : 'Failed to send reply.';
        toast.error(msg);
      } else {
        toast.error('Failed to send reply.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020609]">
        <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen bg-[#020609]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
        <SiteHeader />
        <main className="relative mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="font-mono text-[0.65rem] text-coral mb-4">{error}</p>
          <Link href="/support/tickets">
            <Button variant="outline">Back to tickets</Button>
          </Link>
        </main>
      </div>
    );
  }

  if (!ticket) return null;

  const statusColor = STATUS_BADGE_COLORS[ticket.status];
  const priorityColor = PRIORITY_BADGE_COLORS[ticket.priority];

  return (
    <div className="relative min-h-screen bg-[#020609]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
      <SiteHeader />

      <main className="relative mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/support/tickets"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground hover:text-cyan"
        >
          <ArrowLeft className="size-4" /> Back to tickets
        </Link>

        {/* Ticket Header */}
        <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[0.5rem] text-muted-foreground/50">
              #{ticket.ticketNumber}
            </span>
            <span className={`clip-corner border px-1.5 py-0.5 font-mono text-[0.45rem] uppercase tracking-wider ${statusColor}`}>
              {ticket.status.replace(/_/g, ' ')}
            </span>
            <span className={`clip-corner border px-1.5 py-0.5 font-mono text-[0.45rem] uppercase tracking-wider ${priorityColor}`}>
              {ticket.priority}
            </span>
            <span className="font-mono text-[0.45rem] text-muted-foreground/50">
              {DEPARTMENT_LABELS[ticket.department]}
            </span>
          </div>

          <h1 className="mb-4 font-display text-2xl font-black uppercase tracking-tight text-white">
            {ticket.title}
          </h1>

          <div className="flex items-center gap-2 border-b border-border/40 pb-4 mb-4">
            <div className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
              {ticket.author.avatarUrl ? (
                <img src={ticket.author.avatarUrl} alt="" className="size-full rounded-full object-cover" />
              ) : (
                ticket.author.displayName.slice(0, 1).toUpperCase()
              )}
            </div>
            <span className="font-mono text-[0.55rem] text-muted-foreground">
              {ticket.author.displayName}
            </span>
            <span className="font-mono text-[0.5rem] text-muted-foreground/40">
              {formatRelativeTime(ticket.createdAt)}
            </span>
            {ticket.assignedTo && (
              <span className="ml-auto font-mono text-[0.5rem] text-muted-foreground/40">
                Assigned to {ticket.assignedTo.displayName}
              </span>
            )}
          </div>

          {/* Original body */}
          <div className="whitespace-pre-wrap font-mono text-[0.6rem] leading-relaxed text-foreground/80">
            {ticket.body}
          </div>
        </div>

        {/* Replies */}
        <div className="mt-6 space-y-4">
          <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan">
            Replies ({replies.length})
          </h2>

          {replies.length === 0 && (
            <div className="clip-corner border border-border/40 bg-[#050b0f]/30 py-8 text-center">
              <p className="font-mono text-[0.6rem] text-muted-foreground">
                No replies yet. A support agent will respond shortly.
              </p>
            </div>
          )}

          {replies.map((reply) => {
            const isStaff = reply.isStaff;
            const isOwn = user?.id === reply.authorId;
            return (
              <div
                key={reply.id}
                className={`clip-corner border p-4 ${
                  isStaff
                    ? 'border-cyan/20 bg-cyan/[0.02]'
                    : 'border-border/50 bg-[#050b0f]/40'
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-full bg-muted text-[8px] font-bold text-muted-foreground">
                    {reply.author.avatarUrl ? (
                      <img src={reply.author.avatarUrl} alt="" className="size-full rounded-full object-cover" />
                    ) : (
                      reply.author.displayName.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <span className="font-mono text-[0.55rem] font-semibold text-foreground">
                    {reply.author.displayName}
                  </span>
                  {isStaff && (
                    <span className="clip-corner border border-cyan/30 bg-cyan/5 px-1.5 py-0.5 font-mono text-[0.4rem] uppercase tracking-wider text-cyan">
                      Staff
                    </span>
                  )}
                  {isOwn && (
                    <span className="font-mono text-[0.45rem] text-muted-foreground/50">
                      (you)
                    </span>
                  )}
                  <span className="ml-auto font-mono text-[0.45rem] text-muted-foreground/40">
                    {formatRelativeTime(reply.createdAt)}
                  </span>
                </div>
                <div className="whitespace-pre-wrap font-mono text-[0.55rem] leading-relaxed text-foreground/80">
                  {reply.body}
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply Form */}
        <form onSubmit={handleReply} className="mt-6">
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <label htmlFor="reply" className="mb-2 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
              Add a reply
            </label>
            <textarea
              id="reply"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              className="clip-corner h-32 w-full resize-y border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]"
              placeholder="Type your reply here..."
              maxLength={5000}
            />
            <p className="mt-1 text-right font-mono text-[0.5rem] text-muted-foreground/50">{replyBody.length}/5000</p>
          </div>
          <Button
            type="submit"
            disabled={submitting || !replyBody.trim()}
            className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="size-4" />
                Send Reply
              </>
            )}
          </Button>
        </form>
      </main>

    </div>
  );
}
