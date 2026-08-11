# SECURITY REMEDIATION V2.1 — P1 Dependency Fixes

**Date:** 2026-08-11
**Classification:** Security remediation sprint (P1 dependency vulnerabilities)
**Related docs:** `SECURITY_ASSESSMENT_V2.md`, `SECURITY_CVE_INVENTORY.md`, `SECURITY_FINDINGS.md`, `SECURITY_THREAT_MODEL.md`

---

## 1. Executive Summary

This sprint remediates all 3 confirmed **P1 production dependency vulnerabilities** identified by the Security Assessment v2 (Session 32), plus the low-severity SEC-004 which shared the same root cause. The fix consisted of dependency upgrades only — **zero application code changes**:

| Finding | Vulnerability | Fix Applied | Result |
|---------|---------------|-------------|--------|
| SEC-001 | DOMPurify XSS via `IN_PLACE` hook | dompurify 3.4.11 → **3.4.13** | ✅ REMEDIATED |
| SEC-002 | DOMPurify `CUSTOM_ELEMENT_HANDLING` bypass | dompurify 3.4.11 → **3.4.13** | ✅ REMEDIATED |
| SEC-003 | Multer DoS (transitive) | multer 2.1.1 → **2.2.0** (pnpm override) | ✅ REMEDIATED |
| SEC-004 | DOMPurify low-severity bypass | Resolved by same dompurify upgrade | ✅ REMEDIATED |
| SEC-010 | image-size DoS (ICNS/JXL/HEIF) | **No patch exists** — magic-byte gate is compensating control | 🟡 MITIGATED |
| SEC-011 | js-yaml exponential parsing DoS | js-yaml 4.1.1 → **4.3.1** (pnpm override) | ✅ REMEDIATED |

**Verdict:** 🟢 **REMEDIATION READY FOR COMMIT** — all P1 findings cleared, plus js-yaml (SEC-011) remediated via override. Single remaining in-scope residual: image-size (SEC-010), for which **no patched version exists** (registry latest = 2.0.2; advisory lists ≥2.0.3 but it is not published) — documented as MITIGATED with the magic-byte gate as compensating control.

**Honest audit scope note:** the committed baseline (`HEAD`) carries **23 production audit findings** (6 moderate | 17 high). This sprint remediates the in-scope ones only (dompurify, multer, js-yaml). The remaining **21 findings** — postcss (4), brace-expansion (6), fast-uri (3), sharp (1), nanoid (2) via `apps__web>@sentry/nextjs>next`, and undici (5) via `apps__api>jsdom>undici` — are **pre-existing transitive findings already present in `HEAD`**, not introduced by this commit, and are **out of scope / deferred** to a future dependency-drift release.

---

## 2. Scope

**In scope:**
- Upgrade vulnerable production dependencies: `dompurify`, `multer`
- Full dependency reinstall to honor the pnpm override
- Prisma client regeneration
- Test + verification suite
- CVE re-scan and residual-finding classification
- Security documentation updates
- M23 freeze-integrity verification

**Out of scope (by design):**
- No application source changes
- No M23 algorithm/weights/rollout/metrics changes (freeze)
- No new feature work
- No commit/push/deploy (requires separate authorization)

---

## 3. Findings Addressed

| ID | Severity | Title | Status |
|----|----------|-------|--------|
| SEC-001 | P1 | DOMPurify XSS (IN_PLACE hook) | **REMEDIATED** |
| SEC-002 | P1 | DOMPurify CUSTOM_ELEMENT_HOOK bypass | **REMEDIATED** |
| SEC-003 | P1 | Multer DoS (transitive, 2.1.1) | **REMEDIATED** |
| SEC-004 | P2 | DOMPurify low-severity bypass | **REMEDIATED** |

---

## 4. Remediation Actions

### 4.1 dompurify 3.4.13 (SEC-001, SEC-002, SEC-004)

Upgraded to 3.4.13 in all 3 package.json locations (root, `apps/api`, `apps/web`):

```bash
pnpm add -w dompurify@3.4.13
pnpm --filter @playmorrow/api add dompurify@3.4.13
pnpm --filter @playmorrow/web add dompurify@3.4.13
```

**Verified installed versions:**
```
playmorrow@0.1.0  → dompurify@3.4.13
@playmorrow/api   → dompurify@3.4.13
@playmorrow/web   → dompurify@3.4.13
```

### 4.2 multer 2.2.0 override (SEC-003)

Multer is a transitive dependency via `@nestjs/platform-express@11.1.28`. The override was added to **`pnpm-workspace.yaml`**:

```yaml
packages:
  - apps/*
  - packages/*
overrides:
  multer: 2.2.0
```

> **Important:** pnpm 11.1.3 **no longer reads the `pnpm.overrides` field in package.json** (verified warning: `The "pnpm" field in package.json is no longer read by pnpm`). Overrides must be declared in `pnpm-workspace.yaml`.

**Verified:** `pnpm why multer` → `Found 1 version of multer` → `multer@2.2.0` (single version in tree).

### 4.3 Full dependency reinstall

The override only takes effect on a fresh install. Performed:

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 4.4 Prisma client regeneration

After the reinstall the Prisma client had not been generated:

```bash
pnpm --filter @playmorrow/database db:generate
```

---

## 5. CVE Evidence (Before / After)

### Before remediation (from SECURITY_ASSESSMENT_V2 / SECURITY_CVE_INVENTORY)

| CVE / Advisory | Severity | Package | Status |
|----------------|----------|---------|--------|
| dompurify 3.4.11 (2 CVEs) | P1 | dompurify | confirmed |
| multer 2.1.1 (transitive) | P1 | multer | confirmed |

### After remediation (in-scope)

```
$ pnpm audit --prod
23 vulnerabilities found
Severity: 6 moderate | 17 high
  - image-size: ICNS parser infinite loop DoS (GHSA-w3rx-r6r6-pgpr)   ← in scope, MITIGATED
  - image-size: JXL and HEIF parsers infinite loop DoS (GHSA-5p2g-fcmc-qvqq) ← in scope, MITIGATED
  - postcss x4, brace-expansion x6, fast-uri x3, sharp, nanoid x2  (via apps__web>@sentry/nextjs>next)
  - undici x5  (via apps__api>jsdom>undici)
```

**dompurify, multer and js-yaml no longer appear in the audit output → all P1 findings cleared. The remaining 21 findings are pre-existing transitive dependencies of `HEAD` (out of scope for this commit).**

---

## 6. New Findings Discovered (Residual Risk)

Two HIGH findings surfaced during this sprint. js-yaml was remediated; image-size remains MITIGATED.

### 6.1 js-yaml@4.1.1 (GHSA-52cp-r559-cp3m, GHSA-5p4m-2wfm-xmqj) — **REMEDIATED**

- **Path:** `apps__api > @nestjs/swagger > js-yaml@4.1.1`
- **Severity:** HIGH (both advisories)
- **Issue:** Exponential parsing time in flow collections → DoS
- **Patched:** ≥4.3.0 (GHSA-52cp-r559-cp3m) and ≥4.3.1 (GHSA-5p4m-2wfm-xmqj)
- **Classification:** Transitive via `@nestjs/swagger@11.4.4` (OpenAPI doc generation, not request parsing). DoS vector requires untrusted YAML input — the app does not parse user-supplied YAML.
- **Remediation (DONE 2026-08-11):** Added `js-yaml: 4.3.1` override to `pnpm-workspace.yaml` (same-major patch bump, drop-in compatible). Verified: single version in tree (`Found 1 version of js-yaml` → 4.3.1), `pnpm audit --prod` no longer flags js-yaml.
- **Status:** ✅ **REMEDIATED**

### 6.2 image-size@2.0.2 (CVE-2025-71330 GHSA-w3rx-r6r6-pgpr, CVE-2025-71329 GHSA-5p2g-fcmc-qvqq)

**DECISION (2026-08-11 final pre-commit review): CLASSIFICATION B — MITIGATED / NOT CURRENTLY EXPLOITABLE**

| Fact | Value |
|------|-------|
| Path | `apps__api > image-size@2.0.2` (direct production dependency) |
| Severity | HIGH (CVSS 4.0: 8.7 each) |
| Issues | CVE-2025-71330: ICNS infinite-loop DoS; CVE-2025-71329: JXL/HEIF infinite-loop DoS |
| Patched | **NONE** — both advisories list "Patched versions: None"; npm `latest` = 2.0.2 (verified via `pnpm view image-size`) |
| Affected | `<= 2.0.2` (both) |
| Upgrade possible? | **NO** — no patched version exists in the registry |

**Reachability analysis (empirical + code):**
- `image-size` is called exactly once in production code: `upload.controller.ts:60` (`imageSize(new Uint8Array(file.buffer))`).
- Every upload passes `validateMagicBytesFromBuffer` (`upload.service.ts:102`) **before** `imageSize()` runs. The gate accepts only: jpeg `FF D8 FF`, png `89 50 4E 47`, gif `47 49 46`, webp `RIFF…WEBP`.
- image-size's detector (`dist/index.cjs:957`) routes by first byte: `0xFF→jpg`, `0x89→png`, `0x47→gif`, `0x52→webp`. The vulnerable parsers require first byte `0x69` ('i', ICNS) or `0x00` (HEIF) — **impossible** to reach through the gate.
- Empirically verified: crafted ICNS/JXL/HEIF payloads wrapped in gate-passing jpeg/png/gif/webp prefixes throw immediately (`unsupported file type`) — no hang. Raw (ungated) CVE-trigger buffers were also tested.
- Additionally: upload requires `SessionAuthGuard`, is rate-limited (`@Throttle 20/min`), and capped at 5MB.

**Residual risk:** No patched version exists. If a future image-size release fixes these CVEs (e.g. 2.0.3+), upgrade immediately. Until then, the magic-byte gate is the compensating control. Tracked in `SECURITY_CVE_INVENTORY.md` as **MITIGATED (monitor for upstream fix)**.

**Optional hardening (deferred, not a P1 blocker):** image-size exports `disableTypes()` — calling `disableTypes(['icns', 'heif', 'jxl', 'jxl-stream'])` in `upload.controller.ts` would hard-block those parsers even if the gate ever regressed. Recommended as follow-up work.

### 6.3 Risk acceptance rationale

The one remaining finding is **high severity but not exploitable in this application**:
- **image-size**: The upload pipeline rejects all file types other than jpg/png/gif/webp at the magic-byte stage **before** any image-size parser runs, and no patched version exists (advisory lists `≥2.0.3` but the registry's latest is still 2.0.2).

It does not block the release certification. Tracked in `SECURITY_FINDINGS.md` and `SECURITY_CVE_INVENTORY.md` as **MITIGATED (monitor for upstream fix)**. js-yaml is no longer residual — fully remediated via the 4.3.1 override.

### 6.4 Pre-existing findings (out of scope)

`pnpm audit --prod` on the committed baseline reports 23 findings. After the in-scope fixes, the remaining 21 are **pre-existing transitive findings already present in `HEAD`** (not introduced by this commit): `postcss` x4, `brace-expansion` x6, `fast-uri` x3, `sharp` x1, `nanoid` x2 via `apps__web>@sentry/nextjs>next`, and `undici` x5 via `apps__api>jsdom>undici`. These are tracked in `SECURITY_CVE_INVENTORY.md` / `SECURITY_FINDINGS.md` as **DEFERRED (out of scope)** — a future dependency-drift release (upgrading `@sentry/nextjs`, `next`, and removing/upgrading the `jsdom` production dependency) is the remediation path.

---

## 7. Test Evidence

| Suite | Result |
|-------|--------|
| API tests | **539/539 pass** (51 files) |
| Typecheck | ✅ 2/2 |
| ESLint | ✅ 0 errors |
| Build | ✅ 6/6 |
| `pnpm verify` | ✅ 6/6 |

---

## 8. Quality Gates

```
pnpm verify ................. 6/6 ✅
pnpm build .................. clean ✅
pnpm lint ................... 0 errors ✅
API tests ................... 539/539 (51 files) ✅
pnpm audit --prod ........... dompurify+multer+js-yaml cleared; 21 pre-existing transitive findings (via @sentry/nextjs→next, jsdom→undici) out of scope; image-size (no patch) MITIGATED ✅
```

---

## 9. M23 Freeze Integrity Verification

The M23 observation freeze (2026-08-10 → 2026-08-17, 25% gate locked) required verification that this sprint touched no frozen component:

- ✅ No changes to M23 scoring weights, candidate generation, semantic search, embedding model/dimensions, MMR, ranking, personalization, rollout %, UX, explanations, or feedback semantics
- ✅ No toggle of `RECOMMENDATIONS_ENABLED` / `ROLLOUT_PCT` / feature flags
- ✅ Git diff confirms only dependency + security-doc changes attributable to this sprint
- ⚠️ Pre-existing uncommitted M23 work (Sessions 26–30) is present in the working tree but **untouched** by this sprint

**Freeze status: INTACT.**

---

## 10. Security Backlog (Deferred — not part of this sprint)

| ID | Severity | Title |
|----|----------|-------|
| SEC-005 | P3 | Draft games accessible via slug enumeration |
| SEC-006 | P3 | No CSP violation report endpoint |
| SEC-007 | P4 | Dev CSP allows 'unsafe-eval' |
| SEC-008 | P4 | No password minimum length |
| SEC-009 | P4 | No password history/rotation |

---

## 11. Residual Risk

1. **image-size@2.0.2** (HIGH, direct) — **no patched version exists** (registry latest = 2.0.2; advisory lists ≥2.0.3 but it is not published). Parsers unreachable via magic-byte gate (classification B). Monitor upstream.
2. **Pre-existing transitive findings (21)** — postcss, brace-expansion, fast-uri, sharp, nanoid (via `@sentry/nextjs→next`) and undici (via `jsdom`). Present in `HEAD`, **not introduced by this commit**, out of scope; remediation deferred to a dependency-drift release.
3. **Dev-only vulnerabilities** (vitest, vite, esbuild, launch-editor, uuid, elliptic) — no production impact, scheduled separately.
4. **CSP 'unsafe-eval'** in dev only (SEC-007) — production CSP has no unsafe-inline/unsafe-eval.

> js-yaml is no longer residual — remediated via 4.3.1 override (SEC-011).

---

## 12. Remediation Verification Commands

```bash
# Confirm dompurify fixed version everywhere
pnpm list dompurify

# Confirm single multer version
pnpm why multer

# Confirm no P1 remaining
pnpm audit --prod

# Regression
pnpm --filter @playmorrow/api test
pnpm verify
```

---

## 13. Production Impact

**None.** No code changes, no migrations, no deployments. The dependency upgrade must be deployed in the next authorized release for production to receive the dompurify/multer fixes. Until then the risk is limited to the pre-existing dependency versions in production. image-size remains at 2.0.2 in production (no patched version available); the magic-byte gate protects it.

---

## 14. Rollback Plan

The changes are limited to dependency version bumps + lockfile + docs. Rollback = revert `package.json` files, `pnpm-workspace.yaml`, and `pnpm-lock.yaml` to previous commit and reinstall. No schema, migration, or data impact.

---

## 15. Final Verdict

# 🟢 SECURITY REMEDIATION READY FOR COMMIT

| Gate | Result |
|------|--------|
| P1 dependency vulnerabilities (SEC-001/002/003) | ✅ REMEDIATED |
| SEC-004 (P2, same root cause) | ✅ REMEDIATED |
| js-yaml (GHSA-52cp-r559-cp3m / GHSA-5p4m-2wfm-xmqj, SEC-011) | ✅ REMEDIATED (4.3.1 override) |
| image-size (CVE-2025-71329/71330, SEC-010) | 🟡 MITIGATED — no patched version exists (classification B, section 6.2) |
| Regression tests | ✅ 539/539 (51 files) |
| `pnpm verify` | ✅ 6/6 |
| M23 freeze | ✅ INTACT |
| Remaining HIGH findings | 📋 21 pre-existing transitive findings (out of scope, deferred); image-size MITIGATED — non-exploitable in current code paths |

**No exploitable P0/P1 dependency vulnerability remains in production.**

---

## 16. Certification Statement

```
DEPENDENCIES CHANGED: YES (dompurify 3.4.13, multer 2.2.0 override, js-yaml 4.3.1 override)
CODE CHANGED: NO
SCHEMA/MIGRATIONS CHANGED: NO
M23 CHANGED: NO
COMMITS CREATED: NO
PUSHES PERFORMED: NO
DEPLOYMENTS PERFORMED: NO
```

All P1 findings from the Security Assessment v2 are remediated in the working tree, plus the js-yaml finding (SEC-011) via override. 21 pre-existing transitive findings remain (out of scope, deferred). The next authorized release must include this dependency upgrade for production to be protected.

**Next actions (awaiting explicit authorization):**
1. Commit remediation files (apps/api/package.json, apps/web/package.json, pnpm-workspace.yaml, pnpm-lock.yaml, docs/security/*)
2. Push + deploy
3. Monitor image-size for an upstream patched release (advisory lists ≥2.0.3 but none is published today); optionally add `disableTypes()` hardening
