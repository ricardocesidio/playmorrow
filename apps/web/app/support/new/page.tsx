'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/api/auth-context';
import { api, ApiError } from '@/lib/api/client';
import {
  type SupportDepartment,
  type SupportTicketPriority,
  type CreateTicketDto,
  type SupportTicket,
  DEPARTMENT_LABELS,
} from '@/lib/api/support-types';

const DEPARTMENTS: SupportDepartment[] = [
  'GENERAL', 'ACCOUNTS', 'TECHNICAL', 'STUDIO', 'PUBLISHING',
  'COMMUNITY', 'BUG_REPORT', 'FEATURE_REQUEST', 'LEGAL', 'SECURITY',
];

const PRIORITIES: { value: SupportTicketPriority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

export default function NewTicketPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState<SupportDepartment>(
    (searchParams.get('department') as SupportDepartment) || 'GENERAL',
  );
  const [priority, setPriority] = useState<SupportTicketPriority>('MEDIUM');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/support/new');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020609]">
        <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Title and description are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateTicketDto = {
        title: title.trim(),
        department,
        priority,
        body: body.trim(),
      };

      const ticket = await api.post<SupportTicket>('/support/tickets', payload);
      toast.success('Ticket created successfully.');
      router.push(`/support/tickets/${ticket.id}`);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.body && typeof err.body === 'object') {
        const body = err.body as Record<string, unknown>;
        const msg = Array.isArray(body.message)
          ? (body.message as string[]).join(', ')
          : typeof body.message === 'string'
            ? body.message
            : 'Failed to create ticket.';
        toast.error(msg);
      } else {
        toast.error('Failed to create ticket. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#020609]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
      <SiteHeader />

      <main className="relative mx-auto max-w-2xl px-6 py-10">
        <Link
          href="/support"
          className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground hover:text-cyan"
        >
          <ArrowLeft className="size-4" /> Back to support
        </Link>

        <h1 className="mb-8 mt-6 font-display text-3xl font-black uppercase tracking-tight text-white">
          Create a Ticket
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 sm:p-6 shadow-[0_0_30px_rgb(0_0_0_/_0.3)]">
            <div className="space-y-5">
              {/* Title */}
              <div>
                <label htmlFor="title" className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                  Title
                </label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of your issue"
                  className="h-11 shadow-[0_0_20px_rgb(62_231_255_/_0.15)]"
                  maxLength={200}
                />
              </div>

              {/* Department & Priority row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="department" className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                    Department
                  </label>
                  <select
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as SupportDepartment)}
                    className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {DEPARTMENT_LABELS[d]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as SupportTicketPriority)}
                    className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Body */}
              <div>
                <label htmlFor="body" className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                  Description
                </label>
                <textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="clip-corner h-48 w-full resize-y border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-cyan focus:shadow-[0_0_20px_rgb(62_231_255_/_0.15)]"
                  placeholder="Describe your issue in detail. Include steps to reproduce, expected behavior, and any relevant information."
                  maxLength={10000}
                />
                <p className="mt-1 text-right font-mono text-[0.5rem] text-muted-foreground/50">{body.length}/10000</p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="clip-corner inline-flex h-14 w-full cursor-pointer items-center justify-center gap-3 border border-cyan bg-cyan/10 px-7 font-mono text-xs uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background disabled:pointer-events-none disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="size-5" />
                Submit Ticket
              </>
            )}
          </Button>
        </form>
      </main>

      <SiteFooter />
    </div>
  );
}
