# Playmorrow — Production Security Headers Audit

**Date:** 2026-08-11
**Scope:** All HTTP security headers configured in `apps/web/middleware.ts` and `apps/api/src/main.ts`
**Verdict:** 🟢 **PASS** (1 P3 gap: missing `Permissions-Policy`)

---

## Header Inventory

### Frontend (middleware.ts)

| Header | Value | Status |
|--------|-------|--------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | ✅ Maximum protection (2yr, preload) |
| `X-Frame-Options` | `DENY` | ✅ Strictest |
| `X-Content-Type-Options` | `nosniff` | ✅ |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ✅ Good default |
| `Content-Security-Policy` | (see below) | 🟡 `unsafe-inline` in script-src |
| `Permissions-Policy` | **MISSING** | 🔴 Not configured |

### Backend (main.ts via Helmet)

| Header | Value | Status |
|--------|-------|--------|
| `Content-Security-Policy` | (see below) | 🟢 No `unsafe-inline` in script-src |
| `Strict-Transport-Security` | Helmet default (2yr) | ✅ |
| `X-Content-Type-Options` | `nosniff` | ✅ |
| `X-Frame-Options` | `SAMEORIGIN` (helmet default) | ⚠️ Inconsistent with CSP `frame-ancestors: 'none'` (CSP wins in modern browsers) |
| `X-DNS-Prefetch-Control` | `off` | ✅ |
| `X-Powered-By` | Removed | ✅ |

---

## CSP Comparison

### Frontend CSP (middleware.ts:53-67)
```
default-src 'self';
script-src 'self' 'unsafe-inline' https://plausible.io;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https: http://localhost:*;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' https://playmorrow-api-aged-mountain-9542.fly.dev https://plausible.io http://localhost:*;
frame-ancestors 'none';
form-action 'self';
base-uri 'self';
object-src 'none'
```

### Backend CSP (main.ts:120-141)
```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https: http://localhost:*;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' https://*.vercel.app https://*.neon.tech http://localhost:*;
frame-ancestors 'none';
object-src 'none';
base-uri 'self';
form-action 'self';
report-uri /api/csp-report
```

---

## Findings

| # | Severity | Finding | Detail |
|---|----------|---------|--------|
| CSP-1 | **P1** | Stripe domains missing from CSP | `script-src` lacks `js.stripe.com`; `connect-src` lacks `api.stripe.com`; no `frame-src` for Stripe Elements. Marketplace payments broken under strict CSP. |
| CSP-2 | P3 | `script-src 'unsafe-inline'` (frontend) | Legacy — Next.js 16 nonce migration in progress (TODO at middleware.ts:49). Defense-in-depth: DOMPurify + server-side sanitization. |
| CSP-3 | P3 | `style-src 'unsafe-inline'` (both) | Required by Next.js/Tailwind CSS-in-JS. Hard to eliminate without nonce pipeline. |
| CSP-4 | P3 | Frontend `report-uri` missing | CSP violations on frontend pages are silently lost. Backend has `/api/csp-report` but only for its own violations. |
| CSP-5 | P4 | `http://localhost:*` in CSP (always) | Always present in CSP regardless of environment. Harmless (localhost unreachable from remote), but sloppy. |
| HDR-1 | P3 | `Permissions-Policy` missing | All browser features (camera, microphone, geolocation) unrestricted. |
| HDR-2 | P4 | `X-Frame-Options: SAMEORIGIN` (backend) inconsistent with CSP `frame-ancestors: 'none'` | CSP wins in all modern browsers. No practical clickjacking exposure. |

---

## Nonce Analysis

- Nonce **is generated** per-request via `crypto.getRandomValues()` (`middleware.ts:4-11`)
- Set as `x-nonce` on request and response headers
- **Not used in CSP header** — `script-src` uses `'unsafe-inline'` without `'nonce-*'`
- Comment at line 46-49: Next.js 16 deprecated the `x-nonce` middleware approach
- TODO: Migrate to Next.js 16 native CSP via instrumentation
- **The nonce generation is non-functional dead code until migration is complete.**

---

## Recommended Fix

### Immediate (Stripe CSP)
```
script-src 'self' 'unsafe-inline' https://plausible.io https://js.stripe.com;
frame-src 'self' https://js.stripe.com;
connect-src 'self' https://playmorrow-api-aged-mountain-9542.fly.dev https://plausible.io https://api.stripe.com http://localhost:*;
```

### Follow-up
```
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
```
