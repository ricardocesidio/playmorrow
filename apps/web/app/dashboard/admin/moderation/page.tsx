'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/api/auth-context';
import { toast } from 'sonner';
import {
  Shield, Search, AlertTriangle, Eye, Ban, UserX, CheckCircle,
  Clock, ArrowRight, Filter, ChevronLeft, ChevronRight, Flag, BarChart3,
} from 'lucide-react';

interface Report {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  resolutionNote?: string;
  reporter: { id: string; username: string };
  createdAt: string;
  updatedAt: string;
}

interface UserStatus {
  id: string;
  username: string;
  displayName: string;
  role: string;
  isSuspended: boolean;
  shadowBanned: boolean;
  appealCount: number;
}

export default function ModerationDashboard() {
  const { user } = useAuth();
  const isMod = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchUserId, setSearchUserId] = useState('');
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [suspendModal, setSuspendModal] = useState<{ userId: string; username: string } | null>(null);
  const [suspendHours, setSuspendHours] = useState(24);
  const [suspendReason, setSuspendReason] = useState('');

  interface DashboardMetrics {
    openReports: number; escalatedReports: number; reportsToday: number;
    reportsThisWeek: number; totalSuspended: number; totalShadowBanned: number;
    totalStrikes: number; avgResolutionHours: number;
  }
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const PAGE_SIZE = 20;

  useEffect(() => {
    if (!isMod) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (statusFilter) params.set('status', statusFilter);

    api.get<{ items: Report[]; total: number }>(`/api/admin/reports?${params}`)
      .then(data => { setReports(data.items || []); setTotal(data.total || 0); })
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  }, [page, statusFilter, isMod]);

  useEffect(() => {
    if (!isMod) return;
    api.get('/api/admin/moderation/dashboard')
      .then(setMetrics)
      .catch(() => {})
      .finally(() => setMetricsLoading(false));
  }, [isMod]);

  const searchUser = async () => {
    if (!searchUserId) return;
    try {
      const data = await api.get<UserStatus>(`/api/admin/moderation/users/${searchUserId}`);
      setUserStatus(data);
    } catch {
      toast.error('User not found');
      setUserStatus(null);
    }
  };

  const doSuspend = async () => {
    if (!suspendModal || !suspendReason) return;
    try {
      await api.post('/api/admin/moderation/suspend', {
        userId: suspendModal.userId,
        reason: suspendReason,
        durationHours: suspendHours,
      });
      toast.success(`Suspended ${suspendModal.username}`);
      setSuspendModal(null);
      setSuspendReason('');
      setUserStatus(null);
    } catch { toast.error('Failed to suspend user'); }
  };

  const doUnsuspend = async (userId: string, username: string) => {
    try {
      await api.post('/api/admin/moderation/unsuspend', { userId });
      toast.success(`Unsuspended ${username}`);
      setUserStatus(null);
    } catch { toast.error('Failed to unsuspend'); }
  };

  const doShadowBan = async (userId: string, username: string) => {
    try {
      await api.post('/api/admin/moderation/shadow-ban', { userId });
      toast.success(`Shadow banned ${username}`);
      setUserStatus(null);
    } catch { toast.error('Failed to shadow ban'); }
  };

  const doRemoveShadowBan = async (userId: string, username: string) => {
    try {
      await api.post('/api/admin/moderation/remove-shadow-ban', { userId });
      toast.success(`Removed shadow ban from ${username}`);
      setUserStatus(null);
    } catch { toast.error('Failed to remove shadow ban'); }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (!isMod) {
    return (
      <div className="mx-auto max-w-[1200px] px-5 py-12">
        <div className="clip-corner border border-coral/50 bg-coral/5 p-6 text-center">
          <Shield className="mx-auto size-10 text-coral" />
          <h1 className="mt-4 font-display text-xl font-black text-white">Access Denied</h1>
          <p className="mt-2 font-mono text-sm text-muted-foreground">You need ADMIN or MODERATOR role to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8">
      <div className="mb-8 flex items-center gap-3">
        <Shield className="size-6 text-coral" />
        <h1 className="font-display text-2xl font-black uppercase tracking-tight text-white">Moderation Center</h1>
      </div>

      {/* Metrics */}
      {!metricsLoading && metrics && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="clip-corner border border-coral/30 bg-coral/5 p-4">
            <Flag className="size-5 text-coral" />
            <p className="mt-2 font-display text-2xl font-black text-white">{metrics.openReports}</p>
            <p className="font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground">Open Reports</p>
          </div>
          <div className="clip-corner border border-amber/30 bg-amber/5 p-4">
            <AlertTriangle className="size-5 text-amber" />
            <p className="mt-2 font-display text-2xl font-black text-white">{metrics.escalatedReports}</p>
            <p className="font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground">Escalated</p>
          </div>
          <div className="clip-corner border border-cyan/30 bg-cyan/5 p-4">
            <BarChart3 className="size-5 text-cyan" />
            <p className="mt-2 font-display text-2xl font-black text-white">{metrics.reportsToday}</p>
            <p className="font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground">Reports Today</p>
          </div>
          <div className="clip-corner border border-cyan/30 bg-cyan/5 p-4">
            <Clock className="size-5 text-cyan" />
            <p className="mt-2 font-display text-2xl font-black text-white">{metrics.avgResolutionHours}h</p>
            <p className="font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground">Avg Resolution</p>
          </div>
        </div>
      )}

      {/* User Lookup */}
      <section className="mb-8 clip-corner border border-border bg-[#09161d] p-5">
        <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-cyan">User Lookup</h2>
        <div className="flex gap-3">
          <input
            type="text" value={searchUserId} onChange={e => setSearchUserId(e.target.value)}
            placeholder="Enter user ID..."
            className="clip-corner h-10 flex-1 border border-border bg-background/80 px-4 font-mono text-sm text-foreground outline-none"
            onKeyDown={e => e.key === 'Enter' && searchUser()}
          />
          <button onClick={searchUser} className="clip-corner flex h-10 items-center gap-2 border border-cyan/50 bg-cyan/5 px-4 font-mono text-xs text-cyan hover:bg-cyan/10">
            <Search className="size-4" /> Search
          </button>
        </div>

        {userStatus && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="clip-corner border border-border/60 bg-background/40 p-3">
              <p className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Username</p>
              <p className="font-mono text-sm text-foreground">{userStatus.username}</p>
            </div>
            <div className="clip-corner border border-border/60 bg-background/40 p-3">
              <p className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Role</p>
              <p className="font-mono text-sm text-foreground">{userStatus.role}</p>
            </div>
            <div className="clip-corner border border-border/60 bg-background/40 p-3">
              <p className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Status</p>
              <p className={`font-mono text-sm ${userStatus.isSuspended ? 'text-coral' : userStatus.shadowBanned ? 'text-amber' : 'text-success'}`}>
                {userStatus.isSuspended ? 'SUSPENDED' : userStatus.shadowBanned ? 'SHADOW BANNED' : 'ACTIVE'}
              </p>
            </div>
            <div className="clip-corner border border-border/60 bg-background/40 p-3">
              <p className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Actions</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {!userStatus.isSuspended ? (
                  <button onClick={() => setSuspendModal({ userId: userStatus.id, username: userStatus.username })}
                    className="clip-corner border border-coral/50 bg-coral/5 px-3 py-1 font-mono text-[0.55rem] text-coral hover:bg-coral/10">
                    <Ban className="mr-1 inline size-3" /> Suspend
                  </button>
                ) : (
                  <button onClick={() => doUnsuspend(userStatus.id, userStatus.username)}
                    className="clip-corner border border-success/50 bg-success/5 px-3 py-1 font-mono text-[0.55rem] text-success hover:bg-success/10">
                    <CheckCircle className="mr-1 inline size-3" /> Unsuspend
                  </button>
                )}
                {!userStatus.shadowBanned ? (
                  <button onClick={() => doShadowBan(userStatus.id, userStatus.username)}
                    className="clip-corner border border-amber/50 bg-amber/5 px-3 py-1 font-mono text-[0.55rem] text-amber hover:bg-amber/10">
                    <Eye className="mr-1 inline size-3" /> Shadow Ban
                  </button>
                ) : (
                  <button onClick={() => doRemoveShadowBan(userStatus.id, userStatus.username)}
                    className="clip-corner border border-cyan/50 bg-cyan/5 px-3 py-1 font-mono text-[0.55rem] text-cyan hover:bg-cyan/10">
                    <Eye className="mr-1 inline size-3" /> Remove Shadow
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Reports Queue */}
      <section className="clip-corner border border-border bg-[#09161d]">
        <div className="flex items-center justify-between border-b border-border/60 p-4">
          <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-cyan">
            <AlertTriangle className="size-4" /> Reports Queue
            <span className="text-muted-foreground">({total})</span>
          </h2>
          <div className="flex gap-2">
            {['', 'OPEN', 'RESOLVED', 'DISMISSED'].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`clip-corner px-3 py-1 font-mono text-[0.55rem] uppercase tracking-wider transition ${
                  statusFilter === s
                    ? 'bg-cyan/20 text-cyan border border-cyan/40'
                    : 'text-muted-foreground border border-border/40 hover:border-cyan/30'
                }`}>
                {s || 'ALL'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="mx-auto size-6 animate-spin border border-cyan border-t-transparent" />
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="mx-auto size-8 text-success/50" />
            <p className="mt-2 font-mono text-sm text-muted-foreground">No reports found</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {reports.map(report => (
              <Link key={report.id} href={`/dashboard/admin/moderation/reports/${report.id}`}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 p-4 transition hover:bg-background/30">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-foreground">{report.targetType}</span>
                    <span className={`clip-corner px-2 py-0.5 font-mono text-[0.5rem] uppercase ${
                      report.status === 'OPEN' ? 'bg-amber/10 text-amber border border-amber/30'
                      : report.status === 'RESOLVED' ? 'bg-success/10 text-success border border-success/30'
                      : 'bg-muted/10 text-muted-foreground border border-border/30'
                    }`}>{report.status}</span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{report.reason}</p>
                  <p className="font-mono text-[0.5rem] text-muted-foreground/60">
                    Reported by {report.reporter.username} · {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Link href={`/dashboard/admin/moderation/users/${report.targetId}`}
                  className="clip-corner border border-border/40 px-3 py-1.5 font-mono text-[0.55rem] text-muted-foreground hover:text-cyan">
                  View Target
                </Link>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 border-t border-border/60 p-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="clip-corner border border-border/40 px-3 py-1.5 font-mono text-xs text-muted-foreground disabled:opacity-30">
              <ChevronLeft className="inline size-4" /> Previous
            </button>
            <span className="font-mono text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="clip-corner border border-border/40 px-3 py-1.5 font-mono text-xs text-muted-foreground disabled:opacity-30">
              Next <ChevronRight className="inline size-4" />
            </button>
          </div>
        )}
      </section>

      {/* Suspend Modal */}
      {suspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setSuspendModal(null)}>
          <div className="mx-4 w-full max-w-md clip-corner border border-border bg-[#09161d] p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg font-black text-white">Suspend User</h3>
            <p className="mt-1 font-mono text-xs text-muted-foreground">Suspending: {suspendModal.username}</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Duration (hours)</label>
                <input type="number" value={suspendHours} onChange={e => setSuspendHours(Number(e.target.value))} min={1} max={720}
                  className="mt-1 clip-corner h-10 w-full border border-border bg-background/80 px-4 font-mono text-sm text-foreground outline-none" />
              </div>
              <div>
                <label className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">Reason</label>
                <textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)} rows={3}
                  className="mt-1 clip-corner w-full border border-border bg-background/80 px-4 py-2 font-mono text-sm text-foreground outline-none"
                  placeholder="Why is this user being suspended?" />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setSuspendModal(null)}
                className="clip-corner border border-border/60 px-5 py-2 font-mono text-xs text-muted-foreground hover:text-foreground">
                Cancel
              </button>
              <button onClick={doSuspend} disabled={!suspendReason}
                className="clip-corner border border-coral/50 bg-coral/10 px-5 py-2 font-mono text-xs text-coral hover:bg-coral/20 disabled:opacity-30">
                <UserX className="mr-1 inline size-3" /> Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
