'use client';

import { useState } from 'react';
import Link from 'next/link';
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
      <main className="mx-auto max-w-5xl flex-1 px-4 py-8 lg:px-6 lg:py-10">
        <div className="mb-6 flex items-center gap-3">
          <ShieldAlert className="size-6 text-coral" />
          <h1 className="font-display text-2xl font-semibold">Moderation Reports</h1>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 border border-border bg-elevated p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setStatus(tab.key); setPage(1); }}
              className={`flex-1 px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${
                status === tab.key ? 'bg-coral/10 text-coral' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse border border-border bg-elevated" />
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 border border-border bg-elevated py-16">
            <ShieldAlert className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No {status === 'all' ? '' : status.toLowerCase()} reports.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data?.items.map((report) => (
              <Link
                key={report.id}
                href={`/dashboard/reports/${report.id}`}
                className="flex items-center gap-4 border border-border bg-elevated p-4 transition-colors hover:border-border-bright"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-display font-semibold">{report.reason}</span>
                    <span className={`font-mono text-[10px] uppercase tracking-widest ${
                      report.status === 'OPEN' ? 'text-amber' : report.status === 'RESOLVED' ? 'text-cyan' : 'text-muted-foreground'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {report.targetType} · by {report.reporter.displayName}
                  </p>
                  {report.details && <p className="mt-1 text-xs text-muted-foreground/60 line-clamp-1">{report.details}</p>}
                </div>
                <span className="font-mono text-[10px] text-muted-foreground/60">
                  {new Date(report.createdAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground disabled:opacity-30">
              <ChevronLeft className="size-3" /> Previous
            </button>
            <span className="font-mono text-xs text-muted-foreground">{page} / {totalPages}</span>
            <button disabled={!data?.hasMore} onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground disabled:opacity-30">
              Next <ChevronRight className="size-3" />
            </button>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
