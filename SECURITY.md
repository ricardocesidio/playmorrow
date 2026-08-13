# Security Policy

## Incident Disclosure (2026-08-06)

**On 2026-08-06, a development database operation cleared the production
dataset.** A `prisma migrate reset` executed against the production Neon
database erased all production data. Neon point-in-time recovery (6-hour
retention, zero snapshots) could not restore it; the pre-incident data is
**not recoverable**.

Remediation completed 2026-08-07:

- **Environment isolation:** production and development now use separate Neon
  branches with no shared connection string.
- **DB safety guard:** `packages/database/scripts/db-guard.mjs` runs before
  every DB command and blocks `reset`/`push`/`migrate dev`/`seed` against the
  production host unless an explicit override is set. Destructive commands
  against unknown hosts are also blocked (fail-closed).
- **Nightly backups:** `pg_dump` to R2 via a read-only database role,
  14-day retention, SHA-256 manifest, restore drill passed.
- **CI isolation:** GitHub Actions runs against an ephemeral Postgres 16 +
  pgvector container; CI fails if `DATABASE_URL` resembles a production host.

This incident is disclosed here because it is material to any evaluation of
the project's reliability and operational maturity.

---

## Current Protections

### Authentication

- **Primary auth:** session-based via the `playmorrow_session` httpOnly cookie.
  `SameSite=Lax` in development, `SameSite=None; Secure` in production.
- **Password hashing:** argon2id (memoryCost 19456, timeCost 3).
- **Two-factor authentication (TOTP):** implemented and enforced.
  - Enrollment: `POST /api/auth/2fa/enable` returns a TOTP secret (base32) for
    the user to register in an authenticator app.
  - Verification: `POST /api/auth/2fa/verify` validates a code (±1 time step)
    before enabling; the secret is stored AES-256-GCM encrypted.
  - Login enforcement: when `totpEnabled` is set, `POST /api/auth/session/login`
    returns `{ requires2fa: true, token }` instead of creating a session; the
    short-lived (5-minute) TOTP login token is exchanged via
    `POST /api/auth/2fa/login`.
  - Backup codes: 8 recovery codes, SHA-256 hashed at rest, one-time use with
    timing-safe comparison, redeemed via `POST /api/auth/2fa/recovery`.
  - Disable: `POST /api/auth/2fa/disable` requires a valid TOTP code.
- **OAuth:** Google + GitHub account linking by verified email, state parameter
  CSRF protection.
- **Legacy JWT:** a JWT access token (`JWT_EXPIRES_IN`, default 15m) still
  guards the legacy `/api/auth/me` endpoint; new code uses sessions.
- **Refresh tokens:** rotating 30-day tokens, SHA-256 hashed at rest; reuse
  detection revokes all tokens for the user.
- **Session revocation:** an `authVersion` integer on the User record — bumped
  on password change/reset, invalidating all existing sessions.
- **Session lifetime:** fixed 7-day expiry from creation.
- **Account lockout:** 5 failed attempts → 15-minute lock (`lockedUntil`).
- **Email verification:** code-based flow, rate-limited per user.

### Authorization (RBAC)

- **Global roles:** `PLAYER`, `PUBLISHER`, `MODERATOR`, `ADMIN` — enforced by
  `RolesGuard` on admin/moderation endpoints.
- **Studio roles:** `OWNER` (max 2), `ADMIN` (max 3), `MODERATOR` (max 10),
  `MEMBER` (unlimited) — enforced by `assertStudioAccess()` in
  `apps/api/src/common/studio-permissions.ts`.
- **Global ADMIN bypass:** users with `role === 'ADMIN'` bypass studio-level
  permission checks (by design; documented in ARCHITECTURE.md).
- **Dual enforcement:** `SessionAuthGuard` (global APP_GUARD) for
  authentication, `CsrfGuard` (global APP_GUARD) for CSRF, service-layer
  permission checks for authorization. Frontend route gating is UX only —
  never the security boundary.

### CSRF Protection

- **Stateless HMAC:** `HMAC-SHA256(userId:nonce:ts, CSRF_SECRET)` — no
  server-side token storage.
- **Global scope:** `CsrfGuard` registered as `APP_GUARD`, covering all
  authenticated mutations (~130 POST/PUT/PATCH/DELETE endpoints).
- **Token lifecycle:** generated on login, stored as a non-httpOnly
  `playmorrow_csrf` cookie, sent as `X-CSRF-Token` header on mutations.
- **7-day expiry** matching session lifetime.
- **Timing-safe comparison** via `crypto.timingSafeEqual`.
- **Production hardening:** `CSRF_SECRET` required in production via
  `getOrThrow` — no fallback.

### Content Security Policy (CSP)

- **Frontend (Next.js):** set in `middleware.ts`. Production
  `script-src 'self' 'unsafe-inline' https://plausible.io https://js.stripe.com`
  (`'unsafe-inline'` is a known gap — see Known Gaps below); development adds
  `'unsafe-eval'` for HMR. `frame-ancestors 'none'`, `form-action 'self'`,
  `base-uri 'self'`, `object-src 'none'`, `frame-src 'self'
  https://js.stripe.com`.
- **Backend (NestJS):** helmet CSP with `script-src 'self'` (no
  `'unsafe-inline'`). Violations reported to `/api/csp-report`.

### Rate Limiting

- **Global:** 60 requests / minute per user (authenticated) or IP
  (anonymous).
- **Per-route overrides:** register 5/min, login 10/min, upload 20/min,
  AI/embed 10–20/min, and mutation endpoints at 10–30/min (see controller
  `@Throttle` decorators).
- **Redis-backed (fail-open):** Upstash Redis with atomic Lua
  `INCR`/`PEXPIRE`/`PTTL`; degrades to in-memory if Redis is unreachable
  (never blocks traffic).

### Input Validation

- **class-validator:** global `ValidationPipe` with `whitelist: true` and
  `forbidNonWhitelisted: true`.

### XSS Prevention

- **DOMPurify 3.4.13:** Markdown sanitized server-side (`sanitizeHtml` for
  game/studio/devlog content) and client-side before rendering.
- **No `dangerouslySetInnerHTML`** with user input outside of JSON-LD
  structured data (encoded via `JSON.stringify`).

### Upload Security

- **MIME whitelist:** `image/jpeg`, `image/png`, `image/gif`, `image/webp`.
- **Magic byte validation:** file header bytes verified against expected
  signatures before any further processing.
- **Dimension limits:** 4096px max in either dimension.
- **Size limit:** 5MB (`MaxFileSizeValidator` + `express.json` limit).

### Cookie Security

- `playmorrow_session`: httpOnly, `SameSite=Lax` (dev) / `SameSite=None;
  Secure` (prod).
- `playmorrow_csrf`: non-httpOnly (readable by JS, required for the CSRF
  header), same site attributes.
- Domain configured via `COOKIE_DOMAIN` env var.

### Marketplace Payments

- **PCI DSS SAQ A:** card details never touch the backend — Stripe.js
  tokenizes on the frontend; backend receives only a PaymentIntent flow.
- **Webhook signature verification:** `stripe.webhooks.constructEvent()` with
  `STRIPE_WEBHOOK_SECRET`.
- **Idempotency:** `ProcessedWebhookEvent` has a `UNIQUE` constraint on
  `stripeEventId`, preventing duplicate processing of retried webhooks.

### Data Protection

- **Passwords:** argon2id hashed — never stored in plaintext.
- **Tokens:** SHA-256 hashed before storage (refresh tokens, verification
  tokens, TOTP backup codes, reset tokens).
- **Account deletion:** cascading Prisma deletes.

### Logging & Observability

- **Structured JSON logging:** Pino logger with request IDs and latency.
- **Sentry:** error tracking when `SENTRY_DSN` is configured.
- **Audit log:** `AuditLog` model tracks sensitive operations (publishing,
  role changes, ownership transfer).

## Security Headers (frontend, `middleware.ts`)

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(self), usb=(), fullscreen=(self), clipboard-write=(self), accelerometer=(), gyroscope=(), magnetometer=()` |

## Verification Workflow

- Studio verification levels: `UNVERIFIED` → `EMAIL_VERIFIED` →
  `BASIC_VERIFIED` → `OFFICIAL_STUDIO` → `PARTNER_STUDIO` → `FEATURED_STUDIO`.
- Requests require admin review (`StudioVerificationRequest` model with
  `PENDING/APPROVED/REJECTED/MORE_INFO` states).

## Known Security Gaps

- **CSP `'unsafe-inline'` for scripts (frontend):** production `script-src`
  still includes `'unsafe-inline'` because Next.js inline scripts cannot carry
  nonces with the current middleware approach. A per-request nonce is
  generated but not yet wired into the CSP header. Tracked as SEC-007;
  mitigation planned via Next.js native CSP support.
- **Redis limiter is fail-open:** if Redis is unreachable, rate limiting
  degrades to in-memory rather than blocking traffic. Accepted for
  availability; revisit if abuse becomes an issue.
- **`image-size` 2.0.2:** upstream CVEs (ICNS/JXL/HEIF parser loops) have no
  published fix. Mitigated by the magic-byte gate which rejects those formats
  before `image-size` runs. Monitor upstream for a patched release.
- **CSP violation reports:** the backend CSP references `/api/csp-report`,
  which is implemented; the frontend CSP does not currently emit a
  `report-uri`.

## How to Report a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Report via email to the project maintainers:

- **Security contact:** see the maintainer's GitHub profile
- **Response SLA:** initial acknowledgment within 48 hours
- **Disclosure policy:** coordinated disclosure — 90 days from confirmation
  before public disclosure

### What to include

- Type of issue (e.g., SQL injection, CSRF bypass, auth bypass)
- Source file paths related to the manifestation
- Step-by-step reproduction instructions
- Proof-of-concept or exploit code (if possible)
- Impact assessment

## Dependencies & Supply Chain

- Dependabot configured for automated dependency updates
  (`.github/dependabot.yml`).
- CI runs dependency review (blocks high-severity findings), Gitleaks secret
  scanning, CodeQL + Semgrep SAST, and Trivy.
- Minimum Node.js 20, pnpm 11.
- No untrusted build steps or postinstall scripts from external sources.

## Database Safety & Production Data Protection

- **Environment isolation:** production and development use separate Neon
  branches; they share no connection string or endpoint.
- **Safety guard:** `packages/database/scripts/db-guard.mjs` blocks destructive
  commands against the production host unless `ALLOW_PROD_DB_OPERATIONS=1` is
  explicitly set. `migrate deploy`/`status`/`generate`/`diff` are always
  allowed.
- **CI isolation:** GitHub Actions runs against an ephemeral Postgres 16 +
  pgvector container; CI fails if `DATABASE_URL` resembles the production host.
- **Frontend:** `apps/web` contains zero `DATABASE_URL` references.
- **Credentials discipline:** the production `DATABASE_URL` exists only as a
  Fly.io secret; it is never committed or stored in local `.env` files.

## Production Environment Variables (Required in Production)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection (Neon) |
| `JWT_SECRET` | Legacy JWT signing key |
| `SESSION_SECRET` | Session cookie signing |
| `CSRF_SECRET` | HMAC CSRF token signing |
| `RESEND_API_KEY` | Email service |
| `WEB_ORIGIN` | Frontend origin for CORS |
| `REDIS_URL` | Upstash Redis for throttler storage (fail-open) |

**Recommended:** `COOKIE_DOMAIN`, `SENTRY_DSN`, `NODE_ENV`.

The server fails fast on boot if any required variable is missing in
production.
