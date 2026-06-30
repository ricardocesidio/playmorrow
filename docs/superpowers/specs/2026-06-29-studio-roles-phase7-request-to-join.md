# Studio Roles Phase 7 — Request to Join

## Overview

Allow PLAYERs to request joining a studio. Studio admins approve or reject requests. Reuses existing `StudioInvitation` model with status `REQUESTED`.

## Backend

### InvitationsService — new methods

- `requestJoin(studioSlug, userId)` — creates invitation with status REQUESTED, role=MEMBER, no token
- `findJoinRequests(studioId)` — returns all REQUESTED invitations for the studio
- `approveJoinRequest(studioId, requestId, actorId)` — creates StudioMember, changes status to ACCEPTED, audit log, notification
- `rejectJoinRequest(studioId, requestId, actorId)` — changes status to REJECTED, audit log

### InvitationsController — new endpoints

All prefixed with `studios/:slug`:
- `POST /request-join` → `requestJoin()`
- `GET /join-requests` → guarded by StudioRoles(OWNER, ADMIN)
- `POST /join-requests/:userId/approve` → guarded
- `POST /join-requests/:userId/reject` → guarded

## Frontend

### Team page — Pending Requests section
Added after Pending Invitations. Shows requester avatar, name, date, and Approve/Reject buttons.

### Studio public page — Request to Join button
Added for non-members. Shows "Request to Join" button. After clicking, shows "Request sent" state.
