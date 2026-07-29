# Threat Model

**Version:** 1.0 (2026-07-29)
**Owner:** Security Team

---

## Architecture Overview

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Browser  │────▶│  Vercel  │────▶│  Fly.io  │────▶│   Neon   │
│  (User)   │     │ (Next.js)│     │ (NestJS) │     │(Postgres)│
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │                 │                 │
                      ▼                 ▼                 ▼
                 CSP Nonce          CSRF HMAC         Prisma ORM
                 DOMPurify          Argon2id          Encrypted
                 OAuth              RBAC
```

---

## Trust Boundaries

| Boundary | Description | Security Controls |
|----------|-------------|-------------------|
| **Browser → Vercel** | User accesses website | CSP, HSTS, HTTPS, secure cookies |
| **Vercel → Fly.io** | API requests from frontend | CSRF HMAC, rate limiting, session auth |
| **Fly.io → Neon** | Database queries from API | Prisma ORM (parameterized), encrypted connection |
| **Fly.io → R2** | File uploads to storage | Randomized filenames, MIME validation, magic bytes |
| **OAuth Provider** | Google/GitHub authentication | State parameter, origin validation |

---

## Threat Scenarios

### T1: Authentication Bypass

| Attribute | Detail |
|-----------|--------|
| **Threat** | Attacker bypasses login to access authenticated endpoints |
| **Vector** | Direct API calls without session cookie |
| **Controls** | `SessionAuthGuard` on all mutation endpoints, CSRF guard, rate limiting |
| **Residual Risk** | Low |
| **Status** | ✅ Mitigated |

### T2: Privilege Escalation

| Attribute | Detail |
|-----------|--------|
| **Threat** | MEMBER role user performs OWNER actions |
| **Vector** | Direct API calls modifying studio settings |
| **Controls** | `assertStudioAccess()` enforcing role checks, seat limits (OWNER: 2) |
| **Residual Risk** | Low |
| **Status** | ✅ Mitigated |

### T3: Data Exfiltration via API

| Attribute | Detail |
|-----------|--------|
| **Threat** | Attacker enumerates IDs to access other users' data |
| **Vector** | IDOR via game/studio/user IDs |
| **Controls** | Ownership checks, global ValidationPipe with whitelist, rate limiting |
| **Residual Risk** | Low |
| **Status** | ✅ Mitigated |

### T4: Stored XSS

| Attribute | Detail |
|-----------|--------|
| **Threat** | Attacker injects malicious script in devlog content |
| **Vector** | Devlog body, comments, studio description (all support Markdown) |
| **Controls** | DOMPurify sanitization on all rendered Markdown, CSP nonce |
| **Residual Risk** | Low |
| **Status** | ✅ Mitigated |

### T5: Secret Exposure

| Attribute | Detail |
|-----------|--------|
| **Threat** | Secrets leaked via git history or CI logs |
| **Vector** | Commit with hardcoded secret, CI log containing env var |
| **Controls** | Gitleaks CI, git-filter-repo on historical leaks, pre-commit (planned) |
| **Residual Risk** | Low (historical leaks rotated) |
| **Status** | ✅ Mitigated |

### T6: Supply Chain Attack

| Attribute | Detail |
|-----------|--------|
| **Threat** | Compromised npm dependency introduces vulnerability |
| **Vector** | Dependency update with malicious code |
| **Controls** | Dependabot, Dependency Review, CodeQL, Semgrep, npm audit |
| **Residual Risk** | Medium (CodeQL/Semgrep/Trivy now configured in CI) |
| **Status** | ✅ Mitigated |

### T7: Denial of Service

| Attribute | Detail |
|-----------|--------|
| **Threat** | Attacker overwhelms API with requests |
| **Vector** | High-volume requests to any endpoint |
| **Controls** | Rate limiting (60/min global, per-route overrides), 5/min register, 10/min login |
| **Residual Risk** | Medium (no auto-scaling, no Redis for global rate limits) |
| **Status** | 🟡 Partially mitigated |

### T8: Account Takeover

| Attribute | Detail |
|-----------|--------|
| **Threat** | Attacker gains access to user account via password guessing or session hijacking |
| **Vector** | Brute force login, session cookie theft, OAuth token theft |
| **Controls** | Account lockout (5 attempts → 15min), rate limiting, httpOnly+secure cookies, OAuth state param |
| **Residual Risk** | Low |
| **Status** | ✅ Mitigated |

---

## Risk Matrix

| ID | Threat | Likelihood | Impact | Risk Level | Status |
|----|--------|------------|--------|------------|--------|
| T1 | Authentication Bypass | Low | Critical | 🟡 Medium | ✅ Mitigated |
| T2 | Privilege Escalation | Low | High | 🟡 Medium | ✅ Mitigated |
| T3 | Data Exfiltration | Low | High | 🟡 Medium | ✅ Mitigated |
| T4 | Stored XSS | Low | High | 🟡 Medium | ✅ Mitigated |
| T5 | Secret Exposure | Low | Critical | 🟡 Medium | ✅ Mitigated |
| T6 | Supply Chain Attack | Medium | High | 🟡 Medium | ✅ Mitigated |
| T7 | Denial of Service | Medium | Medium | 🟡 Medium | 🟡 Partial |
| T8 | Account Takeover | Low | Critical | 🟡 Medium | ✅ Mitigated |

---

## Attack Surface Summary

| Surface | Exposed | Protected By | Risk |
|---------|---------|--------------|------|
| Public API (162+ endpoints) | Internet | Rate limiting, CSRF, auth, validation | Low |
| Frontend (78 pages) | Internet | CSP, DOMPurify, nonce | Low |
| Admin endpoints | Authenticated | RBAC, ADMIN role check | Low |
| OAuth callbacks | Internet | State parameter, origin validation | Low |
| File uploads | Authenticated | MIME, magic bytes, size, random names | Low |
| Database | Internal only | Prisma ORM, not exposed | Low |
| CI/CD | GitHub | Gitleaks, CodeQL, Semgrep, Trivy, Dep Review | Low |

---

## References

- `docs/releases/SECURITY_CERTIFICATION_v1.1.md` — Security certification
- `docs/security/INCIDENT_RESPONSE.md` — Incident response playbook
- `docs/security/SECURITY_BASELINE.md` — Baseline requirements
