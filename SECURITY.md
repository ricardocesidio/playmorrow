# Security Policy

## Current Protections

### Authentication
- **Session-based**: Primary auth via `playmorrow_session` httpOnly cookie. `SameSite=Lax` in development, `SameSite=None; Secure` in production.
- **Password hashing**: argon2 with per-password salts.
- **OAuth**: Google + GitHub account linking by verified email.
- **JWT tokens**: Signed with `JWT_SECRET`, short-lived (15m default), used for API-level authentication.
- **Refresh tokens**: Rotating 30-day tokens, SHA-256 hashed before storage.
- **Session revocation**: `authVersion` field on User — bumping it invalidates all existing sessions.
- **Account lockout**: `failedLoginAttempts` counter with `lockedUntil` timestamp after threshold.
- **Email verification**: Code-based verification flow, rate-limited per user.

### Authorization (RBAC)
- **Global roles**: `PLAYER`, `PUBLISHER`, `MODERATOR`, `ADMIN` — enforced by `RolesGuard`.
- **Studio roles**: `OWNER` (max 2), `ADMIN` (max 3), `MODERATOR` (max 10), `MEMBER` (unlimited) — enforced by `assertStudioWriteAccess()` and `assertPermission()`.
- **Global ADMIN bypass**: Users with `role === 'ADMIN'` bypass studio-level permission checks.
- **Dual enforcement**: `SessionAuthGuard` (global APP_GUARD) for auth, `CsrfGuard` (global APP_GUARD) for CSRF, service-layer permission checks for authorization.

### CSRF Protection
- **Stateless HMAC**: `HMAC-SHA256(userId:nonce:ts, CSRF_SECRET)` — no server-side token storage.
- **Global scope**: `CsrfGuard` registered as `APP_GUARD` in `AppModule`, covering all 70+ POST/PUT/PATCH/DELETE endpoints.
- **Token lifecycle**: Generated on login, stored as non-httpOnly `playmorrow_csrf` cookie, sent as `X-CSRF-Token` header on mutations.
- **7-day expiry**: CSRF tokens expire after 7 days (matching session lifetime).
- **Timing-safe comparison**: Uses `crypto.timingSafeEqual` to prevent timing attacks.
- **Production hardening**: `CSRF_SECRET` env var is required in production via `getOrThrow` — no fallback allowed.

### Content Security Policy (CSP)
- **Frontend (Next.js)**: Nonce-based CSP in `middleware.ts`. Per-request cryptographic nonce generated via Web Crypto API.
  - Production: `script-src 'self' 'nonce-{nonce}' https://plausible.io`
  - Development: `'unsafe-inline' 'unsafe-eval'` for HMR/hot reload
  - `style-src 'self' 'unsafe-inline'`
  - `frame-ancestors 'none'` (clickjacking protection)
  - `form-action 'self'`
  - `base-uri 'self'`
  - `object-src 'none'`
- **Backend (NestJS)**: `helmet` middleware with CSP directives.
  - Production: `script-src 'self'` (no `unsafe-inline`)
  - CSP violation reports sent to `/api/csp-report`

### Rate Limiting
- **Global**: 60 requests / minute / IP (via `@nestjs/throttler`).
- **Per-user**: `CustomThrottlerGuard` tracks by `userId` when authenticated, falls back to IP for unauthenticated requests.
- **Per-route overrides**:
  - Register: 5 req/min
  - Login: 10 req/min
  - Comments, reactions: Tighter limits
  - Reports, invitations: Rate-limited (added during professionalization audit)
  - Upload: 20 uploads/min (increased from 5)
- **Health endpoint**: `@SkipThrottle` — always responsive.
- **Redis-backed (fail-open)**: `ThrottlerStorage` uses Upstash Redis with atomic Lua `INCR`/`PEXPIRE`/`PTTL`. If Redis is unreachable the limiter degrades to in-memory (never blocks traffic), and misconfiguration is logged. Configure via `REDIS_URL` (or `REDIS_TOKEN`/`UPSTASH_REDIS_REST_TOKEN`).

### Input Validation
- **class-validator**: Global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` — strips unknown props, rejects malicious payloads.
- **DTO transformation**: Payloads are validated and transformed into typed DTO instances before reaching controllers.

### XSS Prevention
- **DOMPurify**: All Markdown content is sanitized client-side via DOMPurify before rendering.
- **Server-side**: `sanitizeHtml` applied to game/studio content fields.
- **No `dangerouslySetInnerHTML`** without sanitization anywhere in the codebase.

### Upload Security
- **MIME whitelist**: Only `image/jpeg`, `image/png`, `image/gif`, `image/webp` accepted.
- **Magic byte validation**: File header bytes verified against expected signatures for the declared MIME type.
- **Dimension limits**: Maximum 4096px in either dimension.
- **Size limits**: 5MB request body limit via `express.json({ limit: '5mb' })`.
- **Stream cleanup**: File descriptor properly destroyed in both success and error paths (`stream.destroy()`).

### Cookie Security
- `playmorrow_session`: httpOnly, `SameSite=Lax` (dev) / `SameSite=None; Secure` (prod).
- `playmorrow_csrf`: non-httpOnly (must be readable by JS), same site attributes.
- Path scoped, domain configured via `COOKIE_DOMAIN` env var (shared `cookie-helper.ts` utility).

### Session Management
- Server-side session records in `Session` model.
- `authVersion` field enables mass session invalidation (e.g. password change).
- Session list accessible to user, with individual revocation support.
- Sessions expire after 7 days of inactivity.

### Marketplace Payments (Phase 5)
- **PCI DSS SAQ A**: Card details never touch the backend — Stripe.js tokenizes on the frontend; backend receives only a `paymentMethodId`.
- **Webhook signature verification**: Stripe webhook payloads are verified using `stripe.webhooks.constructEvent()` with the endpoint signing secret (`STRIPE_WEBHOOK_SECRET`).
- **Idempotency**: `ProcessedWebhookEvent` table has a `UNIQUE` constraint on `stripeEventId`, preventing duplicate processing of retried webhooks.

### Data Protection
- **Passwords**: argon2 hashed — never stored in plaintext.
- **Tokens**: SHA-256 hashed before database storage (refresh tokens, verification tokens).
- **Rate-limited auth**: Failed login attempts tracked; account locked after threshold.
- **Account deletion**: Cascading Prisma deletes with explicit cleanup logic.

### Logging & Observability
- **Structured JSON logging**: Pino logger with request IDs, user IDs, and latency.
- **Request tracing**: Every request gets an `x-request-id` header for traceability.
- **Sentry**: Error tracking when `SENTRY_DSN` is configured.
- **Audit log**: `AuditLog` model tracks sensitive operations.
- **CSP violation reporting**: Dedicated `/api/csp-report` endpoint.

## Security Headers
Set by `middleware.ts` (Next.js frontend):
| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | Nonce-based (see CSP section above) |

## Verification Workflow
- Studio verification supports levels: `UNVERIFIED` → `EMAIL_VERIFIED` → `BASIC_VERIFIED` → `OFFICIAL_STUDIO` → `PARTNER_STUDIO` → `FEATURED_STUDIO`.
- Verification requests require admin review (`StudioVerificationRequest` model with `PENDING/APPROVED/REJECTED/MORE_INFO` states).
- Document uploads and reviewer notes supported.

## Known Security Gaps
- **Redis limiter is fail-open**: if Redis is unreachable the rate limiter degrades to in-memory rather than blocking traffic — acceptable for availability, revisit if abuse becomes an issue.
- **Rate limiting per-endpoint**: Per-route limits exist for auth endpoints but not for all mutation endpoints.

## How to Report a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, report them via email to the project maintainers. If the issue is critical (credential exposure, auth bypass, data leakage), please use the following contact:

- **Security contact**: Use the email listed in the project maintainer's GitHub profile
- **Response SLA**: Initial acknowledgment within 48 hours
- **Disclosure policy**: We follow coordinated disclosure — 90 days from confirmation before public disclosure

### What to include
- Type of issue (e.g., SQL injection, CSRF bypass, auth bypass)
- Full paths of source file(s) related to the manifestation
- Step-by-step reproduction instructions
- Proof-of-concept or exploit code (if possible)
- Impact assessment

## Dependencies & Supply Chain
- Dependencies scanned on install (pnpm audit).
- Dependabot configured for automated dependency update PRs (see `.github/dependabot.yml`).
- Minimum Node.js 20, pnpm 11.
- No untrusted build steps or postinstall scripts from external sources.

## Production Environment Variables (Required in Production)
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection (Neon) |
| `JWT_SECRET` | JWT signing key |
| `SESSION_SECRET` | Session cookie signing |
| `CSRF_SECRET` | HMAC CSRF token signing |
| `RESEND_API_KEY` | Email service |
| `WEB_ORIGIN` | Frontend origin for CORS |
| `REDIS_URL` | Upstash Redis for the throttler storage (fail-open) |

**Recommended** (not required but strongly advised):
`COOKIE_DOMAIN`, `SENTRY_DSN`, `NODE_ENV`

The server fails fast on boot if any required variable is missing in production.
