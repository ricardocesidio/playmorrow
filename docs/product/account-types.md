# Account Types

## PLAYER

A normal user who discovers games, follows studios, wishlists games, comments, and reacts.

**Can do:**
- Browse games, studios, feed
- Follow/unfollow games and studios
- Wishlist/unwishlist games
- Comment on game pages
- Like/unlike community comments
- Edit own profile
- Receive notifications

**Cannot do:**
- Create games
- Create/edit studios
- Publish devlogs
- Manage roadmaps
- Access studio dashboard
- Access admin dashboard

## STUDIO

An indie developer, studio, or company account that publishes games and content.

**Can do everything PLAYER can, plus:**
- Create and manage a studio profile
- Create games (requires OWNER/ADMIN studio membership)
- Publish devlogs
- Manage roadmaps
- Create press kits
- Manage game media and external links

**Important:** Having `accountType: STUDIO` alone does NOT grant permissions to edit any studio or game. The user must be a `StudioMember` with `OWNER` or `ADMIN` role in that specific studio.

## ADMIN (Role, not Account Type)

ADMIN is a **global role**, not an account type. It's set on the `User.role` field.

**There is no way to register as ADMIN.**
- Registration ignores any submitted `role` field
- Only the configured owner email (`PLAYMORROW_OWNER_EMAIL`) can be promoted to ADMIN
- Admin promotion is done via `pnpm admin:ensure`

## Backend enforcement

- `RolesGuard` checks `user.role` against required roles
- `StudioMember` roles check `OWNER`/`ADMIN`/`MEMBER` via `StudiosService`
- Game creation endpoints check studio membership + role
- Registration DTO does NOT have a `role` field
