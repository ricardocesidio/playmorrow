# Playmorrow — Engineering Handoff

> **Generated:** 2026-06-28
> **Repo:** https://github.com/ricardocesidio/playmorrow (`main`)

## Current status

### ✅ Completed

| Feature | Status | Details |
|---|---|---|
| **Session auth** | ✅ | httpOnly cookies, SHA-256 hashed, revocable, SameSite conditional |
| **Email verification** | ✅ | 6-digit code via Resend, rate limited, single-use |
| **Password reset** | ✅ | Forgot/reset flow with tokens |
| **Account lockout** | ✅ | 5 failed attempts → 15 min lockout |
| **Rate limiting** | ✅ | Global 60/min, per-route tighter limits |
| **Google OAuth** | ✅ | Working with proper client credentials |
| **GitHub OAuth** | ✅ | Working with proper client credentials |
| **Account types** | ✅ | PLAYER vs STUDIO, onboarding intent only |
| **Permissions** | ✅ | StudioMember roles (OWNER/ADMIN/MEMBER) enforced |
| **Admin role** | ✅ | Protected bootstrap via `pnpm admin:ensure` |
| **Registration consent** | ✅ | Terms/Privacy/Community Guidelines acceptance |
| **Game detail page** | ✅ | Premium interactive page with follow, wishlist, share, lightbox, community |
| **Professional splash** | ✅ | Cyberpunk animated splash (5-8s, sessionStorage) |
| **Pagination** | ✅ | 16 games/page with URL params |
| **Search** | ✅ | Header dropdown + search page with 300ms debounce |
| **Live feed** | ✅ | Real data from DB (devlogs + roadmap) |
| **User profiles** | ✅ | `/users/[username]` with followers, activity |
| **Studio profiles** | ✅ | `/studios/[slug]` with banner, stats, members, games |
| **Follow system** | ✅ | Games + studios, real endpoints |
| **Wishlist** | ✅ | Private, real endpoints |
| **Comments** | ✅ | Game-level comments with likes |
| **Onboarding wizard** | ✅ | Multi-step (account type, username, profile, review) |
| **Player Dashboard** | ✅ | PLAYER-focused dashboard with sidebar, wishlist, following, feed |
| **Dashboard separation** | ✅ | `/dashboard` routes by `accountType` |
| **Seed data** | ✅ | 5 demo games + studios with real data |
| **Demo assets** | ✅ | 30 SVG placeholder assets for 5 games |
| **Footer** | ✅ | X/Twitter link + Instagram + copyright |
| **Password visibility** | ✅ | Toggle on login/register/reset-password |
| **Notification dropdown** | ✅ | Cyberpunk dropdown in header |
| **Profile settings** | ✅ | `/settings/profile` with email change limit (2x) |
| **Game creation form** | ✅ | Complete form with README, demo, engine, languages, genres |
| **Game README page** | ✅ | `/games/[slug]/readme` |
| **GameView tracking** | ✅ | Views counted per game detail visit |
| **CSP headers** | ✅ | Helmet-configured, updated for Next.js compatibility |

### 🔴 Critical Issues

| Issue | Status | Details |
|---|---|---|
| Google OAuth credentials need updating | 🔴 | User created new Google project. Render needs `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` updated |
| Onboarding not fully integrated with email registration | 🟡 | Email registration still uses old flow, doesn't redirect to onboarding |

### 🟡 Open / In Progress

| Item | Priority | Notes |
|---|---|---|
| Email registration → onboarding | Medium | Should also use the new onboarding wizard |
| Dashboard empty states | Medium | Professional empty states for wishlist/feed/notifications |
| Remove fake seed data defaults | Medium | Dashboard should start completely empty for new users |
| Account dropdown menu | Low | Click avatar → dropdown with navigation |
| Activity feed / Signal Relay | Low | Real events for follows, comments, wishlist |
| GitHub OAuth testing | Low | Not yet tested with credentials |
| Production deployment | Low | Vercel + Render configured, needs final validation |

### 📋 Recommended Next Steps

1. **Update Render env vars** with new Google OAuth credentials
2. **Test Google login flow** end-to-end (Google → onboarding → dashboard)
3. **Integrate email registration** with new onboarding wizard
4. **Create empty states** for all dashboard sections
5. **Add account dropdown** to header
6. **Create activity feed events** for real-time Signal Relay

## Architecture

```
playmorrow.vercel.app (Next.js 15)
  └── /api/* → Next.js proxy → playmorrow-api.onrender.com (NestJS 11)
                                        └── neon.tech (PostgreSQL)
```

### Key env vars

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Vercel | Frontend API URL |
| `API_URL` | Vercel (server) | Server-side API calls |
| `DATABASE_URL` | Render + `.env` | Prisma connection |
| `JWT_SECRET` | Render | JWT signing |
| `SESSION_SECRET` | Render | Session cookie signing |
| `GOOGLE_CLIENT_ID` | Render | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Render | Google OAuth |
| `GOOGLE_CALLBACK_URL` | Render | Google OAuth callback |
| `PLAYMORROW_OWNER_EMAIL` | Render | Admin bootstrap |
| `RESEND_API_KEY` | Render | Email verification |

## Commands

```bash
pnpm dev              # Run web + API
pnpm build            # Full build
pnpm lint             # Lint all
pnpm typecheck        # TypeScript check
pnpm admin:ensure     # Promote user to ADMIN
pnpm db:seed          # Seed demo data
pnpm db:migrate       # Create migration
pnpm db:deploy        # Apply migration to production
```
