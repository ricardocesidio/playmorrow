# Admin Role

## What is ADMIN?

ADMIN is a **global role** on the `User.role` field. It is NOT an account type.

The `UserRole` enum has: `PLAYER`, `PUBLISHER`, `MODERATOR`, `ADMIN`

## How to become ADMIN

There is NO public way to register as ADMIN:
- Registration DTO has no `role` field
- Any submitted `role` in the body is ignored (class-validator strips unknown properties)
- No frontend UI for ADMIN selection

The only way to become ADMIN is via the owner bootstrap script:

```bash
pnpm admin:ensure
```

This script:
1. Reads `PLAYMORROW_OWNER_EMAIL` from environment
2. Finds the user with that email
3. Promotes them to `role: ADMIN`
4. If the user doesn't exist, shows an error message

## Configuration

Add to `.env`:
```
PLAYMORROW_OWNER_EMAIL=your-email@example.com
PLAYMORROW_OWNER_USERNAME=your-username (optional)
```

## Protected routes

- `GET /api/admin/me` — returns current admin info
- Admin dashboard routes are protected by `RolesGuard` checking for `ADMIN` role
- Reports management at `/dashboard/reports` requires ADMIN

## Security

- Only ONE admin should exist (the project owner)
- The admin script never runs from an HTTP request
- Registration cannot create ADMIN accounts
- There is no "make me admin" endpoint
