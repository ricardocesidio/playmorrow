# M23 — Freeze Change Log

**Status:** 2 entries — platform/catalog-readiness + dependency-security changes only; M23 algorithm components untouched, freeze intact.
**Created:** 2026-08-10
**Owner:** AI Engineer (freeze custodian)

---

## Instructions

This log records **every** change to a frozen M23 component made during the
observation window (2026-08-10 → 2026-08-17). Only P0/P1 emergencies qualify
(see `M23_OBSERVATION_FREEZE.md` §3). Each entry must state:

1. What changed.
2. Why it was necessary (evidence).
3. Exact affected component.
4. Baseline contaminated? (YES/NO + reasoning).
5. Observation window restart? (YES/NO + new dates).

---

## Entries

| Date | Change | Why | Component | Baseline Contaminated? | Restart? | Author |
|---|---|---|---|---|---|---|
| 2026-08-10 | Game Publishing Path (product/platform fix — STATUS.md issue #8): `POST /games/:slug/publish` sets `Game.isPublished`; public catalog/search filter `isPublished: true`; RELEASED auto-stamp removed | Root cause: no product path could publish a game, blocking catalog growth for M23 discovery data | Outside frozen M23 components — no algorithm/weights/metrics/rollout/CTR/baseline/embedding changes | NO | NO | AI Engineer |
| 2026-08-11 | SEC-012 dependency-security remediation: `next` 16.2.12 → 16.3.0 + `@next/bundle-analyzer` 16.2.12 → 16.3.0 (web workspace) — replaces vulnerable `sharp@0.34.5` (GHSA-f88m-g3jw-g9cj, libvips CVEs) with patched `sharp@0.35.3` (libvips 8.18.3) | P1 transitive vuln via `next` optional dependency; verified no vulnerable sharp reachable in resolved tree (`pnpm why sharp` → single 0.35.3), next optimizer functional, audit 23 → 20 findings | Outside frozen M23 components — build/dependency layer only; no algorithm/weights/metrics/rollout/CTR/baseline/embedding changes | NO | NO | AI Engineer |
