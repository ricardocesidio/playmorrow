# Security Baseline

**Version:** 1.0 (2026-07-29)
**Owner:** Security Team

---

## Purpose

Minimum security requirements for all Playmorrow systems, services, and code.

---

## Code Requirements

| Control | Requirement | Exception |
|---------|-------------|-----------|
| Authentication | All mutations require authentication | Public routes: register, login, public feed, public game/studio pages |
| Authorization | RBAC enforced for all studio operations | Global ADMIN bypass permitted |
| CSRF | Global HMAC guard on all mutations | Routes with `@SkipCsrf()` (health, auth) |
| Input validation | DTOs with `whitelist: true` | None |
| Output encoding | DOMPurify for all user-generated HTML | JSON-LD (safe, server-generated) |
| Secrets | Zero secrets in code, env-only | CI test secrets (dummy values) |
| Logging | No secrets, tokens, or PII in logs | None |
| Rate limiting | Every endpoint has a rate limit | Health endpoints (`@SkipThrottle()`) |

## Infrastructure Requirements

| Control | Requirement | Status |
|---------|-------------|--------|
| HTTPS | TLS 1.2+ enforced | ✅ |
| HSTS | `max-age=63072000; includeSubDomains; preload` | ✅ |
| CSP | Nonce-based, no `unsafe-inline` in prod | ✅ |
| Headers | X-Frame-Options, X-Content-Type-Options, Referrer-Policy | ✅ |
| Backups | Automated daily + 7-day PITR | ✅ |
| Monitoring | Health checks every 5min + Sentry | ✅ |
| Secrets | Encrypted at rest (Fly.io) | ✅ |

## CI/CD Requirements

| Control | Requirement | Status |
|---------|-------------|--------|
| Typecheck | Must pass | ✅ In CI |
| Lint | Must pass | ✅ In CI |
| Tests | All must pass | ✅ In CI |
| Gitleaks | Must pass | ✅ In CI |
| Dependency Review | Must pass | ✅ Added |
| CodeQL | Must pass | ✅ Added |
| Semgrep | Must pass | ✅ Added |
| Trivy | Must pass (no CRITICAL/HIGH) | ✅ Added |
| npm audit | Must pass (audit-level high) | ✅ Added |

## Dependency Requirements

| Control | Requirement |
|---------|-------------|
| Critical vulnerabilities | Zero tolerance |
| High vulnerabilities | Fix within 7 days |
| Deprecated packages | Replace before next major release |
| License compatibility | MIT, Apache-2.0, BSD, ISC, Unlicense only |

## Incident Response Requirements

| Control | Requirement | Status |
|---------|-------------|--------|
| Playbook | Documented | ✅ `INCIDENT_RESPONSE.md` |
| Contacts | Defined | ✅ In playbook |
| Severity matrix | Defined | ✅ In playbook |
| Templates | Available | ✅ In playbook |
| Post-mortem | Required within 72h | ✅ Format defined |
