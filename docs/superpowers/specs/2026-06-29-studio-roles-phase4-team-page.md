# Studio Roles Phase 4 — Team Management Page

## Overview

Frontend team management page at `/dashboard/studios/[slug]/team`. Displays members grouped by role with action menus, invitations section, and invite modal.

## Page Structure

- Header: "Team · N members" + "Invite Member" button
- Grouped sections: OWNER, ADMIN, MODERATOR/MEMBER
- Each member card: avatar, displayName, username, role badge, joined date, actions menu
- Pending invitations section (Owner/Admin only)
- Invite modal: two tabs (By Email, Search Users)

## Hooks

All PATCH, DELETE, POST calls go through the existing `api` client:

- `useUpdateMemberRole()` → `api.patch('/studios/${slug}/members/${userId}', { role?, title? })`
- `useRemoveMember()` → `api.delete('/studios/${slug}/members/${userId}')`
- `useLeaveStudio()` → `api.post('/studios/${slug}/members/leave')`
- `useTransferOwnership()` → `api.post('/studios/${slug}/transfer', { targetUserId })`
- `useCreateInvitation()` → `api.post('/studios/${slug}/invitations', { email? | userId?, role, message? })`
- `useCancelInvitation()` → `api.delete('/studios/${slug}/invitations/${id}')`
- `useStudioInvitations()` → `api.get('/studios/${slug}/invitations?status=PENDING')`
- `useMyInvitations()` → `api.get('/me/invitations')`

## Files Created

- `apps/web/app/dashboard/studios/[slug]/team/page.tsx` — main page
- `apps/web/components/team/team-member-card.tsx` — member card component
- `apps/web/components/team/invite-modal.tsx` — invite modal

## Files Modified

- `apps/web/lib/api/hooks.ts` — add hooks
- `apps/web/app/dashboard/studios/[slug]/page.tsx` — update sidebar Team link
- `apps/web/components/dashboard/StudioDashboard.tsx` — update sidebar Team link
