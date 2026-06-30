# Studio Roles Phase 6 — Audit Log & Activity

## Overview

Activity feed showing audit log entries in the team page. Backend endpoint for fetching logs. Frontend display with human-readable labels.

## Backend

**GET `/studios/:slug/audit-logs`**
- Guarded by `StudioRoles(OWNER, ADMIN)`
- Returns paginated logs with actor info
- Default: last 50, ordered by newest first

## Frontend

**Activity section** added to bottom of team page. Shows action icon, human-readable label, relative time, and actor name.

### Action labels

| DB action | Display label |
|---|---|
| `MEMBER_INVITED` | "invited [role]" |
| `INVITATION_ACCEPTED` | "joined the studio" |
| `INVITATION_CANCELLED` | "cancelled invitation" |
| `MEMBER_REMOVED` | "removed [role]" |
| `MEMBER_ROLE_CHANGED` | "changed role to [role]" |
| `MEMBER_LEFT` | "left the studio" |
| `OWNERSHIP_TRANSFERRED` | "transferred ownership" |
| `GAME_CREATED` | "created a game" |
| `GAME_DELETED` | "deleted a game" |

## Files

- Create: `apps/api/src/audit-log/audit-log.controller.ts`
- Modify: `apps/api/src/audit-log/audit-log.module.ts` — register controller
- Modify: `apps/web/lib/api/hooks.ts` — add useStudioAuditLogs
- Modify: `apps/web/app/dashboard/studios/[slug]/team/page.tsx` — add activity section
