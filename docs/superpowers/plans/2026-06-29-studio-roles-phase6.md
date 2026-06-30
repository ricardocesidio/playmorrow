# Studio Roles Phase 6 — Audit Log & Activity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Activity feed showing audit log entries in the team page with backend endpoint.

**Architecture:** New AuditLogController with paginated GET endpoint + frontend activity section in team page.

**Tech Stack:** NestJS 11, Next.js 15

---

### Task 1: Backend AuditLog Controller

**Files:**
- Create: `apps/api/src/audit-log/audit-log.controller.ts`
- Modify: `apps/api/src/audit-log/audit-log.module.ts`

- [ ] **Step 1: Create the controller**

```typescript
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { StudioRolesGuard } from '../studios/guards/studio-roles.guard';
import { StudioRoles } from '../studios/guards/studio-roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { StudioRole } from '@playmorrow/database';

@ApiTags('Audit Logs')
@Controller('studios/:slug/audit-logs')
@UseGuards(SessionAuthGuard, StudioRolesGuard)
@StudioRoles(StudioRole.OWNER, StudioRole.ADMIN)
export class AuditLogController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOkResponse({ description: 'Paginated audit logs.' })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Param('slug') slug: string,
    @Query('limit') limit = '50',
  ) {
    const studio = await this.prisma.studio.findUnique({ where: { slug } });
    if (!studio) return { items: [], total: 0 };

    const logs = await this.prisma.auditLog.findMany({
      where: { studioId: studio.id },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit, 10) || 50, 100),
      include: {
        actor: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
      },
    });

    const total = await this.prisma.auditLog.count({ where: { studioId: studio.id } });

    return { items: logs, total };
  }
}
```

- [ ] **Step 2: Update AuditLogModule**

```typescript
// apps/api/src/audit-log/audit-log.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
```

- [ ] **Step 3: Build and commit**

```bash
pnpm --filter @playmorrow/api build 2>&1 | tail -5
git add apps/api/src/audit-log/
git commit -m "feat: add audit log controller with GET endpoint"
```

---

### Task 2: Frontend Activity Section

**Files:**
- Modify: `apps/web/lib/api/hooks.ts` — add useStudioAuditLogs
- Modify: `apps/web/app/dashboard/studios/[slug]/team/page.tsx` — add activity section

- [ ] **Step 1: Add the hook**

```typescript
// In apps/web/lib/api/hooks.ts, add after the team management hooks:
export function useStudioAuditLogs(slug: string) {
  return useQuery({
    queryKey: ['auditLogs', slug],
    queryFn: () => api.get<{ items: any[]; total: number }>(`/studios/${slug}/audit-logs`),
    enabled: !!slug,
  });
}
```

- [ ] **Step 2: Add activity section to team page**

In `apps/web/app/dashboard/studios/[slug]/team/page.tsx`, after the pending invitations section and before the `</div>` that closes the main content, add:

```typescript
import { useStudioAuditLogs } from '@/lib/api/hooks';
import { History } from 'lucide-react';

// Inside the component, after the invitations section:
const { data: auditLogs } = useStudioAuditLogs(slug);

const actionLabels: Record<string, string> = {
  MEMBER_INVITED: 'invited a',
  INVITATION_ACCEPTED: 'joined the studio',
  INVITATION_CANCELLED: 'cancelled an invitation',
  MEMBER_REMOVED: 'removed a',
  MEMBER_ROLE_CHANGED: 'changed role',
  MEMBER_LEFT: 'left the studio',
  OWNERSHIP_TRANSFERRED: 'transferred ownership',
  GAME_CREATED: 'created a game',
  GAME_DELETED: 'deleted a game',
  MEMBER_TITLE_CHANGED: 'changed title',
};

// Activity section JSX (add after the invitations section):
{(currentUserRole === 'OWNER' || currentUserRole === 'ADMIN') && auditLogs?.items && auditLogs.items.length > 0 && (
  <div className="mt-10">
    <h2 className="mb-3 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
      <History className="mr-1 inline size-3.5" /> Activity
    </h2>
    <div className="space-y-1">
      {auditLogs.items.map((log: any) => (
        <div key={log.id} className="flex items-center gap-3 border-b border-border/30 px-2 py-2.5">
          <div className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-background/40 overflow-hidden">
            {log.actor?.avatarUrl ? (
              <img src={log.actor.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-[9px] font-bold text-muted-foreground">{log.actor?.displayName?.slice(0, 1) ?? '?'}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[0.58rem] text-foreground">
              <span className="font-semibold text-cyan">{log.actor?.displayName ?? 'Someone'}</span>{' '}
              {actionLabels[log.action] ?? log.action.toLowerCase()}
              {log.metadata && (log.metadata as any).role && <span className="text-muted-foreground"> {(log.metadata as any).role}</span>}
            </p>
          </div>
          <p className="shrink-0 font-mono text-[0.5rem] text-muted-foreground/50">
            {formatRelativeTime(log.createdAt)}
          </p>
        </div>
      ))}
    </div>
  </div>
)}
```

Add a `formatRelativeTime` helper:

```typescript
function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
```

- [ ] **Step 3: Build and commit**

```bash
pnpm --filter @playmorrow/web build 2>&1 | tail -5
git add apps/web/
git commit -m "feat: add activity feed with audit logs to team page"
git push
```
