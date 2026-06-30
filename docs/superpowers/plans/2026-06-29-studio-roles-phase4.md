# Studio Roles Phase 4 — Team Management Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Frontend team management page at `/dashboard/studios/[slug]/team` with member cards, role badges, invite modal, and all management actions.

**Architecture:** New page under existing studio dashboard route. New team components. New API hooks for member/invitation management. Sidebar nav updates.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind v4, TanStack Query v5

## Global Constraints

- Same cyberpunk design language as existing pages
- Role badge colors: OWNER=orange, ADMIN=red, MODERATOR=blue, MEMBER=cyan
- All mutations use `useMutation` with query invalidation
- Mock data support for development

---

### Task 1: Add API Hooks for Team Management

**Files:**
- Modify: `apps/web/lib/api/hooks.ts`

Add after existing hooks:

```typescript
// ── Team Management ──

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string; userId: string; role?: string; title?: string }) =>
      api.patch(`/studios/${data.slug}/members/${data.userId}`, { role: data.role, title: data.title }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['studio'] }); },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string; userId: string }) =>
      api.delete(`/studios/${data.slug}/members/${data.userId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['studio'] }); },
  });
}

export function useLeaveStudio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => api.post(`/studios/${slug}/members/leave`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['myStudios'] }); },
  });
}

export function useTransferOwnership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string; targetUserId: string }) =>
      api.post(`/studios/${data.slug}/transfer`, { targetUserId: data.targetUserId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['studio'] }); },
  });
}

export function useCreateInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string; email?: string; userId?: string; role: string; message?: string }) =>
      api.post(`/studios/${data.slug}/invitations`, { email: data.email, userId: data.userId, role: data.role, message: data.message }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['studioInvitations'] }); },
  });
}

export function useCancelInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { slug: string; invitationId: string }) =>
      api.delete(`/studios/${data.slug}/invitations/${data.invitationId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['studioInvitations'] }); },
  });
}

export function useStudioInvitations(slug: string) {
  return useQuery({
    queryKey: ['studioInvitations', slug],
    queryFn: () => api.get<any[]>(`/studios/${slug}/invitations?status=PENDING`),
    enabled: !!slug,
  });
}

export function useMyInvitations() {
  return useQuery({
    queryKey: ['myInvitations'],
    queryFn: () => api.get<any[]>('/me/invitations'),
  });
}
```

- [ ] **Commit**

```bash
git add apps/web/lib/api/hooks.ts
git commit -m "feat: add team management API hooks"
```

---

### Task 2: Create Team Member Card Component

**Files:**
- Create: `apps/web/components/team/team-member-card.tsx`

```typescript
'use client';

import { useState } from 'react';
import { MoreHorizontal, Shield, Crown, UserMinus, ArrowUpRight, LogOut, Pencil } from 'lucide-react';
import type { StudioRole } from '@playmorrow/database';

interface TeamMember {
  id: string;
  userId: string;
  role: StudioRole;
  title?: string | null;
  joinedAt: string;
  user: { id: string; displayName: string; username: string; avatarUrl?: string | null };
}

interface TeamMemberCardProps {
  member: TeamMember;
  currentUserId: string;
  currentUserRole: StudioRole;
  onRemove: (userId: string) => void;
  onPromoteToAdmin?: (userId: string) => void;
  onUpdateTitle?: (userId: string, title: string) => void;
  onTransferOwnership?: (userId: string) => void;
}

const ROLE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  OWNER: { bg: 'bg-orange/10', text: 'text-orange', label: 'Owner' },
  ADMIN: { bg: 'bg-red/10', text: 'text-red', label: 'Admin' },
  MODERATOR: { bg: 'bg-blue/10', text: 'text-blue', label: 'Mod' },
  MEMBER: { bg: 'bg-cyan/10', text: 'text-cyan', label: 'Member' },
};

export function TeamMemberCard({ member, currentUserId, currentUserRole, onRemove, onPromoteToAdmin, onUpdateTitle, onTransferOwnership }: TeamMemberCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(member.title || '');
  const isSelf = member.userId === currentUserId;
  const style = ROLE_STYLES[member.role] ?? ROLE_STYLES.MEMBER;

  const canManage = currentUserRole === 'OWNER' || (currentUserRole === 'ADMIN' && (member.role === 'MODERATOR' || member.role === 'MEMBER'));

  return (
    <div className="clip-corner flex items-center gap-4 border border-border/70 bg-[#050b0f]/80 p-4 shadow-[0_0_20px_rgb(0_0_0_/_0.25)]">
      <div className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-background/60 text-sm font-bold text-foreground overflow-hidden">
        {member.user.avatarUrl ? (
          <img src={member.user.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          member.user.displayName.slice(0, 1).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-display text-sm font-semibold text-foreground">{member.user.displayName}</p>
          {member.role === 'OWNER' && <Crown className="size-3.5 text-orange" />}
          {member.role === 'ADMIN' && <Shield className="size-3.5 text-red" />}
        </div>
        <p className="truncate font-mono text-[0.58rem] text-muted-foreground">@{member.user.username}</p>
        {member.title && <p className="font-mono text-[0.55rem] text-muted-foreground/60">{member.title}</p>}
        <p className="font-mono text-[0.5rem] text-muted-foreground/40">Joined {new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
      </div>
      <span className={`clip-corner shrink-0 px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-wider ${style.bg} ${style.text}`}>
        {style.label}
      </span>
      {(canManage || isSelf) && (
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="cursor-pointer p-1 text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="size-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-44 border border-border bg-[#050b0f] shadow-lg">
                {isSelf && member.role !== 'OWNER' && (
                  <button onClick={() => { onRemove(member.userId); setMenuOpen(false); }}
                    className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 font-mono text-[0.6rem] text-coral hover:bg-coral/10">
                    <LogOut className="size-3.5" /> Leave studio
                  </button>
                )}
                {canManage && !isSelf && (
                  <>
                    {currentUserRole === 'OWNER' && member.role !== 'ADMIN' && (
                      <button onClick={() => { onPromoteToAdmin?.(member.userId); setMenuOpen(false); }}
                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 font-mono text-[0.6rem] text-foreground hover:bg-cyan/10">
                        <ArrowUpRight className="size-3.5" /> Promote to Admin
                      </button>
                    )}
                    {currentUserRole === 'OWNER' && member.role === 'ADMIN' && (
                      <button onClick={() => { onTransferOwnership?.(member.userId); setMenuOpen(false); }}
                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 font-mono text-[0.6rem] text-amber hover:bg-amber/10">
                        <Crown className="size-3.5" /> Transfer ownership
                      </button>
                    )}
                    <button onClick={() => { onRemove(member.userId); setMenuOpen(false); }}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 font-mono text-[0.6rem] text-coral hover:bg-coral/10">
                      <UserMinus className="size-3.5" /> Remove member
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add apps/web/components/team/team-member-card.tsx
git commit -m "feat: create team member card component"
```

---

### Task 3: Create Invite Modal Component

**Files:**
- Create: `apps/web/components/team/invite-modal.tsx`

```typescript
'use client';

import { useState } from 'react';
import { X, Mail, Search, Send, Loader2 } from 'lucide-react';

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  onInvite: (data: { email?: string; userId?: string; role: string; message?: string }) => Promise<void>;
}

export function InviteModal({ open, onClose, onInvite }: InviteModalProps) {
  const [tab, setTab] = useState<'email' | 'search'>('email');
  const [email, setEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [role, setRole] = useState('MODERATOR');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (tab === 'email' && !email.trim()) { setError('Email is required'); return; }
    if (tab === 'search' && !selectedUserId) { setError('Select a user'); return; }
    setLoading(true);
    try {
      await onInvite({
        email: tab === 'email' ? email.trim() : undefined,
        userId: tab === 'search' ? selectedUserId! : undefined,
        role,
        message: message.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="clip-corner w-full max-w-md border border-border/70 bg-[#050b0f] p-6 shadow-[0_0_60px_rgb(0_0_0_/_0.5)]" onClick={e => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white">Invite Member</h2>
          <button onClick={onClose} className="cursor-pointer text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
        </div>

        <div className="mb-5 flex border-b border-border/60">
          <button onClick={() => { setTab('email'); setError(''); }} className={`flex-1 pb-3 font-mono text-[0.6rem] uppercase tracking-widest ${tab === 'email' ? 'border-b-2 border-cyan text-cyan' : 'text-muted-foreground'}`}>
            <Mail className="mr-1 inline size-3" /> By Email
          </button>
          <button onClick={() => { setTab('search'); setError(''); }} className={`flex-1 pb-3 font-mono text-[0.6rem] uppercase tracking-widest ${tab === 'search' ? 'border-b-2 border-cyan text-cyan' : 'text-muted-foreground'}`}>
            <Search className="mr-1 inline size-3" /> Search User
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'email' ? (
            <div>
              <label className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Email address</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="user@example.com" autoFocus
                className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none focus:border-cyan" />
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Search by username</label>
              {selectedUserId ? (
                <div className="flex items-center justify-between rounded border border-cyan/50 bg-cyan/5 px-4 py-3">
                  <span className="text-sm text-foreground">{selectedUserName}</span>
                  <button type="button" onClick={() => { setSelectedUserId(null); setSelectedUserName(''); }} className="cursor-pointer text-coral hover:text-coral/80"><X className="size-4" /></button>
                </div>
              ) : (
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Type a username..." autoFocus
                  className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none focus:border-cyan" />
              )}
            </div>
          )}

          <div>
            <label className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="clip-corner h-11 w-full border border-input bg-background/80 px-4 text-sm text-foreground outline-none cursor-pointer">
              <option value="MODERATOR">Moderator</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">Message (optional)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} placeholder="Join us!"
              className="clip-corner w-full resize-none border border-input bg-background/80 px-4 py-3 text-sm text-foreground outline-none focus:border-cyan" />
          </div>

          {error && <p className="font-mono text-[0.6rem] text-coral">{error}</p>}

          <button type="submit" disabled={loading}
            className="clip-corner flex w-full cursor-pointer items-center justify-center gap-2 border border-cyan bg-cyan/10 px-6 py-3 font-mono text-[0.65rem] uppercase tracking-widest text-cyan transition hover:bg-cyan hover:text-background disabled:opacity-40">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {loading ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add apps/web/components/team/invite-modal.tsx
git commit -m "feat: create invite modal component"
```

---

### Task 4: Create the Team Page

**Files:**
- Create: `apps/web/app/dashboard/studios/[slug]/team/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Users, Crown, Shield } from 'lucide-react';
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
  const { data: members, isLoading: membersLoading } = useStudioMembers(slug);
  const { data: invitations, refetch: refetchInvitations } = useStudioInvitations(slug);
  const [inviteOpen, setInviteOpen] = useState(false);

  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const leaveStudio = useLeaveStudio();
  const transferOwnership = useTransferOwnership();
  const createInvitation = useCreateInvitation();
  const cancelInvitation = useCancelInvitation();

  const currentMember = members?.find((m: any) => m.userId === user?.id);
  const currentUserRole = currentMember?.role;
  const grouped = (members ?? []).reduce((acc: Record<string, any[]>, m: any) => {
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
                <Users className="mr-1 inline size-3.5" /> {members?.length ?? 0} member{(members?.length ?? 0) !== 1 ? 's' : ''}
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
```

- [ ] **Commit**

```bash
git add apps/web/app/dashboard/studios/\[slug\]/team/page.tsx
git commit -m "feat: create team management page"
```

---

### Task 5: Update Sidebar Nav Links

**Files:**
- Modify: `apps/web/app/dashboard/studios/[slug]/page.tsx` — edit studio sidebar
- Modify: `apps/web/components/dashboard/StudioDashboard.tsx` — dashboard sidebar

In **edit studio page** (`apps/web/app/dashboard/studios/[slug]/page.tsx`), find the nav links array and change the Team link from `#` to `/dashboard/studios/${slug}/team`:

```typescript
{ href: `/dashboard/studios/${slug}/team`, icon: <ShieldCheck className="size-4" />, label: 'Team' },
```

In **StudioDashboard.tsx**, find the sidebar nav links and change the Team link:

```typescript
<SidebarLink href={`/dashboard/${studioSlug}/team`} icon={<ShieldCheck className="size-4" />} label="Team" />
```

Note: The StudioDashboard uses `/dashboard/studios/${studioSlug}` as the base path. Check the exact href pattern used by existing links.

- [ ] **Build and commit**

```bash
pnpm --filter @playmorrow/web build 2>&1 | tail -5
git add apps/web/
git commit -m "feat: update sidebar team links to team page"
git push
```
