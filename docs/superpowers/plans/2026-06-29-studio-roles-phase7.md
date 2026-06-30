# Studio Roles Phase 7 — Request to Join Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Allow PLAYERs to request joining a studio and admins to approve/reject.

**Architecture:** Four new backend endpoints in InvitationsService/Controller. New frontend section in team page + button on studio public page.

---

### Task 1: Backend — Add request-join methods to InvitationsService

**Files:**
- Modify: `apps/api/src/invitations/invitations.service.ts`

Add four methods:

```typescript
async requestJoin(slug: string, userId: string) {
  const studio = await this.prisma.studio.findUnique({ where: { slug } });
  if (!studio) throw new NotFoundException('Studio not found');

  const existing = await this.prisma.studioMember.findUnique({
    where: { studioId_userId: { studioId: studio.id, userId } },
  });
  if (existing) throw new ConflictException('You are already a member');

  const pending = await this.prisma.studioInvitation.findFirst({
    where: { studioId: studio.id, userId, status: 'REQUESTED' },
  });
  if (pending) throw new ConflictException('You already have a pending request');

  const invitation = await this.prisma.studioInvitation.create({
    data: { studioId: studio.id, invitedById: userId, userId, role: 'MEMBER', token: '', status: 'REQUESTED', expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  });

  // Notify admins
  const admins = await this.prisma.studioMember.findMany({
    where: { studioId: studio.id, role: { in: ['OWNER', 'ADMIN'] } },
  });
  for (const admin of admins) {
    await this.notifications.create({
      recipientId: admin.userId,
      actorId: userId,
      type: 'JOIN_REQUEST',
      title: `Someone wants to join ${studio.name}`,
      targetType: 'STUDIO',
      targetId: studio.id,
    });
  }

  return invitation;
}

async findJoinRequests(slug: string) {
  const studio = await this.prisma.studio.findUnique({ where: { slug } });
  if (!studio) throw new NotFoundException('Studio not found');
  return this.prisma.studioInvitation.findMany({
    where: { studioId: studio.id, status: 'REQUESTED' },
    include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

async approveJoinRequest(slug: string, requestUserId: string, actorId: string) {
  const studio = await this.prisma.studio.findUnique({ where: { slug } });
  if (!studio) throw new NotFoundException('Studio not found');

  const request = await this.prisma.studioInvitation.findFirst({
    where: { studioId: studio.id, userId: requestUserId, status: 'REQUESTED' },
  });
  if (!request) throw new NotFoundException('Join request not found');

  await this.prisma.studioMember.create({
    data: { studioId: studio.id, userId: requestUserId, role: 'MEMBER' },
  });

  await this.prisma.studioInvitation.update({
    where: { id: request.id },
    data: { status: 'ACCEPTED', acceptedAt: new Date() },
  });

  await this.auditLog.log({
    studioId: studio.id, actorId, action: 'MEMBER_JOINED', targetType: 'USER', targetId: requestUserId,
  });

  await this.notifications.create({
    recipientId: requestUserId, actorId, type: 'MEMBER_JOINED', title: `You joined ${studio.name}`, targetType: 'STUDIO', targetId: studio.id,
  });
}

async rejectJoinRequest(slug: string, requestUserId: string, actorId: string) {
  const studio = await this.prisma.studio.findUnique({ where: { slug } });
  if (!studio) throw new NotFoundException('Studio not found');

  const request = await this.prisma.studioInvitation.findFirst({
    where: { studioId: studio.id, userId: requestUserId, status: 'REQUESTED' },
  });
  if (!request) throw new NotFoundException('Join request not found');

  await this.prisma.studioInvitation.update({
    where: { id: request.id },
    data: { status: 'REJECTED', rejectedAt: new Date() },
  });

  await this.auditLog.log({
    studioId: studio.id, actorId, action: 'JOIN_REQUEST_REJECTED', targetType: 'USER', targetId: requestUserId,
  });
}
```

Controller updates — add these endpoints to InvitationsController:

```typescript
@Post('studios/:slug/request-join')
@UseGuards(SessionAuthGuard)
async requestJoin(@Param('slug') slug: string, @CurrentUser() user: { id: string }) {
  return this.invitationsService.requestJoin(slug, user.id);
}

@Get('studios/:slug/join-requests')
@UseGuards(SessionAuthGuard, StudioRolesGuard)
@StudioRoles(StudioRole.OWNER, StudioRole.ADMIN)
async listJoinRequests(@Param('slug') slug: string) {
  return this.invitationsService.findJoinRequests(slug);
}

@Post('studios/:slug/join-requests/:userId/approve')
@UseGuards(SessionAuthGuard, StudioRolesGuard)
@StudioRoles(StudioRole.OWNER, StudioRole.ADMIN)
async approveJoin(@Param('slug') slug: string, @Param('userId') userId: string, @CurrentUser() user: { id: string }) {
  return this.invitationsService.approveJoinRequest(slug, userId, user.id);
}

@Post('studios/:slug/join-requests/:userId/reject')
@UseGuards(SessionAuthGuard, StudioRolesGuard)
@StudioRoles(StudioRole.OWNER, StudioRole.ADMIN)
async rejectJoin(@Param('slug') slug: string, @Param('userId') userId: string, @CurrentUser() user: { id: string }) {
  return this.invitationsService.rejectJoinRequest(slug, userId, user.id);
}
```

Build: `pnpm --filter @playmorrow/api build 2>&1 | tail -5`
Commit: `git add apps/api/src/invitations/ && git commit -m "feat: add request-join endpoints"`

---

### Task 2: Frontend — Team page requests section + studio page button

**Files:**
- Modify: `apps/web/app/dashboard/studios/[slug]/team/page.tsx`
- Create/modify: `apps/web/app/studios/[slug]/page.tsx`

#### Team page — add Pending Requests section

After the Pending Invitations section, add:

```typescript
// Query join requests
const { data: joinRequests, refetch: refetchRequests } = useStudioInvitations(slug);

// Filter to only REQUESTED status
const pendingRequests = (joinRequests ?? []).filter((inv: any) => inv.status === 'REQUESTED');

// JSX section (after Pending Invitations, if currentUserRole is OWNER/ADMIN):
{pendingRequests.length > 0 && (
  <div className="mt-6">
    <h2 className="mb-3 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
      Pending Requests ({pendingRequests.length})
    </h2>
    <div className="space-y-2">
      {pendingRequests.map((req: any) => (
        <div key={req.id} className="clip-corner flex items-center gap-3 border border-border/60 bg-[#050b0f]/50 px-4 py-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-background/60 text-xs font-bold overflow-hidden">
            {req.user?.avatarUrl ? <img src={req.user.avatarUrl} alt="" className="size-full object-cover" /> : req.user?.displayName?.slice(0, 1) ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[0.6rem] text-foreground">{req.user?.displayName ?? 'Unknown'}</p>
            <p className="font-mono text-[0.55rem] text-muted-foreground/60">{new Date(req.createdAt).toLocaleDateString()}</p>
          </div>
          <button onClick={() => { /* approve */ }}
            className="clip-corner cursor-pointer border border-cyan bg-cyan/10 px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-wider text-cyan hover:bg-cyan hover:text-background">
            Approve
          </button>
          <button onClick={() => { /* reject */ }}
            className="clip-corner cursor-pointer border border-coral/60 px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-wider text-coral hover:bg-coral/20">
            Reject
          </button>
        </div>
      ))}
    </div>
  </div>
)}
```

But don't use `any` types. Use a local interface.

#### Studio public page — Request to Join button

In `apps/web/app/studios/[slug]/page.tsx`, add a "Request to Join" button for users who are not members:

```typescript
// After the follow button, add:
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/api/auth-context';

// Inside the component:
const { user } = useAuth();
const [requestSent, setRequestSent] = useState(false);

// Check if current user is a member
const isMember = studio?.members?.some((m: any) => m.userId === user?.id);

// Button (if user is logged in, not a member, and not the studio owner):
{user && !isMember && !requestSent && (
  <button onClick={async () => {
    try {
      await api.post(`/studios/${slug}/request-join`);
      setRequestSent(true);
    } catch {}
  }} className="...">Request to Join</button>
)}
{requestSent && <p className="...">Request sent!</p>}
```

Build: `pnpm --filter @playmorrow/web build 2>&1 | tail -5`
Commit:
```bash
git add apps/web/
git commit -m "feat: add request-join UI to team page and studio public page"
git push
```
