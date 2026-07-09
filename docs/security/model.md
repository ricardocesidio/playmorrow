# Playmorrow Security Model (Summary)

**Purpose:** Quick reference for contributors and auditors.

## Authentication
- Primary: Session-based (httpOnly `playmorrow_session` cookie).
- SameSite: Lax (dev) / None (prod with secure).
- Additional: JWT access + rotating refresh tokens (30 days) for some flows.
- OAuth: Google + GitHub (account linking by verified email).

## Authorization & RBAC
- Global roles: PLAYER, PUBLISHER, MODERATOR, ADMIN.
- Studio roles: OWNER (max 2), ADMIN (max 3), MODERATOR (max 10), MEMBER (unlimited).
- Enforcement: `assertPermission` + `StudioRolesGuard`.
- Global ADMIN bypass for emergencies.

## CSRF
- Stateless HMAC: `HMAC-SHA256(userId:nonce:ts, CSRF_SECRET)`.
- Global `CsrfGuard` (APP_GUARD) on all authenticated POST/PUT/PATCH/DELETE.
- Token passed via `X-CSRF-Token` header; bridged via non-httpOnly cookie on login.

## Secrets & Config (Production)
See `PRODUCTION.md` for exact list.
- Must set: `JWT_SECRET`, `SESSION_SECRET`, `CSRF_SECRET`, `RESEND_API_KEY`, `DATABASE_URL`, `WEB_ORIGIN`, `NODE_ENV=production`.
- App fails fast on boot if critical ones are missing in prod.

## Input & Upload Security
- class-validator + whitelist + forbidNonWhitelisted (global).
- Image uploads: MIME whitelist + magic byte + dimension ≤4096px + size limit.
- All Markdown rendered with DOMPurify.

## Rate Limiting
- Global: 60 req / min / IP (ThrottlerModule).
- Tighter: register (5), login (10), comments, reactions.
- Health is `@SkipThrottle`.

## Data Protection
- Passwords: argon2.
- Tokens: hashed (sha256) before storage.
- Sessions: revocable, authVersion bump on password reset.
- Account deletion: explicit cleanup + Prisma cascades.

## Logging & Observability
- Request IDs + structured JSON logs.
- Sentry for errors (when DSN provided).

## Known Gaps (as of audit)
- No 2FA yet.
- No per-user rate limiting (IP only).
- Full GDPR export UI pending.
- No Redis-backed rate limiting / queue (in-memory today).

Last reviewed during elite audit (2026-07-09).
