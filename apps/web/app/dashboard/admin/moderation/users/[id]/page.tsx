'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/api/auth-context';
import { toast } from 'sonner';
import {
  ArrowLeft, Shield, UserIcon, Ban, Eye, CheckCircle,
  AlertTriangle, Clock, Hash, FileText,
} from 'lucide-react';

interface UserStatus {
  id: string;
  username: string;
  displayName: string;
  role: string;
  isSuspended: boolean;
  suspendedUntil: string | null;
  shadowBanned: boolean;
  appealCount: number;
}

export default function UserModerationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const isMod = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  const [status, setStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendHours, setSuspendHours] = useState(24);

  useEffect(() => {
    if (!id || !isMod) return;
    api.get<UserStatus>(`/api/admin/moderation/users/${id}`)
      .then(setStatus)
      .catch(() => toast.error('User not found'))
      .finally(() => setLoading(false));
  }, [id, isMod]);

  const refresh = () => {
    if (!id) return;
    api.get<UserStatus>(`/api/admin/moderation/users/${id}`)
      .then(setStatus)
      .catch(() => {});
  };

  const doSuspend = async () => {
    if (!id || !suspendReason) return;
    try {
      await api.post('/api/admin/moderation/suspend', { userId: id, reason: suspendReason, durationHours: suspendHours });
      toast.success(`Suspended for ${suspendHours}h`);
      setSuspendReason('');
      refresh();
    } catch { toast.error('Failed to suspend'); }
  };

  const doUnsuspend = async () => {
    if (!id) return;
    try { await api.post('/api/admin/moderation/unsuspend', { userId: id }); toast.success('Unsuspended'); refresh(); }
    catch { toast.error('Failed to unsuspend'); }
  };

  const doShadowBan = async () => {
    if (!id) return;
    try { await api.post('/api/admin/moderation/shadow-ban', { userId: id }); toast.success('Shadow banned'); refresh(); }
    catch { toast.error('Failed to shadow ban'); }
  };

  const doRemoveShadowBan = async () => {
    if (!id) return;
    try { await api.post('/api/admin/moderation/remove-shadow-ban', { userId: id }); toast.success('Shadow ban removed'); refresh(); }
    catch { toast.error('Failed to remove shadow ban'); }
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

  if (!status) {
    return (
      <div className="mx-auto max-w-[800px] px-5 py-12">
        <div className="clip-corner border border-border bg-[#09161d] p-8 text-center">
          <UserIcon className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-2 font-mono text-sm text-muted-foreground">User not found</p>
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

      {/* User Info */}
      <div className="clip-corner border border-border bg-[#09161d]">
        <div className="flex items-center gap-4 border-b border-border/60 p-5">
          <div className="grid size-12 place-items-center rounded-full border border-cyan/30 bg-cyan/5">
            <UserIcon className="size-6 text-cyan" />
          </div>
          <div>
            <h1 className="font-display text-xl font-black text-white">{status.displayName}</h1>
            <p className="font-mono text-xs text-muted-foreground">@{status.username} · {status.role}</p>
          </div>
          <div className="ml-auto">
            <span className={`clip-corner px-3 py-1 font-mono text-[0.55rem] uppercase ${
              status.isSuspended ? 'bg-coral/10 text-coral border border-coral/30'
              : status.shadowBanned ? 'bg-amber/10 text-amber border border-amber/30'
              : 'bg-success/10 text-success border border-success/30'
            }`}>
              {status.isSuspended ? 'SUSPENDED' : status.shadowBanned ? 'SHADOW BANNED' : 'ACTIVE'}
            </span>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <div className="clip-corner border border-border/60 bg-background/40 p-4">
            <div className="flex items-center gap-2 text-coral">
              <Ban className="size-4" />
              <span className="font-mono text-[0.55rem] uppercase tracking-widest">Suspension</span>
            </div>
            <p className="mt-2 font-mono text-sm text-foreground">
              {status.isSuspended ? `Until ${new Date(status.suspendedUntil!).toLocaleString()}` : 'Not suspended'}
            </p>
          </div>
          <div className="clip-corner border border-border/60 bg-background/40 p-4">
            <div className="flex items-center gap-2 text-amber">
              <Eye className="size-4" />
              <span className="font-mono text-[0.55rem] uppercase tracking-widest">Shadow Ban</span>
            </div>
            <p className="mt-2 font-mono text-sm text-foreground">{status.shadowBanned ? 'Active' : 'Not active'}</p>
          </div>
          <div className="clip-corner border border-border/60 bg-background/40 p-4">
            <div className="flex items-center gap-2 text-cyan">
              <FileText className="size-4" />
              <span className="font-mono text-[0.55rem] uppercase tracking-widest">Appeals</span>
            </div>
            <p className="mt-2 font-mono text-sm text-foreground">{status.appealCount} filed</p>
          </div>
        </div>

        {/* ID */}
        <div className="border-t border-border/60 px-5 py-3">
          <p className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground">User ID</p>
          <p className="mt-1 break-all font-mono text-xs text-cyan">{status.id}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 clip-corner border border-border bg-[#09161d] p-5">
        <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-cyan">Moderation Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Suspend / Unsuspend */}
          <div className="clip-corner border border-border/60 bg-background/40 p-4">
            <h3 className="font-mono text-[0.55rem] uppercase tracking-widest text-coral">
              <Ban className="mr-1 inline size-3" /> {status.isSuspended ? 'Unsuspend User' : 'Suspend User'}
            </h3>
            {status.isSuspended ? (
              <button onClick={doUnsuspend}
                className="mt-3 clip-corner border border-success/50 bg-success/5 px-4 py-2 font-mono text-xs text-success hover:bg-success/10">
                <CheckCircle className="mr-1 inline size-3" /> Remove Suspension
              </button>
            ) : (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <input type="number" value={suspendHours} onChange={e => setSuspendHours(Number(e.target.value))}
                    min={1} max={720}
                    className="clip-corner h-9 w-24 border border-border bg-background/80 px-3 font-mono text-xs text-foreground outline-none" />
                  <span className="self-center font-mono text-[0.55rem] text-muted-foreground">hours</span>
                </div>
                <input type="text" value={suspendReason} onChange={e => setSuspendReason(e.target.value)}
                  placeholder="Reason for suspension..."
                  className="clip-corner h-9 w-full border border-border bg-background/80 px-3 font-mono text-xs text-foreground outline-none" />
                <button onClick={doSuspend} disabled={!suspendReason}
                  className="clip-corner border border-coral/50 bg-coral/10 px-4 py-2 font-mono text-xs text-coral hover:bg-coral/20 disabled:opacity-30">
                  <Ban className="mr-1 inline size-3" /> Suspend
                </button>
              </div>
            )}
          </div>

          {/* Shadow Ban */}
          <div className="clip-corner border border-border/60 bg-background/40 p-4">
            <h3 className="font-mono text-[0.55rem] uppercase tracking-widest text-amber">
              <Eye className="mr-1 inline size-3" /> Shadow Ban
            </h3>
            <p className="mt-1 font-mono text-[0.5rem] text-muted-foreground">
              {status.shadowBanned
                ? 'User content is hidden from other users. They are not notified.'
                : 'User content remains visible. Shadow ban hides it without notifying.'}
            </p>
            <button onClick={status.shadowBanned ? doRemoveShadowBan : doShadowBan}
              className="mt-3 clip-corner border border-amber/50 bg-amber/5 px-4 py-2 font-mono text-xs text-amber hover:bg-amber/10">
              {status.shadowBanned ? <CheckCircle className="mr-1 inline size-3" /> : <Eye className="mr-1 inline size-3" />}
              {status.shadowBanned ? 'Remove Shadow Ban' : 'Apply Shadow Ban'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
