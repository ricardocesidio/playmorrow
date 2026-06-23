# Account Types & Wishlist — Product Design

## Account types

PlayMorrow has two account types to distinguish registration intent:

| Type | Label | Description |
|---|---|---|
| `PLAYER` | Player | Follow games, comment, react, save games to private wishlist |
| `STUDIO` | Studio / Indie Company | Create studio profile, publish games, post devlogs, manage roadmaps |

## Important: accountType is NOT authorization

- A `STUDIO` account does NOT automatically get studio permissions.
- Permission to create/edit studio content requires StudioMember role.
- A `PLAYER` account can create a studio through the normal studio creation flow.
- All authorization is enforced server-side via `assertStudioWriteAccess()`.

## Registration flow

1. User visits `/register`
2. Chooses "Player" or "Studio / Indie Company"
3. Fills in name, username, email, password
4. Submits with `accountType: 'PLAYER'` or `accountType: 'STUDIO'`
5. Backend validates and stores accountType
6. Player → redirected to `/dashboard`
7. Studio → redirected to `/studios/new?from=register`

## Wishlist

### What it is

A private list of games the user is interested in.

### Privacy rules

- Wishlist is **private** — only the current user can see their own wishlist.
- Other users and studios cannot see who has wishlisted their games.
- No public wishlist counts are displayed.
- Wishlist is separate from follows (follows are public/social, wishlist is private).

### Where it appears

- Game detail page — wishlist toggle button
- Dashboard — "My Wishlist" section showing saved games
- API — `/api/me/wishlist` for the current user

### Difference between Follow and Wishlist

| Feature | Follow | Wishlist |
|---|---|---|
| Visibility | Public | Private |
| Updates feed | Affects personalized feed | No feed impact |
| Target | Studios and games | Games only |
| Use case | Social discovery | Personal save list |

## API endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/games/:slug/wishlist` | Required | Add game to wishlist (idempotent) |
| DELETE | `/api/games/:slug/wishlist` | Required | Remove game from wishlist (idempotent) |
| GET | `/api/games/:slug/wishlist-status` | Optional | Check wishlist status for current viewer |
| GET | `/api/me/wishlist` | Required | List current user's wishlist items |

## Future ideas

- Dedicated `/dashboard/wishlist` page with full paginated list
- Wishlist export/share (opt-in)
- Email notification when wishlisted game has major update
