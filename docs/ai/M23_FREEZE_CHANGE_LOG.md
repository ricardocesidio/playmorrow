# M23 — Freeze Change Log

**Status:** 1 entry — platform/catalog-readiness change only; M23 algorithm components untouched, freeze intact.
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
