'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Users, Crown, Shield, Mail } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { useStudio, useStudioMembers } from '@/lib/api/hooks';
import { useUpdateMemberRole, useRemoveMember, useLeaveStudio, useTransferOwnership, useCreateInvitation, useCancelInvitation, useStudioInvitations } from '@/lib/api/hooks';
import { TeamMemberCard } from '@/components/team/team-member-card';
import { InviteModal } from '@/components/team/invite-modal';

export default function TeamPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: studio, isLoading: studioLoading } = useStudio(slug);
  const { data: studioMembers, isLoading: membersLoading } = useStudioMembers(slug);
  const { data: invitations, refetch: refetchInvitations } = useStudioInvitations(slug);
  const [inviteOpen, setInviteOpen] = useState(false);

  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const leaveStudio = useLeaveStudio();
  const transferOwnership = useTransferOwnership();
  const createInvitation = useCreateInvitation();
  const cancelInvitation = useCancelInvitation();

  const members = (studioMembers as any)?.members ?? [];
  const currentMember = members.find((m: any) => m.userId === user?.id || m.user?.id === user?.id);
  const currentUserRole = currentMember?.role;
  const grouped = members.reduce((acc: Record<string, any[]>, m: any) => {
    const role = m.role === 'MEMBER' ? 'MODERATOR' : m.role;
    if (!acc[role]) acc[role] = [];
    acc[role].push(m);
    return acc;
  }, {});

  if (studioLoading || membersLoading) {
    return (
      <>
        <SiteHeader />
        <div className="flex min-h-screen items-center justify-center bg-[#020609]">
          <div className="size-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
        </div>
      </>
    );
  }

  if (!studio) {
    return (
      <>
        <SiteHeader />
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#020609] px-4">
          <p className="font-display text-2xl font-semibold text-foreground">Studio not found</p>
          <Link href="/dashboard" className="mt-4 font-mono text-xs uppercase tracking-widest text-cyan underline">Back to dashboard</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="relative min-h-screen bg-[#020609]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(62_231_255_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(62_231_255_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

        <div className="relative mx-auto max-w-4xl px-5 py-6 sm:px-8 lg:px-10">
          <Link href={`/dashboard/studios/${slug}`} className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-widest text-muted-foreground transition hover:text-cyan">
            <ArrowLeft className="size-3" /> Back to settings
          </Link>

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">Team</h1>
              <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-widest text-muted-foreground">
                <Users className="mr-1 inline size-3.5" /> {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
            </div>
            {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN') && (
              <button onClick={() => setInviteOpen(true)}
                className="clip-corner flex cursor-pointer items-center gap-2 border border-cyan bg-cyan/10 px-5 py-2.5 font-mono text-[0.6rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background">
                <UserPlus className="size-4" /> Invite Member
              </button>
            )}
          </div>

          {/* Members grouped by role */}
          <div className="space-y-6">
            {['OWNER', 'ADMIN', 'MODERATOR'].map(role => {
              const roleMembers = grouped[role];
              if (!roleMembers?.length) return null;
              const icon = role === 'OWNER' ? <Crown className="size-4 text-orange" /> :
                role === 'ADMIN' ? <Shield className="size-4 text-red" /> : null;
              return (
                <div key={role}>
                  <div className="mb-3 flex items-center gap-2">
                    {icon}
                    <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                      {role} ({roleMembers.length})
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {roleMembers.map((m: any) => (
                      <TeamMemberCard
                        key={m.id}
                        member={m}
                        currentUserId={user?.id ?? ''}
                        currentUserRole={currentUserRole}
                        onRemove={(userId) => removeMember.mutate({ slug, userId })}
                        onPromoteToAdmin={(userId) => updateRole.mutate({ slug, userId, role: 'ADMIN' })}
                        onTransferOwnership={(userId) => transferOwnership.mutate({ slug, targetUserId: userId })}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pending Invitations */}
          {(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN') && invitations && invitations.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-3 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                Pending Invitations ({invitations.length})
              </h2>
              <div className="space-y-2">
                {invitations.map((inv: any) => (
                  <div key={inv.id} className="clip-corner flex items-center gap-3 border border-border/60 bg-[#050b0f]/50 px-4 py-3">
                    <Mail className="size-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-mono text-[0.6rem] text-foreground">{inv.email || inv.userId}</p>
                      <p className="font-mono text-[0.55rem] text-muted-foreground/60">
                        {(inv.role as string).charAt(0) + (inv.role as string).slice(1).toLowerCase()} · Expires {new Date(inv.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button onClick={() => cancelInvitation.mutate({ slug, invitationId: inv.id })}
                      className="cursor-pointer font-mono text-[0.55rem] uppercase tracking-wider text-coral hover:text-coral/80">
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={async (data) => {
          await createInvitation.mutateAsync({ slug, ...data } as any);
        }}
      />
    </>
  );
}
