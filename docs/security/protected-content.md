# PlayMorrow Protected Content & Future Access Model

## Current access model

### Public content (no auth required)
- Studio profiles (detail, members, games list)
- Game profiles (detail, devlogs, roadmap, press kit)
- Published devlogs
- Global games catalogue with search
- Studios directory with search
- Public development feed
- Public search
- User profiles
- Health endpoint

### Authenticated-only content
- Studio creation, editing, deletion
- Game creation, editing, deletion
- Devlog creation, editing, deletion, drafts
- Roadmap management (create, edit, reorder, delete)
- Press kit management
- Following/unfollowing studios and games
- Comments (create, edit, delete)
- Reactions (create, delete)
- Personalized feed
- Notifications (list, read, dismiss)
- File uploads
- Personal profile editing
- Account deletion
- Dashboard
- Creating reports

### Owner/Admin-only content
- Studio editing/deletion (studio ADMIN/OWNER)
- Game editing/deletion (studio member)
- Devlog editing/deletion (author or studio member)
- Roadmap management (studio member)
- Press kit editing (studio member)

### Global ADMIN-only content
- Admin reports listing
- Admin report detail
- Admin report resolution/dismissal
- Admin-only test route

## Why frontend-only protection is not security

Frontend route guards and hidden UI elements are convenience features, not security controls. Any user can:

1. Open browser DevTools and modify JavaScript
2. Send direct HTTP requests to the API via `fetch` or `curl`
3. Bypass the frontend entirely and call the API directly

All authorization must be enforced server-side. PlayMorrow follows this pattern:
- Every write endpoint is protected by `SessionAuthGuard`
- Ownership is verified in the service layer (not the controller)
- `assertStudioWriteAccess()` centralizes studio permission checks
- Admin endpoints are protected by `RolesGuard` with `@Roles('ADMIN')`

## Future paid/protected content

### Content that could become premium

| Feature | Current access | Required backend changes |
|---|---|---|
| Premium studio profiles (custom CSS, analytics) | Public read + auth write | Add `subscriptionTier` to `Studio` model, gate premium features |
| Sponsored placements in feed/games | Auth write (sponsor) | Add sponsorship model, filter logic in feed queries |
| Private devlogs (team-only) | Optional draft visibility | Add `visibility` field to `Devlog`, enforce in service |
| Private press kit downloads | Public | Add `downloadAccess` field, gate in service |
| Analytics dashboard | Auth (studio member) | Already gated — add tier check |
| Team-only roadmap drafts | Public read | Add `visibility` field to `RoadmapItem` |
| Subscription limits (max studios/games) | None currently | Add limits to `User` or `Studio` model |

### Recommended permission model

```
User.subscriptionTier: 'FREE' | 'PRO' | 'ENTERPRISE'
Studio.subscriptionTier: 'FREE' | 'PRO' (inherits or overrides)
```

Backend gating pattern:

```typescript
// Service layer — not frontend
async function requireTier(userId: string, minimumTier: SubscriptionTier) {
  const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { subscriptionTier: true } });
  const tiers = { FREE: 0, PRO: 1, ENTERPRISE: 2 };
  if (tiers[user.subscriptionTier] < tiers[minimumTier]) {
    throw new ForbiddenException('Upgrade required');
  }
}
```

## Current backend permission enforcement

| Feature | Enforcement | Location |
|---|---|---|
| Studio write | `assertStudioWriteAccess()` | `studios.service.ts` |
| Game write | Studio membership check | `games.service.ts` |
| Devlog write | Author or studio member | `devlogs.service.ts` |
| Roadmap write | Studio membership check | `roadmap-items.service.ts` |
| Press kit write | Studio membership check | `press-kits.service.ts` |
| Comment edit | Author only | `comments.service.ts` |
| Notification read | Recipient only | `notifications.service.ts` |
| Admin reports | `RolesGuard` + `@Roles('ADMIN')` | Controller level |
| Account deletion | Self + password verify | `users.controller.ts` |
| Session list | Self via `CurrentUser()` | Controller level |

All enforcement is server-side. No frontend-only authorization exists.
