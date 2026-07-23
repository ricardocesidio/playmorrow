'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { useAdminReports } from '@/lib/api/hooks';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'DISMISSED', label: 'Dismissed' },
] as const;

export default function AdminReportsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const { data, isLoading } = useAdminReports(page, 20, status);

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 py-6 sm:px-8 lg:px-10">
        {/* Grid overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        {/* Top accent line */}
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

        <div className="relative mx-auto max-w-5xl">
          <div className="mb-6 flex items-center gap-3">
            <ShieldAlert className="size-6 text-cyan" />
            <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Moderation Reports</h1>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-4 border-b border-border/40">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setStatus(tab.key); setPage(1); }}
                className={`pb-2 font-mono text-[0.6rem] uppercase tracking-widest transition-colors ${
                  status === tab.key ? 'border-b-2 border-cyan text-cyan' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="clip-corner h-16 animate-pulse border border-border/40 bg-[#050b0f]/30" />
              ))}
            </div>
          ) : data?.items.length === 0 ? (
            <div className="clip-corner border border-border/40 bg-[#050b0f]/30 py-16 text-center">
              <ShieldAlert className="mx-auto mb-3 size-10 text-muted-foreground/30" />
              <p className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                No {status === 'all' ? '' : status.toLowerCase()} reports.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {data?.items.map((report) => (
                <Link
                  key={report.id}
                  href={`/dashboard/reports/${report.id}`}
                  className="clip-corner flex items-center gap-4 border border-border/60 bg-[#050b0f]/50 p-4 transition-colors hover:border-cyan/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-display font-semibold text-foreground">{report.reason}</span>
                      <span className={`clip-corner px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider ${
                        report.status === 'OPEN' ? 'border border-amber/30 text-amber bg-amber/5' : report.status === 'RESOLVED' ? 'border border-cyan/30 text-cyan bg-cyan/5' : 'border border-border/40 text-muted-foreground bg-muted/20'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-[0.6rem] text-muted-foreground">
                      {report.targetType} · by {report.reporter.displayName}
                    </p>
                    {report.details && <p className="mt-1 font-mono text-[0.55rem] text-muted-foreground/60 line-clamp-1">{report.details}</p>}
                  </div>
                  <span className="font-mono text-[0.55rem] text-muted-foreground/60">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                variant="outline" size="sm">
                <ChevronLeft className="size-3" /> Previous
              </Button>
              <span className="font-mono text-[0.55rem] text-muted-foreground/60">{page} / {totalPages}</span>
              <Button disabled={!data?.hasMore} onClick={() => setPage((p) => p + 1)}
                variant="outline" size="sm">
                Next <ChevronRight className="size-3" />
              </Button>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
