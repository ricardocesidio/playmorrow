# Playmorrow Threat Model

**Date:** 2026-08-11
**Version:** 1.0
**Based on:** Security Assessment v2

---

## 1. System Overview

Playmorrow is a social discovery platform connecting indie game studios with players. The platform consists of:

- **Frontend:** Next.js 16 (App Router, React 19) deployed on Vercel
- **Backend:** NestJS 11 API deployed on Fly.io
- **Database:** PostgreSQL + pgvector (Neon) with Prisma ORM
- **Cache/Rate Limit:** Upstash Redis
- **AI/ML:** OpenAI/Anthropic embeddings, M23 hybrid recommendation engine
- **Payments:** Stripe Connect for marketplace

---

## 2. Assets

| Asset ID | Asset | Classification | Description |
|----------|-------|----------------|-------------|
| A-001 | User Credentials | **CRITICAL** | Email, Argon2id password hashes, TOTP secrets, recovery codes |
| A-002 | Session Tokens | **CRITICAL** | SHA-256 hashed session cookies, JWT refresh tokens |
| A-003 | Personal Data | **HIGH** | Email, username, display name, bio, location, country |
| A-004 | Studio Data | **HIGH** | Studio profiles, verification documents, brand kits, press kits |
| A-005 | Unpublished Games | **HIGH** | Draft games, devlogs, roadmap items, media, private metadata |
| A-006 | Published Games | **MEDIUM** | Public game profiles, devlogs, roadmap, media |
| A-007 | Recommendation Data | **HIGH** | User behavioral signals, wishlist, follows, dismissals, clicks |
| A-008 | Embeddings | **HIGH** | Game embeddings (1536-dim), user taste vectors |
| A-009 | Audit Logs | **HIGH** | Studio-scoped, actor-attributed, JSON metadata |
| A-010 | Production Database | **CRITICAL** | All persistent data, credentials, secrets |
| A-011 | Deployment Credentials | **CRITICAL** | Fly.io tokens, Vercel tokens, Neon credentials, API keys |
| A-012 | AI Provider Keys | **CRITICAL** | OpenAI/Anthropic API keys |

---

## 3. Threat Actors

| Actor ID | Threat Actor | Motivation | Capability |
|----------|--------------|------------|------------|
| TA-001 | Anonymous Attacker | Reconnaissance, DoS, credential stuffing | Network access, automated tools |
| TA-002 | Malicious User (Registered) | Data theft, privilege escalation, abuse | Authenticated access, API knowledge |
| TA-003 | Malicious Studio Member | Data exfiltration, sabotage | Studio-level access, role permissions |
| TA-004 | Compromised Account | Credential theft, lateral movement | Valid credentials, session tokens |
| TA-005 | Malicious Studio Owner | Data exfiltration, financial fraud | Full studio admin access |
| TA-006 | External API Attacker | Supply chain, credential theft | Network access, compromised dependencies |
| TA-007 | Supply-Chain Attacker | Code injection, backdoor insertion | Compromised dependency, CI/CD |
| TA-008 | Insider/Admin Abuse | Data access, privilege escalation | Admin privileges, infrastructure access |

---

## 4. Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            INTERNET / UNTRUSTED                              │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ HTTPS/TLS 1.2+
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VERCEL EDGE / CDN (Frontend)                         │
│  Next.js 16 │ CSP Nonce │ HSTS │ X-Frame-Options │ Referrer-Policy         │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ HTTPS + CSP + HSTS + Cookies
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLY.IO API (Backend - NestJS 11)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │ AuthN       │  │ AuthZ       │  │ CSRF        │  │ Rate Limit      │   │
│  │ (Session)   │  │ (RBAC)      │  │ (HMAC-SHA256) │  │ (Redis Lua)     │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │ Validation  │  │ Sanitization│  │ Rate Limit  │  │ Audit Log       │   │
│  │ (class-     │  │ (DOMPurify) │  │ (Redis Lua) │  │ (Studio-scoped) │   │
│  │  validator) │  │             │  │             │  │                 │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘   │
└────────┬───────────────────────┬───────────────────────┬──────────────────┘
         │                       │                       │
    ┌────▼────┐             ┌────▼────┐             ┌────▼────┐
    │PostgreSQL│             │Upstash  │             │External │
    │(Neon)   │             │Redis    │             │Providers│
    │+ pgvector│            │(Rate    │             │(OpenAI/ │
    │         │             │ Limit)  │             │Anthropic)│
    └─────────┘             └─────────┘             └─────────┘
```

---

## 5. Attack Surface Matrix

| Boundary | Entry Points | Controls |
|----------|--------------|----------|
| **Browser → Frontend** | HTTPS, CSP, HSTS, Cookies | CSP nonce, HSTS, Secure cookies, SameSite=Lax |
| **Frontend → API** | REST API, WebSocket (if any), Cookies, Headers | CORS allowlist, CSRF token, Session auth, Rate limit |
| **API → Database** | Prisma ORM, Connection pool | Parameterized queries, Least privilege, SSL |
| **API → Redis** | Upstash Redis client | TLS, Token auth, Read-only where possible |
| **API → External AI** | OpenAI/Anthropic SDK | API keys in env, Request signing, Timeout |
| **API → Stripe** | Stripe SDK, Webhooks | Signature verification, Idempotency keys |
| **API → Email (Resend)** | Resend SDK | API key, Template validation |
| **Admin/DevOps** | Fly.io CLI, Vercel CLI, GitHub | MFA, Branch protection, Secret scanning |

---

## 6. Threat Scenarios

| Scenario | Actor | Attack Path | Impact | Likelihood | Existing Controls | Residual Risk |
|----------|-------|-------------|--------|------------|-------------------|---------------|
| **Credential Stuffing** | TA-001 | Automated login attempts with breached credentials | Account takeover | MEDIUM | Argon2id, 5-attempt lockout, email verification, 2FA | LOW |
| **Session Hijacking** | TA-001/TA-004 | Cookie theft via XSS/mitm | Session hijack | LOW | HttpOnly, Secure, SameSite=Lax, SHA-256 hash, IP binding | LOW |
| **IDOR on Draft Games** | TA-002/TA-003 | Enumerate `/games/:slug` for unpublished games | Pre-release data leak | MEDIUM | Draft isolation documented, but endpoint lacks check | MEDIUM |
| **IDOR on Studio Data** | TA-003 | Manipulate studio slug in API calls | Unauthorized studio access | LOW | `assertStudioAccess` with seat limits | LOW |
| **CSRF on Mutations** | TA-001/TA-002 | Forge requests via victim's browser | Unauthorized actions | LOW | HMAC-SHA256 stateless CSRF, global guard, SameSite=Lax | LOW |
| **XSS via Devlogs/Comments** | TA-002 | Inject malicious HTML/JS in markdown | Session theft, defacement | LOW | DOMPurify (server+client), CSP nonce, React auto-escape | LOW |
| **SQL Injection** | TA-001/TA-002 | Malicious query parameters | Data breach, corruption | LOW | Prisma parameterized queries only, no raw SQL | LOW |
| **SSRF via Image Upload** | TA-002 | Upload malicious file with SSRF payload | Internal network access | LOW | Magic bytes validation, no URL fetching | LOW |
| **File Upload RCE** | TA-002 | Upload executable disguised as image | Server compromise | LOW | Magic bytes, 5MB limit, 4096px dim, no SVG, CDN storage | LOW |
| **M23 Feedback Poisoning** | TA-002 | Mass CLICKED/DISMISSED to manipulate recommendations | Degraded recommendations | LOW | Session-scoped, 60-min dedup, admin metrics, 60/min limit | LOW |
| **M23 Embedding Exposure** | TA-006 | Extract embeddings via API | Intellectual property leak | LOW | Auth required, only published games embedded, no batch export | LOW |
| **Supply Chain Compromise** | TA-007 | Malicious dependency in lockfile | Code execution, data exfiltration | LOW | `pnpm-lock.yaml` frozen, `--frozen-lockfile`, dependency review | LOW |
| **Credential Leak via Logs** | TA-007/TA-008 | Secrets in error logs/stack traces | Full system compromise | LOW | GlobalExceptionFilter strips secrets, Sentry filters | LOW |
| **Audit Log Tampering** | TA-008 | Delete/modify audit logs | Cover tracks | LOW | Append-only, no delete API, studio-scoped | LOW |
| **M23 Embedding Extraction** | TA-006 | Batch request embeddings for all games | Model inversion, IP theft | LOW | Rate limit 10 RPM, admin-only batch refresh, only published games | LOW |
| **Stripe Webhook Replay** | TA-006 | Replay captured webhook events | Financial fraud | LOW | `stripe.webhooks.constructEvent`, idempotency keys | LOW |

---

## 7. AI/M23 Specific Threats

| Threat | Actor | Description | Mitigation |
|--------|-------|-------------|------------|
| **Recommendation Manipulation** | TA-002 | Coordinated CLICKED/DISMISSED to promote/demote games | Session-scoped, 60-min dedup, admin metrics, 60/min rate limit |
| **Taste Signal Inference** | TA-006 | Infer user preferences from recommendations | Consent-gated (opt-in default off), no raw signals exposed |
| **Embedding Model Inversion** | TA-006 | Reconstruct game features from embeddings | Only published games embedded, rate limited, admin-only refresh |
| **Feedback Loop Manipulation** | TA-002 | Coordinated wishlist/click to bias future recommendations | Dismissal exclusions, diversity re-ranking (MMR), per-user scope |
| **Cost Exhaustion** | TA-001/TA-002 | Trigger expensive embedding generation | Daily cost ceiling ($50), 10 RPM limit, admin-only refresh |
| **Model Poisoning** | TA-007 | Compromise OpenAI/Anthropic API response | Provider keys in env, SDK validation, request signing |

---

## 8. M23 Observation Freeze Impact

The M23 Observation Freeze (2026-08-10 → 2026-08-17) creates a **time-bounded trust boundary**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    M23 OBSERVATION FREEZE                        │
│  2026-08-10 00:00 UTC  ──►  2026-08-17 23:59 UTC                │
│                                                                  │
│  Frozen Components:                                              │
│  ✓ Algorithm (hybrid-recommender.service.ts)                    │
│  ✓ Weights (0.35/0.25/0.25/0.05/0.10)                           │
│  ✓ MMR (λ=0.5)                                                   │
│  ✓ Embeddings (text-embedding-3-small, 1536-dim)                │
│  ✓ Rollout % (5%)                                                │
│  ✓ Personalization logic (opt-in default off)                   │
│  ✓ Metrics definitions (CTR, dismissal, impression, opt-in)     │
│  ✓ Kill switch (RECOMMENDATIONS_ENABLED=false)                  │
│                                                                  │
│  Allowed Changes:                                                │
│  ✓ Emergency P0/P1 security fixes (logged in freeze log)        │
│  ✓ Infrastructure/platform changes (publishing path, etc.)      │
│                                                                  │
│  Gate: 2026-08-17 evaluation                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Security Implication:** During freeze, M23 attack surface is **static and known**. No new algorithmic attack vectors can be introduced. Security review can focus on infrastructure around M23 (embedding pipeline, feedback endpoints, consent enforcement).

---

## 9. Data Flow & Privacy

```
User Behavioral Signals
         │
         ▼
┌─────────────────────┐
│ Consent Gate        │─── No (default) ──► Content-based only
│ (personalizationEnabled)                    (no signals read)
└─────────┬───────────┘
          │ Yes
          ▼
┌─────────────────────┐
│ Taste Signals       │─── Wishlist, Views, Tags, Studio Follows
│ Gathering           │     (no PII, no private drafts)
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Embedding Pipeline  │─── User vector → pgvector KNN
│ (pgvector + MMR)    │     Only published games
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Explanations        │─── "Because you..." with reason type
│ (reasonType)        │     (semantic/tag/studio/popular/trending)
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Feedback Loop       │─── CLICKED/DISMISSED/WISHLISTED/IMPRESSION
│ (user-scoped)       │     60-min dedup, session-scoped reset
└─────────────────────┘
```

**Privacy Guarantees:**
- ✅ Consent default OFF (AI Constitution Art. 5)
- ✅ Server-side enforcement per request
- ✅ No cross-user data leakage
- ✅ Session-scoped history reset
- ✅ Admin metrics aggregated only
- ✅ Dismissed games reappear after reset
- ✅ Embeddings only for published games

---

## 10. Residual Risks & Acceptance

| Risk ID | Risk | Current Control | Residual | Acceptance |
|---------|------|-----------------|----------|------------|
| RR-001 | Draft game enumeration via slug | Documented, but endpoint lacks check | MEDIUM | **ACCEPTED** - Fix in next sprint |
| RR-002 | DOMPurify XSS (3 CVEs) | **REMEDIATED** — dompurify 3.4.13 (all workspaces) | NONE | ✅ RESOLVED |
| RR-003 | Multer DoS (transitive) | **REMEDIATED** — multer 2.2.0 pinned (pnpm override) | NONE | ✅ RESOLVED |
| RR-004 | Draft game enumeration via slug | Public endpoint serves drafts | MEDIUM | **ACCEPTED** - Fix in next sprint |
| RR-005 | Password policy gaps | Only common pw check, no length/complexity | MEDIUM | **ACCEPTED** - Policy enhancement in next sprint |
| RR-006 | Dev CSP `unsafe-eval` | Dev-only, prod strict | LOW | **ACCEPTED** - Migrate to Next.js 16 native CSP |
| RR-007 | Dev dependencies with vulns | Dev-only (vitest, vite, esbuild, undici, etc.) | NONE | **ACCEPTED** - Dev environment only |
| RR-008 | image-size infinite-loop DoS (ICNS/JXL/HEIF) | Magic-byte gate blocks vulnerable parsers; **no patch exists** | LOW (gate-dependent) | **ACCEPTED** - Monitor upstream, upgrade when patch ships |
| RR-009 | js-yaml exponential parsing DoS (transitive) | **REMEDIATED** — js-yaml 4.3.1 override | NONE | ✅ RESOLVED |
| RR-010 | 21 pre-existing transitive prod findings (postcss/brace-expansion/fast-uri/sharp/nanoid via @sentry/nextjs→next; undici via jsdom) | Present in committed baseline (`HEAD`), not introduced by remediation | LOW | **ACCEPTED** - dependency-drift release |

---

## 10. Security Control Effectiveness Summary

| Control Family | Effectiveness | Notes |
|----------------|---------------|-------|
| **Authentication** | HIGH | Argon2id, 2FA, lockout, email verification, session management |
| **Authorization** | HIGH | RBAC, studio ownership, seat limits, admin guards |
| **Input Validation** | HIGH | Prisma ORM, class-validator, ValidationPipe |
| **Output Encoding** | HIGH | DOMPurify (server+client), CSP, React auto-escape |
| **Session Security** | HIGH | SHA-256, 7-day TTL, revocation, IP binding, rotation |
| **CSRF** | HIGH | HMAC-SHA256 stateless, global guard, SameSite=Lax |
| **Rate Limiting** | HIGH | Redis atomic Lua, fail-open, per-endpoint |
| **CSP/Headers** | HIGH | Nonce-based, HSTS preload, strict headers |
| **Secrets Management** | HIGH | Env-only, getOrThrow in prod, Fly.io/Vercel secrets |
| **Database Security** | HIGH | Prisma, audit logs, db guard, encrypted secrets |
| **Supply Chain** | HIGH | Lockfile frozen, npm audit, dependency review |
| **M23 Security** | HIGH | Consent-gated, kill switch, rollout control, fail-graceful |
| **Infrastructure** | HIGH | Fly.io/Vercel managed TLS, secrets, read-only DB role |
| **CI/CD** | HIGH | Lint/typecheck/build/test, dependency review, DB safety |

---

## 11. Recommended Security Enhancements

### Immediate (Next Sprint)
1. ✅ `dompurify` → 3.4.13 (fixes 3 CVEs) — **DONE**
2. ✅ `multer@2.2.0` pinned (pnpm overrides) — **DONE**
3. ✅ `js-yaml` → 4.3.1 override (GHSA-52cp-r559-cp3m / GHSA-5p4m-2wfm-xmqj) — **DONE**
4. Add publication check to `GET /games/:slug`
5. Implement `/api/csp-report` endpoint

### Short-term (Next Release)
1. Add `@MinLength(8)` to `RegisterDto`
3. Add password history table + rotation check
4. Implement CSP report endpoint `/api/csp-report`
5. Monitor image-size upstream for a patched release; upgrade immediately (SEC-010)

### Medium-term
1. Migrate to Next.js 16 native CSP support
2. Add password history/rotation policy
3. Authorized penetration test on staging
4. Enhance audit log for failed authorization attempts

---

## 11. Sign-Off

**Assessment Completed:** 2026-08-11
**Assessor:** Security Assessment v2 (Read-Only)
**Next Review:** 2026-08-17 (M23 Gate Evaluation)
**Classification:** INTERNAL - SECURITY SENSITIVE