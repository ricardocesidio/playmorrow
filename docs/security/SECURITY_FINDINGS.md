# Playmorrow Security Findings Register

**Date:** 2026-08-11
**Assessment:** Security Assessment v2
**Scope:** All findings from read-only security discovery sprint

---

## Finding Classification

| Severity | Definition |
|----------|------------|
| **P0 - Critical** | Immediate security compromise or catastrophic exposure |
| **P1 - High** | Serious exploitable vulnerability requiring urgent remediation |
| **P2 - Medium** | Meaningful security weakness with realistic impact |
| **P3 - Low** | Limited impact / defense-in-depth |
| **P4 - Informational** | Hardening opportunity or observation |

---

## Findings Register

| ID | Severity | Title | Component | Evidence | Attack Scenario | Impact | Exploitability | Confidence | Production Exposure | Remediation | Blocking |
|----|----------|-------|-----------|----------|-----------------|--------|----------------|------------|---------------------|-------------|----------|
| SEC-001 | **P1** | DOMPurify XSS bypass (IN_PLACE hook) | `dompurify@3.4.11` (API + Web) | GHSA-55q2-fjhq-7xh7: IN_PLACE hook leaves detached subtree executable | Attacker injects malicious HTML in devlog/comment; script executes when rendered | XSS via malicious HTML in devlogs/comments | Requires user-controlled HTML input | **CONFIRMED** | Yes (API + Web) | Upgrade to ≥3.4.13 | **Yes** |
| SEC-002 | **P1** | DOMPurify CUSTOM_ELEMENT_HANDLING bypass | `dompurify@3.4.11` | GHSA-c2j3-45gr-mqc4: bypasses `afterSanitizeElements` for allowed custom elements | Attacker uses custom elements to bypass sanitization | XSS via custom elements | Requires custom elements in content | **CONFIRMED** | Yes (API + Web) | Upgrade to ≥3.4.13 (fixes both) | **Yes** |
| SEC-003 | **P1** | Multer DoS via nested field names (transitive) | `multer@2.1.1` (via @nestjs/platform-express) | GHSA-72gw-mp4g-v24j: DoS via deeply nested field names | Attacker sends deeply nested multipart form; server CPU exhaustion | DoS on file upload endpoints | Requires upload endpoint access | **CONFIRMED** (transitive) | Yes | Ensure multer 2.2.0 used; pin in overrides | **Yes** |
| SEC-004 | **P2** | DOMPurify low-severity bypass | `dompurify@3.4.11` | GHSA-c2j3-45gr-mqc4: CUSTOM_ELEMENT_HANDLING bypasses `afterSanitizeElements` | Limited XSS via custom elements | Limited XSS | Requires custom elements | **CONFIRMED** | Yes | Upgrade to ≥3.4.12 | No |
| SEC-005 | **P3** | Draft games accessible via slug enumeration | `GET /games/:slug` | No `isPublished` check on public detail endpoint | Attacker guesses slugs to access unpublished games | Pre-release content exposure | No auth required | **CONFIRMED** | Yes | Add publication check or `/preview/:slug` | No |
| SEC-006 | **P3** | No CSP violation report endpoint | CSP header | CSP header references `/api/csp-report` but no handler exists | CSP violations go unreported; blind to attacks | Violations unreported | N/A | **CONFIRMED** | Yes | Implement `/api/csp-report` handler | No |
| SEC-007 | **P4** | Dev CSP allows `'unsafe-eval'` | `middleware.ts` | Dev mode allows `'unsafe-eval'` for HMR | Dev-only risk; eval injection if dev tools compromised | Dev-only risk | Dev only | **CONFIRMED** | Dev only | Migrate to Next.js 16 native CSP | No |
| SEC-008 | **P4** | No password minimum length | `RegisterDto` | Only common password check; no length enforcement | Attacker uses short password; easier brute force | Weak passwords possible | Requires registration | **CONFIRMED** | Yes | Add `@MinLength(8)` to `RegisterDto` | No |
| SEC-009 | **P4** | No password history / rotation | Auth service | Not implemented | Credential reuse after breach | Credential reuse risk | Post-breach | **CONFIRMED** | Yes | Add history table + rotation check | No |
| SEC-010 | **HIGH*** | image-size infinite-loop DoS (ICNS/JXL/HEIF) | `image-size@2.0.2` (direct, API) | CVE-2025-71329/CVE-2025-71330; **no patched version exists** | Crafted ICNS/JXL/HEIF upload hangs event loop | DoS on upload endpoint | Blocked by magic-byte gate — vulnerable parsers unreachable | **CONFIRMED (pkg) / MITIGATED (usage)** | Yes (pkg) / No (reachable path) | **NONE AVAILABLE** — magic-byte gate is the compensating control | No |
| SEC-011 | **HIGH*** | js-yaml exponential parsing DoS (transitive) | `js-yaml@4.1.1` (via @nestjs/swagger) | GHSA-52cp-r559-cp3m / GHSA-5p4m-2wfm-xmqj; fixed ≥4.3.1 | Malicious YAML in flow collection hangs parser | DoS | **No untrusted YAML parsed** — only OpenAPI doc generation from trusted decorators | **REMEDIATED** (4.3.1 override) | Yes (pkg) / No (reachable path) | ✅ Override `js-yaml: 4.3.1` in pnpm-workspace.yaml | No |
| SEC-012 | **HIGH (batch)** | Pre-existing transitive findings in committed baseline | postcss (4), brace-expansion (6), fast-uri (3), sharp (1), nanoid (2) via `@sentry/nextjs→next`; undici (5) via `jsdom` | pnpm audit --prod = 23 findings; in-scope (dompurify/multer/js-yaml/image-size) handled above | Depends on package | Varied | Reachability varies; present in `HEAD` | **DEFERRED** (out of scope) | Yes (transitive) | Upgrade `@sentry/nextjs`+`next`; remove/upgrade `jsdom` prod dep — dependency-drift release | No |

*\*Severity as reported by advisory. Reclassified **MITIGATED** (not exploitable in Playmorrow's usage) after reachability analysis — see Finding Details.*

---

## Finding Details

### SEC-001: DOMPurify XSS bypass (IN_PLACE hook)
- **GHSA:** GHSA-55q2-fjhq-7xh7
- **CVSS:** 7.1 (High)
- **Affected:** dompurify ≤ 3.4.12
- **Fixed:** ≥ 3.4.13
- **Location:** `apps/api/src/common/sanitize-html.ts`, `apps/web/components/sanitized-markdown.tsx`
- **Description:** When using IN_PLACE mode, DOMPurify leaves a detached subtree that remains executable, allowing XSS.
- **Mitigation:** Upgrade to dompurify ≥ 3.4.13. Defense-in-depth: server-side (sanitize-html.ts) + client-side (SanitizedMarkdown) + CSP nonce.

### SEC-002: DOMPurify CUSTOM_ELEMENT_HANDLING bypass
- **GHSA:** GHSA-c2j3-45gr-mqc4
- **CVSS:** 6.5 (Medium) / 3.7 (Low)
- **Affected:** dompurify ≤ 3.4.11 (Low), ≤ 3.4.12 (Medium)
- **Fixed:** ≥ 3.4.12 (Low), ≥ 3.4.13 (Medium)
- **Description:** CUSTOM_ELEMENT_HANDLING bypasses afterSanitizeElements for allowed custom elements.
- **Mitigation:** Same upgrade fixes both (dompurify ≥ 3.4.13).

### SEC-003: Multer DoS via nested field names
- **GHSA:** GHSA-72gw-mp4g-v24j
- **CVSS:** 7.5 (High)
- **Affected:** multer < 2.2.0
- **Fixed:** ≥ 2.2.0
- **Dependency Path:** Transitive via @nestjs/platform-express → @nestjs/core
- **Current:** Two versions (2.1.1 transitive, 2.2.0 direct)
- **Fix:** Add pnpm override to force 2.2.0

### SEC-004: DOMPurify low-severity bypass
- **GHSA:** GHSA-c2j3-45gr-mqc4 (Low)
- **CVSS:** 3.7 (Low)
- **Affected:** dompurify ≤ 3.4.11
- **Fixed:** ≥ 3.4.12
- **Description:** CUSTOM_ELEMENT_HANDLING bypasses afterSanitizeElements for allowed custom elements.
- **Fixed by:** Same upgrade as SEC-001/SEC-002.

### SEC-005: Draft games accessible via slug enumeration
- **Component:** `GET /games/:slug` endpoint
- **Issue:** No `isPublished` check on public game detail endpoint
- **Risk:** Attacker can enumerate slugs to access unpublished games
- **Current Behavior:** Returns draft game if slug known
- **Fix:** Add `isPublished: true` filter or create `/preview/:slug` endpoint

### SEC-006: No CSP violation report endpoint
- **Component:** CSP header
- **Issue:** CSP header includes `report-uri: /api/csp-report` but no handler exists
- **Impact:** CSP violations go unreported; blind to attacks
- **Fix:** Implement `/api/csp-report` POST handler

### SEC-007: Dev CSP allows 'unsafe-eval'
- **Component:** `apps/web/middleware.ts`
- **Issue:** Development CSP allows `'unsafe-eval'` for HMR/React DevTools
- **Risk:** Dev-only; production CSP is strict
- **Mitigation:** Migrate to Next.js 16 native CSP support

### SEC-008: No password minimum length
- **Component:** `RegisterDto`
- **Issue:** Only common password blocklist; no minimum length
- **Fix:** Add `@MinLength(8)` validation decorator

### SEC-009: No password history / rotation
- **Component:** Auth service
- **Issue:** No password history tracking or rotation enforcement
- **Risk:** Credential reuse after breach
- **Remediation:** Add PasswordHistory table + rotation check

### SEC-010: image-size infinite-loop DoS (ICNS / JXL / HEIF)
- **CVE/GHSA:** CVE-2025-71330 (GHSA-w3rx-r6r6-pgpr, ICNS), CVE-2025-71329 (GHSA-5p2g-fcmc-qvqq, JXL/HEIF)
- **CVSS:** 8.7 (High) each
- **Affected:** image-size ≤ 2.0.2
- **Fixed:** **NONE — no patched version exists** (npm `latest` = 2.0.2)
- **Location:** `apps/api/src/uploads/upload.controller.ts:60` (only call site)
- **Description:** Crafted ICNS/JXL/HEIF buffers with zero-length fields cause an infinite loop in the image parser.
- **Classification: B — no patch exists; compensating control in place.**
- **Reachability analysis (code + empirical):**
  1. `validateMagicBytesFromBuffer` (`upload.service.ts:102`) runs **before** `imageSize()` and accepts only jpeg (`FF D8 FF`), png (`89 50 4E 47`), gif (`47 49 46`), webp (`RIFF…WEBP`).
  2. image-size detector (`dist/index.cjs:957`) routes by first byte: `0xFF→jpg`, `0x89→png`, `0x47→gif`, `0x52→webp`. ICNS requires `0x69` ('i'), HEIF requires `0x00` — unreachable.
  3. Empirical test (8 crafted payloads): gate-passing buffers throw `unsupported file type` in <2ms — no hang. Raw CVE triggers also tested.
- **Remediation:** Monitor upstream for a patched release; upgrade immediately. Optional hardening: `imageSize.disableTypes(['icns','heif','jxl','jxl-stream'])`.

### SEC-011: js-yaml exponential parsing DoS (transitive) — **REMEDIATED**
- **GHSA:** GHSA-52cp-r559-cp3m (≥4.0.0 <4.3.0), GHSA-5p4m-2wfm-xmqj (≥4.0.0 <4.3.1)
- **Affected:** js-yaml ≥ 4.0.0 < 4.3.1
- **Fixed:** ≥ 4.3.1
- **Dependency Path:** Transitive via `@nestjs/swagger@11.4.4`
- **Location:** OpenAPI spec generation (Swagger bootstrap, trusted static decorators)
- **Description:** Exponential parsing time on flow collections.
- **Reachability:** Playmorrow never parses untrusted YAML at runtime. js-yaml is only exercised by `SwaggerModule.setup()` reading app decorators (trusted developer input). No user-controlled YAML reaches the parser.
- **Remediation (DONE 2026-08-11):** Override `js-yaml: 4.3.1` in `pnpm-workspace.yaml` (same-major patch bump). Verified: `pnpm why js-yaml` → `Found 1 version of js-yaml` (4.3.1); `pnpm audit --prod` no longer flags js-yaml.

---

## Remediation Tracking

| Finding | Priority | Status | Target Date | Owner |
|---------|----------|--------|-------------|-------|
| SEC-001 | P1 | **REMEDIATED** | 2026-08-11 | - |
| SEC-002 | P1 | **REMEDIATED** | 2026-08-11 | - |
| SEC-003 | P1 | **REMEDIATED** | 2026-08-11 | - |
| SEC-004 | P2 | **REMEDIATED** (via dompurify upgrade) | 2026-08-11 | - |
| SEC-005 | P3 | **DEFERRED** | Next Sprint | - |
| SEC-006 | P3 | **DEFERRED** | Next Sprint | - |
| SEC-007 | P4 | Backlog | Next Release | - |
| SEC-008 | P4 | Backlog | Next Release | - |
| SEC-009 | P4 | Backlog | Next Release | - |
| SEC-010 | HIGH* | **MITIGATED** (magic-byte gate; no patch exists) | Monitor upstream | - |
| SEC-011 | HIGH* | **REMEDIATED** (4.3.1 override) | 2026-08-11 | - |
| SEC-012 | HIGH (batch) | **DEFERRED** — 21 pre-existing transitive findings in HEAD (postcss/brace-expansion/fast-uri/sharp/nanoid via @sentry/nextjs→next; undici via jsdom). Not introduced by this commit; dependency-drift release required. | dependency-drift release | - |

---

## Remediation Commands

```bash
# Upgrade dompurify (fixes SEC-001, SEC-002, SEC-004)
pnpm add -w dompurify@latest

# Ensure multer 2.2.0 (fixes SEC-003)
# Add to package.json pnpm.overrides:
# "multer": "2.2.0"
pnpm install

# Add password min length (SEC-008)
# Edit apps/api/src/auth/dto/register.dto.ts
# Add @MinLength(8) to password field

# Implement CSP report endpoint (SEC-006)
# Create apps/api/src/csp/csp-report.controller.ts

# Fix draft game exposure (SEC-005)
# Edit apps/api/src/games/games.controller.ts findBySlug method
# Add isPublished: true to findUnique where clause
```

---

## Verification

After remediation:
```bash
# Verify upgrades
pnpm list dompurify
pnpm why multer
pnpm audit --prod

# Run tests
pnpm --filter @playmorrow/api test
pnpm --filter @playmorrow/web test:e2e

# Full verification
pnpm verify
```

**Verification Results (2026-08-11):**
```bash
$ pnpm list dompurify
@playmorrow/api@0.1.0: dompurify@3.4.13
@playmorrow/web@0.1.0: dompurify@3.4.13
@playmorrow/root: dompurify@3.4.13

$ pnpm why multer
multer@2.2.0
└─┬ @nestjs/platform-express@11.1.28
  └── @playmorrow/api@0.1.0 (dependencies)
Found 1 version of multer

$ pnpm audit --prod
23 vulnerabilities found
Severity: 6 moderate | 17 high
# In scope: dompurify/multer/js-yaml cleared; image-size@2.0.2 x2 MITIGATED (magic-byte gate, SEC-010)
# Pre-existing in HEAD (DEFERRED, SEC-012): postcss x4, brace-expansion x6, fast-uri x3, sharp, nanoid x2 (via @sentry/nextjs→next); undici x5 (via jsdom)
# js-yaml (SEC-011) cleared via 4.3.1 override

$ pnpm verify
Tasks:    6 successful, 6 total

$ pnpm --filter @playmorrow/api test
539 passed, 51 files
```

**All P1 findings REMEDIATED. SEC-004 resolved by same dompurify upgrade.
SEC-011 resolved via js-yaml 4.3.1 override. SEC-010 documented as MITIGATED with compensating control and upstream monitoring. SEC-012 (21 pre-existing transitive findings in HEAD) tracked as DEFERRED.**