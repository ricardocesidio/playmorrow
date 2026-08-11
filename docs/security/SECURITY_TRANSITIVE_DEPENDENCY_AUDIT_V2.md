# Playmorrow Transitive Dependency Deep Audit (SEC-012 / RR-010)

**Date:** 2026-08-11
**Audit Type:** Read-only transitive dependency deep audit
**Baseline Commit:** `ac86169` (`chore: remediate P1 dependency vulnerabilities...`)
**Scope:** The 21 pre-existing production findings deferred in SEC-012 (postcss x4, brace-expansion x6, fast-uri x3, sharp x1, nanoid x2 via `@sentry/nextjs→next`; undici x5 via `jsdom`)
**Constraints:** STRICT READ-ONLY — no fixes, upgrades, overrides, lockfile/package/workspace changes, commits, pushes, or deploys. Documentation only.

> **REMEDIATION CLOSURE (2026-08-11, after this read-only audit):**
> The sole actionable finding from this audit — **sharp@0.34.5** (P1, partially
> reachable via `/_next/image`) — has been **REMEDIATED** by upgrading `next`
> 16.2.12 → **16.3.0** (+ `@next/bundle-analyzer` 16.2.12 → 16.3.0) in the web
> workspace, which vendors **patched `sharp@0.35.3` (libvips 8.18.3)**.
> Verification: `pnpm why sharp` → single 0.35.3 via next@16.3.0; next
> `optimizeImage` functionally exercised (TIFF→webp, PNG→jpeg) on sharp
> 0.35.3/vips 8.18.3; `pnpm audit --prod` dropped 23 → 20 findings (sharp no
> longer flagged). See `docs/security/SECURITY_FINDINGS.md` SEC-012 and the
> SEC-012 certification report for full evidence. M23 observation freeze
> unaffected (dependency-layer change only; log entry added).

---

## Executive Summary

A deep reachability audit of the 21 deferred transitive production findings was
performed against the committed remediation baseline `ac86169`. The audit
combined:
1. `pnpm audit --prod --json` on the committed tree (23 advisories: 6 moderate | 17 high)
2. Full GHSA/CVE correlation with vulnerable/patched ranges
3. Package-level reachability analysis (source-code + dependency-path inspection)
4. Playmorrow-specific deployment context (Vercel frontend + Fly.io API + middleware + remotePatterns)

**Verdict: 🟡 PARTIALLY REACHABLE — 1 finding with a plausible attack path (sharp), 20 findings NOT REACHABLE in Playmorrow's runtime.**

| Finding | Package | Reachability | Risk |
|---------|---------|--------------|------|
| **sharp** | sharp@0.34.5 | **PARTIALLY REACHABLE** (via live `/_next/image` + attacker-controllable `**.r2.dev`/`**.githubusercontent.com` remotePatterns + TIFF/GIF decode through vulnerable libvips) | **P1 — track for remediation** |
| undici (x5) | undici@7.28.0 | **NOT REACHABLE** (jsdom used DOM-only via `sanitize-html.ts`; no network/WebSocket/fetch paths) | P4 |
| postcss (x4) | postcss@8.4.31 (via next) | **NOT REACHABLE** (build-time only, in `next/dist/build/webpack`; never required in server runtime) | P4 |
| brace-expansion (x6) | brace-expansion@1.1.15/5.0.6 | **NOT REACHABLE** (dev/build-time: eslint, @storybook, fork-ts-checker, glob in sentry plugin) | P4 |
| fast-uri (x3) | fast-uri@3.1.2 | **NOT REACHABLE** (build-time webpack via @sentry/webpack-plugin→schema-utils→ajv) | P4 |
| nanoid (x2) | nanoid@3.3.12 | **NOT REACHABLE** (build-time only: postcss, @storybook/nextjs) | P4 |

The single actionable item from this audit is the **sharp** finding. It does NOT
block deployment of `ac86169` (which introduces no new dependency versions and
fixes the 3 P1 findings), but it must be tracked for the dependency-drift
release: upgrade `@sentry/nextjs`/`next` (which brings sharp ≥ 0.35.0) or add a
`pnpm` override for `sharp`. Full detail in §6.

---

## 1. Baseline Verification

- **HEAD:** `ac861693dad20cfc09e04d8be05033af4048d474`
- **Working tree:** contains only pre-existing uncommitted M23 work (Sessions 26–31) — 25 files unstaged, no staged changes. The audit did NOT modify any of them.
- **Audit command:** `pnpm audit --prod --json` on the committed tree (before the uncommitted M23 changes) → 23 advisories.

```
$ pnpm audit --prod
23 vulnerabilities found
Severity: 6 moderate | 17 high
```

## 2. Advisory Inventory (23 total)

| # | Advisory | Package | Vuln range | Fixed | Severity |
|---|----------|---------|-----------|-------|----------|
| 1 | GHSA-f88m-g3jw-g9cj | sharp | < 0.35.0 | ≥ 0.35.0 | high |
| 2 | GHSA-8xcm-r25x-g524 | undici | ≥7.0.0 <7.29.0 | ≥ 7.29.0 | moderate |
| 3 | GHSA-4cwx-7wf7-3272 | undici | ≥7.0.0 <7.29.0 | ≥ 7.29.0 | high |
| 4 | GHSA-m8rv-5g2x-5cg5 | undici | ≥7.0.0 <7.29.0 | ≥ 7.29.0 | moderate |
| 5 | GHSA-jr45-8vmc-qm54 | undici | ≥7.0.0 <7.29.0 | ≥ 7.29.0 | moderate |
| 6 | GHSA-v3r7-h72x-cjcm | undici | ≥7.0.0 <7.29.0 | ≥ 7.29.0 | moderate |
| 7 | GHSA-qx2v-qp2m-jg93 | postcss | < 8.5.10 | ≥ 8.5.10 | moderate |
| 8 | GHSA-6g55-p6wh-862q | postcss | ≤ 8.5.11 | ≥ 8.5.12 | high |
| 9 | GHSA-r28c-9q8g-f849 | postcss | ≤ 8.5.17 | ≥ 8.5.18 | high |
| 10 | GHSA-fxqj-rqcc-2cmp | postcss | (incomplete fix) | — | moderate |
| 11–13 | GHSA-3jxr-9vmj-r5cp | brace-expansion | <1.1.16 & ≥3.0.0<5.0.7 | 1.1.16 / 5.0.7 | high |
| 14–15 | GHSA-mh99-v99m-4gvg | brace-expansion | <1.1.16 & ≥3.0.0<5.0.7 | 1.1.16 / 5.0.7 | high |
| 16 | GHSA-rgw5-rvv9-x895 | brace-expansion | <5.0.7 | 5.0.7 | high |
| 17 | GHSA-v2hh-gcrm-f6hx | fast-uri | ≥3.0.0 ≤3.1.3 | ≥ 3.1.4 | high |
| 18 | GHSA-7p8r-x3mc-p8w7 | fast-uri | < 3.1.5 | ≥ 3.1.5 | high |
| 19 | GHSA-4c8g-83qw-93j6 | fast-uri | < 3.1.3 | ≥ 3.1.3 | high |
| 20 | GHSA-28wg-ghj8-5hjv | nanoid | < 3.3.16 | ≥ 3.3.16 | high |
| 21 | GHSA-2v37-7h3g-55p8 | nanoid | < 3.3.17 | ≥ 3.3.17 | high |
| 22–23 | GHSA-w3rx-r6r6-pgpr / GHSA-5p2g-fcmc-qvqq | image-size | ≤ 2.0.2 | none (SEC-010, already MITIGATED) | high |

## 3. Installed Versions (verified, committed tree)

| Package | Installed | Where | Upstream version elsewhere in tree |
|---------|-----------|-------|------------------------------------|
| next | 16.2.12 | web (prod dep) | — |
| sharp | **0.34.5** | optional dep of next@16.2.12 (installed) | 0.35.3 (elsewhere) |
| @sentry/nextjs | 10.64.0 | web (prod dep) | — |
| jsdom | 29.1.1 | api (prod dep) | — |
| undici | 7.28.0 (via jsdom) | api | 7.29.0 (elsewhere) |
| postcss | 8.4.31 (via next) | web | 8.5.15 / 8.5.23 / 8.5.26 (elsewhere) |
| brace-expansion | 1.1.15 & 5.0.6 | web/api | 1.1.18 / 2.1.4 / 5.0.9 (elsewhere) |
| fast-uri | 3.1.2 | web (build-time) | 3.1.5 (elsewhere) |
| nanoid | 3.3.12 | web (build-time) | 3.3.16 / 3.3.18 (elsewhere) |

## 4. Reachability Analysis

### 4.1 sharp@0.34.5 — **PARTIALLY REACHABLE** (P1, tracked)

**Vulnerability (GHSA-f88m-g3jw-g9cj):** sharp < 0.35.0 bundles libvips ≤ 8.18.1
with 4 vulnerabilities inherited from libvips:
- **CVE-2026-33327** (7.0 High) — VIPS loader (`VipsForeignLoadVips`): miscomputed dimensions → integer overflow → **heap buffer overflow**, possible code execution, when decoding an untrusted `.vips` file.
- **CVE-2026-33328** (6.8 Medium) — GIF loader (`VipsForeignLoadNsgif`): integer overflow on 32-bit systems (not exploitable on 64-bit production).
- **CVE-2026-35590** (6.8 Medium) — EXIF decoder: out-of-bounds read / null-pointer dereference (crash / DoS).
- **CVE-2026-35591** (7.0 High) — TIFF loader (`VipsForeignLoadTiff`): miscounts channels of JPEG/JPEG2000-encoded tiles → **heap buffer overflow**, possible code execution, when decoding an untrusted TIFF.

**Remediation:** upgrade sharp ≥ 0.35.0 (libvips 8.18.3). Workaround:
`sharp.block({ operation: ["VipsForeignLoadNsgif", "VipsForeignLoadTiff", "VipsForeignLoadVips"] })`
or set `VIPS_BLOCK_UNTRUSTED`.

**Playmorrow reachability analysis (source-code verified):**

1. **`/_next/image` endpoint is LIVE.** The Next.js image optimizer route is
   registered in `next-server.js:154` and the middleware matcher explicitly
   exempts it (`apps/web/middleware.ts:82`: `_next/image` is in the negated
   lookahead), so optimization requests reach the server. `next.config.ts` has
   `images.formats` + `remotePatterns` (optimization is NOT disabled with
   `unoptimized: true`).
2. **remotePatterns include attacker-controllable hosts.** `next.config.ts:21-28`
   whitelists `**.vercel.app`, `**.r2.dev`, `**.neon.tech`, `github.com`,
   `**.githubusercontent.com`, and `http://localhost`. An attacker can host a
   crafted image on any Cloudflare R2 bucket (`<anything>.r2.dev`) or any
   public GitHub repo (`raw.githubusercontent.com`, matches `**.githubusercontent.com`).
3. **TIFF and GIF are accepted inputs.** `image-optimizer.js` `detectContentType`
   (magic-byte detection) recognizes TIFF (`II*\0`), GIF, JPEG, PNG, etc.
   `BYPASS_TYPES` = { SVG, ICO, ICNS, BMP, JXL, HEIC } — **TIFF and GIF are NOT
   bypassed**. `ANIMATABLE_TYPES` = { WEBP, PNG, GIF } only bypasses animated
   GIFs. A crafted static TIFF/GIF buffer flows into `optimizeImage`.
4. **sharp is invoked on the buffer.** `optimizeImage` (image-optimizer.js:849)
   calls `getSharp()` → `sharp(buffer, { limitInputPixels }).timeout(7s).rotate()`
   → `.resize()` → `.toBuffer()`. Any input buffer (including TIFF) is decoded
   by the bundled libvips → the vulnerable `tiffload`/`gifload` paths execute.
5. **The request is fully attacker-driven.** URL + width + quality are taken
   from query params (`url=`, `w=`, `q=`), validated against remotePatterns /
   deviceSizes, then the upstream image is fetched server-side and processed.
   An attacker needs only a valid width (e.g. `w=640`) and a whitelisted host
   they control.

**Impact scenario:** An attacker hosts a crafted TIFF (CVE-2026-35591, JPEG/
JPEG2000 tiles) or `.vips` file (CVE-2026-33327) on a public R2 bucket or GitHub
repo, then requests
`/_next/image?url=https://<attacker>.r2.dev/payload.tiff&w=640&q=75`. The Vercel
Next.js server fetches it and decodes it through libvips, potentially corrupting
heap memory and, in the worst case, achieving code execution or a reliable DoS.

**Mitigating factors (reduce likelihood, do not eliminate):**
- Fetch has a 7-second timeout, response-size cap (maxResponseBody), and
  `limitInputPixels` — bounds DoS duration but does not prevent heap corruption.
- CVE-2026-33328 (GIF) is 32-bit only — not applicable (64-bit infra).
- Exploitation requires an attacker-controlled host matching remotePatterns
  (trivially satisfied via R2/GitHub) — no other barrier.
- Vercel's image optimization runs in the Node serverless runtime using the
  bundled sharp; on self-hosted Fly/standalone it is the same code path.

**Recommendation (dependency-drift release, not this commit):**
1. Upgrade `@sentry/nextjs` + `next` to versions pulling sharp ≥ 0.35.0, OR
2. Add `sharp: 0.35.x` to `pnpm-workspace.yaml` overrides, OR
3. As interim hardening, add `sharp.block(...)` for GIF/TIFF/VIPS loaders in
   the Next image optimizer path (Next 16 does not expose this config natively;
   would require a patch — hence override is preferred).

### 4.2 undici@7.28.0 (x5, via jsdom) — **NOT REACHABLE** (P4)

**Path:** `@playmorrow/api` → `jsdom@29.1.1` → `undici@7.28.0`.

**Playmorrow usage:** jsdom is imported in exactly one file —
`apps/api/src/common/sanitize-html.ts:1` — solely to construct `new JSDOM('')`
as a DOM window for DOMPurify. It is used by comments, studios, devlogs, and
games services (runtime, server-side).

**Why not reachable:** The 5 advisories concern undici's HTTP/WebSocket client:
retry interceptor desync (GHSA-8xcm-r25x-g524), degenerate private cache
directives (GHSA-4cwx-7wf7-3272), CRLF injection via blob body type
(GHSA-m8rv-5g2x-5cg5), whitespace-around-equals Cache-Control disclosure
(GHSA-jr45-8vmc-qm54), and cookie-attribute injection (GHSA-v3r7-h72x-cjcm).
All require undici to **perform network I/O** (fetch, WebSocket, resource
loading). Playmorrow's jsdom usage is **DOM-only** — no `JSDOM.fromURL`, no
`runScripts`, no `resources: "usable"`, no network fetches, no WebSocket, no
`fetch`/undici dispatch. undici is present in the tree only because jsdom
declares it; its vulnerable code paths are never executed.

### 4.3 postcss@8.4.31 (x4, via next) — **NOT REACHABLE** (P4)

**Path:** `next@16.2.12` → `postcss@8.4.31`.

**Why not reachable:** postcss is only `require()`'d inside `next/dist/build/**`
(build-time webpack/Tailwind processing). Verified: zero `require('postcss')` in
`next/dist/server/**`. The advisories (sourceMappingURL arbitrary file read,
path traversal, XSS in `stringify`) require **processing attacker-controlled CSS
at runtime**, which Playmorrow never does — CSS is compiled at build time from
first-party sources.

### 4.4 brace-expansion (x6, 3 advisories) — **NOT REACHABLE** (P4)

**Path:** eslint + minimatch + glob (dev), @storybook/builder-webpack5,
fork-ts-checker-webpack-plugin, @sentry bundler plugins — all dev/build-time.

**Why not reachable:** The DoS (nested brace expansion on user-supplied glob
patterns) requires runtime expansion of attacker-controlled patterns. All
dependency paths are development tooling (eslint, storybook, webpack build)
that expand first-party, static patterns. Not in any production server runtime.

### 4.5 fast-uri@3.1.2 (x3) — **NOT REACHABLE** (P4)

**Path:** `@sentry/webpack-plugin@5.3.0` → `webpack` → `schema-utils` → `ajv` → `fast-uri`
(and `ajv-formats`/`terser-webpack-plugin` variants) — **build-time webpack only**.

**Why not reachable:** fast-uri parses URIs during webpack schema validation at
build time. No production runtime code path imports fast-uri. The advisories
(ReDoS / parser issues in URI parsing) require runtime invocation with
attacker-controlled URIs, which does not occur.

### 4.6 nanoid@3.3.12 (x2) — **NOT REACHABLE** (P4)

**Path:** postcss@8.5.x (via @storybook/nextjs + @tailwindcss/postcss) +
postcss-modules-* — **build-time only**.

**Why not reachable:** nanoid is used by postcss modules during CSS processing.
Advisories concern `nonSecure` generator loops with negative/zero size — only
reachable if the caller supplies a bad size. Playmorrow's nanoid is exercised
only during build, never at runtime with attacker input. (Note: `next@16.2.12`
server runtime does not import nanoid — verified via grep.)

### 4.7 image-size@2.0.2 (x2) — **already MITIGATED** (SEC-010)

Carried from the v2 assessment; no change. Magic-byte gate before `imageSize()`
makes the ICNS/JXL/HEIF parser unreachable. Not part of the 21 SEC-012 findings.

## 5. Final Findings Table

| ID | CVE/GHSA | Package | Installed | Prod? | Reachability | CVSS | KEV? | Patch? | Risk | Decision |
|----|----------|---------|-----------|-------|--------------|------|------|--------|------|----------|
| SEC-012-01 | CVE-2026-33327 | sharp (libvips VIPS loader) | 0.34.5 | yes | **REACHABLE** via `/_next/image` (attacker host on `**.r2.dev`/`githubusercontent.com`) | 7.0 H | no | ≥0.35.0 | **HIGH** | TRACK — dependency-drift upgrade |
| SEC-012-02 | CVE-2026-33328 | sharp (libvips GIF loader) | 0.34.5 | yes | not exploitable (32-bit only) | 6.8 M | no | ≥0.35.0 | LOW | fixed by same upgrade |
| SEC-012-03 | CVE-2026-35590 | sharp (libvips EXIF) | 0.34.5 | yes | reachable (any image with EXIF) — DoS/crash | 6.8 M | no | ≥0.35.0 | MEDIUM | TRACK — same upgrade |
| SEC-012-04 | CVE-2026-35591 | sharp (libvips TIFF loader) | 0.34.5 | yes | **REACHABLE** via `/_next/image` (crafted TIFF w/ JPEG2000 tiles) | 7.0 H | no | ≥0.35.0 | **HIGH** | TRACK — same upgrade |
| SEC-012-05..09 | GHSA-8xcm/4cwx/m8rv/jr45/v3r7 | undici | 7.28.0 | api | NOT REACHABLE (DOM-only jsdom; no network) | 4.3–7.5 | no | ≥7.29.0 | LOW | DEFERRED |
| SEC-012-10..13 | GHSA-qx2v/6g55/r28c/fxqj | postcss | 8.4.31 | web(build) | NOT REACHABLE (build-time) | 5.3–8.2 | no | ≥8.5.18 | LOW | DEFERRED |
| SEC-012-14..19 | GHSA-3jxr/mh99/rgw5 | brace-expansion | 1.1.15/5.0.6 | dev/build | NOT REACHABLE | 6.5–7.5 | no | 1.1.16/5.0.7 | LOW | DEFERRED |
| SEC-012-20..22 | GHSA-v2hh/7p8r/4c8g | fast-uri | 3.1.2 | web(build) | NOT REACHABLE (build-time) | 5.3–8.1 | no | ≥3.1.5 | LOW | DEFERRED |
| SEC-012-23..24 | GHSA-28wg/2v37 | nanoid | 3.3.12 | web(build) | NOT REACHABLE (build-time) | 5.3–8.7 | no | ≥3.3.17 | LOW | DEFERRED |
| — (carried) | CVE-2025-71329/71330 | image-size | 2.0.2 | api | MITIGATED (SEC-010) | 8.7 H | no | none | MEDIUM | MITIGATED (monitor) |

**Reachability verdicts:** 1 finding (sharp, 2 CVEs: VIPS + TIFF loader, plus
EXIF DoS) = PARTIALLY REACHABLE and is the single actionable item; 20 findings =
NOT REACHABLE in Playmorrow's runtime.

## 6. Deploy Verdict for `ac86169`

**🟢 DEPLOYABLE.** The commit introduces no new dependency versions, fixes the 3
P1 findings (dompurify, multer, js-yaml), and documents the honest audit state.
The sharp finding pre-dates this commit (next@16.2.12 was already in HEAD) and
does not block it. **However**, the sharp finding elevates the priority of the
dependency-drift release: it is the first transitive finding with a demonstrable
attack path (server-side image decode of attacker-controlled TIFF via the live
`/_next/image` endpoint). Recommend:
- Schedule the dependency-drift release (next/@sentry upgrade → sharp ≥ 0.35.0)
  as a **P1 item** rather than routine maintenance.
- Optionally harden now (outside this read-only audit): either a `sharp`
  override in `pnpm-workspace.yaml`, or restricting `images.remotePatterns`
  (e.g., removing `**.r2.dev`/`**.githubusercontent.com` would not break current
  app functionality since the app uses plain `<img>` tags, not `next/image`).

## 7. M23 Freeze Verification

- **Frozen components untouched:** No M23 scoring weights, candidate generation,
  semantic search, embedding model/dimensions, MMR, ranking, personalization,
  rollout %, UX, explanations, or feedback semantics were modified. The audit
  was entirely read-only (source inspection + package queries).
- **Commit `ac86169`** contains only dependency bumps + security docs; zero M23
  code.
- **Working tree M23 changes (Sessions 26–31):** present and untouched (25 files,
  unstaged).
- **Freeze log:** `docs/ai/M23_FREEZE_CHANGE_LOG.md` retains its single entry
  (publishing path, outside frozen set). This audit adds no entry — no frozen
  component was touched.

## 8. Verification Evidence

```bash
# Baseline
$ git rev-parse HEAD
ac861693dad20cfc09e04d8be05033af4048d474

# Audit output (committed tree)
$ pnpm audit --prod --json   # → /tmp/audit21.json: 23 advisories, 6 moderate | 17 high

# Key source evidence
# - middleware.ts:82  matcher exempts _next/image
# - next.config.ts:21-28  remotePatterns (**.r2.dev, **.githubusercontent.com, ...)
# - image-optimizer.js:849  optimizeImage → getSharp → sharp(buffer).rotate().resize()
# - image-optimizer.js:295+ detectContentType recognizes TIFF (II*\0); TIFF ∉ BYPASS_TYPES
# - sanitize-html.ts:4  new JSDOM('') — DOM-only, no network
# - postcss: only in next/dist/build/** (grep), not next/dist/server/**

# Version verification
# - next@16.2.12 optionalDependencies.sharp = ^0.34.5 (installed)
# - jsdom@29.1.1 (api prod dep); undici@7.28.0 via jsdom
```

## 9. Documentation Updates (this audit)

| File | Change |
|------|--------|
| `docs/security/SECURITY_TRANSITIVE_DEPENDENCY_AUDIT_V2.md` | **CREATED** — this report |
| `docs/security/SECURITY_FINDINGS.md` | SEC-012 split into sharp (tracked P1) + DEFERRED (not-reachable) |
| `docs/security/SECURITY_CVE_INVENTORY.md` | Reachability column added per advisory |
| `docs/security/SECURITY_ASSESSMENT_V2.md` | Verdict section updated (sharp tracked; 20 deferred not-reachable) |

Per mission constraints, mixed project docs (ARCHITECTURE.md, README.md,
STATUS.md, CHANGELOG.md, HANDOFF.md, AGENTS.md) were NOT modified. If the team
wants the sharp finding reflected there (e.g., STATUS.md known-issues, ROADMAP
priority), that is a separate authorized change.

---

**Verdict: 🟡 PARTIALLY REACHABLE.** One actionable finding (sharp, P1-tracked);
20 findings not reachable in Playmorrow's runtime. `ac86169` is deployable. M23
observation freeze intact.
