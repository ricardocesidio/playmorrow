# Playmorrow Security Baseline — Final Post-V4 Certification

**Date:** 2026-08-11
**Release:** `d4989be` (Security Hardening V4)
**Type:** Final Read-Only Certification

---

## 🟢 SECURITY BASELINE CERTIFIED — NO KNOWN REACHABLE P0/P1 BLOCKERS

No known reachable critical/high security blockers remain within the assessed scope.

---

## Release

| Field | Value |
|-------|-------|
| Commit | `d4989be` |
| Remote | `d4989be` (origin/main) |
| Backend | Fly.io `playmorrow-api-aged-mountain-9542` |
| Frontend | Vercel `playmorrow.co` |
| API | 200 |
| Frontend | 200 |

---

## Security Domains

### Secrets & Credentials
| Check | Status |
|-------|--------|
| Source code | 0 active creds |
| `NEXT_PUBLIC_*` | 8 variables, all legitimate public config |
| `.env` files | All gitignored; 0 committed in history |
| localStorage | 0 auth tokens |
| sessionStorage | Not used |
| Production responses | 0 credentials |

### Dependencies
| Package | Version | Status |
|---------|---------|--------|
| dompurify | 3.4.13 | ✅ Patched (SEC-001/002/004) |
| sharp | 0.35.3 (vips 8.18.3) | ✅ Patched (SEC-012) |
| multer | 2.2.0 | ✅ Patched (SEC-003) |
| js-yaml | 4.3.1 | ✅ Patched (SEC-011) |
| next | 16.3.0 | ✅ Current |
| image-size | 2.0.2 | 🟡 MITIGATED (no patch exists) |
| `pnpm audit --prod` | 20 findings | All NOT REACHABLE (build-time/DOM-only) |

### Authentication
| Control | Status |
|---------|--------|
| Password hashing | Argon2id (memory=19456, time=3) |
| 2FA/TOTP | AES-256-GCM encrypted; recovery codes |
| Account lockout | 5 failures → 15 min |
| Session cookies | HttpOnly + Secure + SameSite |
| Session rotation | Revoke all on logout |
| OAuth state | httpOnly cookie, validated |
| Email verification | 6-digit code, timing-safe compare |

### Authorization
| Resource | Status |
|----------|--------|
| RBAC | Global ADMIN/MODERATOR + Studio OWNER/ADMIN/MODERATOR/MEMBER |
| Studio membership | Enforced per-resource |
| Seat limits | OWNER(2), ADMIN(3), MODERATOR(10) |
| Draft isolation | `findBySlug` + `findByStudioSlug` gated by viewer |
| Publishing | Server-authoritative, 7-field completeness gate |

### CSRF
| Controller | Status |
|-----------|--------|
| Global guard | HMAC-SHA256, timing-safe, APP_GUARD |
| ApiKeysController | `@SkipCsrf()` removed (V4) |
| EmailTemplatesController | `@SkipCsrf()` removed (V4) |
| Stripe webhook | Works via CsrfGuard unauthenticated skip |
| CSP report | Route fixed `/api/csp-report` (V4) |
| Logout | `@SkipCsrf()` method-level (justified) |
| DMCA | `@SkipCsrf()` method-level (justified) |
| Class-level @SkipCsrf on authenticated controllers | **0** |

### XSS / Injection
| Control | Status |
|---------|--------|
| DOMPurify | 3.4.13 (api + web) |
| Server sanitization | Explicit `ALLOWED_TAGS`/`ALLOWED_ATTR` |
| Client sanitization | Default DOMPurify (defense-in-depth) |
| SQL | All parameterized (Prisma); 1 metadata key interpolation (server-safe) |
| Shell execution | 0 instances |
| Redirect validation | Allowlist-based (SAST-019 resolved) |
| `dangerouslySetInnerHTML` | JSON-LD only (properly encoded) |

### CSP
| Check | Production |
|-------|-----------|
| `script-src` | `'self' 'unsafe-inline' plausible.io js.stripe.com` |
| `connect-src` | `'self' fly.dev plausible.io api.stripe.com` |
| `frame-src` | `'self' js.stripe.com` |
| `frame-ancestors` | `'none'` |
| `object-src` | `'none'` |
| `base-uri` | `'self'` |
| `form-action` | `'self'` |
| `report-uri` | `/api/csp-report` (fixed V4) |
| Wildcards | 0 introduced |

### Security Headers
| Header | Status |
|--------|--------|
| HSTS | `max-age=63072000; includeSubDomains; preload` |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | Restrictive (camera/mic/geo/sensors disabled) |

### CORS / HTTPS
| Control | Status |
|---------|--------|
| CORS | Single origin (`playmorrow.co`), credentials-aware |
| HTTPS | `force_https` (Fly.io), HTTP → 308 redirect |
| Source maps | 403 (blocked) |
| Error responses | Clean JSON, no stack traces in production |

### Rate Limiting
| Control | Status |
|---------|--------|
| Global floor | 60 req/min per-user/IP (Redis atomic Lua, fail-open) |
| Endpoint @Throttle | 90+ decorators (V3 + V4 coverage) |
| Auth endpoints | 3-10/min |
| Mutations | 10-30/min |
| Health endpoint | @SkipThrottle() |

### Privacy / Storage
| Check | Status |
|-------|--------|
| localStorage | UX preferences only; 0 auth tokens |
| sessionStorage | Not used |
| Cookies | `playmorrow_session` (HttpOnly), `playmorrow_csrf` (non-HttpOnly) |
| PII in public APIs | 0 (email never exposed unauthenticated) |
| GDPR paths | Export (SessionAuthGuard), Delete (password-confirmed) |
| AI data reset | `DELETE /recommendations/feedback` (user-scoped) |
| Console logs | Startup-only `console.error`; runtime uses Pino logger |

### API Surface
| Domain | Controllers | Status |
|--------|------------|--------|
| Public | 12 | All ungated, rate-limited |
| Optional auth | 8 | OptionalSessionGuard |
| Authenticated | 25 | SessionAuthGuard |
| Admin/Mod | 12 | RolesGuard |
| Webhooks | 2 | CsrfGuard autoskip (unauthenticated) |
| CSP report route | Fixed `/api/csp-report` (V4) |

### Frontend
| Check | Status |
|-------|--------|
| Pages | 100, all compile |
| Broken routes | 0 |
| Auth boundaries | Dashboard layout gating |
| CSP compatible | ✅ |
| Source maps | Blocked (403) |
| Secrets in bundle | 0 |
| Console errors | 0 critical (3 P4 UX gaps documented) |

### Database
| Check | Status |
|-------|--------|
| Models | 65 |
| Migrations | 39 applied, 0 drift |
| Secrets hashed | passwordHash (argon2id), sessionHash (SHA-256), totpSecret (AES-256-GCM) |
| Parameters | All Prisma-parameterized |
| Transactional ops | Publishing, password reset, marketplace purchase |

### Publishing Path
| Check | Status |
|-------|--------|
| isPublished | Single source of truth |
| Completeness gate | 7 fields (title, tagline, desc, cover, screenshot, platform, tag) |
| Authorization | OWNER/ADMIN/MODERATOR |
| Idempotent | ✅ |
| Transactional | ✅ ($transaction + audit) |
| Catalog filter | `isPublished: true` on findAll, search |
| Draft isolation | findBySlug + findByStudioSlug gated (V3) |
| RELEASED ≠ publish | ✅ (only XP award) |
| isPublished in DTOs | 0 (not forgeable) |

### M23
| Check | Status |
|-------|--------|
| Rollout | 5% |
| Freeze | Active |
| Algorithm | Untouched |
| Weights | Untouched (0.35/0.25/0.25/0.05/0.10) |
| MMR λ | 0.5 (code confirmed; doc fixed V4) |
| Embeddings | Config-driven (`text-embedding-3-small`) |
| Metrics | Admin-only (RolesGuard) |
| Kill switch | `RECOMMENDATIONS_ENABLED` |
| Baseline | Valid, not restarted |

### Production Health
| Check | Status |
|-------|--------|
| Backend health | 200 ✅ |
| Frontend | 200 ✅ |
| API games | 200 ✅ |
| API search | 200 ✅ |
| API for-you | 200 ✅ |
| 5xx | 0 |
| Timeouts | 0 |
| CSP report route | 201 ✅ |

---

## Findings Reconciliation — Complete History

### P0: 0

### P1: 6 all RESOLVED

| ID | Finding | Status |
|----|---------|--------|
| SEC-001 | DOMPurify IN_PLACE XSS | REMEDIATED — 3.4.13 |
| SEC-002 | DOMPurify CUSTOM_ELEMENT bypass | REMEDIATED — 3.4.13 |
| SEC-003 | Multer DoS | REMEDIATED — 2.2.0 |
| SEC-011 | js-yaml DoS | REMEDIATED — 4.3.1 override |
| SEC-012 | sharp/libvips CVEs | REMEDIATED — 0.35.3 |
| CSP-1 | Stripe domains CSP | REMEDIATED — V3 live |

### P2: 3 all RESOLVED

| ID | Finding | Status |
|----|---------|--------|
| IDOR-1 | Draft game enumeration | REMEDIATED — V3 deployed |
| SAST-019 | Open redirect email | REMEDIATED — V3 live |
| SEC-004 | DOMPurify low-severity | REMEDIATED — 3.4.13 |

### P3: 7 (6 resolved, 1 accepted)

| ID | Finding | Status |
|----|---------|--------|
| HDR-1 | Permissions-Policy | REMEDIATED — V3 live |
| RATE-1 | Throttle coverage | REMEDIATED — V3 deployed |
| F-3 | Class-level @SkipCsrf | REMEDIATED — V4 |
| F-2 | CSP report route | REMEDIATED — V4 |
| F-4 | MMR doc drift | REMEDIATED — V4 doc |
| SEC-005 | Draft slug enumeration | ACCEPTED — no sensitive data |
| F-5 | GET throttle defense-in-depth | ACCEPTED — global 60/min floor |

### P4: 12 (all ACCEPTED or resolved)

| ID | Finding | Status |
|----|---------|--------|
| SEC-006 | CSP report endpoint | RESOLVED — route fixed V4 |
| SEC-007 | CSP `unsafe-inline` | DEFERRED — Next.js 16 native CSP |
| SEC-008/SEC-009/SEC-010 | Password/credential hardening | ACCEPTED |
| AUTH-001/AUTH-002/MED-01/MED-02/AI-01 | Minor | ACCEPTED |
| F-1/F-2/F-9 | CSRF/incorrect findings | FALSE POSITIVE / CLOSED |
| F-6/F-7/F-8 | UX gaps | DEFERRED — non-security |

---

## Git Integrity

| Check | Result |
|-------|--------|
| HEAD | `d4989be` |
| Remote | `d4989be` |
| Modified | 0 |
| Staged | 0 |
| Untracked | Verification docs only |

---

## Final Security Verdict

### 🟢 SECURITY BASELINE CERTIFIED — NO KNOWN REACHABLE P0/P1 BLOCKERS

Certification means: within the assessed scope (application code, dependencies,
deployment configuration, production controls), no known reachable critical or
high-severity security blockers exist that could compromise the confidentiality,
integrity, or availability of the Playmorrow platform.

This does not constitute a guarantee that the system is vulnerability-free or
immune to undiscovered zero-day vulnerabilities in third-party dependencies.

**Report:** `docs/releases/SECURITY_FINAL_POST_V4_CERTIFICATION.md`
