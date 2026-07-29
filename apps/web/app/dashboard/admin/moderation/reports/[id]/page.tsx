'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/api/auth-context';
import { toast } from 'sonner';
import {
  ArrowLeft, AlertTriangle, Shield, CheckCircle, XCircle,
  MessageSquare, User, FileText, Clock, Send,
} from 'lucide-react';

interface ReportDetail {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  status: string;
  resolutionNote: string | null;
  reporter: { id: string; username: string };
  createdAt: string;
  updatedAt: string;
}

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const isMod = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolution, setResolution] = useState<'RESOLVED' | 'DISMISSED'>('RESOLVED');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!id || !isMod) return;
    api.get<ReportDetail>(`/api/admin/reports/${id}`)
      .then(setReport)
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false));
  }, [id, isMod]);

  const resolveReport = async () => {
    if (!id) return;
    try {
      await api.patch(`/api/admin/reports/${id}`, { status: resolution, resolutionNote: note || undefined });
      toast.success(`Report ${resolution.toLowerCase()}`);
      setReport(prev => prev ? { ...prev, status: resolution, resolutionNote: note } : null);
    } catch {
      toast.error('Failed to update report');
    }
  };

  if (!isMod) {
    return (
      <div className="mx-auto max-w-[800px] px-5 py-12">
        <div className="clip-corner border border-coral/50 bg-coral/5 p-6 text-center">
          <Shield className="mx-auto size-10 text-coral" />
          <h1 className="mt-4 font-display text-xl font-black text-white">Access Denied</h1>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-6 animate-spin border border-cyan border-t-transparent" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-[800px] px-5 py-12">
        <div className="clip-corner border border-border bg-[#09161d] p-8 text-center">
          <XCircle className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-2 font-mono text-sm text-muted-foreground">Report not found</p>
          <button onClick={() => router.back()} className="mt-4 clip-corner border border-cyan/50 px-4 py-2 font-mono text-xs text-cyan">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-5 py-8 sm:px-8">
      <button onClick={() => router.push('/dashboard/admin/moderation')}
        className="mb-6 inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-cyan">
        <ArrowLeft className="size-4" /> Back to Moderation Center
      </button>

      <div className="clip-corner border border-border bg-[#09161d]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-coral" />
            <h1 className="font-display text-xl font-black text-white">Report Detail</h1>
          </div>
          <span className={`clip-corner px-3 py-1 font-mono text-[0.55rem] uppercase tracking-wider ${
            report.status === 'OPEN' ? 'bg-amber/10 text-amber border border-amber/30'
            : report.status === 'RESOLVED' ? 'bg-success/10 text-success border border-success/30'
            : 'bg-muted/10 text-muted-foreground border border-border/30'
          }`}>{report.status}</span>
        </div>

        {/* Content */}
        <div className="grid gap-6 p-5 sm:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Target Type</p>
              <p className="font-mono text-sm text-foreground">{report.targetType}</p>
            </div>
            <div>
              <p className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Target ID</p>
              <p className="break-all font-mono text-xs text-cyan">{report.targetId}</p>
            </div>
            <div>
              <p className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Reason</p>
              <p className="font-mono text-sm text-coral">{report.reason}</p>
            </div>
            <div>
              <p className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Reported by</p>
              <p className="font-mono text-sm text-foreground">{report.reporter.username}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Created</p>
              <p className="font-mono text-sm text-foreground">{new Date(report.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Last Updated</p>
              <p className="font-mono text-sm text-foreground">{new Date(report.updatedAt).toLocaleString()}</p>
            </div>
            {report.details && (
              <div>
                <p className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Details</p>
                <p className="mt-1 font-mono text-sm text-muted-foreground">{report.details}</p>
              </div>
            )}
          </div>
        </div>

        {/* Details (full width) */}
        {report.details && (
          <div className="border-t border-border/60 px-5 py-4">
            <p className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Additional Details</p>
            <p className="mt-2 font-mono text-sm text-muted-foreground">{report.details}</p>
          </div>
        )}

        {/* Resolution Note (if resolved) */}
        {report.resolutionNote && (
          <div className="border-t border-border/60 px-5 py-4">
            <p className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Resolution Note</p>
            <p className="mt-2 font-mono text-sm text-cyan">{report.resolutionNote}</p>
          </div>
        )}

        {/* Actions (only for OPEN reports) */}
        {report.status === 'OPEN' && (
          <div className="border-t border-border/60 p-5">
            <h3 className="font-mono text-xs uppercase tracking-widest text-cyan">Resolve Report</h3>
            <div className="mt-3 flex gap-3">
              {(['RESOLVED', 'DISMISSED'] as const).map(r => (
                <button key={r} onClick={() => setResolution(r)}
                  className={`clip-corner border px-4 py-2 font-mono text-xs uppercase tracking-wider transition ${
                    resolution === r
                      ? r === 'RESOLVED'
                        ? 'border-success/50 bg-success/10 text-success'
                        : 'border-border/60 bg-background/40 text-foreground'
                      : 'border-border/40 text-muted-foreground hover:border-cyan/30'
                  }`}>
                  {r === 'RESOLVED' ? <CheckCircle className="mr-1 inline size-3" /> : <XCircle className="mr-1 inline size-3" />}
                  {r}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="Resolution note (optional)..."
                className="clip-corner h-20 w-full border border-border bg-background/80 p-3 font-mono text-sm text-foreground outline-none" />
            </div>
            <button onClick={resolveReport}
              className="mt-3 clip-corner border border-cyan/50 bg-cyan/5 px-5 py-2 font-mono text-xs text-cyan hover:bg-cyan/10">
              <Send className="mr-1 inline size-3" /> Submit Resolution
            </button>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <a href={`/api/admin/moderation/users/${report.targetId}`} target="_blank" rel="noopener noreferrer"
          className="clip-corner flex items-center gap-3 border border-border/60 bg-[#09161d]/60 p-4 transition hover:border-cyan/30">
          <User className="size-5 text-cyan" />
          <div>
            <p className="font-mono text-xs font-semibold text-foreground">View User</p>
            <p className="font-mono text-[0.55rem] text-muted-foreground">Check user moderation status</p>
          </div>
        </a>
        <button onClick={async () => {
          if (!report) return;
          try {
            await api.post('/api/admin/moderation/suspend', {
              userId: report.targetId, reason: report.reason, durationHours: 24,
            });
            toast.success('User suspended for 24h');
          } catch { toast.error('Failed to suspend'); }
        }} className="clip-corner flex items-center gap-3 border border-coral/50 bg-coral/5 p-4 text-left transition hover:bg-coral/10">
          <AlertTriangle className="size-5 text-coral" />
          <div>
            <p className="font-mono text-xs font-semibold text-coral">Quick Suspend 24h</p>
            <p className="font-mono text-[0.55rem] text-muted-foreground">Suspend target for 24 hours</p>
          </div>
        </button>
        <button onClick={async () => {
          try {
            await api.post('/api/admin/moderation/shadow-ban', { userId: report.targetId });
            toast.success('User shadow banned');
          } catch { toast.error('Failed to shadow ban'); }
        }} className="clip-corner flex items-center gap-3 border border-amber/50 bg-amber/5 p-4 text-left transition hover:bg-amber/10">
          <Eye className="size-5 text-amber" />
          <div>
            <p className="font-mono text-xs font-semibold text-amber">Shadow Ban</p>
            <p className="font-mono text-[0.55rem] text-muted-foreground">Hide content without notifying user</p>
          </div>
        </button>
      </div>
    </div>
  );
}
