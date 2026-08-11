# Playmorrow CVE Inventory

**Date:** 2026-08-11
**Assessment:** Security Assessment v2
**Source:** OSV Database, NIST NVD (rate-limited), GitHub Security Advisories
**Scope:** All runtime and development dependencies in pnpm-lock.yaml

---

## Summary

| Category | Count | Details |
|----------|-------|---------|
| **Total Vulnerabilities Found** | 37 | Across all dependencies |
| **Critical** | 1 | vitest (dev-only) |
| **High** | 20 | 3 production-relevant |
| **Moderate** | 12 | 2 production-relevant |
| **Low** | 2 | 1 production-relevant |
| **Production-Affecting** | **5** | dompurify (2), multer (transitive), js-yaml (transitive), image-size (2 CVEs) |
| **Dev-Only** | 34 | vitest, vite, esbuild, launch-editor, uuid, elliptic |

---

## Production-Affecting Vulnerabilities

### 1. DOMPurify - IN_PLACE Hook Removal XSS
| Field | Value |
|-------|-------|
| **CVE/GHSA** | GHSA-55q2-fjhq-7xh7 |
| **Package** | dompurify |
| **Installed Version** | ~~3.4.11~~ → **3.4.13** (all workspaces) |
| **Affected Range** | ≤ 3.4.12 |
| **Fixed Version** | ≥ 3.4.13 |
| **Severity** | High (CVSS 7.1) |
| **CWE** | CWE-79 (XSS) |
| **Production Impact** | **YES** - Used in both API (devlog sanitization) and Web (SanitizedMarkdown component) |
| **Attack Vector** | Malicious HTML with IN_PLACE hook leaves detached subtree executable |
| **Exploitability** | Requires `IN_PLACE: true` config + element-removal hook — **not used in Playmorrow** (default config only) |
| **CISA KEV** | No |
| **Confidence** | **REMEDIATED** — 3.4.13 installed |
| **Remediation** | ✅ Upgraded to `dompurify@3.4.13` |
| **Priority** | **P1 → REMEDIATED** |

**Evidence:**
- OSV: `dompurify@3.4.11` has 3 vulnerabilities
- Used in `apps/api/src/common/sanitize-html.ts` (server-side)
- Used in `apps/web/components/sanitized-markdown.tsx` (client-side)
- Defense-in-depth: server-side + client-side + CSP

---

### 2. DOMPurify - CUSTOM_ELEMENT_HANDLING Bypass
| Field | Value |
|-------|-------|
| **CVE/GHSA** | GHSA-c2j3-45gr-mqc4 |
| **Package** | dompurify |
| **Installed Version** | ~~3.4.11~~ → **3.4.13** (all workspaces) |
| **Affected Range** | ≤ 3.4.11 (Low), ≤ 3.4.12 (Moderate) |
| **Fixed Version** | ≥ 3.4.12 (Low), ≥ 3.4.13 (Moderate) |
| **Severity** | Low / Moderate |
| **CWE** | CWE-79 (XSS) |
| **Production Impact** | **YES** - Same as above |
| **Attack Vector** | `CUSTOM_ELEMENT_HANDLING` bypasses `afterSanitizeElements` for allowed custom elements |
| **Exploitability** | Requires `CUSTOM_ELEMENT_HANDLING` custom elements in sanitized content — **not used in Playmorrow** |
| **CISA KEV** | No |
| **Confidence** | **REMEDIATED** — 3.4.13 installed |
| **Remediation** | ✅ Upgraded to `dompurify@3.4.13` (fixes both) |
| **Priority** | **P1** (moderate) / **P2** (low) → **REMEDIATED** |

---

### 3. Multer - Denial of Service via Nested Field Names
| Field | Value |
|-------|-------|
| **CVE/GHSA** | CVE-2026-5079 / GHSA-72gw-mp4g-v24j |
| **Package** | multer |
| **Installed Version** | ~~2.1.1~~ → **2.2.0** (pnpm override via `pnpm-workspace.yaml`) |
| **Affected Range** | ≥ 1.0.0 < 2.2.0 |
| **Fixed Version** | **2.2.0** |
| **Severity** | High (CVSS 7.5) |
| **CWE** | CWE-400 (Resource Exhaustion) |
| **Production Impact** | **YES** (transitive via @nestjs/platform-express@11.1.28) |
| **Attack Vector** | Deeply nested field names in multipart/form-data cause DoS |
| **Exploitability** | Requires file upload endpoint access (authenticated) |
| **CISA KEV** | No |
| **Confidence** | **CONFIRMED VULNERABLE (transitive)** — now REMEDIATED |
| **Current State** | Single version in tree: **2.2.0** (verified `pnpm why multer` → "Found 1 version of multer") |
| **Remediation** | ✅ Override in `pnpm-workspace.yaml` (`overrides: multer: 2.2.0`) + full reinstall |
| **Priority** | **P1 → REMEDIATED** |

**Verification:**
```bash
$ pnpm why multer
multer@2.2.0
└─┬ @nestjs/platform-express@11.1.28
  └── @playmorrow/api@0.1.0 (dependencies)
Found 1 version of multer
```

> **Note:** Advisory also recommends `limits.fieldNestingDepth` config for defense-in-depth. Recommended follow-up hardening (not a P1 blocker — 2.2.0 already prevents the deep-nesting allocation).

---

### 4. image-size - ICNS / JXL / HEIF Infinite-Loop DoS
| Field | Value |
|-------|-------|
| **CVE/GHSA** | CVE-2025-71330 / GHSA-w3rx-r6r6-pgpr (ICNS); CVE-2025-71329 / GHSA-5p2g-fcmc-qvqq (JXL/HEIF) |
| **Package** | image-size |
| **Installed Version** | 2.0.2 (direct production dependency of `apps/api`) |
| **Affected Range** | ≤ 2.0.2 (both) |
| **Fixed Version** | **NONE** — advisories list "Patched versions: None"; npm `latest` = 2.0.2 |
| **Severity** | High (CVSS 4.0: 8.7 each) |
| **CWE** | CWE-835 (Loop with Unreachable Exit Condition) |
| **Production Impact** | **YES** (direct) — `upload.controller.ts:60` |
| **Attack Vector** | Crafted ICNS/JXL/HEIF buffer with zero-length field → event loop hang |
| **Exploitability** | **NOT REACHABLE in production** — magic-byte gate rejects non-jpeg/png/gif/webp before `imageSize()` runs (see below) |
| **CISA KEV** | No |
| **Confidence** | **CONFIRMED VULNERABLE (package) / MITIGATED (Playmorrow usage)** |
| **Remediation** | **NONE AVAILABLE** — no patched version exists. Compensating control = magic-byte gate |
| **Priority** | **HIGH → MITIGATED (classification B)** |

**Reachability evidence (empirical + code):**
1. Only call site: `upload.controller.ts:60` (`imageSize(new Uint8Array(file.buffer))`).
2. `validateMagicBytesFromBuffer` (`upload.service.ts:102`) runs **before** and only accepts jpeg `FF D8 FF` / png `89 50 4E 47` / gif `47 49 46` / webp `RIFF…WEBP`.
3. image-size detector (`dist/index.cjs:957`) routes by first byte: `0xFF→jpg`, `0x89→png`, `0x47→gif`, `0x52→webp`. ICNS requires first byte `0x69` ('i'), HEIF requires `0x00` — unreachable.
4. Empirical test (8 crafted payloads): gate-passing buffers throw `unsupported file type` in <2ms — no hang. Raw ungated CVE triggers also tested.

**Monitor:** upstream `image-size` releases after 2.0.2 — upgrade immediately if a patched version is published. Optional hardening: `disableTypes(['icns','heif','jxl','jxl-stream'])`.

---

### 5. js-yaml - Exponential Parsing Time DoS
| Field | Value |
|-------|-------|
| **CVE/GHSA** | GHSA-52cp-r559-cp3m (≥4.0.0 <4.3.0), GHSA-5p4m-2wfm-xmqj (≥4.0.0 <4.3.1) |
| **Package** | js-yaml |
| **Installed Version** | ~~4.1.1~~ → **4.3.1** (pnpm override) |
| **Affected Range** | ≥ 4.0.0 < 4.3.1 |
| **Fixed Version** | ≥ 4.3.1 |
| **Severity** | High |
| **CWE** | CWE-1333 (Inefficient Regex) |
| **Production Impact** | **YES** (transitive, prod graph) |
| **Attack Vector** | Exponential parsing time in flow collections |
| **Exploitability** | **NOT REACHABLE** — app never parses untrusted YAML; js-yaml used only by Swagger for OpenAPI doc generation (trusted static decorators). Now also patched via override. |
| **CISA KEV** | No |
| **Confidence** | **REMEDIATED** — 4.3.1 override applied |
| **Remediation** | ✅ Override in `pnpm-workspace.yaml` (`overrides: js-yaml: 4.3.1`), same-major patch bump |
| **Priority** | **HIGH → REMEDIATED** |

---

## Dev-Only Vulnerabilities (Not Production-Affecting)

### Critical
| GHSA | Package | Installed | Severity | Fixed | Notes |
|------|---------|-----------|----------|-------|-------|
| GHSA-5xrq-8626-4rwp | vitest | 2.1.8 | Critical | ≥3.2.6 | Vitest UI server arbitrary file read/execute |

### High
| GHSA | Package | Installed | Severity | Fixed | Notes |
|------|---------|-----------|----------|-------|-------|
| GHSA-fx2h-pf6j-xcff | vite | ≤6.4.2 | High | ≥6.4.3 | `server.fs.deny` bypass on Windows |
| GHSA-p6cm-8f9q-8wjv | esbuild | ≤0.25.11 | High | ≥0.25.12 | S3 bucket overwrite DoS (dev tooling only) |
| GHSA-3jxr-9vmj-r5cp | brace-expansion | <1.1.16 | High | ≥1.1.16 | DoS via {} expansion (dev transitive) |

### Moderate
| GHSA | Package | Installed | Severity | Fixed | Notes |
|------|---------|-----------|----------|-------|-------|
| GHSA-8gj9-mv54-cwjc | launch-editor | ≤4.0.0 | Moderate | ≥4.0.1 | Env variable injection (dev tooling only) |
| GHSA-v3r7-h72x-cjcm | undici | <7.29.0 | Moderate | ≥7.29.0 | Cookie attribute injection |
| GHSA-jr45-8vmc-qm54 | undici | <7.29.0 | Moderate | ≥7.29.0 | Cross-user info disclosure |
| GHSA-m8rv-5g2x-5cg5 | undici | <7.29.0 | Moderate | ≥7.29.0 | Cookie injection via Cache-Control |

### Low
| GHSA | Package | Installed | Severity | Fixed | Notes |
|------|---------|-----------|----------|-------|-------|
| GHSA-848j-6mx2-7j84 | elliptic | ≤6.6.1 | Low | ≥6.6.2 | Risky crypto implementation (storybook dep) |
| GHSA-gv3v-92v6-48fh | uuid | 11.1.0 | Moderate | ≥13.0.0 | Malicious owner takeover (npm registry race, dev transitive) |

---

## CVE Classification Summary

| Classification | Count | Details |
|----------------|-------|---------|
| **REMEDIATED (Production)** | 4 | dompurify (2 CVEs: GHSA-55q2, GHSA-c2j3), multer (CVE-2026-5079), js-yaml (GHSA-52cp-r559-cp3m / GHSA-5p4m-2wfm-xmqj) |
| **MITIGATED (Production)** | 2 | image-size (CVE-2025-71329/71330 — no patch exists, magic-byte gate) |
| **DEFERRED (Production, pre-existing in HEAD)** | 21 | postcss (4), brace-expansion (6), fast-uri (3), sharp (1), nanoid (2) via `@sentry/nextjs→next`; undici (5) via `jsdom` — out of scope for this commit, see §7 |
| **CONFIRMED VULNERABLE (Dev-Only)** | 10 | vitest, vite, esbuild, brace-expansion, undici, elliptic, launch-editor, uuid |
| **CONFIRMED VULNERABLE (Production)** | **0** | — |
| **NOT APPLICABLE** | 0 | - |
| **UNVERIFIED** | 0 | - |
| **REVIEW REQUIRED** | 0 | - |

---

## Remediation Tracking

| Vulnerability | Current | Target | Status | Owner | Target Date |
|---------------|---------|--------|--------|-------|-------------|
| dompurify XSS (High) | 3.4.13 | ≥3.4.13 | **REMEDIATED** | - | 2026-08-11 |
| dompurify XSS (Moderate/Low) | 3.4.13 | ≥3.4.13 | **REMEDIATED** | - | 2026-08-11 |
| multer DoS (transitive) | 2.2.0 | 2.2.0 only | **REMEDIATED** | - | 2026-08-11 |
| image-size DoS (ICNS/JXL/HEIF) | 2.0.2 | no patch (advisory: ≥2.0.3, unpublished) | **MITIGATED** (magic-byte gate) | - | Monitor upstream |
| js-yaml DoS (transitive) | 4.3.1 | ≥4.3.1 | **REMEDIATED** (4.3.1 override) | - | 2026-08-11 |
| postcss / brace-expansion / fast-uri / sharp / nanoid (via @sentry/nextjs→next) | HEAD | upgrade @sentry/nextjs+next | **DEFERRED** (pre-existing in HEAD) | - | dependency-drift release |
| undici (via jsdom) | HEAD | remove/upgrade jsdom prod dep | **DEFERRED** (pre-existing in HEAD) | - | dependency-drift release |
| vitest Critical | 2.1.8 | ≥3.2.6 | Backlog | - | Dev Dependency |
| vite High | ≤6.4.2 | ≥6.4.3 | Backlog | - | Dev Dependency |
| esbuild High | ≤0.25.11 | ≥0.25.12 | Backlog | - | Dev Dependency |
| brace-expansion High | <1.1.16 | ≥1.1.16 | Backlog | - | Dev Dependency |
| undici Moderate | <7.29.0 | ≥7.29.0 | Backlog | - | Dev Dependency |
| launch-editor Moderate | ≤4.0.0 | ≥4.0.1 | Backlog | - | Dev Dependency |
| elliptic Low | ≤6.6.1 | ≥6.6.2 | Backlog | - | Dev Dependency |
| uuid Moderate | 11.1.0 | ≥13.0.0 | Backlog | - | Dev Dependency |

---

## Verification Evidence (2026-08-11)

```bash
# Verify dompurify upgrade - ALL WORKSPACES NOW AT 3.4.13
$ pnpm list dompurify
@playmorrow/api@0.1.0: dompurify@3.4.13
@playmorrow/web@0.1.0: dompurify@3.4.13
@playmorrow/root: dompurify@3.4.13

# Verify multer version - SINGLE 2.2.0 VERSION IN TREE
$ pnpm why multer
multer@2.2.0
└─┬ @nestjs/platform-express@11.1.28
  └── @playmorrow/api@0.1.0 (dependencies)
Found 1 version of multer

# Run production audit - 23 findings; in-scope cleared, image-size MITIGATED, 21 pre-existing DEFERRED
$ pnpm audit --prod
23 vulnerabilities found
Severity: 6 moderate | 17 high
# In scope: dompurify/multer/js-yaml cleared; image-size@2.0.2 MITIGATED (magic-byte gate blocks unreachable parsers)
# Pre-existing in HEAD (DEFERRED): postcss x4, brace-expansion x6, fast-uri x3, sharp, nanoid x2 (via @sentry/nextjs→next); undici x5 (via jsdom)
# (js-yaml cleared via 4.3.1 override)
```

---

## Notes

1. **NVD API was rate-limited** during assessment. OSV (Open Source Vulnerabilities) database used as authoritative alternative.
2. **CISA KEV Catalog checked** - no matches for installed packages.
3. **All dev-only vulnerabilities** are in tooling (vitest, vite, esbuild, eslint/undici transitive) and do not affect production runtime.
4. **Multer 2.1.1 → 2.2.0** resolved via `pnpm-workspace.yaml` override; verified single version in tree.
5. **DOMPurify** is used in both server-side (API devlog sanitization) and client-side (SanitizedMarkdown component) — upgraded to 3.4.13 in all workspaces.
6. **image-size** has NO patched version (npm latest = 2.0.2; advisory lists ≥2.0.3 but it is not published). The magic-byte gate (jpeg/png/gif/webp only) makes the vulnerable ICNS/JXL/HEIF parsers unreachable. Monitor upstream; upgrade immediately when a patch is published.
7. **js-yaml** (via `@nestjs/swagger`) was remediated by a `js-yaml: 4.3.1` override (same-major patch bump) fixing GHSA-52cp-r559-cp3m and GHSA-5p4m-2wfm-xmqj. Verified single version in tree and cleared from `pnpm audit --prod`.
8. **21 pre-existing production findings** remain in the committed baseline (`HEAD`) — postcss/brace-expansion/fast-uri/sharp/nanoid via `@sentry/nextjs→next`, and undici via `jsdom`. They were present before this commit and are tracked as **DEFERRED (out of scope)**; remediation requires a dependency-drift release.