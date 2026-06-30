# Studio Roles Phase 5 — Invitation UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Frontend invitation UX — accept/decline flow, my invitations page, public invite page, invitation badge in header.

**Architecture:** Two new pages (my invitations, public invite) + SiteHeader badge. Uses existing `useMyInvitations` hook from Phase 4.

**Tech Stack:** Next.js 15 App Router, React 19

## Global Constraints

- Same cyberpunk design language
- Accept/decline mutations call existing backend endpoints
- Public invite page at `/invite/[token]` works without auth (shows login prompt)

---

### Task 1: Create My Invitations Page

**Files:**
- Create: `apps/web/app/my/invitations/page.tsx`

```typescript
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Check, X, Loader2 } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { useMyInvitations } from '@/lib/api/hooks';
import { api } from '@/lib/api/client';

export default function MyInvitationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data: invitations, isLoading, refetch } = useMyInvitations();

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
    } catch {}
  };

  const handleDecline = async (token: string) => {
    try {
      await api.post(`/invitations/${token}/decline`);
      refetch();
    } catch {}
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
              {invitations.map((inv: any) => (
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
```

- [ ] **Commit**

```bash
git add apps/web/app/my/invitations/page.tsx
git commit -m "feat: create my invitations page"
```

---

### Task 2: Create Public Invite Page

**Files:**
- Create: `apps/web/app/invite/[token]/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Check, X, Loader2, ArrowLeft } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/api/auth-context';
import { api } from '@/lib/api/client';

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    api.get(`/invitations/${token}`)
      .then(setInvitation)
      .catch(() => setError('Invitation not found or expired'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await api.post(`/invitations/${token}/accept`);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Failed to accept invitation');
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
```

- [ ] **Commit**

```bash
git add apps/web/app/invite/\[token\]/page.tsx
git commit -m "feat: create public invite page"
```

---

### Task 3: Add Invitation Badge to SiteHeader

**Files:**
- Modify: `apps/web/components/site-header.tsx`

- [ ] **Step 1: Add invitation badge**

In `site-header.tsx`, import `useMyInvitations` from `@/lib/api/hooks` and add a badge near the notification dropdown:

```typescript
import { useMyInvitations } from '@/lib/api/hooks';

// Inside the SiteHeader component:
const { data: invitations } = useMyInvitations();
const pendingCount = invitations?.length ?? 0;
```

Find the notification dropdown area and add an invitation link with badge:

```typescript
{!isLoading && isAuthenticated && user && (
  <>
    {/* Invitation badge */}
    <Link href="/my/invitations" className="relative hidden sm:block">
      <div className="grid size-8 place-items-center rounded-full border border-border bg-background/60 text-muted-foreground hover:text-cyan transition">
        <Building2 className="size-4" />
      </div>
      {pendingCount > 0 && (
        <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-coral px-1 py-0.5 font-mono text-[9px] font-bold text-white leading-none">
          {pendingCount > 9 ? '9+' : pendingCount}
        </span>
      )}
    </Link>
    {/* Existing notification dropdown */}
    <NotificationDropdown />
    {/* Existing user menu */}
    <div className="relative group hidden sm:block">...
```

Import `Building2` from `lucide-react` if not already imported.

- [ ] **Step 2: Build and commit**

```bash
pnpm --filter @playmorrow/web build 2>&1 | tail -5
git add apps/web/components/site-header.tsx
git commit -m "feat: add invitation badge to header"
git push
```
