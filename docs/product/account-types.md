# Account Types — Product Design

## Definition

Account type (`accountType`) represents the user's registration intent.

| Type | Meaning |
|---|---|
| `PLAYER` | Follow games, comment, react, build feed |
| `STUDIO` | Publish games, post devlogs, manage roadmaps, create press kits |

## Important: accountType is NOT authorization

A `STUDIO` account does NOT automatically get studio permissions. Permission
to create/edit studio content still requires:

- Authenticated user (session cookie)
- Studio membership (`StudioMember` record)
- Appropriate studio role (`OWNER` or `ADMIN`) for destructive operations

This is enforced server-side via `assertStudioWriteAccess()` and service-layer
ownership checks. Account type is never checked in permission logic.

A `PLAYER` account can create a studio through the normal studio creation
endpoint and become an `OWNER` of that studio.

## Where accountType is used

- Registration flow — to customize onboarding copy
- Dashboard — to personalize CTAs and suggestions
- User profile — informational display

## Database

Stored in `User.accountType` with a default of `PLAYER`.
Existing users get `PLAYER` automatically via the default.

## Future account types

If the product adds subscription plans, account type could inform default
limits (e.g., `STUDIO` starts with higher devlog quota). However, limits
should be enforced via a separate `subscriptionTier` field, not accountType.
