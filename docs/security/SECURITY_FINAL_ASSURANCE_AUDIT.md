# Playmorrow — Security Final Assurance Audit Report

**Date:** 2026-08-11
**Type:** Read-Only Adversarial Security Verification
**Scope:** Full platform — source code, dependencies, git history, API surface, authentication, authorization, AI, publishing, infrastructure
**Baseline Commit:** `dd1616f` (SEC-012 remediation)

---

## 1. Executive Summary

A comprehensive read-only security assurance audit was performed across 21
phases of the Playmorrow platform. The audit searched for secrets, dependency
vulnerabilities, injection vectors, authorization gaps, IDOR, XSS, SSRF, CSRF,
and AI-specific threats.

**No critical (P0) vulnerabilities were identified. No known reachable and
unmitigated high-severity (P1) vulnerabilities exist in the assessed scope.**

All P1 dependency findings from the Session 32 Security Assessment v2 have been
remediated (dompurify, multer, js-yaml) or resolved (SEC-012 sharp/libvips via
next 16.3.0 upgrade in `dd1616f`).

Residual risk is limited to:
- 2 P2 findings (email redirect, draft game enumeration)
- 3 P3 findings (CSP unsafe-inline, Anthropic timeout, pgvector key interpolation)
- 12 P4 findings (informational hardening opportunities)
- 20 deferred transitive dependency findings (all build-time or DOM-only, NOT REACHABLE)

**Verdict:** 🟢 **SECURITY BASELINE ACCEPTED**

---

## 2. Scope

### In Scope
- Source code (`apps/api/src/`, `apps/web/`, `packages/`)
- Dependencies (`pnpm-lock.yaml`, `package.json`, workspace manifests)
- Git history (full 900+ commits)
- API surface (59 controllers, ~55 NestJS modules)
- Authentication (argon2id, 2FA, session, OAuth)
- Authorization (RBAC, studio roles, global roles)
- AI recommendation system (M23)
- Game publishing path
- File upload pipeline
- Network/CORS/HTTPS/CSP/CSRF
- Database (Prisma ORM, raw SQL, sensitive fields)
- Production configuration (Fly.io, Vercel, Dockerfile)
- CI/CD workflows

### Out of Scope
- Runtime penetration testing
- Third-party service configuration (Fly.io/Vercel/Neon/Upstash dashboards)
- Physical security
- Social engineering
- DDoS protection
- Actual load testing

---

## 3. Methodology

1. **Static Analysis:** Full-source grep for injection, XSS, deserialization, secrets, unsafe patterns
2. **Dependency Audit:** `pnpm audit --prod`, version verification, reachability analysis
3. **Git History Scan:** `git log -p --all` for credential leaks
4. **Architecture Review:** Guard chain, RBAC matrix, IDOR analysis per resource type
5. **Configuration Review:** CSP, CORS, HSTS, CSRF, rate limiting, Dockerfile, CI workflows
6. **AI-Specific Review:** Consent gates, personalization boundaries, kill switch, explainability
7. **Evidence Correlation:** Cross-referenced with existing security docs (`docs/security/`)

---

## 4. Repository Baseline

| Attribute | Value |
|-----------|-------|
| HEAD | `dd1616f` (chore: remediate SEC-012 sharp/libvips CVEs) |
| Previous security commit | `ac86169` (chore: remediate P1 dependency vulnerabilities) |
| Uncommitted files | 49 (pre-existing M23/publishing-path work from Sessions 26-31, untouched) |
| Protected branches | main (branch protection configured) |
| CI security workflows | 7 (CodeQL, Semgrep, Gitleaks, Trivy, Dependency Review, SBOM, Uptime) |

**Audit integrity:** No files were modified during this audit. All uncommitted
files are pre-existing and documented in STATUS.md and AGENTS.md.

---

## 5. Findings Register

### P2 (Medium)

| ID | Title | Location | Details |
|----|-------|----------|---------|
| SAST-019 | Open redirect in email click tracking | `apps/api/src/email/email-tracking.controller.ts:32` | `res.redirect(302, url)` with unvalidated `url` query parameter. Attacker can redirect email recipients to arbitrary external sites. |
| SEC-005 | Draft games accessible via slug enumeration | `apps/api/src/games/games.service.ts:227-229` | `findBySlug()` lacks `isPublished` filter. Known, previously documented. Low severity — no sensitive data on draft pages. |

### P3 (Low)

| ID | Title | Location | Details |
|----|-------|----------|---------|
| SAST-020 | Production CSP allows `unsafe-inline` for scripts | `apps/web/middleware.ts:52` | Legacy constraint — Next.js inline scripts cannot be nonce-tagged with current approach. Documented TODO to migrate to Next.js 16 native CSP. Mitigated by DOMPurify + server-side sanitization. |
| SAST-024 | Anthropic provider `fetch()` calls lack timeout | `apps/api/src/ai/providers/anthropic.provider.ts:78,131,206` | No `AbortController`/signal on fetch. OpenAI provider uses SDK with built-in timeouts. |
| SAST-001 | SQL filter key interpolation in pgvector search | `apps/api/src/ai/rag/vector-store.pgvector.ts:114` | `metadata->>'${key}'` interpolates key name. Currently safe — keys come from server config, not user input. Would be vulnerable if filter sources changed. |

### P4 (Informational)

| ID | Title | Location | Details |
|----|-------|----------|---------|
| AUTH-001 | Login reveals email existence on password success | `apps/api/src/auth/auth.service.ts:203-205` | `EMAIL_NOT_VERIFIED` response with email visible confirms email+password validity. Mild enumeration. |
| AUTH-002 | TOTP encryption key derived from `JWT_SECRET` | `apps/api/src/auth/totp.service.ts:13` | Separation of concerns — a dedicated `TOTP_ENCRYPTION_KEY` would be stronger. |
| SAST-007 | Game editor markdown preview uses default DOMPurify | `apps/web/app/dashboard/games/new/page.tsx:294` | No explicit ALLOWED_TAGS. Safe in practice — DOMPurify default config is robust. |
| SAST-021 | CSP img-src allows `http://localhost:*` | `apps/web/middleware.ts:59`, `apps/api/src/main.ts:131` | Allows images from any localhost port. Low risk (Vercel + Fly isolate). |
| MED-01 | User-supplied extension preserved in upload filenames | `apps/api/src/upload/upload.service.ts:139` | `extname(originalname)` preserved. Content is safe, extension misleading. |
| MED-02 | `process.env` directly alongside ConfigService | `apps/api/src/upload/upload.service.ts:10-11` | Module-load-time env reads bypass config validation. Only UPLOADS_DIR/STORAGE_PROVIDER. |
| F-1 | Rotated Neon DB password in documentation | `AGENTS.md`, `CHANGELOG.md`, 2 cert reports | `npg_d0nw9exVhtBk` — confirmed dead (password rotated 2026-08-07). Violates best practice of removing rotated creds from docs. |
| F-2 | Production Fly.io hostname in config | `fly.toml`, `middleware.ts`, CI workflows | `playmorrow-api-aged-mountain-9542` — public identifier, not a secret. |
| F-4 | Rotated credential in git history | Commits `b8d18cd` and `8256e86` | Same rotated password in incident documentation commits. |
| AI-01 | OpenAI embedding fallback model mismatch | `apps/api/src/ai/providers/openai.provider.ts:306` | Fallback `text-embedding-ada-002` differs from config default. Not reachable — EmbeddingService always passes configured model. |
| PUB-01 | Draft game slug enumeration | Same as SEC-005 | |
| SCA-001/2 | image-size 2.0.2 CVEs (ICNS/JXL/HEIF DoS) | `apps/api/src/upload/upload.controller.ts:60` | MITIGATED — magic-byte gate blocks vulnerable parsers. No upstream patch exists. |
| SCA-003-015 | Build-time/dev transitive dependency findings | Various (postcss, fast-uri, brace-expansion, nanoid, undici, vitest, vite, esbuild, uuid, elliptic) | All NOT REACHABLE in production runtime. Build-time/dev/test only. |

### Deferred (existing SEC-012 residual)

| Package | Count | Classification |
|---------|-------|---------------|
| postcss (build-time via terser-webpack-plugin) | 2 | BUILD-TIME ONLY |
| brace-expansion | 6 | DEV/BUILD-TIME ONLY |
| fast-uri | 3 | BUILD-TIME ONLY |
| nanoid | 2 | BUILD-TIME ONLY |
| undici (via jsdom) | 5 | DEV/TEST ONLY (DOM-only jsdom usage) |
| image-size | 2 | MITIGATED (magic-byte gate) |

---

## 6. Security Scorecard

| Domain | Status | Evidence |
|--------|--------|----------|
| Secrets | 🟡 PASS (FINDINGS) | 0 active creds; 1 rotated password in docs; all .env gitignored |
| Git history | 🟡 PASS (FINDINGS) | 0 active creds in history; rotated password in 2 incident doc commits |
| Dependencies | 🟢 PASS | 0 exploitable prod vulns; P1s remediated; 20 deferred (NOT REACHABLE) |
| Supply chain | 🟢 PASS | Frozen lockfile; no install scripts; explicit native allowlist; Dependency Review CI |
| SAST | 🟡 PASS (FINDINGS) | 0 injection vulns; 1 open redirect (P2); 0 XSS (DOMPurify 3.4.13) |
| Authentication | 🟢 STRONG | Argon2id; 2FA/TOTP; account lockout; session cookies (HttpOnly/Secure/SameSite) |
| Authorization | 🟢 STRONG | RBAC with studio roles + global roles; IDOR-protected on all resource types |
| API security | 🟢 STRONG | ValidationPipe (whitelist+forbid); rate limiting (90+ @Throttle); global CSRF |
| CSRF | 🟢 STRONG | HMAC-SHA256; timing-safe compare; 7-day token; global guard |
| CORS | 🟢 PASS | Single-origin (not *); credentials: true |
| HTTPS | 🟢 STRONG | HSTS max-age=2yr; includeSubDomains; preload |
| Security Headers | 🟡 STRONG (1 finding) | Comprehensive; `unsafe-inline` in frontend script-src (legacy, documented) |
| SSRF | 🟢 PASS | No user-supplied fetch URLs; image remotePatterns reasonable |
| File security | 🟢 STRONG | 3-layer validation (MIME → magic bytes → dimensions); 5MB cap |
| Database | 🟢 STRONG | All secrets hashed; parameterized queries; transactions on critical ops |
| Privacy | 🟢 STRONG | No PII in logs; recommendation data privacy-preserving; consent-gated |
| Frontend | 🟢 STRONG | No secrets in NEXT_PUBLIC_; no auth tokens in localStorage; source maps disabled |
| AI security | 🟢 STRONG | Consent gate (opt-in); user scoping; kill switch; no fabricated explanations |
| Publishing security | 🟢 STRONG | Server-authoritative; completeness gate; idempotent; cross-studio protected |
| Production config | 🟢 PASS | NODE_ENV=production; force_https; release_command for migrations; debug endpoints disabled |
| Monitoring | 🟡 PASS (1 gap) | Sentry (error tracking); UptimeRobot (health); no CSP violation collection on frontend; no rate-limit alerting |
| M23 security | 🟢 INTACT | 5% rollout; consent default false; kill switch functional; freeze log (2 entries, 0 contaminations) |

---

## 7. Critical Questions

### Q1: Is there any known P0/P1 vulnerability that is both reachable and currently unmitigated?

**NO.**

All P1 findings from Session 32 have been remediated:
- SEC-001/002/004: dompurify 3.4.13 (verified in both workspaces)
- SEC-003: multer 2.2.0 (verified single version in tree)
- SEC-012: sharp 0.35.3 (verified via next 16.3.0 upgrade)

No new P0/P1 findings were discovered in this audit.

### Q2: Are there any credentials or secrets that appear to have been exposed in source code or git history?

**NO active credentials.**

- 0 active API keys, database passwords, JWT secrets, private keys
- 1 rotated password (`npg_d0nw9exVhtBk`) in documentation — confirmed dead (Session 25 P0.1.1)
- All `.env.*` files properly gitignored
- CI uses GitHub Secrets; production uses Fly.io/Vercel secrets
- Rotated password appears in git history from incident documentation commits (`b8d18cd`, `8256e86`)

### Q3: Are there any security controls that cannot be verified from the available evidence?

**Yes, 3 controls require in-person/hands-on verification:**

1. **Production CSP nonce works as expected** — verification requires live browser testing against `playmorrow.co` (the code sets nonce headers but the CSP directive doesn't reference them; only the frontend is online for live testing).
2. **Fly.io/Neon/Upstash secret store integrity** — platform-level secrets (DATABASE_URL, CSRF_SECRET, etc.) cannot be read from the CLI. Only configuration files can be verified.
3. **Rate-limiting under load** — the Redis atomic Lua throttler is verified in code, but actual Redis availability and latency behavior can only be tested in production.

---

## 8. Residual Risk

| Risk | Severity | Mitigation | Status |
|------|----------|------------|--------|
| Open redirect (email tracking) | P2 | URL whitelist/validation | Accepted — documented finding |
| Draft game slug enumeration | P2 | `isPublished` filter on findBySlug | Accepted — documented (SEC-005) |
| CSP `unsafe-inline` in frontend | P3 | DOMPurify + server-side sanitization | Accepted — documented TODO |
| Anthropic fetch no timeout | P3 | Add AbortController 30s | Accepted — low likelihood |
| image-size 2.0.2 (ICNS/JXL/HEIF) | P3 | Magic-byte gate; no upstream patch | Accepted — monitor upstream |
| 20 deferred transitive CVEs | P4 | NOT REACHABLE (build-time/dev/DOM-only) | Accepted — dependency-drift release |
| Rotated credential in docs | P4 | Non-functional password | Accepted — cleanup in next docs sweep |

---

## 9. What's Working Well

- **Argon2id password hashing** with strong parameters (memoryCost=19456, timeCost=3)
- **2FA/TOTP** with AES-256-GCM encrypted secrets and SHA-256 recovery codes
- **Stateless HMAC-SHA256 CSRF** with timing-safe comparison, applied globally
- **Session cookies** with HttpOnly, Secure (prod), SameSite=None (prod)/Lax (dev)
- **Account lockout** (5 failures → 15-min lockout) + rate limiting on all auth endpoints
- **RBAC with studio roles** (OWNER/ADMIN/MODERATOR/MEMBER) + global ADMIN bypass
- **DOMPurify 3.4.13** on both server-side (devlog/comments) and client-side (markdown)
- **3-layer upload validation** (MIME type → magic bytes → dimensions) with 5MB cap
- **Global rate limiting** with Redis atomic Lua (fail-open — never blocks traffic)
- **Comprehensive CSP** (frame-ancestors 'none', object-src 'none', base-uri 'self')
- **HSTS preload** (2-year max-age, includeSubDomains)
- **7 CI security workflows** (CodeQL, Semgrep, Gitleaks, Trivy, Dependency Review, SBOM, Uptime)
- **M23 consent-gated personalization** (opt-in default false, kill switch, admin-only metrics)
- **Server-authoritative game publishing** (completeness gate, idempotent, transactional audit)
- **DB safety guard** (`db-guard.mjs`) — fail-closed, blocks destructive ops against prod
- **Nightly production backups** to R2 (read-only role, pg_dump, pg_restore verification)
- **539/539 API tests** (51 files) against disposable Postgres
- **Pre-push hook** (`pnpm verify` — lint + typecheck + build)

---

## 10. Final Verdict

### 🟢 SECURITY BASELINE ACCEPTED

**No known critical/high security blockers were identified within the assessed
scope, with all residual risks explicitly documented.**

The 2 P2 findings (open redirect in email tracking, draft game slug enumeration)
are accepted as documented residual risk. Neither is exploitable for privilege
escalation, data exfiltration, or service disruption. The 20 deferred transitive
dependency findings have been deep-audited and classified as NOT REACHABLE in
Playmorrow's production runtime.

The M23 observation freeze remains intact. No algorithmic, weight, rollout, or
metric component was modified by any security remediation. The observation
baseline (2026-08-10 → 2026-08-17) is uncontaminated.

---

## 11. No-Change Verification

```
FILES CHANGED = DOCUMENTATION ONLY (this report)
CODE CHANGED = NO
DEPENDENCIES CHANGED = NO
LOCKFILE CHANGED = NO
DATABASE CHANGED = NO
PRODUCTION CHANGED = NO
M23 CHANGED = NO
COMMIT CREATED = NO
PUSH = NO
DEPLOY = NO
```

**Verified:** `dd1616f` remains HEAD. No files were modified during this audit
except this certification report. All uncommitted files (49) are the same
pre-existing M23/publishing-path work from Sessions 26-31, untouched.
