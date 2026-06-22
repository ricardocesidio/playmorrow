'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, X } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { useAdminReport, useUpdateReport } from '@/lib/api/hooks';

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'border-amber/30 text-amber bg-amber/5',
  RESOLVED: 'border-cyan/30 text-cyan bg-cyan/5',
  DISMISSED: 'border-border text-muted-foreground bg-muted',
};

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: report, isLoading } = useAdminReport(id);
  const updateReport = useUpdateReport();
  const [resolutionNote, setResolutionNote] = useState('');

  const handleResolve = async () => {
    await updateReport.mutateAsync({ id, body: { status: 'RESOLVED', resolutionNote: resolutionNote || undefined } });
    router.refresh();
  };

  const handleDismiss = async () => {
    await updateReport.mutateAsync({ id, body: { status: 'DISMISSED', resolutionNote: resolutionNote || undefined } });
    router.refresh();
  };

  if (isLoading) {
    return <><SiteHeader /><main className="mx-auto max-w-3xl px-4 py-8"><LoadingSkeleton count={5} /></main><SiteFooter /></>;
  }

  if (!report) {
    return <><SiteHeader /><main className="mx-auto max-w-3xl px-4 py-8"><p className="text-sm text-muted-foreground">Report not found.</p></main><SiteFooter /></>;
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-8 lg:px-6 lg:py-10">
        <Link href="/dashboard/reports" className="mb-6 inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3" /> Back to reports
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold">{report.reason}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {report.targetType} · reported by {report.reporter.displayName}
            </p>
          </div>
          <span className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${STATUS_STYLES[report.status] ?? ''}`}>
            {report.status}
          </span>
        </div>

        {report.details && (
          <div className="mt-6 border border-border bg-elevated p-4">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Details</p>
            <p className="mt-2 text-sm whitespace-pre-wrap">{report.details}</p>
          </div>
        )}

        <div className="mt-4 flex gap-4 font-mono text-xs text-muted-foreground/60">
          <span>Reported: {new Date(report.createdAt).toLocaleString()}</span>
          {report.resolvedAt && <span>Resolved: {new Date(report.resolvedAt).toLocaleString()}</span>}
        </div>

        {report.status === 'OPEN' && (
          <div className="mt-8 border border-border bg-elevated p-4">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">Resolution note</p>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Add a note about this resolution (optional)"
              rows={3}
              className="w-full border border-input bg-background px-3 py-2 text-sm focus:border-cyan focus:outline-none"
            />
            <div className="mt-4 flex gap-3">
              <button onClick={handleResolve} disabled={updateReport.isPending}
                className="flex items-center gap-2 border border-cyan bg-cyan/10 px-4 py-2 font-mono text-xs uppercase tracking-widest text-cyan transition-colors hover:bg-cyan hover:text-cyan-foreground disabled:opacity-50">
                <Check className="size-3" /> Resolve
              </button>
              <button onClick={handleDismiss} disabled={updateReport.isPending}
                className="flex items-center gap-2 border border-border px-4 py-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50">
                <X className="size-3" /> Dismiss
              </button>
            </div>
          </div>
        )}

        {report.resolutionNote && (
          <div className="mt-4 border border-border bg-elevated p-4">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {report.status === 'RESOLVED' ? 'Resolution' : 'Dismissal'} note
            </p>
            <p className="mt-2 text-sm">{report.resolutionNote}</p>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
