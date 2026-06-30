# Studio Roles Phase 5 — Invitation UX & Notifications

## Overview

Frontend invitation UX: accept/decline flow, my invitations page, public invite page, invitation badge in header.

## Pages

### `/my/invitations`
List of pending invites for the current user. Each card shows studio name, logo, inviter name, role, and Accept/Decline buttons.

### `/invite/[token]`
Public page for Method A (email) recipients. Shows invitation details. If not authenticated, shows login/register prompt. After auth, allows accept/decline.

## Components

**InvitationBadge** — integrated into SiteHeader. Shows a count badge next to the bell/notifications when `useMyInvitations` returns > 0 items.

## Hooks

`useMyInvitations` already exists from Phase 4. No new hooks needed.

## Files

- Create: `apps/web/app/my/invitations/page.tsx`
- Create: `apps/web/app/invite/[token]/page.tsx`
- Modify: `apps/web/components/site-header.tsx` — add invitation badge with link
