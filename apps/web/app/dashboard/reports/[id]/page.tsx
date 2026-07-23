'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, X } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { useAdminReport, useUpdateReport } from '@/lib/api/hooks';

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'border border-amber/30 text-amber bg-amber/5',
  RESOLVED: 'border border-cyan/30 text-cyan bg-cyan/5',
  DISMISSED: 'border border-border/40 text-muted-foreground bg-muted/20',
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
    return (
      <>
        <SiteHeader />
        <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
          <div className="relative mx-auto max-w-3xl">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="clip-corner h-16 animate-pulse border border-border/40 bg-[#050b0f]/30" />
              ))}
            </div>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (!report) {
    return (
      <>
        <SiteHeader />
        <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
          <div className="relative mx-auto max-w-3xl">
            <div className="clip-corner border border-border/40 bg-[#050b0f]/30 py-16 text-center">
              <p className="font-mono text-[0.6rem] text-muted-foreground">Report not found.</p>
            </div>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
        {/* Grid overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        {/* Top accent line */}
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

        <div className="relative mx-auto max-w-3xl">
          <Link href="/dashboard/reports" className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan">
            <ArrowLeft className="size-3" /> Back to reports
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">{report.reason}</h1>
              <p className="mt-1 font-mono text-[0.6rem] text-muted-foreground">
                {report.targetType} · reported by {report.reporter.displayName}
              </p>
            </div>
            <span className={`clip-corner px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider ${STATUS_STYLES[report.status] ?? ''}`}>
              {report.status}
            </span>
          </div>

          {report.details && (
            <div className="clip-corner mt-6 border border-border/60 bg-[#050b0f]/50 p-4">
              <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Details</p>
              <p className="mt-2 font-mono text-[0.55rem] text-foreground whitespace-pre-wrap">{report.details}</p>
            </div>
          )}

          <div className="mt-4 flex gap-4 font-mono text-[0.55rem] text-muted-foreground/60">
            <span>Reported: {new Date(report.createdAt).toLocaleString()}</span>
            {report.resolvedAt && <span>Resolved: {new Date(report.resolvedAt).toLocaleString()}</span>}
          </div>

          {report.status === 'OPEN' && (
            <div className="clip-corner mt-8 border border-border/60 bg-[#050b0f]/50 p-4">
              <p className="mb-3 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Resolution note</p>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Add a note about this resolution (optional)"
                rows={3}
                className="clip-corner w-full border border-border/60 bg-[#050b0f]/50 px-3 py-2 font-mono text-[0.55rem] text-foreground placeholder:text-muted-foreground/40 focus:border-cyan focus:outline-none"
              />
              <div className="mt-4 flex gap-3">
                <Button onClick={handleResolve} disabled={updateReport.isPending}>
                  <Check className="size-3" /> Resolve
                </Button>
                <Button onClick={handleDismiss} disabled={updateReport.isPending} variant="outline">
                  <X className="size-3" /> Dismiss
                </Button>
              </div>
            </div>
          )}

          {report.resolutionNote && (
            <div className="clip-corner mt-4 border border-border/60 bg-[#050b0f]/50 p-4">
              <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                {report.status === 'RESOLVED' ? 'Resolution' : 'Dismissal'} note
              </p>
              <p className="mt-2 font-mono text-[0.55rem] text-foreground">{report.resolutionNote}</p>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
