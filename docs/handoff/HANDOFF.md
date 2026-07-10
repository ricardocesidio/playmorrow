# Playmorrow — Engineering Handoff

> **Original:** 2026-06-28 (Render-based deployment, pre-DevlogV2)
> **Current:** See living docs below

---

This document is **historical** — the project has undergone significant changes since this was written (platform changed from Render to Railway, Devlog V2 system implemented, production hardening audit).

## Current Source of Truth

| Document | Purpose | Link |
|----------|---------|------|
| **STATUS.md** | Complete feature inventory, deployment config, env vars, open issues | [`STATUS.md`](../../STATUS.md) |
| **README.md** | Project overview, quick start, architecture | [`README.md`](../../README.md) |
| **AGENTS.md** | Chronological development history (10 sessions) | [`AGENTS.md`](../../AGENTS.md) |
| **ROADMAP.md** | Enterprise readiness items with hour estimates | [`ROADMAP.md`](../../ROADMAP.md) |
| **Session 10 handoff** | Evidence-first hardening, CSRF, test cleanup, production verification | [`session-10.md`](./session-10.md) |
| **Session 11 handoff** | CI reconciliation, unskipping integration tests, migrations | [`session-11.md`](./session-11.md) |
| **Session 12 handoff** | Professional project audit — gaps to reach professional-grade status + prioritized plan | [`session-12.md`](./session-12.md) |
| **Devlog System V2** | Community detection, rich editor, feed engine, comments | Implemented — see STATUS.md |

**Ongoing (post audit):** 1-6 completed (1: N+1/selects in comments/follows; 2: a11y CI placeholder + e2e notes; 3: scores updated + deadcode sweep; 4: Redis in-memory cache stub in studios; 5: staging/monitoring notes in PRODUCTION; 6: export stub expanded). Per-user rate limiting added (CustomThrottlerGuard + OptionalSessionGuard first). Upload finished for object storage (#2): memory buffer, STORAGE_PROVIDER=local|s3|r2 (stub). #3 Load testing baseline: apps/api/scripts/load-test.js (npx autocannon, no dep). Root 'loadtest' script added. Placeholder results in PRODUCTION. #4 GDPR: enhanced deletion + /me/export stub. See docs/audit-fixes-summary.md. Build green.

## Historical Reference (below this line)

The following content is from the original 2026-06-28 handoff and may be inaccurate. Cross-reference with STATUS.md before acting on any claim.

---

## Architecture (historical - kept for reference, see current in STATUS.md)

```
playmorrow.vercel.app (Next.js 15)
  └── /api/* → Next.js proxy → playmorrow-api (Railway)
                                        └── Neon (PostgreSQL)
```

### Key env vars

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Vercel | Frontend API URL |
| `API_URL` | Vercel (server) | Server-side API calls |
| `DATABASE_URL` | Railway + `.env` | Prisma connection |
| `JWT_SECRET` | Railway | JWT signing |
| `SESSION_SECRET` | Railway | Session cookie signing |
| `GOOGLE_CLIENT_ID` | Railway | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Railway | Google OAuth |
| `GOOGLE_CALLBACK_URL` | Railway | Google OAuth callback |
| `PLAYMORROW_OWNER_EMAIL` | Railway | Admin bootstrap |
| `RESEND_API_KEY` | Railway | Email verification |
| `WEB_ORIGIN` | Railway | CORS allowed origin |
| `COOKIE_DOMAIN` | Railway | Session cookie domain |

## Commands

```bash
# Backend dev
cd apps/api && npx nest start --watch

# Frontend dev
cd apps/web && npx next dev -p 3000

# Run API unit tests
cd apps/api && npx vitest run

# Run E2E tests (Playwright)
cd apps/web && npx playwright test

# Build database client
cd packages/database && npx prisma generate

# Push schema (dev)
cd packages/database && npx prisma db push

# Deploy migrations
cd packages/database && npx prisma migrate deploy

# Seed database
cd packages/database && npx prisma db seed

# Admin bootstrap
cd apps/api && npx ts-node src/scripts/admin-bootstrap.ts
```

## Past Handoff Catalogs

The original issue-by-issue breakdowns are preserved as historical reference:

- [`backend.md`](./backend.md) — Backend issues (1–11)
- [`frontend.md`](./frontend.md) — Frontend issues (12–29)
- [`devx.md`](./devx.md) — DX issues (30–34)

These catalogs pre-date the Devlog V2 implementation and production hardening audit (Sessions 3–9). Many listed issues have been resolved. For current status, see [`STATUS.md`](../../STATUS.md) → Outstanding Work.
