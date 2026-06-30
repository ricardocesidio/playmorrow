'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Check, X, Loader2 } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { useMyInvitations } from '@/lib/api/hooks';
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

export default function MyInvitationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data: _invitations, isLoading, refetch } = useMyInvitations();
  const invitations = _invitations as PendingInvitation[] | undefined;

  if (authLoading) {
    return (
      <>
        <SiteHeader />
        <div className="flex min-h-screen items-center justify-center bg-[#020609]">
          <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
        </div>
      </>
    );
  }

  if (!user) {
    router.replace('/login');
    return null;
  }

  const handleAccept = async (token: string) => {
    try {
      await api.post(`/invitations/${token}/accept`);
      refetch();
    } catch {
      // silently ignore
    }
  };

  const handleDecline = async (token: string) => {
    try {
      await api.post(`/invitations/${token}/decline`);
      refetch();
    } catch {
      // silently ignore
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609] px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl">
          <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan">
            <ArrowLeft className="size-3" /> Back to dashboard
          </Link>

          <h1 className="mb-8 font-display text-3xl font-black uppercase tracking-tight text-white">My Invitations</h1>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-cyan" /></div>
          ) : !invitations?.length ? (
            <div className="clip-corner border border-border/60 bg-[#050b0f]/50 px-6 py-12 text-center">
              <Building2 className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="font-mono text-[0.65rem] text-muted-foreground">No pending invitations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((inv) => (
                <div key={inv.id} className="clip-corner border border-border/70 bg-[#050b0f]/80 p-5 shadow-[0_0_20px_rgb(0_0_0_/_0.25)]">
                  <div className="flex items-start gap-4">
                    <div className="grid size-12 shrink-0 place-items-center rounded-full border border-border bg-background/60 overflow-hidden">
                      {inv.studio?.logoUrl ? <img src={inv.studio.logoUrl} alt="" className="size-full object-cover" /> : <Building2 className="size-5 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base font-bold text-white">{inv.studio?.name}</p>
                      <p className="mt-0.5 font-mono text-[0.58rem] text-muted-foreground">
                        Invited by {inv.invitedBy?.displayName ?? 'someone'} · Role: <span className="text-cyan">{inv.role}</span>
                      </p>
                      {inv.message && <p className="mt-2 font-mono text-[0.55rem] text-muted-foreground/60 italic">"{inv.message}"</p>}
                      <p className="mt-1.5 font-mono text-[0.5rem] text-muted-foreground/40">
                        Expires {new Date(inv.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button onClick={() => handleAccept(inv.token)}
                        className="clip-corner flex cursor-pointer items-center gap-1 border border-cyan bg-cyan/10 px-4 py-2 font-mono text-[0.55rem] uppercase tracking-wider text-cyan transition hover:bg-cyan hover:text-background">
                        <Check className="size-3" /> Accept
                      </button>
                      <button onClick={() => handleDecline(inv.token)}
                        className="clip-corner flex cursor-pointer items-center gap-1 border border-coral/60 bg-coral/5 px-4 py-2 font-mono text-[0.55rem] uppercase tracking-wider text-coral transition hover:bg-coral/20">
                        <X className="size-3" /> Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
