# Playmorrow — Final Web/Production Security Assurance Audit

**Date:** 2026-08-11
**Type:** Read-Only Web + Production Security Audit
**Baseline:** `dd1616f` (SEC-012 remediation)
**Previous Audit:** `docs/security/SECURITY_FINAL_ASSURANCE_AUDIT.md` (full platform)

---

## 1. Executive Summary

A focused read-only audit of Playmorrow's **web application and production browser security posture** was performed across 20 phases. The audit specifically examined: client-exposed environment variables, browser storage, cookie security, CSP, CORS, HTTPS, security headers, error leakage, XSS vectors, open redirects, file uploads, dependencies, third-party scripts, rate limiting, and privacy.

**Verdict: 🟢 SECURITY BASELINE ACCEPTED**

No P0 vulnerabilities. No active credentials exposed. Session cookies are HttpOnly + Secure + SameSite-correct. No authentication tokens in browser storage. CSP is configured (with one documented `unsafe-inline` technical debt). CORS is single-origin. HSTS is preload-ready. Production error responses are sanitized.

**5 findings require action (1 P1, 2 P2, 2 P3):**

| ID | Severity | Finding |
|----|----------|---------|
| CSP-1 | **P1** | Stripe.js/API domains missing from CSP — marketplace payments broken under strict CSP |
| IDOR-1 | **P2** | Draft games visible via slug enumeration + studio listing (known SEC-005) |
| SAST-019 | **P2** | Open redirect in email click tracking (unvalidated URL parameter) |
| HDR-1 | **P3** | `Permissions-Policy` header missing |
| RATE-1 | **P3** | 15+ mutation controllers lack per-endpoint `@Throttle` (global 60/min floor) |

---

## 2. Scorecard

| Category | Status | Key Findings |
|----------|--------|--------------|
| Secrets | 🟢 PASS | 0 `NEXT_PUBLIC_` secrets; all client vars are legitimate public config |
| .env Protection | 🟢 PASS | All `.env*` gitignored; zero `.env` in git history; `.env.example` placeholders only |
| Git History | 🟢 PASS | 0 active creds; rotated password in 2 incident doc commits (confirmed dead) |
| Source Maps | 🟢 PASS | `productionBrowserSourceMaps` disabled (Next.js default); Sentry upload configured |
| Browser Storage | 🟢 PASS | Zero auth tokens/PII in localStorage or sessionStorage |
| Cookies | 🟢 PASS | Session: HttpOnly+Secure+SameSite; CSRF: signed double-submit (HMAC); OAuth: validated |
| CSP | 🟡 LIMITATION | `script-src 'unsafe-inline'` (legacy); Stripe domains missing; frontend report-uri absent |
| CORS | 🟢 PASS | Single-origin, credentials: true, globally enforced |
| HTTPS | 🟢 PASS | `force_https` (Fly.io); HSTS preload; zero production HTTP leaks |
| Security Headers | 🟡 LIMITATION | `Permissions-Policy` missing; `X-Frame-Options` inconsistency (not exploitable) |
| Error Handling | 🟢 PASS | Stack traces gated (prod only); Prisma errors never leaked; global exception filter |
| Authentication | 🟢 PASS | Argon2id; 2FA/TOTP; lockout; session rotation; password reset replay protection |
| Authorization | 🟡 LIMITATION | Draft games visible via slug + studio listing (known SEC-005, P2) |
| XSS | 🟢 PASS | DOMPurify 3.4.13 (both workspaces); no `dangerouslySetInnerHTML` with user HTML; no eval() |
| Open Redirect | 🟡 LIMITATION | Email tracking redirect unvalidated (known SAST-019, P2) |
| File/Upload | 🟢 PASS | 3-layer validation (MIME → magic bytes → dimensions); 5MB cap; secure filenames |
| Dependencies | 🟢 PASS | P1s remediated; image-size MITIGATED; 20 deferred (NOT REACHABLE) |
| Third-Party Scripts | 🟡 LIMITATION | Stripe CSP gap (P1); no SRI on Plausible |
| Rate Limiting | 🟡 LIMITATION | Redis-backed global (60/min); 15+ controllers lack per-endpoint @Throttle |
| Privacy | 🟢 PASS | No PII in public APIs; email never leaked unauthenticated; GDPR paths complete |
| Production Config | 🟢 PASS | `NODE_ENV=production`; `force_https`; `release_command`; debug endpoints disabled |
| M23 Integrity | 🟢 INTACT | 5% rollout; freeze active; 0 files modified by audit |

---

## 3. Detailed Findings

### 3.1 P1: Stripe CSP Gap (CSP-1)

**Location:** `apps/web/middleware.ts:54-66`
**Description:** The CSP `script-src` lacks `js.stripe.com` and `connect-src` lacks `api.stripe.com`. Also, no `frame-src https://js.stripe.com` directive. Stripe Elements (iframe-based payment form) would be blocked.
**Impact:** Marketplace payments non-functional under a strict CSP browser.
**Fix:** Add to CSP:
```
script-src ... https://js.stripe.com
frame-src https://js.stripe.com
connect-src ... https://api.stripe.com
```

### 3.2 P2: Draft Game Enumeration (IDOR-1)

**Location:** `apps/api/src/games/games.service.ts:226-244` + `:154-185`
**Description:** `findBySlug()` and `getGamesByStudioSlug()` lack `isPublished` filter. Known finding SEC-005 from Session 32.
**Impact:** Anyone can discover unpublished/draft games by enumerating slugs or browsing studio pages.
**Fix:** Add `isPublished: true` to `findBySlug()` (unless editing own game) and studio game listing.

### 3.3 P2: Open Redirect (SAST-019)

**Location:** `apps/api/src/email/email-tracking.controller.ts:32`
**Description:** `res.redirect(302, url)` with unvalidated URL query parameter.
**Impact:** Phishing — attacker can craft `GET /api/email/track/click/:logId?url=https://evil.com`.
**Fix:** Validate URL scheme (`https://` only) and domain against whitelist.

### 3.4 P3: Missing Permissions-Policy (HDR-1)

**Location:** Neither `middleware.ts` nor `main.ts`
**Description:** No `Permissions-Policy` header set. All browser features (camera, microphone, geolocation, etc.) unrestricted.
**Fix:** Add: `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`

### 3.5 P3: Rate Limit Coverage Gaps (RATE-1)

**Location:** 15+ controllers without `@Throttle`
**Description:** Devlogs, marketplace, payments, roadmap, events, partners, wishlist, collections, publisher, and creator controllers have no per-endpoint throttling. Global floor is 60/min — too permissive for mutations.
**Fix:** Add `@Throttle` to mutation endpoints in affected controllers (10-20/min typical).

---

## 4. What Was Verified Clean

- **No secrets in `NEXT_PUBLIC_*`**: All 8 client-exposed vars are legitimate public config (API URL, site URL, Sentry DSN, Stripe publishable key, Plausible config, VAPID public key, mock flag)
- **No `.env` in git history**: Zero `.env` files ever committed (verified across all branches)
- **No auth tokens in browser storage**: Zero JWTs/tokens in localStorage or sessionStorage; session token is strictly HttpOnly
- **Session cookies**: HttpOnly=true, Secure=true (prod), SameSite=None (prod)/Lax (dev), 7-day expiry
- **CSRF**: HMAC-SHA256 signed double-submit cookie, timing-safe comparison, global APP_GUARD
- **DOMPurify 3.4.13**: Both workspaces at latest patched version; no IN_PLACE/CUSTOM_ELEMENT_HANDLING
- **Upload pipeline**: MIME → magic bytes → dimensions, 5MB cap, secure filenames
- **Production error handling**: Stack traces gated to dev only; generic "Internal server error" in prod
- **HSTS**: `max-age=63072000; includeSubDomains; preload` (2 years)
- **CORS**: Single origin, credentials-aware, no wildcards
- **Privacy**: No email in public API responses; GDPR export/delete properly gated
- **Dependencies**: All P1 findings from Session 32 remediated (dompurify, multer, js-yaml, sharp)
- **M23 freeze**: Intact — 5% rollout, no algorithm/weight changes, 2 documented freeze log entries (0 contaminations)

---

## 5. Answering the 23 Questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Secrets in client bundle? | **No** — 0 `NEXT_PUBLIC_` secrets |
| 2 | `NEXT_PUBLIC_` vars sensitive? | **No** — all are legitimate public config |
| 3 | `.env` files protected? | **Yes** — all gitignored, zero commits |
| 4 | Historical secret commits? | **No active secrets** — rotated password in 2 doc commits only |
| 5 | Source maps exposing source? | **No** — disabled in production (Next.js default) |
| 6 | localStorage auth tokens? | **No** — zero tokens stored |
| 7 | sessionStorage sensitive data? | **No** — sessionStorage not used at all |
| 8 | Auth cookies HttpOnly+Secure+SameSite? | **Yes** — all correct |
| 9 | CSP strong enough? | **No** — `unsafe-inline` in script-src; Stripe domains missing |
| 10 | CORS restricted? | **Yes** — single origin, no wildcards |
| 11 | HTTPS enforced? | **Yes** — Fly.io `force_https` + HSTS preload |
| 12 | Security headers configured? | **Yes** (except `Permissions-Policy`) |
| 13 | Production errors leak internals? | **No** — sanitized in production |
| 14 | Reachable XSS? | **No** — DOMPurify 3.4.13, no `dangerouslySetInnerHTML` with user HTML |
| 15 | Open redirect exploitable? | **Yes** (P2) — email tracking endpoint |
| 16 | Upload pipeline secure? | **Yes** — 3-layer validation, 5MB cap |
| 17 | Dependencies free of reachable CVEs? | **Yes** — 0 P0/P1 reachable; 20 deferred (NOT REACHABLE) |
| 18 | Rate limiting verified? | **Partially** — global 60/min (Redis fail-open), 15+ controllers unthrottled |
| 19 | PII unnecessarily exposed? | **No** — email never in public APIs |
| 20 | Production safe for public launch? | **Yes** — all critical controls in place; 5 non-blocking findings |
| 21 | What is UNKNOWN? | Live CSP behavior; platform secret store integrity; throttling under load |
| 22 | What must be fixed before launch? | Stripe CSP gap (P1) — marketplace payments break |
| 23 | What can wait? | `unsafe-inline` migration; `Permissions-Policy`; rate limit gaps |

---

## 6. Final Verdict

### 🟢 SECURITY BASELINE ACCEPTED

**No known P0 vulnerability. No active credential exposed. No authentication bypass. No reachable XSS.**

The 5 findings (1 P1, 2 P2, 2 P3) are well-understood, documented, and addressable. Only one is a functional blocker (Stripe CSP gap). The remaining are defense-in-depth hardening items.

See topic-specific reports for detailed evidence:
- `docs/security/SECURITY_BROWSER_STORAGE_AUDIT.md`
- `docs/security/SECURITY_ENVIRONMENT_AUDIT.md`
- `docs/security/SECURITY_PRODUCTION_HEADERS_AUDIT.md`
- `docs/security/SECURITY_FINAL_ASSURANCE_V2.md`
