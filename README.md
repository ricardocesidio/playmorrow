# Playmorrow

**Discover tomorrow's indie games today.**

Playmorrow is a social platform where indie studios share their development journey — devlogs, roadmaps, trailers, and community — and players discover games before they ship.

<p align="center">
  <a href="https://playmorrow.vercel.app">Browse games →</a>
  &nbsp;&middot;&nbsp;
  <a href="https://playmorrow.vercel.app/studios/new">Start your studio →</a>
</p>

---

## For Players

Follow games in development, get real-time devlog updates, build a wishlist, and join the conversation. Every studio page shows their roadmap, media, and community activity so you know what's coming next.

- **Discover** — Browse curated indie games with tags, genres, and status filters
- **Follow** — Get notified when studios publish devlogs or update roadmaps
- **Real-time feed** — Auto-refreshes every 30s with new devlogs, roadmap updates, and community activity
- **Push notifications** — Browser push alerts for new devlogs and updates (VAPID keys)
- **Wishlist** — Save upcoming releases and track their progress
- **Community** — Comment on devlogs, react with LIKE/LOVE/HYPE/INSIGHTFUL

## For Studios

Create a public presence for your game in minutes. Share devlogs with a rich markdown editor, manage your roadmap, publish press kits, and build a following before launch.

- **Game pages** — Screenshots, trailers, tags, platforms, pricing
- **Devlogs** — Rich markdown editor with preview/split modes, scheduling, categories, tags, screenshots
- **Roadmap** — Visual timeline of planned, in-progress, and completed milestones with auto-refresh
- **Team management** — Owner/Admin/Moderator/Member roles with invitations
- **Analytics** — Dashboard with views, follows, wishlists, and engagement data (auto-refresh)
- **Press kits** — Auto-generated .md downloads for media and publishers

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Design System | Shared Button, Input, Modal (focus trap), GameCard (4 variants) |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL (Neon) + Prisma ORM |
| Auth | Session-based (httpOnly cookies) + OAuth (Google, GitHub) |
| State | TanStack Query |
| Security | CSRF (HMAC), CSP, rate limiting, argon2id, DOMPurify |
| Build | pnpm workspaces + Turborepo |
| Testing | Playwright (E2E) + Vitest (unit) |
| Deployment | Vercel (frontend) + Railway (API) |
| Notifications | Push API (VAPID keys, service worker), SSE real-time, email (Resend) |

## Architecture

```
Browser → Next.js (Vercel) → /api/* → NestJS (Railway) → PostgreSQL (Neon)
```

## Setup Prerequisites

- **Node.js** 20+ and **pnpm** 9+
- **PostgreSQL** (or Neon connection string) for local backend
- **VAPID keys** (for push notifications — optional):
  ```bash
  # Generate VAPID keys with web-push CLI
  npx web-push generate-vapid-keys

  # Add to apps/api/.env:
  # VAPID_PUBLIC_KEY=<your-public-key>
  # VAPID_PRIVATE_KEY=<your-private-key>
  # VAPID_SUBJECT=mailto:your@email.com

  # Add to apps/web/.env.local:
  # NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your-public-key>
  ```

## Developer Quick Start

```bash
git clone https://github.com/ricardocesidio/playmorrow
cd playmorrow
pnpm install
pnpm dev
```

Open http://localhost:3000. Demo login: `dev@playmorrow.example` / `Demo123!@`

---

<p align="center">
  <a href="https://playmorrow.vercel.app/terms">Terms of Service</a>
  &nbsp;&middot;&nbsp;
  <a href="https://playmorrow.vercel.app/privacy">Privacy Policy</a>
  &nbsp;&middot;&nbsp;
  <a href="https://playmorrow.vercel.app/cookies">Cookie Policy</a>
  &nbsp;&middot;&nbsp;
  <a href="https://github.com/ricardocesidio/playmorrow">GitHub</a>
</p>

<p align="center">
  All Rights Reserved. Playmorrow is proprietary software.
</p>
