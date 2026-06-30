'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Check, X, Loader2, ArrowLeft } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { api } from '@/lib/api/client';

interface PendingInvitation {
  id: string;
  token: string;
  studio: { name: string; logoUrl: string | null } | null;
  invitedBy: { displayName: string | null } | null;
  role: string;
  message: string | null;
  expiresAt: string;
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [invitation, setInvitation] = useState<PendingInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    api.get<PendingInvitation>(`/invitations/${token}`)
      .then(setInvitation)
      .catch(() => setError('Invitation not found or expired'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await api.post(`/invitations/${token}/accept`);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    setActionLoading(true);
    try {
      await api.post(`/invitations/${token}/decline`);
      router.push('/');
    } catch {
      setError('Failed to decline');
    } finally {
      setActionLoading(false);
    }
  };

  if (!authLoading && !isAuthenticated) {
    return (
      <>
        <SiteHeader />
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#020609] px-4 text-center">
          <Building2 className="mb-4 size-10 text-cyan" />
          <h1 className="font-display text-2xl font-bold text-white">You've been invited!</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in or create an account to accept this invitation.</p>
          <div className="mt-6 flex gap-4">
            <Link href="/login" className="clip-corner border border-cyan bg-cyan/10 px-6 py-3 font-mono text-xs uppercase tracking-widest text-cyan">Sign in</Link>
            <Link href="/register" className="clip-corner border border-coral bg-coral/10 px-6 py-3 font-mono text-xs uppercase tracking-widest text-coral">Create account</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#020609] px-4">
        {loading ? (
          <Loader2 className="size-8 animate-spin text-cyan" />
        ) : error ? (
          <div className="text-center">
            <X className="mx-auto mb-4 size-10 text-coral" />
            <p className="font-display text-xl text-white">Invitation not found</p>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Link href="/" className="mt-6 inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-cyan underline">
              <ArrowLeft className="size-3" /> Go home
            </Link>
          </div>
        ) : invitation ? (
          <div className="clip-corner w-full max-w-md border border-border/70 bg-[#050b0f]/80 p-8 shadow-[0_0_60px_rgb(0_0_0_/_0.4)] text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full border border-border bg-background/60 overflow-hidden">
              {invitation.studio?.logoUrl ? <img src={invitation.studio.logoUrl} alt="" className="size-full object-cover" /> : <Building2 className="size-8 text-cyan" />}
            </div>
            <h1 className="mt-5 font-display text-2xl font-bold text-white">{invitation.studio?.name}</h1>
            <p className="mt-2 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
              Invited by <span className="text-cyan">{invitation.invitedBy?.displayName}</span>
            </p>
            <p className="mt-4 font-mono text-[0.65rem] text-foreground">
              Role: <span className="text-cyan font-semibold">{invitation.role}</span>
            </p>
            {invitation.message && <p className="mt-3 font-mono text-[0.55rem] text-muted-foreground/60 italic">"{invitation.message}"</p>}
            <p className="mt-4 font-mono text-[0.5rem] text-muted-foreground/40">
              Expires {new Date(invitation.expiresAt).toLocaleDateString()}
            </p>
            <div className="mt-8 flex gap-4">
              <button onClick={handleAccept} disabled={actionLoading}
                className="clip-corner flex flex-1 cursor-pointer items-center justify-center gap-2 border border-cyan bg-cyan/10 px-6 py-3 font-mono text-xs uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background disabled:opacity-40">
                {actionLoading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Accept
              </button>
              <button onClick={handleDecline} disabled={actionLoading}
                className="clip-corner flex flex-1 cursor-pointer items-center justify-center gap-2 border border-coral/60 px-6 py-3 font-mono text-xs uppercase tracking-widest text-coral transition hover:bg-coral/20 disabled:opacity-40">
                <X className="size-4" /> Decline
              </button>
            </div>
          </div>
        ) : null}
      </main>
    </>
  );
}
