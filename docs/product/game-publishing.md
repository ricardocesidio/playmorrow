# Game Publishing

## Who can create games

Only users who meet ALL of these conditions:
1. Authenticated
2. `accountType` is `STUDIO`
3. Have created at least one studio
4. Are `OWNER` or `ADMIN` member of that studio

PLAYER accounts cannot create games. STUDIO accounts without a studio membership cannot create games.

## Required fields for game creation

| Field | Required | Notes |
|---|---|---|
| Title | Yes | |
| Slug | Yes | Auto-generated from title |
| Studio | Yes | Select from user's studios |
| Status | No | Default: IN_DEVELOPMENT |
| Tagline | No | |
| Description | No | Short description |
| Full README | No | Long-form game readme |
| Price | No | In cents |
| Currency | No | Default: USD |
| Is Free | No | Sets price to 0 |
| Edition | No | Default: Standard Edition |
| Demo Status | No | NO_DEMO, DEMO_LOCKED, DEMO_PLAYABLE, PLAYTEST_AVAILABLE |
| Demo URL | No | Required if demo is playable |
| Engine | No | e.g. Unreal Engine 5 |
| Languages | No | Comma-separated |
| Genres | No | Comma-separated |
| Modes | No | e.g. Single Player |
| Tags | No | Comma-separated |
| Cover Image URL | No | |
| Banner URL | No | |
| Screenshots | No | Dynamic rows with type/URL/caption |
| Platform Links | No | Dynamic rows with platform/URL/label |
| Release Date | No | |
| Expected Release | No | e.g. Q4 2026 |

## Game status values

CONCEPT, PRE_ALPHA, IN_DEVELOPMENT, ALPHA, BETA, EARLY_ACCESS, RELEASED, CANCELLED, ON_HOLD

## Demo status values

| Value | UI Display |
|---|---|
| NO_DEMO | Hidden/no CTA |
| DEMO_LOCKED | "Demo locked" |
| DEMO_PLAYABLE | "Play demo" (links to demo URL) |
| PLAYTEST_AVAILABLE | "Join playtest" (links to playtest URL) |

## Featured flag

Only ADMIN can set the `featured` flag on a game. Studio owners/admins cannot mark their own games as featured.

## Game detail page sections

The premium game detail page at `/games/[slug]` shows:
- Hero art, title, subtitle, studio block
- Follow button + counts (followers, wishlists, comments, views)
- Price/edition/demo + wishlist button + share buttons
- Tags, trailer, screenshots with lightbox
- About/readme, roadmap, latest devlogs
- Quick info (developer, publisher, engine, languages, modes, genres)
- External links (Steam, Epic, Website, Discord, etc.)
- Community discussion (real comments + likes)

All data comes from the API/database. No hardcoded values.
